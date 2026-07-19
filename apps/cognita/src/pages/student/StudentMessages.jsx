import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import EmptyState from "@/components/curriculum/EmptyState";

export default function StudentMessages() {
  const [student, setStudent] = useState(null);
  const [facilitator, setFacilitator] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [body, setBody] = useState("");
  const [subject, setSubject] = useState("");
  const { toast } = useToast();

  const load = async () => {
    const user = await base44.auth.me();
    const students = await base44.entities.Student.filter({ email: user.email });
    if (students.length > 0) {
      const s = students[0];
      setStudent(s);
      if (s.facilitator_id) {
        const facs = await base44.entities.Facilitator.filter({ id: s.facilitator_id });
        if (facs.length > 0) setFacilitator(facs[0]);
      }
      const allMsgs = await base44.entities.Message.list("-created_date", 100);
      const conversationId = `${s.id}-${s.facilitator_id || "admin"}`;
      const relevant = allMsgs.filter(m =>
        m.conversation_id === conversationId ||
        (m.recipient_id === s.id && m.recipient_role === "student") ||
        (m.sender_id === s.id && m.sender_role === "student")
      );
      setMessages(relevant.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSend = async () => {
    if (!body.trim()) return;
    setSending(true);
    try {
      const recipientId = facilitator?.id || "admin";
      const recipientName = facilitator?.full_name || "Admin";
      const conversationId = `${student.id}-${recipientId}`;
      await base44.entities.Message.create({
        sender_id: student.id,
        sender_name: student.full_name,
        sender_role: "student",
        recipient_id: recipientId,
        recipient_name: recipientName,
        recipient_role: facilitator ? "facilitator" : "admin",
        subject: subject || "Message from student",
        body: body.trim(),
        conversation_id: conversationId,
        read: false,
      });
      setBody("");
      setSubject("");
      toast({ title: "Message sent" });
      load();
    } catch (err) {
      toast({ title: "Failed to send", description: err.message, variant: "destructive" });
    }
    setSending(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;

  if (!student) return <EmptyState icon={MessageSquare} title="Not enrolled yet" description="Messaging will be available once you're enrolled." />;

  return (
    <div>
      <h1 className="text-xl md:text-2xl font-heading font-bold mb-1">Messages</h1>
      <p className="text-xs text-muted-foreground mb-6">
        {facilitator ? `Direct line to your facilitator: ${facilitator.full_name}` : "No facilitator assigned yet — messages will go to admin."}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Conversation */}
        <div className="rounded-xl border border-border/50 bg-card">
          <div className="px-5 py-4 border-b border-border/50">
            <h2 className="text-sm font-semibold">Conversation</h2>
          </div>
          {messages.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No messages yet. Start the conversation below.</div>
          ) : (
            <div className="divide-y divide-border/30 max-h-[400px] overflow-y-auto">
              {messages.map(m => (
                <div key={m.id} className={`px-5 py-4 ${m.sender_role === "student" ? "bg-cyan-500/5" : ""}`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium">{m.sender_name} <span className="text-muted-foreground">→ {m.recipient_name}</span></p>
                    <span className="text-[10px] text-muted-foreground">{m.created_date ? new Date(m.created_date).toLocaleDateString() : ""}</span>
                  </div>
                  {m.subject && <p className="text-xs font-semibold mb-1">{m.subject}</p>}
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap">{m.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Compose */}
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">Send a Message</h2>
          <div className="space-y-3">
            <div>
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject (optional)" className="bg-secondary border-border text-sm" />
            </div>
            <div>
              <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Type your message..." rows={5} className="bg-secondary border-border text-sm" />
            </div>
            <Button onClick={handleSend} disabled={!body.trim() || sending} className="w-full bg-cyan-500 text-black hover:bg-cyan-400">
              {sending ? <Loader2 size={14} className="animate-spin" /> : <><Send size={14} className="mr-1" /> Send Message</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}