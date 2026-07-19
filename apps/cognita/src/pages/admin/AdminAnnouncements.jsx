import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Plus, Megaphone, Trash2, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import EmptyState from "@/components/curriculum/EmptyState";
import { ACTIVE_TRACKS } from "@/lib/curriculum";

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", audience: "All Students", batch_id: "", track: "", priority: "Normal" });
  const { toast } = useToast();

  const load = async () => {
    const [a, b] = await Promise.all([
      base44.entities.Announcement.list("-created_date", 100),
      base44.entities.Batch.list("-created_date", 50),
    ]);
    setAnnouncements(a);
    setBatches(b);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    await base44.entities.Announcement.create({
      ...form,
      status: "Published",
      created_by: (await base44.auth.me())?.full_name || "Admin",
    });
    toast({ title: "Announcement published" });
    setOpen(false);
    setForm({ title: "", body: "", audience: "All Students", batch_id: "", track: "", priority: "Normal" });
    load();
  };

  const handleArchive = async (id) => {
    await base44.entities.Announcement.update(id, { status: "Archived" });
    toast({ title: "Announcement archived" });
    load();
  };

  const handleDelete = async (id) => {
    await base44.entities.Announcement.delete(id);
    toast({ title: "Announcement deleted" });
    load();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-heading font-bold">Announcements</h1>
          <p className="text-sm text-muted-foreground mt-1">Broadcast messages to students and facilitators.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-cyan-500 text-black hover:bg-cyan-400 text-sm">
          <Plus size={14} className="mr-2" /> New Announcement
        </Button>
      </div>

      {announcements.length === 0 ? (
        <EmptyState icon={Megaphone} title="No announcements" description="Create an announcement to broadcast to students." />
      ) : (
        <div className="space-y-3">
          {announcements.map(a => (
            <div key={a.id} className={`rounded-xl border p-5 ${a.status === "Archived" ? "border-border/30 bg-secondary/20 opacity-60" : a.priority === "Urgent" ? "border-red-500/20 bg-red-500/5" : a.priority === "Important" ? "border-yellow-500/20 bg-yellow-500/5" : "border-border/50 bg-card"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-sm font-semibold">{a.title}</h2>
                    {a.priority === "Urgent" && <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full border border-red-500/20 bg-red-500/10 text-red-400">Urgent</span>}
                    {a.priority === "Important" && <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full border border-yellow-500/20 bg-yellow-500/10 text-yellow-400">Important</span>}
                    {a.status === "Archived" && <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full border border-border bg-secondary text-muted-foreground">Archived</span>}
                  </div>
                  <p className="text-sm text-foreground/70 whitespace-pre-wrap line-clamp-2">{a.body}</p>
                  <p className="text-[10px] text-muted-foreground mt-2">{a.audience} · {a.created_by} · {a.created_date ? new Date(a.created_date).toLocaleDateString() : ""}</p>
                </div>
                {a.status !== "Archived" && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => handleArchive(a.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"><Archive size={14} /></button>
                    <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={14} /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Announcement</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Title *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Message *</Label>
              <Textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={5} className="bg-secondary border-border" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">Audience</Label>
                <Select value={form.audience} onValueChange={v => setForm(f => ({ ...f, audience: v }))}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Students">All Students</SelectItem>
                    <SelectItem value="Specific Batch">Specific Batch</SelectItem>
                    <SelectItem value="Specific Track">Specific Track</SelectItem>
                    <SelectItem value="Facilitators">Facilitators</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Important">Important</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.audience === "Specific Batch" && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">Batch</Label>
                <Select value={form.batch_id} onValueChange={v => setForm(f => ({ ...f, batch_id: v }))}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select batch" /></SelectTrigger>
                  <SelectContent>
                    {batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {form.audience === "Specific Track" && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">Track</Label>
                <Select value={form.track} onValueChange={v => setForm(f => ({ ...f, track: v }))}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select track" /></SelectTrigger>
                  <SelectContent>
                    {ACTIVE_TRACKS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button onClick={handleCreate} disabled={!form.title || !form.body} className="w-full bg-cyan-500 text-black hover:bg-cyan-400">Publish Announcement</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}