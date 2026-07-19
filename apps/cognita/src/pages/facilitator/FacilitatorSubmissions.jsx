import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, FileText } from "lucide-react";
import StatusBadge from "@/components/dashboard/StatusBadge";
import ReviewPanel from "@/components/curriculum/ReviewPanel";
import EmptyState from "@/components/curriculum/EmptyState";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { getWeekLesson, computeStudentUpdates } from "@/lib/curriculum-utils";

export default function FacilitatorSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [reviewing, setReviewing] = useState(false);
  const [filter, setFilter] = useState("all");
  const { toast } = useToast();

  const load = async () => {
    const user = await base44.auth.me();
    const facilitators = await base44.entities.Facilitator.filter({ email: user.email });
    if (facilitators.length > 0) {
      const assignedStudents = await base44.entities.Student.filter({ facilitator_id: facilitators[0].id });
      setStudents(assignedStudents);
      const studentIds = new Set(assignedStudents.map((student) => student.id));
      const allSubmissions = await base44.entities.Submission.list("-created_date", 200);
      setSubmissions(allSubmissions.filter((submission) => studentIds.has(submission.student_id)));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getStudent = (id) => students.find((student) => student.id === id);
  const getStudentName = (id) => getStudent(id)?.full_name || "Unknown";

  const updateCurrentVersionRecord = async (submission, decision, reviewData, reviewer, reviewedDate) => {
    try {
      const versions = await base44.entities.SubmissionVersion.filter({
        submission_id: submission.id,
        version_number: submission.current_version || 1,
      });
      if (versions.length === 0) return;
      const { feedback, revision_instructions, rubric_scores } = reviewData;
      await base44.entities.SubmissionVersion.update(versions[0].id, {
        status: decision,
        feedback,
        revision_instructions,
        reviewed_by: reviewer,
        reviewed_date: reviewedDate,
        rubric_completeness: rubric_scores.completeness,
        rubric_relevance: rubric_scores.relevance,
        rubric_usability: rubric_scores.usability,
        rubric_clarity: rubric_scores.clarity,
        rubric_judgment: rubric_scores.judgment,
        rubric_ethics: rubric_scores.ethics,
        rubric_reflection: rubric_scores.reflection,
      });
    } catch (versionError) {
      console.error("Submission version review record could not be updated:", versionError);
    }
  };

  const handleReview = async (decision, reviewData) => {
    setReviewing(true);
    try {
      const {
        feedback,
        revision_instructions,
        rubric_scores,
        portfolio_ready,
        human_review_confirmed,
        reviewer_attestation,
      } = reviewData;
      const reviewerUser = await base44.auth.me();
      const reviewer = reviewerUser.email;
      const reviewedDate = new Date().toISOString();

      await base44.entities.Submission.update(selected.id, {
        status: decision,
        feedback,
        revision_instructions,
        reviewed_by: reviewer,
        reviewed_date: reviewedDate,
        locked_for_review: false,
        human_review_confirmed,
        reviewer_attestation,
        is_portfolio_item: decision === "Passed" && portfolio_ready,
        rubric_completeness: rubric_scores.completeness,
        rubric_relevance: rubric_scores.relevance,
        rubric_usability: rubric_scores.usability,
        rubric_clarity: rubric_scores.clarity,
        rubric_judgment: rubric_scores.judgment,
        rubric_ethics: rubric_scores.ethics,
        rubric_reflection: rubric_scores.reflection,
      });

      await updateCurrentVersionRecord(selected, decision, reviewData, reviewer, reviewedDate);

      const studentSubmissions = await base44.entities.Submission.filter({ student_id: selected.student_id });
      const student = getStudent(selected.student_id);
      if (student) {
        const updates = computeStudentUpdates(student, studentSubmissions);
        if (Object.keys(updates).length > 0) await base44.entities.Student.update(student.id, updates);
      }

      toast({ title: `Submission marked as ${decision}`, description: "The human review decision was added to the version history." });
      setSelected(null);
      await load();
    } catch (error) {
      toast({ title: "Review failed", description: error.message, variant: "destructive" });
    } finally {
      setReviewing(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;

  const filteredSubmissions = filter === "all"
    ? submissions.filter((submission) => submission.status !== "Not Started")
    : submissions.filter((submission) => submission.status === filter && submission.status !== "Not Started");
  const pendingCount = submissions.filter((submission) => submission.status === "Submitted").length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold md:text-2xl">Student Submissions</h1>
          {pendingCount > 0 && <p className="mt-1 text-xs text-yellow-400">{pendingCount} submission{pendingCount > 1 ? "s" : ""} awaiting human review</p>}
        </div>
      </div>

      <div className="mb-4 flex items-center gap-1 overflow-x-auto pb-1">
        {["all", "Submitted", "Needs Revision", "Passed", "Failed"].map((item) => (
          <button key={item} onClick={() => setFilter(item)} className={`whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${filter === item ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-400" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {item === "all" ? "All" : item}
          </button>
        ))}
      </div>

      {filteredSubmissions.length === 0 ? (
        <EmptyState icon={FileText} title="No submissions to review" description="Assigned learner submissions will appear here after submission." />
      ) : (
        <div className="space-y-2">
          {filteredSubmissions.map((submission) => {
            const student = getStudent(submission.student_id);
            return (
              <button key={submission.id} className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-border/50 bg-card px-4 py-4 text-left transition-colors hover:bg-secondary/30 md:px-5" onClick={() => setSelected(submission)}>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <span className="font-mono text-xs font-bold">{String(submission.week_number).padStart(2, "0")}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{submission.title}</p>
                    <p className="text-xs text-muted-foreground">{getStudentName(submission.student_id)} · Week {submission.week_number} · Version {submission.current_version || 1} · {student?.track || ""}</p>
                  </div>
                </div>
                <StatusBadge status={submission.status} />
              </button>
            );
          })}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-border bg-card">
          {selected && (
            <>
              <DialogHeader><DialogTitle>{selected.title}</DialogTitle></DialogHeader>
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
