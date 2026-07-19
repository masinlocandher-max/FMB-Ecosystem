import React, { useEffect, useState } from "react";
import { Loader2, LifeBuoy } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import EmptyState from "@/components/curriculum/EmptyState";
import StatusBadge from "@/components/dashboard/StatusBadge";

const STATUSES = ["New", "Acknowledged", "In Progress", "Waiting for Learner", "Resolved", "Closed"];
const PRIORITIES = ["Normal", "High", "Urgent"];

export default function AdminSupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    try {
      const data = await base44.entities.SupportTicket.list("-created_date", 300);
      setTickets(data);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openTicket = (ticket) => {
    setSelected(ticket);
    setNotes(ticket.internal_notes || "");
  };

  const saveTicket = async (updates = {}) => {
    if (!selected) return;
    setSaving(true);
    try {
      const next = { internal_notes: notes, ...updates };
      if (next.status === "Resolved" || next.status === "Closed") {
        next.resolved_at = new Date().toISOString();
      }
      await base44.entities.SupportTicket.update(selected.id, next);
      toast({ title: "Support ticket updated" });
      setSelected(null);
      await load();
    } catch (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;
  }

  const filtered = filter === "all" ? tickets : tickets.filter((ticket) => ticket.status === filter);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold md:text-2xl">Support Tickets</h1>
          <p className="mt-1 text-sm text-muted-foreground">Traceable learner and public support requests.</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full border-border bg-secondary sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ({tickets.length})</SelectItem>
            {STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={LifeBuoy} title="No support tickets" description="Submitted support requests will appear here." />
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => openTicket(ticket)}
              className="w-full rounded-xl border border-border/50 bg-card p-4 text-left transition-colors hover:bg-secondary/30"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-xs text-cyan-400">{ticket.ticket_reference}</p>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] ${ticket.priority === "Urgent" ? "border-red-500/20 bg-red-500/5 text-red-400" : ticket.priority === "High" ? "border-amber-500/20 bg-amber-500/5 text-amber-400" : "border-border/50 text-muted-foreground"}`}>
                      {ticket.priority || "Normal"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold">{ticket.full_name} · {ticket.concern_type}</p>
                  <p className="text-xs text-muted-foreground">{ticket.email}</p>
                  <p className="mt-2 line-clamp-2 text-xs text-foreground/70">{ticket.message}</p>
                </div>
                <StatusBadge status={ticket.status} />
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setSelected(null)}>
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-border bg-card p-6" onClick={(event) => event.stopPropagation()}>
            <p className="font-mono text-xs text-cyan-400">{selected.ticket_reference}</p>
            <h2 className="mt-2 text-lg font-bold">{selected.concern_type}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{selected.full_name} · {selected.email}</p>
            <div className="mt-5 rounded-xl border border-border/50 bg-secondary/30 p-4 text-sm whitespace-pre-wrap">{selected.message}</div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1.5 text-xs text-muted-foreground">Status</p>
                <Select value={selected.status} onValueChange={(value) => setSelected((current) => ({ ...current, status: value }))}>
                  <SelectTrigger className="border-border bg-secondary"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <p className="mb-1.5 text-xs text-muted-foreground">Priority</p>
                <Select value={selected.priority || "Normal"} onValueChange={(value) => setSelected((current) => ({ ...current, priority: value }))}>
                  <SelectTrigger className="border-border bg-secondary"><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORITIES.map((priority) => <SelectItem key={priority} value={priority}>{priority}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-1.5 text-xs text-muted-foreground">Internal notes</p>
              <Textarea rows={5} value={notes} onChange={(event) => setNotes(event.target.value)} className="border-border bg-secondary" />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setSelected(null)}>Cancel</Button>
              <Button disabled={saving} onClick={() => saveTicket({ status: selected.status, priority: selected.priority || "Normal" })} className="bg-cyan-500 text-black hover:bg-cyan-400">
                {saving ? <Loader2 size={15} className="animate-spin" /> : "Save ticket"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
