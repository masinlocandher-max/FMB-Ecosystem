import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { LEAD_STATUSES } from "@/lib/business-utils";
import EmptyState from "@/components/curriculum/EmptyState";

export default function AdminLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const { toast } = useToast();

  const load = async () => {
    const data = await base44.entities.Lead.list("-created_date", 200);
    setLeads(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    await base44.entities.Lead.update(id, { status });
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    toast({ title: `Lead marked as ${status}` });
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;

  const filtered = filter === "all" ? leads : leads.filter(l => l.status === filter);

  return (
    <div>
      <h1 className="text-xl md:text-2xl font-heading font-bold mb-2">Leads</h1>
      <p className="text-sm text-muted-foreground mb-6">All lead capture submissions across the site.</p>

      <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
        <button onClick={() => setFilter("all")} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${filter === "all" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-muted-foreground border border-transparent"}`}>All ({leads.length})</button>
        {LEAD_STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${filter === s ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "text-muted-foreground border border-transparent"}`}>{s} ({leads.filter(l => l.status === s).length})</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No leads" description="Lead capture forms will appear here." />
      ) : (
        <div className="space-y-3">
          {filtered.map(lead => (
            <div key={lead.id} className="rounded-xl border border-border/50 bg-card p-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{lead.full_name}</p>
                  <p className="text-xs text-muted-foreground">{lead.email}{lead.phone ? ` · ${lead.phone}` : ""}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-400">{lead.interest_type}</span>
                    {lead.preferred_track && <span className="text-[10px] text-muted-foreground">{lead.preferred_track}</span>}
                    {lead.source_page && <span className="text-[10px] text-muted-foreground">from {lead.source_page}</span>}
                  </div>
                  {lead.message && <p className="text-xs text-foreground/70 mt-2">{lead.message}</p>}
                </div>
                <div className="flex-shrink-0 w-full sm:w-40">
                  <StatusBadge status={lead.status} />
                  <Select value={lead.status} onValueChange={v => updateStatus(lead.id, v)}>
                    <SelectTrigger className="w-full h-8 text-xs bg-secondary border-border mt-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LEAD_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}