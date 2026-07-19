import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";
import StatusBadge from "@/components/dashboard/StatusBadge";
import ReviewPanel from "@/components/curriculum/ReviewPanel";
import EmptyState from "@/components/curriculum/EmptyState";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { getWeekLesson } from "@/lib/curriculum-utils";
import { computeStudentUpdates } from "@/lib/curriculum-utils";

export default function AdminSubmissions() {
  const [subs, setSubs] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [reviewing, setReviewing] = useState(false);
  const [filter, setFilter] = useState("Submitted");
  const { toast } = useToast();

  const load = async () => {
    const [s, st] = await Promise.all([
      base44.entities.Submission.list("-created_date", 200),
      base44.entities.Student.list("-created_date", 200),
    ]);
    setSubs(s);
    setStudents(st);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getStudent = (id) => students.find(s => s.id === id);
  const getStudentName = (id) => getStudent(id)?.full_name || "Unknown";

  const handleReview = async (decision, reviewData) => {
    setReviewing(true);
    try {
      const { feedback, revision_instructions, rubric_scores, portfolio_ready } = reviewData;
      const user = await base44.auth.me();

      await base44.entities.Submission.update(selected.id, {
        status: decision,
        feedback,
        revision_instructions,
        reviewed_by: user.email,
        reviewed_date: new Date().toISOString(),
        is_portfolio_item: decision === "Passed" && portfolio_ready,
        rubric_completeness: rubric_scores.completeness,
        rubric_relevance: rubric_scores.relevance,
        rubric_usability: rubric_scores.usability,
        rubric_clarity: rubric_scores.clarity,
        rubric_judgment: rubric_scores.judgment,
        rubric_ethics: rubric_scores.ethics,
        rubric_reflection: rubric_scores.reflection,
        revision_count: decision === "Needs Revision" ? (selected.revision_count || 0) + 1 : selected.revision_count,
      });

      // Reload student's submissions and update their status
      const studentSubs = await base44.entities.Submission.filter({ student_id: selected.student_id });
      const student = getStudent(selected.student_id);
      if (student) {
        const updates = computeStudentUpdates(student, studentSubs);
        if (Object.keys(updates).length > 0) {
          await base44.entities.Student.update(student.id, updates);
        }
      }

      toast({ title: `Submission marked as ${decision}` });
      setSelected(null);
      load();
    } catch (err) {
      toast({ title: "Review failed", description: err.message, variant: "destructive" });
    }
    setReviewing(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;

  const filteredSubs = filter === "all"
    ? subs.filter(s => s.status !== "Not Started")
    : subs.filter(s => s.status === filter && s.status !== "Not Started");

  const readyForCert = students.filter(s => {
    // Quick check: certificate_status is Ready for Review
    return s.certificate_status === "Ready for Review";
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-heading font-bold">Submissions</h1>
          {readyForCert.length > 0 && (
            <p className="text-xs text-amber-400 mt-1">{readyForCert.length} student{readyForCert.length > 1 ? "s" : ""} ready for certificate review</p>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
        {["Submitted", "Needs Revision", "Passed", "Failed", "all"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                : "text-muted-foreground hover:text-foreground border border-transparent"
            }`}
          >
            {f === "all" ? "All" : f}
          </button>
        ))}
      </div>

      {filteredSubs.length === 0 ? (
        <EmptyState title="No submissions" description="No submissions match the current filter." />
      ) : (
        <div className="space-y-2">
          {filteredSubs.map(s => {
            const student = getStudent(s.student_id);
            return (
              <div
                key={s.id}
                className="rounded-xl border border-border/50 bg-card px-4 md:px-5 py-4 flex items-center justify-between hover:bg-secondary/30 transition-colors cursor-pointer"
                onClick={() => setSelected(s)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-mono font-bold">{String(s.week_number).padStart(2, "0")}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{s.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {getStudentName(s.student_id)} · Week {s.week_number} · {student?.track || ""}
                    </p>
                  </div>
                </div>
                <StatusBadge status={s.status} />
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.title}</DialogTitle>
              </DialogHeader>
              <ReviewPanel
                submission={selected}
                studentName={getStudentName(selected.student_id)}
                studentTrack={getStudent(selected.student_id)?.track}
                lesson={getWeekLesson(selected.week_number, getStudent(selected.student_id)?.track)}
                onReview={handleReview}
                reviewing={reviewing}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}