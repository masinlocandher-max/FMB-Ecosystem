import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Eye, Check, X, Calendar, UserCheck } from "lucide-react";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

export default function AdminTeacherApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  const [notes, setNotes] = useState("");
  const [onboardMode, setOnboardMode] = useState(false);
  const [tracks, setTracks] = useState([]);
  const [batchIds, setBatchIds] = useState([]);
  const [batches, setBatches] = useState([]);
  const { toast } = useToast();

  const load = async () => {
    const [a, b] = await Promise.all([
      base44.entities.TeacherApplication.list("-created_date", 200),
      base44.entities.Batch.list("-created_date", 50),
    ]);
    setApps(a);
    setBatches(b);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    const admin = await base44.auth.me();
    await base44.entities.TeacherApplication.update(id, {
      status,
      admin_notes: notes,
      reviewed_by: admin?.full_name || "Admin",
      reviewed_date: new Date().toISOString(),
    });
    toast({ title: `Application ${status.toLowerCase()}` });
    setSelected(null);
    setNotes("");
    load();
  };

  const handleOnboard = async () => {
    if (!selected || tracks.length === 0) return;
    // Create Facilitator record
    await base44.entities.Facilitator.create({
      full_name: selected.full_name,
      email: selected.email,
      tracks,
      batch_ids: batchIds,
      status: "Active",
    });
    // Update teacher application status
    await base44.entities.TeacherApplication.update(selected.id, {
      status: "Onboarded",
      admin_notes: notes,
      educator_agreement_signed: true,
    });
    // Invite the user
    try {
      await base44.users.inviteUser(selected.email, "user");
    } catch (e) {
      // User may already exist
    }
    toast({ title: `${selected.full_name} onboarded as facilitator` });
    setSelected(null);
    setNotes("");
    setOnboardMode(false);
    setTracks([]);
    setBatchIds([]);
    load();
  };

  const toggleTrack = (track) => {
    setTracks(t => t.includes(track) ? t.filter(x => x !== track) : [...t, track]);
  };

  const toggleBatch = (batchId) => {
    setBatchIds(b => b.includes(batchId) ? b.filter(x => x !== batchId) : [...b, batchId]);
  };

  const filtered = filter === "all" ? apps : apps.filter(a => a.status === filter);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;

  const TEACHER_STATUSES = ["Pending Review", "Interview Scheduled", "Accepted", "Rejected", "Onboarded"];

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3">
        <h1 className="text-xl md:text-2xl font-heading font-bold flex-shrink-0">Teacher Applications</h1>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40 sm:w-52 bg-secondary border-border text-sm flex-shrink-0"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ({apps.length})</SelectItem>
            {TEACHER_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">No teacher applications found.</div>
        ) : (
          <div className="divide-y divide-border/30">
            {filtered.map(app => (
              <div key={app.id} className="px-5 py-4 flex items-center justify-between hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => { setSelected(app); setNotes(app.admin_notes || ""); setOnboardMode(false); }}>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{app.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{app.email} · {app.current_occupation}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={app.status} />
                  <Eye size={14} className="text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader><DialogTitle className="text-lg font-heading">{selected.full_name}</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                {[
                  { l: "Email", v: selected.email },
                  { l: "Phone", v: selected.phone },
                  { l: "Location", v: selected.location },
                  { l: "Occupation", v: selected.current_occupation },
                  { l: "Experience", v: selected.years_of_experience ? `${selected.years_of_experience} years` : null },
                  { l: "AI Skill Level", v: selected.ai_skill_level ? `${selected.ai_skill_level}/10` : null },
                ].filter(x => x.v).map((x, i) => (
                  <div key={i}>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{x.l}</p>
                    <p className="text-sm mt-0.5">{x.v}</p>
                  </div>
                ))}
                {selected.teaching_experience && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Teaching Experience</p>
                    <p className="text-sm mt-0.5 text-foreground/80 whitespace-pre-wrap">{selected.teaching_experience}</p>
                  </div>
                )}
                {selected.preferred_tracks?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Preferred Tracks</p>
                    <div className="flex flex-wrap gap-2">
                      {selected.preferred_tracks.map(t => <span key={t} className="text-xs px-2.5 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-400">{t}</span>)}
                    </div>
                  </div>
                )}
                {selected.why_teach && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Why Teach at Cognita?</p>
                    <p className="text-sm mt-0.5 text-foreground/80 whitespace-pre-wrap">{selected.why_teach}</p>
                  </div>
                )}
                {selected.teaching_philosophy && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Teaching Philosophy</p>
                    <p className="text-sm mt-0.5 text-foreground/80 whitespace-pre-wrap">{selected.teaching_philosophy}</p>
                  </div>
                )}
                {(selected.portfolio_url || selected.linkedin_url) && (
                  <div className="flex gap-3">
                    {selected.portfolio_url && <a href={selected.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:underline">Portfolio →</a>}
                    {selected.linkedin_url && <a href={selected.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:underline">LinkedIn →</a>}
                  </div>
                )}

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Admin Notes</p>
                  <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="bg-secondary border-border text-sm" placeholder="Add review notes..." />
                </div>

                {!onboardMode ? (
                  <div className="flex items-center gap-2 pt-2 flex-wrap">
                    {selected.status === "Pending Review" && (
                      <>
                        <Button size="sm" onClick={() => updateStatus(selected.id, "Interview Scheduled")} className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/20">
                          <Calendar size={14} className="mr-1" /> Schedule Interview
                        </Button>
                        <Button size="sm" onClick={() => updateStatus(selected.id, "Accepted")} className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/20">
                          <Check size={14} className="mr-1" /> Accept
                        </Button>
                        <Button size="sm" onClick={() => updateStatus(selected.id, "Rejected")} className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/20">
                          <X size={14} className="mr-1" /> Reject
                        </Button>
                      </>
                    )}
                    {selected.status === "Interview Scheduled" && (
                      <>
                        <Button size="sm" onClick={() => updateStatus(selected.id, "Accepted")} className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/20">
                          <Check size={14} className="mr-1" /> Accept
                        </Button>
                        <Button size="sm" onClick={() => updateStatus(selected.id, "Rejected")} className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/20">
                          <X size={14} className="mr-1" /> Reject
                        </Button>
                      </>
                    )}
                    {selected.status === "Accepted" && (
                      <Button size="sm" onClick={() => setOnboardMode(true)} className="bg-cyan-500 text-black hover:bg-cyan-400">
                        <UserCheck size={14} className="mr-1" /> Onboard as Facilitator
                      </Button>
                    )}
                    {selected.status === "Onboarded" && (
                      <p className="text-sm text-cyan-400">This educator has been onboarded as a facilitator.</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 p-4 rounded-lg bg-secondary/50 border border-border/50">
                    <p className="text-sm font-semibold">Onboard {selected.full_name}</p>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5">Assign Tracks</Label>
                      <div className="space-y-2">
                        {["AI for Creatives", "AI for Professionals and Virtual Assistants", "AI for Entrepreneurs", "AI for Students"].map(t => (
                          <div key={t} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 cursor-pointer" onClick={() => toggleTrack(t)}>
                            <div className={`w-4 h-4 rounded border flex-shrink-0 ${tracks.includes(t) ? "border-cyan-400 bg-cyan-400" : "border-muted-foreground/30"}`} />
                            <span className="text-sm">{t}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5">Assign Batches</Label>
                      <div className="space-y-2">
                        {batches.map(b => (
                          <div key={b.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 cursor-pointer" onClick={() => toggleBatch(b.id)}>
                            <div className={`w-4 h-4 rounded border flex-shrink-0 ${batchIds.includes(b.id) ? "border-cyan-400 bg-cyan-400" : "border-muted-foreground/30"}`} />
                            <span className="text-sm">{b.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={handleOnboard} disabled={tracks.length === 0} className="bg-cyan-500 text-black hover:bg-cyan-400">Confirm Onboarding</Button>
                      <Button size="sm" variant="ghost" onClick={() => setOnboardMode(false)}>Cancel</Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}