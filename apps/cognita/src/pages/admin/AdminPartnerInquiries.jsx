import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Eye } from "lucide-react";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { PARTNER_INQUIRY_STATUSES } from "@/lib/business-utils";
import EmptyState from "@/components/curriculum/EmptyState";

export default function AdminPartnerInquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  const { toast } = useToast();

  const load = async () => {
    const data = await base44.entities.PartnerInquiry.list("-created_date", 200);
    setInquiries(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    await base44.entities.PartnerInquiry.update(id, { status });
    setInquiries(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    if (selected?.id === id) setSelected(prev => ({ ...prev, status }));
    toast({ title: `Inquiry marked as ${status}` });
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;

  const filtered = filter === "all" ? inquiries : inquiries.filter(i => i.status === filter);

  return (
    <div>
      <h1 className="text-xl md:text-2xl font-heading font-bold mb-2">Partner Inquiries</h1>
      <p className="text-sm text-muted-foreground mb-6">Institutional partnership requests from organizations.</p>

      <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
        <button onClick={() => setFilter("all")} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${filter === "all" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-muted-foreground border border-transparent"}`}>All ({inquiries.length})</button>
        {PARTNER_INQUIRY_STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${filter === s ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-muted-foreground border border-transparent"}`}>{s}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No partner inquiries" description="Partnership requests will appear here." />
      ) : (
        <div className="space-y-3">
          {filtered.map(inq => (
            <div key={inq.id} className="rounded-xl border border-border/50 bg-card p-4 cursor-pointer hover:bg-secondary/30 transition-colors" onClick={() => setSelected(inq)}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{inq.organization_name}</p>
                  <p className="text-xs text-muted-foreground">{inq.contact_person} · {inq.email}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400">{inq.organization_type}</span>
                    <span className="text-[10px] text-muted-foreground">{inq.interested_program}</span>
                    {inq.estimated_participants && <span className="text-[10px] text-muted-foreground">· {inq.estimated_participants} participants</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={inq.status} />
                  <Eye size={14} className="text-muted-foreground" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader><DialogTitle>{selected.organization_name}</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                {[
                  { l: "Organization Type", v: selected.organization_type },
                  { l: "Contact Person", v: selected.contact_person },
                  { l: "Email", v: selected.email },
                  { l: "Phone", v: selected.phone },
                  { l: "Location", v: selected.location },
                  { l: "Interested Program", v: selected.interested_program },
                  { l: "Estimated Participants", v: selected.estimated_participants },
                  { l: "Preferred Schedule", v: selected.preferred_schedule },
                ].filter(x => x.v).map((x, i) => (
                  <div key={i}>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{x.l}</p>
                    <p className="text-sm mt-0.5">{String(x.v)}</p>
                  </div>
                ))}
                {selected.message && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Message</p>
                    <p className="text-sm mt-0.5 text-foreground/80 whitespace-pre-wrap">{selected.message}</p>
                  </div>
                )}
                {selected.proposal_url && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Proposal/Letter</p>
                    <a href={selected.proposal_url} target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-400 hover:underline">View document →</a>
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Update Status</p>
                  <Select value={selected.status} onValueChange={v => updateStatus(selected.id, v)}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PARTNER_INQUIRY_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}