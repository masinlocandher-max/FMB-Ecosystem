import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Megaphone, AlertCircle } from "lucide-react";
import EmptyState from "@/components/curriculum/EmptyState";

export default function StudentAnnouncements() {
  const [student, setStudent] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      const students = await base44.entities.Student.filter({ email: user.email });
      if (students.length > 0) {
        const s = students[0];
        setStudent(s);
        const all = await base44.entities.Announcement.list("-created_date", 50);
        const visible = all.filter(a => {
          if (a.status !== "Published") return false;
          if (a.audience === "All Students") return true;
          if (a.audience === "Specific Batch" && a.batch_id) return a.batch_id === s.batch_id;
          if (a.audience === "Specific Track" && a.track) return a.track === s.track;
          return false;
        });
        setAnnouncements(visible);
      }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;

  if (!student) return <EmptyState icon={AlertCircle} title="Not enrolled yet" description="Announcements will appear here once you're enrolled." />;

  if (announcements.length === 0) {
    return <EmptyState icon={Megaphone} title="No announcements" description="Announcements from the academy will appear here." />;
  }

  const getPriorityStyle = (priority) => {
    if (priority === "Urgent") return "border-red-500/20 bg-red-500/5";
    if (priority === "Important") return "border-yellow-500/20 bg-yellow-500/5";
    return "border-border/50 bg-card";
  };

  const getPriorityBadge = (priority) => {
    if (priority === "Urgent") return <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full border border-red-500/20 bg-red-500/10 text-red-400">Urgent</span>;
    if (priority === "Important") return <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full border border-yellow-500/20 bg-yellow-500/10 text-yellow-400">Important</span>;
    return null;
  };

  return (
    <div>
      <h1 className="text-xl md:text-2xl font-heading font-bold mb-6">Announcements</h1>
      <div className="space-y-3">
        {announcements.map(a => (
          <div key={a.id} className={`rounded-xl border p-5 ${getPriorityStyle(a.priority)}`}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold">{a.title}</h2>
              {getPriorityBadge(a.priority)}
            </div>
            <p className="text-sm text-foreground/70 whitespace-pre-wrap leading-relaxed">{a.body}</p>
            <p className="text-[10px] text-muted-foreground mt-3">
              {a.audience === "All Students" ? "All Students" : a.audience === "Specific Batch" ? "Your Batch" : a.audience === "Specific Track" ? "Your Track" : a.audience}
              {" · "}
              {a.created_date ? new Date(a.created_date).toLocaleDateString() : ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}