import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Plus, Edit2 } from "lucide-react";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { ACTIVE_TRACKS } from "@/lib/curriculum";

export default function AdminFacilitators() {
  const [facilitators, setFacilitators] = useState([]);
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editFac, setEditFac] = useState(null);
  const [form, setForm] = useState({ full_name: "", email: "", tracks: [], batch_ids: [], status: "Active" });
  const { toast } = useToast();

  const load = async () => {
    const [f, b, s] = await Promise.all([
      base44.entities.Facilitator.list("-created_date", 50),
      base44.entities.Batch.list("-created_date", 50),
      base44.entities.Student.list("-created_date", 200),
    ]);
    setFacilitators(f);
    setBatches(b);
    setStudents(s);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditFac(null);
    setForm({ full_name: "", email: "", tracks: [], batch_ids: [], status: "Active" });
    setOpen(true);
  };

  const openEdit = (fac) => {
    setEditFac(fac);
    setForm({
      full_name: fac.full_name,
      email: fac.email,
      tracks: fac.tracks || [],
      batch_ids: fac.batch_ids || [],
      status: fac.status,
    });
    setOpen(true);
  };

  const toggleTrack = (track) => {
    setForm(f => ({ ...f, tracks: f.tracks.includes(track) ? f.tracks.filter(t => t !== track) : [...f.tracks, track] }));
  };

  const toggleBatch = (batchId) => {
    setForm(f => ({ ...f, batch_ids: f.batch_ids.includes(batchId) ? f.batch_ids.filter(b => b !== batchId) : [...f.batch_ids, batchId] }));
  };

  const handleSave = async () => {
    if (editFac) {
      await base44.entities.Facilitator.update(editFac.id, form);
      toast({ title: "Facilitator updated" });
    } else {
      await base44.entities.Facilitator.create(form);
      try { await base44.users.inviteUser(form.email, "user"); } catch (e) {}
      toast({ title: "Facilitator added" });
    }
    setOpen(false);
    load();
  };

  const getStudentCount = (facId) => students.filter(s => s.facilitator_id === facId).length;

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl md:text-2xl font-heading font-bold">Facilitators</h1>
        <Button onClick={openCreate} className="bg-cyan-500 text-black hover:bg-cyan-400 text-sm">
          <Plus size={14} className="mr-2" /> Add Facilitator
        </Button>
      </div>

      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        {facilitators.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">No facilitators added yet.</div>
        ) : (
          <div className="divide-y divide-border/30">
            {facilitators.map(f => (
              <div key={f.id} className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-secondary/30 transition-colors" onClick={() => openEdit(f)}>
                <div>
                  <p className="text-sm font-medium">{f.full_name}</p>
                  <p className="text-xs text-muted-foreground">{f.email}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {f.tracks?.map(t => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-400">{t.split(" ").slice(-1)[0]}</span>)}
                    <span className="text-[10px] text-muted-foreground">{getStudentCount(f.id)} students</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={f.status} />
                  <Edit2 size={14} className="text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editFac ? "Edit Facilitator" : "Add Facilitator"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-xs text-muted-foreground">Full Name</Label>
              <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="bg-secondary border-border" disabled={!!editFac} />
              {editFac && <p className="text-[10px] text-muted-foreground mt-1">Email cannot be changed after creation.</p>}
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Assigned Tracks</Label>
              <div className="space-y-2">
                {ACTIVE_TRACKS.map(t => (
                  <div key={t} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 cursor-pointer" onClick={() => toggleTrack(t)}>
                    <div className={`w-4 h-4 rounded border flex-shrink-0 ${form.tracks.includes(t) ? "border-cyan-400 bg-cyan-400" : "border-muted-foreground/30"}`} />
                    <span className="text-sm">{t}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Assigned Batches</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {batches.map(b => (
                  <div key={b.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 cursor-pointer" onClick={() => toggleBatch(b.id)}>
                    <div className={`w-4 h-4 rounded border flex-shrink-0 ${form.batch_ids.includes(b.id) ? "border-cyan-400 bg-cyan-400" : "border-muted-foreground/30"}`} />
                    <span className="text-sm">{b.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <Button onClick={handleSave} disabled={!form.full_name || !form.email} className="w-full bg-cyan-500 text-black hover:bg-cyan-400">
              {editFac ? "Save Changes" : "Add Facilitator"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}