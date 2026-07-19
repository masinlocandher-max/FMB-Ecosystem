import React, { useState, useEffect } from "react";
import { Loader2, CheckCircle, ShieldCheck } from "lucide-react";
import RubricScorer from "@/components/curriculum/RubricScorer";
import SecureFileLink from "@/components/SecureFileLink";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const EMPTY_SCORES = {
  completeness: null,
  relevance: null,
  usability: null,
  clarity: null,
  judgment: null,
  ethics: null,
  reflection: null,
};

export default function ReviewPanel({ submission, studentName, studentTrack, lesson, onReview, reviewing }) {
  const [feedback, setFeedback] = useState("");
  const [revisionInstructions, setRevisionInstructions] = useState("");
  const [rubricScores, setRubricScores] = useState(EMPTY_SCORES);
  const [portfolioReady, setPortfolioReady] = useState(false);
  const [humanReviewConfirmed, setHumanReviewConfirmed] = useState(false);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (submission) {
      setFeedback(submission.feedback || "");
      setRevisionInstructions(submission.revision_instructions || "");
      setPortfolioReady(submission.is_portfolio_item || false);
      setHumanReviewConfirmed(false);
      setValidationError("");
      setRubricScores({
        completeness: submission.rubric_completeness ?? null,
        relevance: submission.rubric_relevance ?? null,
        usability: submission.rubric_usability ?? null,
        clarity: submission.rubric_clarity ?? null,
        judgment: submission.rubric_judgment ?? null,
        ethics: submission.rubric_ethics ?? null,
        reflection: submission.rubric_reflection ?? null,
      });
    }
  }, [submission]);

  const handleReview = (decision) => {
    setValidationError("");
    const scoresComplete = Object.values(rubricScores).every((score) => Number.isFinite(score));
    if (!scoresComplete) {
      setValidationError("Complete every rubric criterion before recording a decision.");
      return;
    }
    if (!humanReviewConfirmed) {
      setValidationError("Confirm that you personally reviewed the learner evidence.");
      return;
    }
    if (decision !== "Passed" && !feedback.trim()) {
      setValidationError("Feedback is required when an output does not pass.");
      return;
    }
    if (decision === "Needs Revision" && !revisionInstructions.trim()) {
      setValidationError("Specific revision instructions are required.");
      return;
    }

    onReview(decision, {
      feedback: feedback.trim(),
      revision_instructions: revisionInstructions.trim(),
      rubric_scores: rubricScores,
      portfolio_ready: decision === "Passed" && portfolioReady,
      human_review_confirmed: true,
      reviewer_attestation: "I personally reviewed the submitted evidence and recorded this decision without delegating the pass, revision, or fail judgment to AI.",
    });
  };

  if (!submission) return null;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Student</p>
          <p className="text-sm font-medium">{studentName}</p>
          <p className="text-xs text-muted-foreground">{studentTrack}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Submission</p>
          <p className="text-sm font-medium">Week {submission.week_number}</p>
          <p className="text-xs text-muted-foreground">Version {submission.current_version || 1}</p>
        </div>
      </div>

      {submission.content && (
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Submission</p>
          <div className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border/30 bg-secondary/30 p-3 text-sm text-foreground/80">{submission.content}</div>
        </div>
      )}

      {submission.process_note && (
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Process Note</p>
          <div className="whitespace-pre-wrap rounded-lg border border-border/30 bg-secondary/30 p-3 text-sm text-foreground/70">{submission.process_note}</div>
        </div>
      )}

      {submission.reflection && (
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Reflection</p>
          <div className="whitespace-pre-wrap rounded-lg border border-border/30 bg-secondary/30 p-3 text-sm text-foreground/70">{submission.reflection}</div>
        </div>
      )}

      {submission.file_urls?.length > 0 && (
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Private Files</p>
          <div className="space-y-1">
            {submission.file_urls.map((fileReference, index) => (
              <SecureFileLink key={`${fileReference}-${index}`} fileReference={fileReference} className="block max-w-full text-sm" />
            ))}
          </div>
        </div>
      )}

      {lesson && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-amber-400">Rubric Guidance</p>
          <div className="space-y-1.5 text-xs">
            <p className="text-foreground/80"><span className="font-semibold text-emerald-400">Pass:</span> {lesson.rubric.pass}</p>
            <p className="text-foreground/80"><span className="font-semibold text-orange-400">Revise:</span> {lesson.rubric.needsRevision}</p>
            <p className="text-foreground/80"><span className="font-semibold text-red-400">Fail:</span> {lesson.rubric.failed}</p>
          </div>
        </div>
      )}

      <RubricScorer scores={rubricScores} onChange={setRubricScores} />

      <div>
        <Label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Feedback</Label>
        <Textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} rows={3} className="border-border bg-secondary text-sm" placeholder="Explain the evidence considered and the learner's next step." />
      </div>

      <div>
        <Label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Revision Instructions</Label>
        <Textarea value={revisionInstructions} onChange={(event) => setRevisionInstructions(event.target.value)} rows={3} className="border-border bg-secondary text-sm" placeholder="State exactly what must be remade, added, corrected, or demonstrated." />
      </div>

      <label className="flex cursor-pointer items-center gap-2.5">
        <button type="button" onClick={() => setPortfolioReady(!portfolioReady)} className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${portfolioReady ? "border-emerald-500/40 bg-emerald-500/20" : "border-border/50 bg-secondary"}`}>
          {portfolioReady && <CheckCircle size={14} className="text-emerald-400" />}
        </button>
        <span className="text-sm">Mark passed output as portfolio-ready</span>
      </label>

      <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
        <div className="flex items-start gap-3">
          <Checkbox checked={humanReviewConfirmed} onCheckedChange={(value) => setHumanReviewConfirmed(value === true)} className="mt-0.5" />
          <div>
            <p className="flex items-center gap-2 text-sm font-medium"><ShieldCheck size={15} className="text-cyan-400" /> Human reviewer attestation</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">I personally reviewed the evidence. AI did not make the pass, revision, or fail decision.</p>
          </div>
        </div>
      </div>

      {validationError && <p className="text-sm text-destructive">{validationError}</p>}

      <div className="flex flex-wrap items-center gap-2 pt-2">
        <Button size="sm" onClick={() => handleReview("Passed")} disabled={reviewing} className="border border-emerald-500/20 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">
          {reviewing ? <Loader2 size={14} className="animate-spin" /> : "Pass"}
        </Button>
        <Button size="sm" onClick={() => handleReview("Needs Revision")} disabled={reviewing} className="border border-orange-500/20 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30">Request Revision</Button>
        <Button size="sm" onClick={() => handleReview("Failed")} disabled={reviewing} className="border border-red-500/20 bg-red-500/20 text-red-400 hover:bg-red-500/30">Fail</Button>
      </div>
    </div>
  );
}
