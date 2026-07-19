import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Plus, Eye, CheckCircle } from "lucide-react";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { DEFAULT_TUITION_FEE, DISCOUNT_TYPES, calculateDiscount, calculateAmountDue, formatCurrency, generateInvoiceNumber, getNextSequence } from "@/lib/business-utils";
import EmptyState from "@/components/curriculum/EmptyState";

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [students, setStudents] = useState([]);
  const [apps, setApps] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ source: "student", entity_id: "", discount_type: "None", due_date: "" });
  const [selected, setSelected] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");
  const { toast } = useToast();

  const load = async () => {
    const [i, s, a, b] = await Promise.all([
      base44.entities.Invoice.list("-created_date", 200),
      base44.entities.Student.list("-created_date", 200),
      base44.entities.Application.list("-created_date", 200),
      base44.entities.Batch.list("-created_date", 50),
    ]);
    setInvoices(i);
    setStudents(s);
    setApps(a);
    setBatches(b);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getBatch = (id) => batches.find(b => b.id === id);

  const handleCreate = async () => {
    let name, email, batchId, batchName, track;
    if (form.source === "student") {
      const s = students.find(st => st.id === form.entity_id);
      if (!s) return;
      name = s.full_name; email = s.email; batchId = s.batch_id; batchName = getBatch(s.batch_id)?.name || ""; track = s.track;
    } else {
      const a = apps.find(ap => ap.id === form.entity_id);
      if (!a) return;
      name = a.full_name; email = a.email; batchId = a.batch_id; batchName = getBatch(a.batch_id)?.name || ""; track = a.preferred_track;
    }

    const batch = getBatch(batchId);
    const batchCode = batch?.batch_code || "B000";
    const year = new Date().getFullYear();
    const seq = getNextSequence(invoices, "COG-INV", year, batchCode);
    const invoiceNumber = generateInvoiceNumber(year, batchCode, seq);

    const tuition = DEFAULT_TUITION_FEE;
    const discountAmount = calculateDiscount(tuition, form.discount_type);
    const totalDue = calculateAmountDue(tuition, discountAmount);

    await base44.entities.Invoice.create({
      invoice_number: invoiceNumber,
      student_id: form.source === "student" ? form.entity_id : undefined,
      student_name: name,
      student_email: email,
      batch_id: batchId,
      batch_name: batchName,
      track,
      tuition_fee: tuition,
      discount_type: form.discount_type,
      discount_amount: discountAmount,
      total_amount_due: totalDue,
      payment_status: "Unpaid",
      issue_date: new Date().toISOString().split("T")[0],
      due_date: form.due_date || undefined,
    });

    toast({ title: `Invoice ${invoiceNumber} created` });
    setCreateOpen(false);
    setForm({ source: "student", entity_id: "", discount_type: "None", due_date: "" });
    load();
  };

  const markPaid = async (invoice) => {
    await base44.entities.Invoice.update(invoice.id, { payment_status: "Paid", admin_notes: adminNotes });
    toast({ title: `Invoice ${invoice.invoice_number} marked as paid` });
    setSelected(null);
    setAdminNotes("");
    load();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;

  const acceptedApps = apps.filter(a => a.status === "Accepted");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-heading font-bold">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage student invoices.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="bg-cyan-500 text-black hover:bg-cyan-400 text-sm">
          <Plus size={14} className="mr-2" /> New Invoice
        </Button>
      </div>

      {invoices.length === 0 ? (
        <EmptyState title="No invoices" description="Create an invoice for an accepted applicant or student." />
      ) : (
        <div className="space-y-3">
          {invoices.map(inv => (
            <div key={inv.id} className="rounded-xl border border-border/50 bg-card p-4 cursor-pointer hover:bg-secondary/30 transition-colors" onClick={() => { setSelected(inv); setAdminNotes(inv.admin_notes || ""); }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{inv.student_name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{inv.invoice_number}</p>
                  <p className="text-xs text-muted-foreground">{inv.track} · {inv.batch_name}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs">
                    <span className="text-muted-foreground">Total: <span className="font-mono text-foreground">{formatCurrency(inv.total_amount_due)}</span></span>
                    {inv.discount_amount > 0 && <span className="text-purple-400">-{formatCurrency(inv.discount_amount)}</span>}
                    {inv.due_date && <span className="text-muted-foreground">Due: {inv.due_date}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={inv.payment_status} />
                  <Eye size={14} className="text-muted-foreground" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader><DialogTitle>New Invoice</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Source</Label>
              <Select value={form.source} onValueChange={v => setForm(f => ({ ...f, source: v, entity_id: "" }))}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Enrolled Student</SelectItem>
                  <SelectItem value="application">Accepted Applicant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">{form.source === "student" ? "Student" : "Accepted Applicant"}</Label>
              <Select value={form.entity_id} onValueChange={v => setForm(f => ({ ...f, entity_id: v }))}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {form.source === "student"
                    ? students.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name} - {s.track}</SelectItem>)
                    : acceptedApps.map(a => <SelectItem key={a.id} value={a.id}>{a.full_name} - {a.preferred_track}</SelectItem>)
                  }
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Discount Type</Label>
              <Select value={form.discount_type} onValueChange={v => setForm(f => ({ ...f, discount_type: v }))}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DISCOUNT_TYPES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Due Date</Label>
              <Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className="bg-secondary border-border" />
            </div>
            <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20 text-xs space-y-1">
              <p>Tuition: <span className="font-mono">{formatCurrency(DEFAULT_TUITION_FEE)}</span></p>
              <p>Discount: <span className="font-mono text-purple-400">-{formatCurrency(calculateDiscount(DEFAULT_TUITION_FEE, form.discount_type))}</span></p>
              <p>Total Due: <span className="font-mono font-bold">{formatCurrency(calculateAmountDue(DEFAULT_TUITION_FEE, calculateDiscount(DEFAULT_TUITION_FEE, form.discount_type)))}</span></p>
            </div>
            <Button onClick={handleCreate} disabled={!form.entity_id} className="w-full bg-cyan-500 text-black hover:bg-cyan-400">Create Invoice</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md bg-card border-border">
          {selected && (
            <>
              <DialogHeader><DialogTitle>Invoice {selected.invoice_number}</DialogTitle></DialogHeader>
              <div className="space-y-2 mt-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Student</span><span>{selected.student_name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="text-xs">{selected.student_email}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Track</span><span>{selected.track}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Batch</span><span>{selected.batch_name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tuition</span><span className="font-mono">{formatCurrency(selected.tuition_fee)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="font-mono text-purple-400">-{formatCurrency(selected.discount_amount)}</span></div>
                <div className="flex justify-between border-t border-border/30 pt-2"><span className="font-semibold">Total Due</span><span className="font-mono font-bold">{formatCurrency(selected.total_amount_due)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Issue Date</span><span>{selected.issue_date}</span></div>
                {selected.due_date && <div className="flex justify-between"><span className="text-muted-foreground">Due Date</span><span>{selected.due_date}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge status={selected.payment_status} /></div>
              </div>
              {selected.payment_status !== "Paid" && selected.payment_status !== "Waived" && (
                <>
                  <div className="mt-4">
                    <Label className="text-xs text-muted-foreground mb-1.5">Admin Notes</Label>
                    <Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={2} className="bg-secondary border-border" placeholder="Internal notes..." />
                  </div>
                  <Button onClick={() => markPaid(selected)} className="w-full mt-3 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/20 text-sm">
                    <CheckCircle size={14} className="mr-2" /> Mark as Paid
                  </Button>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}