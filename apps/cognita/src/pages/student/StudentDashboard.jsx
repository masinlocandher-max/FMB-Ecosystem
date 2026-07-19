import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, BookOpen, FileText, Clock, FolderOpen, CheckCircle, Circle, AlertTriangle, MessageSquare, ChevronRight, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import StatCard from "@/components/dashboard/StatCard";
import StatusBadge from "@/components/dashboard/StatusBadge";
import CertificateBadge from "@/components/curriculum/CertificateBadge";
import EmptyState from "@/components/curriculum/EmptyState";
import { getCurriculumForTrack, getWeekStatus, getEffectiveCertificateStatus, getCertificateRequirements } from "@/lib/curriculum-utils";
import { Progress } from "@/components/ui/progress";

export default function StudentDashboard() {
  const [student, setStudent] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      const students = await base44.entities.Student.filter({ email: user.email });
      if (students.length > 0) {
        const s = students[0];
        setStudent(s);
        const [subs, b] = await Promise.all([
          base44.entities.Submission.filter({ student_id: s.id }),
          s.batch_id ? base44.entities.Batch.get(s.batch_id).catch(() => null) : null,
        ]);
        setSubmissions(subs);
        setBatch(b);
      }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;

  if (!student) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Not enrolled yet"
        description="You haven't been enrolled as a student yet. If you've been accepted, please wait for enrollment confirmation."
      />
    );
  }

  const curriculum = getCurriculumForTrack(student.track);
  const passedCount = submissions.filter(s => s.status === "Passed").length;
  const submittedCount = submissions.filter(s => s.status !== "Not Started").length;
  const progressPct = Math.round((passedCount / 10) * 100);
  const portfolioCount = submissions.filter(s => s.is_portfolio_item && s.status === "Passed").length;
  const certStatus = getEffectiveCertificateStatus(student, submissions);
  const requirements = getCertificateRequirements(submissions);

  const currentLesson = curriculum.find(w => w.week === student.current_week);
  const phase = currentLesson?.phase || "AI Foundation";

  const pendingTasks = curriculum.filter(w => {
    const status = getWeekStatus(w.week, submissions);
    return status !== "Passed" && status !== "Locked";
  });

  const needsRevision = submissions.filter(s => s.status === "Needs Revision");

  const feedbackSubs = submissions
    .filter(s => s.feedback)
    .sort((a, b) => new Date(b.reviewed_date || 0) - new Date(a.reviewed_date || 0));
  const latestFeedback = feedbackSubs[0];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-heading font-bold mb-1">Welcome, {student.full_name}</h1>
        <p className="text-xs md:text-sm text-muted-foreground">
          {student.track} · {batch?.name || "Batch pending"} · Week {student.current_week}/10 · {phase}
        </p>
        {certStatus === "Ready for Review" && (
          <div className="mt-3 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 text-sm text-amber-400">
            Your portfolio is ready for final review. An admin will review and issue your certificate.
          </div>
        )}
        {certStatus === "In Progress" && pendingTasks.length > 0 && (
          <div className="mt-3 p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 text-sm text-yellow-400">
            You still have {pendingTasks.length} required output{pendingTasks.length > 1 ? "s" : ""} before certificate review.
          </div>
        )}
      </div>

      {/* Payment status */}
      {student && student.payment_status !== "Payment Confirmed" && student.payment_status !== "Payment Waived" && (
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 mb-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CreditCard size={16} className="text-orange-400" />
              <div>
                <p className="text-sm font-medium text-orange-400">Payment Pending</p>
                <p className="text-xs text-muted-foreground">Your enrollment is not yet complete.</p>
              </div>
            </div>
            <Link to="/student/payments" className="text-xs font-medium text-cyan-400 hover:underline whitespace-nowrap">
              View Payment Details →
            </Link>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard label="Current Week" value={`${student.current_week}/10`} icon={Clock} />
        <StatCard label="Passed Outputs" value={`${passedCount}/10`} icon={FileText} accent="text-emerald-400" />
        <StatCard label="Pending Tasks" value={pendingTasks.length} icon={BookOpen} accent="text-yellow-400" />
        <StatCard label="Portfolio Items" value={`${portfolioCount}/7`} icon={FolderOpen} accent="text-blue-400" />
      </div>

      {/* Progress + Certificate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">Program Progress</p>
            <span className="text-sm font-mono text-cyan-400">{progressPct}%</span>
          </div>
          <Progress value={progressPct} className="h-2" />
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>{passedCount} of 10 outputs passed</span>
            <span>{submittedCount} submitted</span>
          </div>
        </div>

        <div className={`rounded-xl border p-5 ${
          certStatus === "Ready for Review" ? "border-amber-500/30 bg-amber-500/5" :
          certStatus === "Issued" ? "border-amber-500/30 bg-amber-500/5" :
          "border-border/50 bg-card"
        }`}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">Certificate Eligibility</p>
            <CertificateBadge status={certStatus} />
          </div>
          <div className="space-y-2">
            {requirements.map((req, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {req.done ? <CheckCircle size={14} className="text-emerald-400" /> : <Circle size={14} className="text-muted-foreground" />}
                  <span className={req.done ? "text-foreground" : "text-muted-foreground"}>{req.label}</span>
                </div>
                <span className="font-mono text-muted-foreground">{req.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Latest feedback */}
      {latestFeedback ? (
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-5 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare size={14} className="text-cyan-400" />
            <p className="text-[10px] font-semibold uppercase tracking-widest text-cyan-400">Latest Feedback</p>
          </div>
          <p className="text-sm font-medium mb-1">{latestFeedback.title} · Week {latestFeedback.week_number}</p>
          <p className="text-sm text-foreground/80">{latestFeedback.feedback}</p>
        </div>
      ) : (
        <EmptyState
          icon={MessageSquare}
          title="No feedback yet"
          description="Your facilitator's feedback on submitted outputs will appear here."
        />
      )}

      {/* Revision requests */}
      {needsRevision.length > 0 && (
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-5 mb-6">
          <h3 className="text-sm font-semibold text-orange-400 mb-3">Revision Requests</h3>
          <div className="space-y-3">
            {needsRevision.map(s => (
              <Link
                key={s.id}
                to={`/student/lesson/${s.week_number}`}
                className="flex items-start justify-between hover:bg-orange-500/5 -mx-2 px-2 py-1.5 rounded-lg transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground">Week {s.week_number}</p>
                  {s.revision_instructions && <p className="text-xs text-foreground/70 mt-1">{s.revision_instructions}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status="Needs Revision" />
                  <ChevronRight size={14} className="text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Weekly outputs summary */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Weekly Outputs</h2>
          <Link to="/student/program" className="text-xs text-cyan-400 hover:underline">View full program →</Link>
        </div>
        <div className="divide-y divide-border/30">
          {curriculum.map(w => {
            const status = getWeekStatus(w.week, submissions);
            return (
              <div key={w.week} className={`px-5 py-3 flex items-center justify-between ${status === "Locked" ? "opacity-40" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                    <span className="text-xs font-mono font-semibold">{String(w.week).padStart(2, "0")}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{w.requiredOutput}</p>
                    <p className="text-xs text-muted-foreground">{w.phase}</p>
                  </div>
                </div>
                <StatusBadge status={status} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}