import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Plus, Eye, CheckCircle, XCircle, Gift } from "lucide-react";
import StatusBadge from "@/components/dashboard/StatusBadge";
import StatCard from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { PAYMENT_STATUSES, DISCOUNT_TYPES, DEFAULT_TUITION_FEE, calculateDiscount, calculateAmountDue, formatCurrency, generateReceiptNumber, getNextSequence } from "@/lib/business-utils";
import EmptyState from "@/components/curriculum/EmptyState";

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [apps, setApps] = useState([]);
  const [batches, setBatches] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ source: "student", entity_id: "", discount_type: "None" });
  const [selected, setSelected] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [filter, setFilter] = useState("all");
  const { toast } = useToast();

  const load = async () => {
    const [p, s, a, b, r] = await Promise.all([
      base44.entities.Payment.list("-created_date", 200),
      base44.entities.Student.list("-created_date", 200),
      base44.entities.Application.list("-created_date", 200),
      base44.entities.Batch.list("-created_date", 50),
      base44.entities.Receipt.list("-created_date", 200),
    ]);
    setPayments(p);
    setStudents(s);
    setApps(a);
    setBatches(b);
    setReceipts(r);
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

    const tuition = DEFAULT_TUITION_FEE;
    const discountAmount = calculateDiscount(tuition, form.discount_type);
    const amountDue = calculateAmountDue(tuition, discountAmount);

    await base44.entities.Payment.create({
      student_id: form.source === "student" ? form.entity_id : undefined,
      student_name: name,
      student_email: email,
      batch_id: batchId,
      batch_name: batchName,
      track,
      tuition_fee: tuition,
      discount_type: form.discount_type,
      discount_amount: discountAmount,
      amount_due: amountDue,
      amount_paid: 0,
      balance_due: amountDue,
      payment_status: "Payment Pending",
      service_commitment_required: form.discount_type === "Future Educator 50% Discount",
      teaching_hours_required: form.discount_type === "Future Educator 50% Discount" ? 40 : 0,
      teaching_hours_completed: 0,
    });
    toast({ title: "Payment record created" });
    setCreateOpen(false);
    setForm({ source: "student", entity_id: "", discount_type: "None" });
    load();
  };

  const updatePaymentStatus = async (payment, status) => {
    const updates = { payment_status: status, admin_notes: adminNotes };
    const batch = getBatch(payment.batch_id);
    const batchCode = batch?.batch_code || "B000";
    const year = new Date().getFullYear();

    if (status === "Payment Confirmed") {
      updates.date_confirmed = new Date().toISOString();
      updates.confirmed_by = (await base44.auth.me())?.full_name || "Admin";
      updates.amount_paid = payment.amount_due;
      updates.balance_due = 0;

      // Create receipt
      const seq = getNextSequence(receipts, "COG-RCPT", year, batchCode);
      const receiptNumber = generateReceiptNumber(year, batchCode, seq);
      await base44.entities.Receipt.create({
        receipt_number: receiptNumber,
        student_id: payment.student_id,
        student_name: payment.student_name,
        student_email: payment.student_email,
        batch_id: payment.batch_id,
        batch_name: payment.batch_name,
        track: payment.track,
        amount_paid: payment.amount_due,
        payment_method: payment.payment_method || "Bank Transfer",
        payment_reference: payment.payment_reference,
        date_paid: new Date().toISOString().split("T")[0],
        confirmed_by: updates.confirmed_by,
        payment_id: payment.id,
      });

      // Update student payment status
      if (payment.student_id) {
        await base44.entities.Student.update(payment.student_id, { payment_status: "Payment Confirmed", payment_proof_url: payment.payment_proof_url });
      }
    } else if (status === "Payment Waived") {
      if (payment.student_id) {
        await base44.entities.Student.update(payment.student_id, { payment_status: "Payment Waived" });
      }
    } else if (status === "Payment Failed") {
      if (payment.student_id) {
        await base44.entities.Student.update(payment.student_id, { payment_status: "Payment Failed" });
      }
    }

    await base44.entities.Payment.update(payment.id, updates);
    toast({ title: `Payment marked as ${status}` });
    setSelected(null);
    setAdminNotes("");
    load();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;

  const acceptedApps = apps.filter(a => a.status === "Accepted");
  const filtered = filter === "all" ? payments : payments.filter(p => p.payment_status === filter);
  const proofsToReview = payments.filter(p => p.payment_status === "Payment Submitted");
  const pendingCount = payments.filter(p => ["Payment Pending", "Payment Submitted", "Balance Due"].includes(p.payment_status)).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-heading font-bold">Payments</h1>
          <p className="text-sm text-muted-foreground mt-1">Manual payment tracking and proof review.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="bg-cyan-500 text-black hover:bg-cyan-400 text-sm">
          <Plus size={14} className="mr-2" /> New Payment
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard label="Total Payments" value={payments.length} icon={Plus} />
        <StatCard label="Proofs to Review" value={proofsToReview.length} icon={Eye} accent="text-yellow-400" />
        <StatCard label="Pending" value={pendingCount} icon={Loader2} accent="text-orange-400" />
        <StatCard label="Confirmed" value={payments.filter(p => p.payment_status === "Payment Confirmed").length} icon={CheckCircle} accent="text-emerald-400" />
      </div>

      <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
        <button onClick={() => setFilter("all")} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${filter === "all" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-muted-foreground border border-transparent"}`}>All ({payments.length})</button>
        {PAYMENT_STATUSES.map(s => {
          const count = payments.filter(p => p.payment_status === s).length;
          if (count === 0 && s !== "Payment Submitted") return null;
          return <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${filter === s ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-muted-foreground border border-transparent"}`}>{s} ({count})</button>;
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No payment records" description="Create a payment record for an accepted applicant or student." />
      ) : (
        <div className="space-y-3">
          {filtered.map(p => (
            <div key={p.id} className="rounded-xl border border-border/50 bg-card p-4 cursor-pointer hover:bg-secondary/30 transition-colors" onClick={() => { setSelected(p); setAdminNotes(p.admin_notes || ""); }}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{p.student_name}</p>
                  <p className="text-xs text-muted-foreground">{p.track} · {p.batch_name}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                    <span className="text-muted-foreground">Due: <span className="font-mono text-foreground">{formatCurrency(p.amount_due)}</span></span>
                    <span className="text-muted-foreground">Paid: <span className="font-mono text-emerald-400">{formatCurrency(p.amount_paid)}</span></span>
                    {p.balance_due > 0 && <span className="text-muted-foreground">Balance: <span className="font-mono text-orange-400">{formatCurrency(p.balance_due)}</span></span>}
                    {p.discount_type !== "None" && <span className="text-[10px] px-2 py-0.5 rounded-full border border-purple-500/20 bg-purple-500/5 text-purple-400">{p.discount_type}</span>}
                  </div>
                  {p.payment_proof_url && p.payment_status === "Payment Submitted" && (
                    <p className="text-[10px] text-yellow-400 mt-1">Payment proof uploaded — review needed</p>
                  )}
                </div>
                <StatusBadge status={p.payment_status} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader><DialogTitle>New Payment Record</DialogTitle></DialogHeader>
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
            {form.discount_type !== "None" && (
              <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20 text-xs space-y-1">
                <p>Tuition: <span className="font-mono">{formatCurrency(DEFAULT_TUITION_FEE)}</span></p>
                <p>Discount: <span className="font-mono text-purple-400">-{formatCurrency(calculateDiscount(DEFAULT_TUITION_FEE, form.discount_type))}</span></p>
                <p>Amount Due: <span className="font-mono font-bold">{formatCurrency(calculateAmountDue(DEFAULT_TUITION_FEE, calculateDiscount(DEFAULT_TUITION_FEE, form.discount_type)))}</span></p>
                {form.discount_type === "Future Educator 50% Discount" && <p className="text-purple-400">Service commitment: 40 teaching hours required</p>}
              </div>
            )}
            <Button onClick={handleCreate} disabled={!form.entity_id} className="w-full bg-cyan-500 text-black hover:bg-cyan-400">Create Payment Record</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail/Review dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader><DialogTitle>Payment — {selected.student_name}</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-[10px] uppercase tracking-widest text-muted-foreground">Tuition</p><p className="font-mono">{formatCurrency(selected.tuition_fee)}</p></div>
                  <div><p className="text-[10px] uppercase tracking-widest text-muted-foreground">Discount</p><p className="font-mono text-purple-400">{selected.discount_type} (-{formatCurrency(selected.discount_amount)})</p></div>
                  <div><p className="text-[10px] uppercase tracking-widest text-muted-foreground">Amount Due</p><p className="font-mono font-bold">{formatCurrency(selected.amount_due)}</p></div>
                  <div><p className="text-[10px] uppercase tracking-widest text-muted-foreground">Amount Paid</p><p className="font-mono text-emerald-400">{formatCurrency(selected.amount_paid)}</p></div>
                  <div><p className="text-[10px] uppercase tracking-widest text-muted-foreground">Balance</p><p className="font-mono text-orange-400">{formatCurrency(selected.balance_due)}</p></div>
                  <div><p className="text-[10px] uppercase tracking-widest text-muted-foreground">Method</p><p>{selected.payment_method || "—"}</p></div>
                  <div><p className="text-[10px] uppercase tracking-widest text-muted-foreground">Reference</p><p className="font-mono text-xs">{selected.payment_reference || "—"}</p></div>
                  <div><p className="text-[10px] uppercase tracking-widest text-muted-foreground">Submitted</p><p className="text-xs">{selected.date_submitted ? new Date(selected.date_submitted).toLocaleDateString() : "—"}</p></div>
                </div>

                {/* Future Educator service commitment */}
                {selected.service_commitment_required && (
                  <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-purple-400 mb-2 flex items-center gap-1"><Gift size={12} /> Future Educator Service Commitment</p>
                    <div className="grid grid-cols-3 gap-2 text-xs text-center">
                      <div><p className="text-muted-foreground">Required</p><p className="font-mono font-bold">{selected.teaching_hours_required}h</p></div>
                      <div><p className="text-muted-foreground">Completed</p><p className="font-mono font-bold text-emerald-400">{selected.teaching_hours_completed || 0}h</p></div>
                      <div><p className="text-muted-foreground">Remaining</p><p className="font-mono font-bold text-orange-400">{(selected.teaching_hours_required || 0) - (selected.teaching_hours_completed || 0)}h</p></div>
                    </div>
                  </div>
                )}

                {/* Payment proof */}
                {selected.payment_proof_url && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Payment Proof</p>
                    <a href={selected.payment_proof_url} target="_blank" rel="noopener noreferrer" className="block">
                      <img src={selected.payment_proof_url} alt="Payment proof" className="max-h-48 rounded-lg border border-border/50 w-full object-contain" />
                    </a>
                  </div>
                )}

                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">Admin Notes</Label>
                  <Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={2} className="bg-secondary border-border" placeholder="Internal notes..." />
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {selected.payment_status === "Payment Submitted" && (
                    <>
                      <Button size="sm" onClick={() => updatePaymentStatus(selected, "Payment Confirmed")} className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/20 text-xs">
                        <CheckCircle size={12} className="mr-1" /> Confirm Payment
                      </Button>
                      <Button size="sm" onClick={() => updatePaymentStatus(selected, "Payment Failed")} className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/20 text-xs">
                        <XCircle size={12} className="mr-1" /> Mark Failed
                      </Button>
                    </>
                  )}
                  <Button size="sm" onClick={() => updatePaymentStatus(selected, "Payment Waived")} className="bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/20 text-xs">
                    <Gift size={12} className="mr-1" /> Waive
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => updatePaymentStatus(selected, "Payment Pending")} className="text-xs border-border">Reset to Pending</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}