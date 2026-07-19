import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Mail } from "lucide-react";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { WAITLIST_STATUSES } from "@/lib/business-utils";
import EmptyState from "@/components/curriculum/EmptyState";

export default function AdminWaitlist() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = async () => {
    const data = await base44.entities.Waitlist.list("-created_date", 200);
    setEntries(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    await base44.entities.Waitlist.update(id, { status });
    setEntries(prev => prev.map(e => e.id === id ? { ...e, status } : e));
    toast({ title: `Waitlist entry marked as ${status}` });
  };

  const inviteToApply = async (entry) => {
    await base44.entities.Waitlist.update(entry.id, { status: "Invited to Apply" });
    setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, status: "Invited to Apply" } : e));
    toast({ title: `Invitation sent to ${entry.full_name}`, description: entry.email });
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;

  return (
    <div>
      <h1 className="text-xl md:text-2xl font-heading font-bold mb-2">Waitlist</h1>
      <p className="text-sm text-muted-foreground mb-6">Manage waitlisted applicants and invite them to apply.</p>

      {entries.length === 0 ? (
        <EmptyState title="No waitlist entries" description="Public waitlist signups will appear here." />
      ) : (
        <div className="space-y-3">
          {entries.map(entry => (
            <div key={entry.id} className="rounded-xl border border-border/50 bg-card p-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{entry.full_name}</p>
                  <p className="text-xs text-muted-foreground">{entry.email}{entry.phone ? ` · ${entry.phone}` : ""}</p>
                  {entry.preferred_track && <p className="text-xs text-muted-foreground mt-1">Preferred track: {entry.preferred_track}</p>}
                  {entry.preferred_batch && <p className="text-xs text-muted-foreground">Preferred batch: {entry.preferred_batch}</p>}
                  {entry.reason_for_interest && <p className="text-xs text-foreground/70 mt-2">{entry.reason_for_interest}</p>}
                </div>
                <div className="flex-shrink-0 flex flex-col items-end gap-2">
                  <StatusBadge status={entry.status} />
                  {entry.status === "New" && (
                    <Button size="sm" onClick={() => inviteToApply(entry)} className="bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/20 text-xs">
                      <Mail size={12} className="mr-1" /> Invite to Apply
                    </Button>
                  )}
                  <Select value={entry.status} onValueChange={v => updateStatus(entry.id, v)}>
                    <SelectTrigger className="w-40 h-8 text-xs bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {WAITLIST_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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