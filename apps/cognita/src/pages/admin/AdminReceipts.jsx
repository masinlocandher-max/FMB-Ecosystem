import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import EmptyState from "@/components/curriculum/EmptyState";
import { formatCurrency } from "@/lib/business-utils";

export default function AdminReceipts() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    const data = await base44.entities.Receipt.list("-created_date", 200);
    setReceipts(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;

  return (
    <div>
      <h1 className="text-xl md:text-2xl font-heading font-bold mb-2">Receipts</h1>
      <p className="text-sm text-muted-foreground mb-6">Payment confirmation records created after payment confirmation.</p>

      {receipts.length === 0 ? (
        <EmptyState title="No receipts yet" description="Receipts are created automatically when payments are confirmed." />
      ) : (
        <div className="space-y-3">
          {receipts.map(r => (
            <div key={r.id} className="rounded-xl border border-border/50 bg-card p-4 cursor-pointer hover:bg-secondary/30 transition-colors" onClick={() => setSelected(r)}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{r.student_name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{r.receipt_number}</p>
                  <p className="text-xs text-muted-foreground">{r.track} · {r.batch_name}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-mono font-bold text-emerald-400">{formatCurrency(r.amount_paid)}</span>
                  <Eye size={14} className="text-muted-foreground" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md bg-card border-border">
          {selected && (
            <>
              <DialogHeader><DialogTitle>Payment Confirmation Record</DialogTitle></DialogHeader>
              <div className="space-y-2 mt-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Receipt Number</span><span className="font-mono">{selected.receipt_number}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Student</span><span>{selected.student_name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="text-xs">{selected.student_email}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Track</span><span>{selected.track}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Batch</span><span>{selected.batch_name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Amount Paid</span><span className="font-mono font-bold text-emerald-400">{formatCurrency(selected.amount_paid)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Payment Method</span><span>{selected.payment_method}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Reference</span><span className="font-mono text-xs">{selected.payment_reference}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Date Paid</span><span>{selected.date_paid}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Confirmed By</span><span>{selected.confirmed_by}</span></div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}