import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { computeCertificateEligibility } from "@/lib/curriculum-utils";

export default function FacilitatorStudents() {
  const [students, setStudents] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = async () => {
    const user = await base44.auth.me();
    const facs = await base44.entities.Facilitator.filter({ email: user.email });
    if (facs.length > 0) {
      const allStudents = await base44.entities.Student.filter({ facilitator_id: facs[0].id });
      setStudents(allStudents);
      const studentIds = allStudents.map(s => s.id);
      const allSubs = await base44.entities.Submission.list("-created_date", 200);
      setSubmissions(allSubs.filter(s => studentIds.includes(s.student_id)));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (studentId, status) => {
    await base44.entities.Student.update(studentId, { progress_status: status });
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, progress_status: status } : s));
    toast({ title: `Student status updated to ${status}` });
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;

  if (students.length === 0) {
    return <div className="rounded-xl border border-border/50 bg-card p-12 text-center text-muted-foreground text-sm">No students assigned.</div>;
  }

  return (
    <div>
      <h1 className="text-xl md:text-2xl font-heading font-bold mb-6">My Students</h1>
      <div className="space-y-3">
        {students.map(s => {
          const studentSubs = submissions.filter(sub => sub.student_id === s.id);
          const passedCount = studentSubs.filter(sub => sub.status === "Passed").length;
          const submittedCount = studentSubs.filter(sub => sub.status !== "Not Started").length;
          const progressPct = Math.round((passedCount / 10) * 100);
          const certStatus = computeCertificateEligibility(studentSubs);

          return (
            <div key={s.id} className="rounded-xl border border-border/50 bg-card p-4 md:p-5">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{s.full_name}</p>
                  <p className="text-xs text-muted-foreground">{s.track} · {s.email}</p>

                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Week</span>
                      <span className="text-sm font-mono font-bold">{s.current_week}/10</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Passed</span>
                      <span className="text-sm font-mono font-bold text-emerald-400">{passedCount}/10</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Submitted</span>
                      <span className="text-sm font-mono font-bold">{submittedCount}/10</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden max-w-xs">
                    <div className="h-full bg-cyan-500/50 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Certificate:</span>
                    <StatusBadge status={certStatus} />
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <Select value={s.progress_status} onValueChange={v => updateStatus(s.id, v)}>
                    <SelectTrigger className="w-36 h-8 text-xs bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["On Track", "Needs Attention", "At Risk", "Completed", "Removed"].map(st => (
                        <SelectItem key={st} value={st}>{st}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}