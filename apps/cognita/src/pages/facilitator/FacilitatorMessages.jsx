import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import EmptyState from "@/components/curriculum/EmptyState";

export default function FacilitatorMessages() {
  const [facilitator, setFacilitator] = useState(null);
  const [students, setStudents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [body, setBody] = useState("");
  const [subject, setSubject] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    const user = await base44.auth.me();
    const facs = await base44.entities.Facilitator.filter({ email: user.email });
    if (facs.length > 0) {
      const fac = facs[0];
      setFacilitator(fac);
      const allStudents = await base44.entities.Student.filter({ facilitator_id: fac.id });
      setStudents(allStudents);
      const allMsgs = await base44.entities.Message.list("-created_date", 200);
      const studentIds = new Set(allStudents.map(s => s.id));
      const relevant = allMsgs.filter(m =>
        studentIds.has(m.sender_id) || studentIds.has(m.recipient_id) ||
        (m.sender_id === fac.id) || (m.recipient_id === fac.id)
      );
      setMessages(relevant);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;

  if (!facilitator) {
    return <EmptyState icon={MessageSquare} title="Not registered as facilitator" description="Contact admin to be added as a facilitator." />;
  }

  const getStudentMessages = (studentId) => {
    return messages
      .filter(m => (m.sender_id === studentId && m.sender_role === "student") || (m.recipient_id === studentId && m.recipient_role === "student"))
      .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
  };

  const handleSend = async () => {
    if (!selectedStudent || !body.trim()) return;
    setSending(true);
    try {
      const student = students.find(s => s.id === selectedStudent);
      const conversationId = `${student.id}-${facilitator.id}`;
      await base44.entities.Message.create({
        sender_id: facilitator.id,
        sender_name: facilitator.full_name,
        sender_role: "facilitator",
        recipient_id: student.id,
        recipient_name: student.full_name,
        recipient_role: "student",
        subject: subject || "Message from your facilitator",
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

  const student = students.find(s => s.id === selectedStudent);
  const conversation = selectedStudent ? getStudentMessages(selectedStudent) : [];

  return (
    <div>
      <h1 className="text-xl md:text-2xl font-heading font-bold mb-6">Student Messages</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Student list */}
        <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50"><h2 className="text-sm font-semibold">Your Students</h2></div>
          {students.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No students assigned.</div>
          ) : (
            <div className="divide-y divide-border/30 max-h-[500px] overflow-y-auto">
              {students.map(s => (
                <div
                  key={s.id}
                  onClick={() => setSelectedStudent(s.id)}
                  className={`px-5 py-3 cursor-pointer transition-colors ${selectedStudent === s.id ? "bg-cyan-500/10" : "hover:bg-secondary/30"}`}
                >
                  <p className="text-sm font-medium">{s.full_name}</p>
                  <p className="text-xs text-muted-foreground">Week {s.current_week}/10</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Conversation */}
        <div className="lg:col-span-2">
          {!selectedStudent ? (
            <EmptyState icon={MessageSquare} title="Select a student" description="Choose a student to view and send messages." />
          ) : (
            <div className="rounded-xl border border-border/50 bg-card">
              <div className="px-5 py-4 border-b border-border/50">
                <h2 className="text-sm font-semibold">{student?.full_name}</h2>
                <p className="text-xs text-muted-foreground">{student?.track}</p>
              </div>
              <div className="max-h-[300px] overflow-y-auto divide-y divide-border/30">
                {conversation.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">No messages yet.</div>
                ) : (
                  conversation.map(m => (
                    <div key={m.id} className={`px-5 py-3 ${m.sender_role === "facilitator" ? "bg-cyan-500/5" : ""}`}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium">{m.sender_name}</p>
                        <span className="text-[10px] text-muted-foreground">{m.created_date ? new Date(m.created_date).toLocaleDateString() : ""}</span>
                      </div>
                      {m.subject && <p className="text-xs font-semibold mb-0.5">{m.subject}</p>}
                      <p className="text-sm text-foreground/80 whitespace-pre-wrap">{m.body}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 border-t border-border/50 space-y-2">
                <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject (optional)" className="bg-secondary border-border text-sm" />
                <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Type your message..." rows={3} className="bg-secondary border-border text-sm" />
                <Button onClick={handleSend} disabled={!body.trim() || sending} className="w-full bg-cyan-500 text-black hover:bg-cyan-400">
                  {sending ? <Loader2 size={14} className="animate-spin" /> : <><Send size={14} className="mr-1" /> Send Message</>}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}