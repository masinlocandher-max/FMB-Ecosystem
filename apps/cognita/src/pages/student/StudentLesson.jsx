import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, ArrowLeft, Lock, CheckCircle, AlertCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import LessonDetail from "@/components/curriculum/LessonDetail";
import SubmissionForm from "@/components/curriculum/SubmissionForm";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { getWeekLesson, isWeekUnlocked, getWeekStatus, mergeLessonOverride } from "@/lib/curriculum-utils";
import { useToast } from "@/components/ui/use-toast";

export default function StudentLesson() {
  const { week } = useParams();
  const weekNum = parseInt(week, 10);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [student, setStudent] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [lessonOverride, setLessonOverride] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const user = await base44.auth.me();
    const students = await base44.entities.Student.filter({ email: user.email });
    if (students.length > 0) {
      setStudent(students[0]);
      const [subs, lessons] = await Promise.all([
        base44.entities.Submission.filter({ student_id: students[0].id }),
        base44.entities.Lesson.filter({ week_number: weekNum }),
      ]);
      setSubmissions(subs);
      const trackMatch = lessons.find((lesson) => lesson.track === students[0].track);
      const foundationMatch = lessons.find((lesson) => !lesson.track);
      setLessonOverride(trackMatch || foundationMatch || null);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [weekNum]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;
  if (!student) return <div className="py-20 text-center text-muted-foreground">Not enrolled yet.</div>;

  const staticLesson = getWeekLesson(weekNum, student.track);
  if (!staticLesson) return <div className="py-20 text-center text-muted-foreground">Lesson not found.</div>;

  const lesson = mergeLessonOverride(staticLesson, lessonOverride);
  const unlocked = isWeekUnlocked(weekNum, submissions) && !lesson.isLocked;
  const status = getWeekStatus(weekNum, submissions);
  const submission = submissions.find((item) => item.week_number === weekNum);
  const isPassed = status === "Passed";
  const needsRevision = status === "Needs Revision";
  const canSubmit = unlocked && !isPassed && status !== "Submitted";

  const uploadPrivateFiles = async (files) => {
    const references = [];
    for (const file of files) {
      try {
        const result = await base44.integrations.Core.UploadPrivateFile({ file });
        references.push(result.file_uri);
      } catch {
        const fallback = await base44.integrations.Core.UploadFile({ file });
        references.push(fallback.file_url);
      }
    }
    return references;
  };

  const createVersionRecord = async ({ submissionId, versionNumber, content, process_note, reflection, fileReferences, submittedAt }) => {
    try {
      await base44.entities.SubmissionVersion.create({
        submission_id: submissionId,
        student_id: student.id,
        week_number: weekNum,
        version_number: versionNumber,
        title: lesson.requiredOutput,
        content,
        process_note,
        reflection,
        file_urls: fileReferences,
        submitted_at: submittedAt,
        locked_at: submittedAt,
        status: "Submitted",
      });
    } catch (versionError) {
      console.error("Submission version record could not be created:", versionError);
    }
  };

  const handleSubmit = async ({ content, process_note, reflection, files }) => {
    setSubmitting(true);
    try {
      const uploadedFiles = await uploadPrivateFiles(files);
      const submittedAt = new Date().toISOString();

      if (submission) {
        const nextVersion = (submission.current_version || 1) + 1;
        const fileReferences = uploadedFiles.length > 0 ? uploadedFiles : (submission.file_urls || []);

        await base44.entities.Submission.update(submission.id, {
          content,
          process_note,
          reflection,
          file_urls: fileReferences,
          status: "Submitted",
          current_version: nextVersion,
          submitted_at: submittedAt,
          locked_for_review: true,
          feedback: "",
          revision_instructions: "",
          reviewed_by: "",
          human_review_confirmed: false,
          reviewer_attestation: "",
          revision_count: needsRevision ? (submission.revision_count || 0) + 1 : (submission.revision_count || 0),
          is_portfolio_item: false,
        });

        await createVersionRecord({
          submissionId: submission.id,
          versionNumber: nextVersion,
          content,
          process_note,
          reflection,
          fileReferences,
          submittedAt,
        });
      } else {
        const created = await base44.entities.Submission.create({
          student_id: student.id,
          week_number: weekNum,
          title: lesson.requiredOutput,
          track: student.track,
          content,
          process_note,
          reflection,
          file_urls: uploadedFiles,
          status: "Submitted",
          current_version: 1,
          submitted_at: submittedAt,
          locked_for_review: true,
          portfolio_category: lesson.portfolioCategory,
          revision_count: 0,
        });

        await createVersionRecord({
          submissionId: created.id,
          versionNumber: 1,
          content,
          process_note,
          reflection,
          fileReferences: uploadedFiles,
          submittedAt,
        });
      }

      toast({ title: `Week ${weekNum} output submitted`, description: "This version is locked while awaiting human review." });
      await load();
    } catch (error) {
      toast({ title: "Submission failed", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Link to="/student/program" className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft size={14} /> Back to Program
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full border border-border/50 bg-secondary/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{lesson.phase}</span>
            <span className="font-mono text-[10px] text-muted-foreground">Week {weekNum}</span>
            <StatusBadge status={status} />
          </div>
          <h1 className="text-xl font-bold md:text-2xl">{lesson.title}</h1>
        </div>
      </div>

      {!unlocked && (
        <div className="mb-6 rounded-xl border border-border/50 bg-card p-8 text-center">
          <Lock size={32} className="mx-auto mb-4 text-muted-foreground" />
          <h2 className="mb-2 text-lg font-bold">This Week is Locked</h2>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">{lesson.isLocked ? "This lesson has been locked by the institute. Please contact your facilitator." : `Complete and submit the previous week&apos;s output to unlock Week ${weekNum}.`}</p>
          <Button onClick={() => navigate("/student/program")} className="mt-4 bg-cyan-500 text-black hover:bg-cyan-400">Back to Program</Button>
        </div>
      )}

      {status === "Submitted" && (
        <div className="mb-6 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
          <p className="text-sm font-medium text-blue-400">Version {submission?.current_version || 1} is locked and awaiting human review.</p>
        </div>
      )}

      {isPassed && (
        <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-2"><CheckCircle size={18} className="text-emerald-400" /><p className="text-sm font-medium text-emerald-400">This output has been reviewed and passed.</p></div>
          {submission?.is_portfolio_item && <p className="ml-7 mt-1 text-xs text-muted-foreground">Added to your portfolio as {lesson.portfolioCategory}.</p>}
        </div>
      )}

      {unlocked && (
        <>
          <div className="mb-6 rounded-xl border border-border/50 bg-card p-5 md:p-6"><LessonDetail lesson={lesson} /></div>

          {submission?.feedback && (
            <div className="mb-6 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-5">
              <div className="mb-2 flex items-center gap-2"><MessageSquare size={14} className="text-cyan-400" /><p className="text-[10px] font-semibold uppercase tracking-widest text-cyan-400">Human Reviewer Feedback</p></div>
              <p className="whitespace-pre-wrap text-sm text-foreground/80">{submission.feedback}</p>
            </div>
          )}

          {submission?.revision_instructions && (
            <div className="mb-6 rounded-xl border border-orange-500/20 bg-orange-500/5 p-5">
              <div className="mb-2 flex items-center gap-2"><AlertCircle size={14} className="text-orange-400" /><p className="text-[10px] font-semibold uppercase tracking-widest text-orange-400">Revision Instructions</p></div>
              <p className="whitespace-pre-wrap text-sm text-foreground/80">{submission.revision_instructions}</p>
            </div>
          )}

          {canSubmit && (
            <div className="rounded-xl border border-border/50 bg-card p-5 md:p-6">
              <h2 className="mb-4 text-sm font-semibold">{needsRevision ? "Submit a New Version" : "Submit Your Output"}</h2>
              {needsRevision && <p className="mb-4 text-xs text-orange-400">Your previous version remains in the audit history. Submit the revised work as a new locked version.</p>}
              <SubmissionForm existing={submission} onSubmit={handleSubmit} submitting={submitting} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
