import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Eye, Check, X, Clock, UserCheck } from "lucide-react";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { enrollStudent } from "@/lib/enrollment-utils";
import { ACTIVE_TRACKS } from "@/lib/curriculum";

export default function AdminApplications() {
  const [apps, setApps] = useState([]);
  const [batches, setBatches] = useState([]);
  const [facilitators, setFacilitators] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  const [notes, setNotes] = useState("");
  const [enrollMode, setEnrollMode] = useState(false);
  const [enrollForm, setEnrollForm] = useState({ batch_id: "", facilitator_id: "", track: "" });
  const [enrolling, setEnrolling] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    const [a, b, f, inv] = await Promise.all([
      base44.entities.Application.list("-created_date", 200),
      base44.entities.Batch.list("-created_date", 50),
      base44.entities.Facilitator.list("-created_date", 50),
      base44.entities.Invoice.list("-created_date", 200),
    ]);
    setApps(a);
    setBatches(b);
    setFacilitators(f);
    setInvoices(inv);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    await base44.entities.Application.update(id, {
      status,
      admin_notes: notes,
      reviewed_date: new Date().toISOString(),
    });
    toast({ title: `Application ${status.toLowerCase()}` });
    setSelected(null);
    setNotes("");
    load();
  };

  const handleEnroll = async () => {
    if (!selected || !enrollForm.batch_id) return;
    setEnrolling(true);
    try {
      const track = enrollForm.track || selected.preferred_track;
      await enrollStudent(base44, selected, { ...enrollForm, track }, batches, facilitators, invoices);
      if (notes) {
        await base44.entities.Application.update(selected.id, { admin_notes: notes });
      }
      toast({ title: `${selected.full_name} enrolled successfully`, description: "Payment record and invoice created automatically." });
      setSelected(null);
      setNotes("");
      setEnrollMode(false);
      setEnrollForm({ batch_id: "", facilitator_id: "", track: "" });
      load();
    } catch (err) {
      toast({ title: "Enrollment failed", description: err.message, variant: "destructive" });
    }
    setEnrolling(false);
  };

  const filtered = filter === "all" ? apps : apps.filter(a => a.status === filter);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3">
        <h1 className="text-xl md:text-2xl font-heading font-bold flex-shrink-0">Applications</h1>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-32 sm:w-44 bg-secondary border-border text-sm flex-shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ({apps.length})</SelectItem>
            <SelectItem value="Pending Review">Pending ({apps.filter(a => a.status === "Pending Review").length})</SelectItem>
            <SelectItem value="Accepted">Accepted</SelectItem>
            <SelectItem value="Waitlisted">Waitlisted</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
            <SelectItem value="Enrolled">Enrolled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">No applications found.</div>
        ) : (
          <div className="divide-y divide-border/30">
            {filtered.map(app => (
              <div key={app.id} className="px-5 py-4 flex items-center justify-between hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => { setSelected(app); setNotes(app.admin_notes || ""); setEnrollMode(false); }}>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{app.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{app.email} · {app.preferred_track}</p>
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
              <DialogHeader>
                <DialogTitle className="text-lg font-heading">{selected.full_name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                {[
                  { l: "Email", v: selected.email },
                  { l: "Phone", v: selected.phone },
                  { l: "Location", v: selected.location },
                  { l: "Preferred Track", v: selected.preferred_track },
                  { l: "Occupation / Student Status", v: selected.occupation },
                  { l: "AI Skill Level", v: selected.ai_skill_level ? `${selected.ai_skill_level}/10` : null },
                  { l: "Tech Skill Level", v: selected.tech_skill_level ? `${selected.tech_skill_level}/10` : null },
                  { l: "Available Hours/Week", v: selected.available_hours ? `${selected.available_hours} hrs` : null },
                ].filter(x => x.v).map((x, i) => (
                  <div key={i}>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{x.l}</p>
                    <p className="text-sm mt-0.5">{x.v}</p>
                  </div>
                ))}
                {selected.why_apply && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Why Cognita?</p>
                    <p className="text-sm mt-0.5 text-foreground/80 whitespace-pre-wrap">{selected.why_apply}</p>
                  </div>
                )}
                {selected.production_goals && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Production Goals</p>
                    <p className="text-sm mt-0.5 text-foreground/80 whitespace-pre-wrap">{selected.production_goals}</p>
                  </div>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Understands no auto-cert: <span className={selected.understands_no_auto_cert ? "text-emerald-400" : "text-muted-foreground"}>{selected.understands_no_auto_cert ? "Yes" : "No"}</span></span>
                  <span>Agrees to weekly outputs: <span className={selected.agrees_to_submit_weekly ? "text-emerald-400" : "text-muted-foreground"}>{selected.agrees_to_submit_weekly ? "Yes" : "No"}</span></span>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Admin Notes</p>
                  <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="bg-secondary border-border text-sm" placeholder="Add review notes..." />
                </div>

                {!enrollMode ? (
                  <div className="flex items-center gap-2 pt-2 flex-wrap">
                    {selected.status === "Pending Review" && (
                      <>
                        <Button size="sm" onClick={() => updateStatus(selected.id, "Accepted")} className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/20">
                          <Check size={14} className="mr-1" /> Accept
                        </Button>
                        <Button size="sm" onClick={() => updateStatus(selected.id, "Waitlisted")} className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/20">
                          <Clock size={14} className="mr-1" /> Waitlist
                        </Button>
                        <Button size="sm" onClick={() => updateStatus(selected.id, "Rejected")} className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/20">
                          <X size={14} className="mr-1" /> Reject
                        </Button>
                      </>
                    )}
                    {selected.status === "Accepted" && (
                      <Button size="sm" onClick={() => setEnrollMode(true)} className="bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/20">
                        <UserCheck size={14} className="mr-1" /> Enroll Student
                      </Button>
                    )}
                    {selected.status === "Waitlisted" && (
                      <Button size="sm" onClick={() => updateStatus(selected.id, "Accepted")} className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/20">
                        <Check size={14} className="mr-1" /> Move to Accepted
                      </Button>
                    )}
                    {selected.status === "Enrolled" && (
                      <p className="text-sm text-cyan-400">This applicant has been enrolled as a student.</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 p-4 rounded-lg bg-secondary/50 border border-border/50">
                    <p className="text-sm font-semibold">Enroll {selected.full_name}</p>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5">Batch *</Label>
                      <Select value={enrollForm.batch_id} onValueChange={v => setEnrollForm(f => ({ ...f, batch_id: v }))}>
                        <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select batch" /></SelectTrigger>
                        <SelectContent>
                          {batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5">Track</Label>
                      <Select value={enrollForm.track || selected.preferred_track} onValueChange={v => setEnrollForm(f => ({ ...f, track: v }))}>
                        <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ACTIVE_TRACKS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5">Facilitator</Label>
                      <Select value={enrollForm.facilitator_id} onValueChange={v => setEnrollForm(f => ({ ...f, facilitator_id: v }))}>
                        <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Assign later" /></SelectTrigger>
                        <SelectContent>
                          {facilitators.map(f => <SelectItem key={f.id} value={f.id}>{f.full_name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-cyan-400/80">A payment record and invoice will be created automatically.</p>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={handleEnroll} disabled={!enrollForm.batch_id || enrolling} className="bg-cyan-500 text-black hover:bg-cyan-400">
                        {enrolling ? "Enrolling..." : "Confirm Enrollment"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEnrollMode(false)}>Cancel</Button>
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