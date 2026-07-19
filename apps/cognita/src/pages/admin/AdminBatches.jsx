import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Plus, Users } from "lucide-react";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

const BATCH_STATUSES = ["Applications Open", "Upcoming", "Active", "Completed", "Archived"];

export default function AdminBatches() {
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editBatch, setEditBatch] = useState(null);
  const [form, setForm] = useState({ name: "", batch_code: "", start_date: "", end_date: "", max_students: 30, description: "", status: "Applications Open" });
  const { toast } = useToast();

  const load = async () => {
    const [b, s] = await Promise.all([
      base44.entities.Batch.list("-created_date", 50),
      base44.entities.Student.list("-created_date", 200),
    ]);
    setBatches(b);
    setStudents(s);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditBatch(null);
    setForm({ name: "", batch_code: "", start_date: "", end_date: "", max_students: 30, description: "", status: "Applications Open" });
    setOpen(true);
  };

  const openEdit = (batch) => {
    setEditBatch(batch);
    setForm({
      name: batch.name,
      batch_code: batch.batch_code || "",
      start_date: batch.start_date || "",
      end_date: batch.end_date || "",
      max_students: batch.max_students || 30,
      description: batch.description || "",
      status: batch.status || "Applications Open",
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (editBatch) {
      await base44.entities.Batch.update(editBatch.id, form);
      toast({ title: "Batch updated" });
    } else {
      await base44.entities.Batch.create(form);
      toast({ title: "Batch created" });
    }
    setOpen(false);
    load();
  };

  const getStudentCount = (batchId) => students.filter(s => s.batch_id === batchId).length;

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl md:text-2xl font-heading font-bold">Batches</h1>
        <Button onClick={openCreate} className="bg-cyan-500 text-black hover:bg-cyan-400 text-sm">
          <Plus size={14} className="mr-2" /> Create Batch
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {batches.length === 0 ? (
          <div className="col-span-full p-12 text-center text-muted-foreground text-sm rounded-xl border border-border/50 bg-card">No batches yet.</div>
        ) : (
          batches.map(b => {
            const count = getStudentCount(b.id);
            const capacity = b.max_students || 30;
            const capacityPercent = Math.round((count / capacity) * 100);
            return (
              <div key={b.id} className="rounded-xl border border-border/50 bg-card p-5 cursor-pointer hover:bg-secondary/30 transition-colors" onClick={() => openEdit(b)}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">{b.name}</h3>
                  <StatusBadge status={b.status} />
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {b.batch_code && <p className="font-mono text-cyan-400/80">Code: {b.batch_code}</p>}
                  <p>Start: {b.start_date || "—"}</p>
                  {b.end_date && <p>End: {b.end_date}</p>}
                  <div className="flex items-center gap-1.5 mt-2">
                    <Users size={12} />
                    <span>{count}/{capacity} students</span>
                    <span className={`ml-1 text-[10px] ${capacityPercent >= 80 ? "text-orange-400" : "text-emerald-400"}`}>({capacityPercent}%)</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-secondary mt-1">
                    <div className={`h-full rounded-full ${capacityPercent >= 80 ? "bg-orange-400" : "bg-cyan-400"}`} style={{ width: `${Math.min(capacityPercent, 100)}%` }} />
                  </div>
                </div>
                {b.description && <p className="text-xs text-foreground/60 mt-2">{b.description}</p>}
              </div>
            );
          })
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editBatch ? "Edit Batch" : "Create Batch"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-xs text-muted-foreground">Batch Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., Batch 2026-A" className="bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Batch Code</Label>
              <Input value={form.batch_code} onChange={e => setForm(f => ({ ...f, batch_code: e.target.value }))} placeholder="e.g., B001" className="bg-secondary border-border font-mono" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Start Date</Label>
                <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="bg-secondary border-border" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">End Date</Label>
                <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className="bg-secondary border-border" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Max Students</Label>
              <Input type="number" value={form.max_students} onChange={e => setForm(f => ({ ...f, max_students: Number(e.target.value) }))} className="bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BATCH_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="bg-secondary border-border" />
            </div>
            <Button onClick={handleSave} disabled={!form.name} className="w-full bg-cyan-500 text-black hover:bg-cyan-400">
              {editBatch ? "Save Changes" : "Create Batch"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}