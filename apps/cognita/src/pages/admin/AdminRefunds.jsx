import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Plus } from "lucide-react";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { REFUND_STATUSES, formatCurrency } from "@/lib/business-utils";
import EmptyState from "@/components/curriculum/EmptyState";

export default function AdminRefunds() {
  const [refunds, setRefunds] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ student_id: "", refund_reason: "" });
  const [selected, setSelected] = useState(null);
  const [adminDecision, setAdminDecision] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const { toast } = useToast();

  const load = async () => {
    const [r, s] = await Promise.all([
      base44.entities.Refund.list("-created_date", 200),
      base44.entities.Student.list("-created_date", 200),
    ]);
    setRefunds(r);
    setStudents(s);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    const student = students.find(s => s.id === form.student_id);
    if (!student) return;
    await base44.entities.Refund.create({
      student_id: student.id,
      student_name: student.full_name,
      batch_id: student.batch_id,
      batch_name: student.batch_id,
      track: student.track,
      amount_paid: 0,
      refund_amount: 0,
      refund_status: "Requested",
      refund_reason: form.refund_reason,
    });
    toast({ title: "Refund record created" });
    setCreateOpen(false);
    setForm({ student_id: "", refund_reason: "" });
    load();
  };

  const updateRefund = async (id, data) => {
    await base44.entities.Refund.update(id, data);
    setRefunds(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
    setSelected(null);
    toast({ title: "Refund updated" });
    load();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-heading font-bold">Refunds</h1>
          <p className="text-sm text-muted-foreground mt-1">Manual refund tracking and decisions.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="bg-cyan-500 text-black hover:bg-cyan-400 text-sm">
          <Plus size={14} className="mr-2" /> New Refund
        </Button>
      </div>

      {refunds.length === 0 ? (
        <EmptyState title="No refund records" description="Refund requests and records will appear here." />
      ) : (
        <div className="space-y-3">
          {refunds.map(refund => (
            <div key={refund.id} className="rounded-xl border border-border/50 bg-card p-4 cursor-pointer hover:bg-secondary/30 transition-colors" onClick={() => { setSelected(refund); setAdminDecision(refund.admin_decision || ""); setAdminNotes(refund.admin_notes || ""); }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{refund.student_name}</p>
                  <p className="text-xs text-muted-foreground">{refund.track} · {refund.batch_name}</p>
                  {refund.refund_reason && <p className="text-xs text-foreground/70 mt-1">Reason: {refund.refund_reason}</p>}
                  {refund.amount_paid > 0 && <p className="text-xs text-muted-foreground mt-1">Amount paid: {formatCurrency(refund.amount_paid)}</p>}
                </div>
                <StatusBadge status={refund.refund_status} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader><DialogTitle>New Refund Record</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Student</Label>
              <Select value={form.student_id} onValueChange={v => setForm(f => ({ ...f, student_id: v }))}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>
                  {students.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name} - {s.track}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Refund Reason</Label>
              <Textarea value={form.refund_reason} onChange={e => setForm(f => ({ ...f, refund_reason: e.target.value }))} rows={3} className="bg-secondary border-border" placeholder="Reason for refund request..." />
            </div>
            <Button onClick={handleCreate} disabled={!form.student_id} className="w-full bg-cyan-500 text-black hover:bg-cyan-400">Create Refund Record</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md bg-card border-border">
          {selected && (
            <>
              <DialogHeader><DialogTitle>Refund — {selected.student_name}</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <div className="text-xs space-y-1">
                  <p>Track: {selected.track}</p>
                  <p>Amount paid: {formatCurrency(selected.amount_paid)}</p>
                  <p>Refund amount: {formatCurrency(selected.refund_amount)}</p>
                  <p>Reason: {selected.refund_reason}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">Admin Decision</Label>
                  <Textarea value={adminDecision} onChange={e => setAdminDecision(e.target.value)} rows={2} className="bg-secondary border-border" placeholder="Decision notes..." />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">Admin Notes</Label>
                  <Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={2} className="bg-secondary border-border" placeholder="Internal notes..." />
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {REFUND_STATUSES.filter(s => s !== "Not Requested").map(s => (
                    <Button key={s} size="sm" variant="outline" onClick={() => updateRefund(selected.id, { refund_status: s, admin_decision: adminDecision, admin_notes: adminNotes, refund_date: ["Approved", "Processed"].includes(s) ? new Date().toISOString().split("T")[0] : selected.refund_date })} className="text-xs">
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}