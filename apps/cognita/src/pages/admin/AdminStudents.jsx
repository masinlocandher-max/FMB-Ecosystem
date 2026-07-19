import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Edit2, Search } from "lucide-react";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader,DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ACTIVE_TRACKS } from "@/lib/curriculum";
import { useToast } from "@/components/ui/use-toast";

const PROGRESS_STATUSES = ["On Track", "Needs Attention", "At Risk", "Completed", "Removed"];

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [facilitators, setFacilitators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editStudent, setEditStudent] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [search, setSearch] = useState("");
  const [trackFilter, setTrackFilter] = useState("all");
  const [progressFilter, setProgressFilter] = useState("all");
  const { toast } = useToast();

  const load = async () => {
    const [s, b, f] = await Promise.all([
      base44.entities.Student.list("-created_date", 200),
      base44.entities.Batch.list("-created_date", 50),
      base44.entities.Facilitator.list("-created_date", 50),
    ]);
    setStudents(s);
    setBatches(b);
    setFacilitators(f);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openEdit = (student) => {
    setEditStudent(student);
    setEditForm({
      track: student.track,
      batch_id: student.batch_id || "",
      facilitator_id: student.facilitator_id || "",
      progress_status: student.progress_status,
      current_week: student.current_week,
    });
  };

  const handleSave = async () => {
    await base44.entities.Student.update(editStudent.id, {
      track: editForm.track,
      batch_id: editForm.batch_id || undefined,
      facilitator_id: editForm.facilitator_id || undefined,
      progress_status: editForm.progress_status,
      current_week: Number(editForm.current_week),
    });
    toast({ title: "Student updated" });
    setEditStudent(null);
    load();
  };

  const getBatchName = (id) => batches.find(b => b.id === id)?.name || "—";
  const getFacilitatorName = (id) => facilitators.find(f => f.id === id)?.full_name || "Unassigned";

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;

  const filtered = students.filter(s => {
    const matchesSearch = !search || s.full_name?.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase());
    const matchesTrack = trackFilter === "all" || s.track === trackFilter;
    const matchesProgress = progressFilter === "all" || s.progress_status === progressFilter;
    return matchesSearch && matchesTrack && matchesProgress;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl md:text-2xl font-heading font-bold">Students</h1>
      </div>

      <p className="text-xs text-muted-foreground mb-4">To enroll a new student, go to Applications → review an accepted applicant → click "Enroll Student".</p>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." className="bg-secondary border-border pl-9 text-sm" />
        </div>
        <Select value={trackFilter} onValueChange={setTrackFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-secondary border-border text-sm"><SelectValue placeholder="All tracks" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tracks</SelectItem>
            {ACTIVE_TRACKS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={progressFilter} onValueChange={setProgressFilter}>
          <SelectTrigger className="w-full sm:w-44 bg-secondary border-border text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {PROGRESS_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">No students found.</div>
        ) : (
          <div className="divide-y divide-border/30">
            {filtered.map(s => (
              <div key={s.id} className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-secondary/30 transition-colors" onClick={() => openEdit(s)}>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{s.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.track} · {getBatchName(s.batch_id)} · Week {s.current_week}/10 · {getFacilitatorName(s.facilitator_id)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={s.progress_status} />
                  <StatusBadge status={s.certificate_status} />
                  <Edit2 size={14} className="text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!editStudent} onOpenChange={() => setEditStudent(null)}>
        <DialogContent className="max-w-md bg-card border-border max-h-[90vh] overflow-y-auto">
          {editStudent && (
            <>
              <DialogHeader><DialogTitle>Edit Student — {editStudent.full_name}</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">Track</Label>
                  <Select value={editForm.track} onValueChange={v => setEditForm(f => ({ ...f, track: v }))}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ACTIVE_TRACKS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">Batch</Label>
                  <Select value={editForm.batch_id} onValueChange={v => setEditForm(f => ({ ...f, batch_id: v }))}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">Facilitator</Label>
                  <Select value={editForm.facilitator_id} onValueChange={v => setEditForm(f => ({ ...f, facilitator_id: v }))}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Unassigned</SelectItem>
                      {facilitators.map(f => <SelectItem key={f.id} value={f.id}>{f.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">Progress Status</Label>
                  <Select value={editForm.progress_status} onValueChange={v => setEditForm(f => ({ ...f, progress_status: v }))}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROGRESS_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">Current Week</Label>
                  <Input type="number" min={1} max={10} value={editForm.current_week} onChange={e => setEditForm(f => ({ ...f, current_week: e.target.value }))} className="bg-secondary border-border" />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Button onClick={handleSave} className="flex-1 bg-cyan-500 text-black hover:bg-cyan-400">Save Changes</Button>
                  <Button variant="ghost" onClick={() => setEditStudent(null)}>Cancel</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}