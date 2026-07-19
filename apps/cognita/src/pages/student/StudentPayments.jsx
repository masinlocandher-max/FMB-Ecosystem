import React, { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, CreditCard, FileText, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import EmptyState from "@/components/curriculum/EmptyState";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { PAYMENT_METHODS, formatCurrency } from "@/lib/business-utils";

const PAYMENT_ACCESS_STATUSES = new Set(["Payment Confirmed", "Payment Waived"]);

export default function StudentPayments() {
  const [student, setStudent] = useState(null);
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ payment_method: "Bank Transfer", payment_reference: "" });
  const { toast } = useToast();

  const load = async () => {
    try {
      const user = await base44.auth.me();
      const students = await base44.entities.Student.filter({ email: user.email });
      if (students.length === 0) return;
      const currentStudent = students[0];
      setStudent(currentStudent);
      const [paymentData, invoiceData, receiptData] = await Promise.all([
        base44.entities.Payment.filter({ student_id: currentStudent.id }),
        base44.entities.Invoice.filter({ student_id: currentStudent.id }),
        base44.entities.Receipt.filter({ student_id: currentStudent.id }),
      ]);
      setPayments(paymentData);
      setInvoices(invoiceData);
      setReceipts(receiptData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const uploadPaymentProof = async (payment, file) => {
    if (!file || !paymentForm.payment_reference.trim()) return;
    setUploading(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      await base44.entities.Payment.update(payment.id, {
        payment_proof_url: file_uri,
        payment_status: "Payment Submitted",
        date_submitted: new Date().toISOString(),
        payment_method: paymentForm.payment_method,
        payment_reference: paymentForm.payment_reference.trim(),
      });
      toast({ title: "Payment proof submitted", description: "Learning access remains locked until an authorized finance reviewer confirms or waives the payment." });
      setPaymentForm({ payment_method: "Bank Transfer", payment_reference: "" });
      await load();
    } catch (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const openPrivateProof = async (fileUri) => {
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: fileUri, expires_in: 300 });
      window.open(signed_url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast({ title: "Could not open payment proof", description: error.message, variant: "destructive" });
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;
  if (!student) return <EmptyState icon={AlertCircle} title="No enrollment record" description="Your finance and enrollment records will appear after the Admissions Office creates your student enrollment." />;

  const paymentAccessAllowed = PAYMENT_ACCESS_STATUSES.has(student.payment_status) || payments.some((payment) => PAYMENT_ACCESS_STATUSES.has(payment.payment_status));
  const pendingPayment = payments.find((payment) => ["Payment Pending", "Payment Submitted", "Payment Failed", "Balance Due"].includes(payment.payment_status));
  const confirmedReceipt = receipts.find((receipt) => receipt.payment_status !== "Revoked") || receipts[0];
  const checklist = [
    { label: "Enrollment record created", done: true },
    { label: "Enrollment agreement signed", done: student.enrollment_agreement_signed === true },
    { label: "Payment confirmed or formally waived", done: paymentAccessAllowed },
    { label: "Learning access available", done: student.enrollment_agreement_signed === true && paymentAccessAllowed && !["Suspended", "Expired", "Revoked"].includes(student.access_status) },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold md:text-2xl">Finance and Enrollment</h1>
      <p className="mb-6 mt-1 text-xs text-muted-foreground">{student.full_name} · {student.track}</p>

      {!paymentAccessAllowed && (
        <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
          <div className="flex items-start gap-3">
            <LockKeyhole size={19} className="mt-0.5 flex-shrink-0 text-amber-400" />
            <div>
              <p className="text-sm font-semibold text-amber-300">Learning access is not active yet</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Submitting payment proof does not automatically unlock lessons. An authorized finance reviewer must confirm the payment or record an approved waiver.</p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 rounded-xl border border-border/50 bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold">Enrollment Checklist</h2>
        <div className="space-y-3">
          {checklist.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              {item.done ? <CheckCircle size={16} className="text-emerald-400" /> : <span className="h-4 w-4 rounded-full border border-muted-foreground/30" />}
              <span className={`text-sm ${item.done ? "text-foreground" : "text-muted-foreground"}`}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {invoices.map((invoice) => (
        <div key={invoice.id} className="mb-6 rounded-xl border border-border/50 bg-card p-5">
          <div className="mb-4 flex items-center gap-2"><FileText size={16} className="text-cyan-400" /><h2 className="text-sm font-semibold">Invoice {invoice.invoice_number}</h2></div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Tuition or service fee</span><span className="font-mono">{formatCurrency(invoice.tuition_fee)}</span></div>
            {invoice.discount_amount > 0 && <div className="flex justify-between gap-4"><span className="text-muted-foreground">Discount ({invoice.discount_type})</span><span className="font-mono text-purple-400">-{formatCurrency(invoice.discount_amount)}</span></div>}
            <div className="flex justify-between gap-4 border-t border-border/30 pt-2"><span className="font-semibold">Total due</span><span className="font-mono font-bold">{formatCurrency(invoice.total_amount_due)}</span></div>
            {invoice.due_date && <div className="flex justify-between gap-4"><span className="text-muted-foreground">Due date</span><span>{invoice.due_date}</span></div>}
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Status</span><StatusBadge status={invoice.payment_status} /></div>
          </div>
        </div>
      ))}

      {pendingPayment && (
        <div className="mb-6 rounded-xl border border-border/50 bg-card p-5">
          <div className="mb-4 flex items-center gap-2"><CreditCard size={16} className="text-cyan-400" /><h2 className="text-sm font-semibold">Payment Record</h2></div>
          {pendingPayment.payment_status === "Payment Submitted" ? (
            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3 text-sm text-yellow-400">Payment proof is awaiting authorized review. Keep your reference number and do not submit duplicate payments unless instructed.</div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-border/30 bg-secondary/30 p-3 text-sm">
                <p className="mb-2 text-muted-foreground">Amount due: <span className="font-mono font-bold text-foreground">{formatCurrency(pendingPayment.amount_due)}</span></p>
                <p className="text-xs text-muted-foreground">Use only the official payment instructions included with your invoice or enrollment communication.</p>
              </div>
              <div>
                <Label className="mb-1.5 text-xs text-muted-foreground">Payment method</Label>
                <Select value={paymentForm.payment_method} onValueChange={(value) => setPaymentForm((current) => ({ ...current, payment_method: value }))}>
                  <SelectTrigger className="border-border bg-secondary"><SelectValue /></SelectTrigger>
                  <SelectContent>{PAYMENT_METHODS.map((method) => <SelectItem key={method} value={method}>{method}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 text-xs text-muted-foreground">Transaction reference *</Label>
                <Input value={paymentForm.payment_reference} onChange={(event) => setPaymentForm((current) => ({ ...current, payment_reference: event.target.value }))} placeholder="Transaction ID or reference number" className="border-border bg-secondary" />
              </div>
              <div>
                <Label className="mb-1.5 text-xs text-muted-foreground">Private payment proof *</Label>
                <input type="file" accept="image/*,application/pdf" onChange={(event) => uploadPaymentProof(pendingPayment, event.target.files?.[0])} disabled={uploading || !paymentForm.payment_reference.trim()} className="block w-full cursor-pointer text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-500/10 file:px-4 file:py-2 file:text-xs file:font-medium file:text-cyan-400 disabled:opacity-40" />
                {uploading && <p className="mt-1 text-xs text-muted-foreground"><Loader2 size={12} className="mr-1 inline animate-spin" />Uploading privately...</p>}
              </div>
            </div>
          )}
          {pendingPayment.payment_proof_url && <Button size="sm" variant="outline" onClick={() => openPrivateProof(pendingPayment.payment_proof_url)} className="mt-4 border-border text-xs"><FileText size={12} className="mr-1" /> View submitted proof</Button>}
        </div>
      )}

      {confirmedReceipt && (
        <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <div className="mb-4 flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-400" /><h2 className="text-sm font-semibold text-emerald-400">Payment Confirmation Record</h2></div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Receipt number</span><span className="font-mono text-xs">{confirmedReceipt.receipt_number}</span></div>
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Amount paid</span><span className="font-mono font-bold text-emerald-400">{formatCurrency(confirmedReceipt.amount_paid)}</span></div>
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Payment method</span><span>{confirmedReceipt.payment_method}</span></div>
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Date confirmed</span><span>{confirmedReceipt.date_paid}</span></div>
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Confirmed by</span><span>{confirmedReceipt.confirmed_by}</span></div>
          </div>
        </div>
      )}

      {payments.length > 0 && (
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold">Payment History</h2>
          {payments.map((payment) => (
            <div key={payment.id} className="flex items-center justify-between gap-4 border-b border-border/30 py-3 last:border-0">
              <div><p className="text-sm">{formatCurrency(payment.amount_due)} due</p>{payment.balance_due > 0 && <p className="text-xs text-orange-400">Balance: {formatCurrency(payment.balance_due)}</p>}</div>
              <StatusBadge status={payment.payment_status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
