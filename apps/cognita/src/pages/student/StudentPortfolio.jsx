import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, AlertTriangle, FileText, ShieldCheck, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import EmptyState from "@/components/curriculum/EmptyState";
import PortfolioProgress from "@/components/curriculum/PortfolioProgress";
import SecureFileLink from "@/components/SecureFileLink";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { getCurriculumForTrack, getPortfolioByCategory } from "@/lib/curriculum-utils";
import { HUMAN_REVIEW_NOTICE, POLICY_VERSIONS, createOperationalReference } from "@/lib/governance";

const LOCKED_AUDIT_STATUSES = new Set([
  "Submitted",
  "Locked for Review",
  "Assigned to Human Reviewer",
  "Under Human Review",
  "Cognita Standard Met",
  "Credential Approved",
]);

export default function StudentPortfolio() {
  const [student, setStudent] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingAudit, setSubmittingAudit] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    const user = await base44.auth.me();
    const students = await base44.entities.Student.filter({ email: user.email });
    if (students.length > 0) {
      const currentStudent = students[0];
      setStudent(currentStudent);
      const [studentSubmissions, portfolioAudits] = await Promise.all([
        base44.entities.Submission.filter({ student_id: currentStudent.id }),
        base44.entities.PortfolioAudit.filter({ student_id: currentStudent.id }).catch(() => []),
      ]);
      setSubmissions(studentSubmissions);
      setAudits(portfolioAudits.sort((a, b) => (b.portfolio_version || 0) - (a.portfolio_version || 0)));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;
  if (!student) return <EmptyState icon={AlertTriangle} title="Not enrolled yet" description="You have not been enrolled as a student yet." />;

  const curriculum = getCurriculumForTrack(student.track);
  const grouped = getPortfolioByCategory(submissions);
  const portfolioItems = Object.values(grouped).flat();
  const passedSubmissions = submissions.filter((submission) => submission.status === "Passed");
  const latestAudit = audits[0] || null;
  const auditLocked = latestAudit && LOCKED_AUDIT_STATUSES.has(latestAudit.status);
  const canSubmitAudit = passedSubmissions.length >= 10 && portfolioItems.length >= 7 && !auditLocked;

  const missingCategories = curriculum
    .map((week) => week.portfolioCategory)
    .filter((category, index, categories) => category && categories.indexOf(category) === index)
    .filter((category) => !grouped[category] || grouped[category].length === 0);

  const submitForAudit = async () => {
    setSubmittingAudit(true);
    try {
      const now = new Date().toISOString();
      const nextVersion = (latestAudit?.portfolio_version || 0) + 1;
      const reference = createOperationalReference("COG-AUD");
      const audit = await base44.entities.PortfolioAudit.create({
        audit_reference: reference,
        student_id: student.id,
        student_name: student.full_name,
        student_email: student.email,
        track: student.track,
        portfolio_version: nextVersion,
        portfolio_item_ids: portfolioItems.map((item) => item.id),
        status: latestAudit?.status === "Revision Required" ? "Resubmitted" : "Locked for Review",
        submitted_at: now,
        locked_at: now,
        decision: "Pending",
        human_review_confirmed: false,
        conflict_of_interest_confirmed: false,
        appeal_status: "Not Requested",
      });
      await base44.entities.Student.update(student.id, {
        last_portfolio_audit_id: audit.id,
        certificate_status: "Ready for Review",
      });
      toast({ title: "Portfolio submitted for human audit", description: reference });
      await load();
    } catch (error) {
      toast({ title: "Portfolio audit submission failed", description: error.message, variant: "destructive" });
    } finally {
      setSubmittingAudit(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold md:text-2xl">Portfolio Center</h1>
        <p className="mt-2 text-sm text-muted-foreground">Passed outputs build your portfolio. A separate human audit decides whether the complete portfolio meets the Cognita Standard.</p>
      </div>

      <div className="mb-6 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck size={18} className="mt-0.5 flex-shrink-0 text-cyan-400" />
          <div>
            <p className="text-sm font-semibold">Human-only final decision</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{HUMAN_REVIEW_NOTICE}</p>
            <p className="mt-2 text-[10px] uppercase tracking-widest text-cyan-400/70">Portfolio Standard {POLICY_VERSIONS.portfolioStandard}</p>
          </div>
        </div>
      </div>

      {latestAudit && (
        <div className="mb-6 rounded-xl border border-border/50 bg-card p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-mono text-xs text-cyan-400">{latestAudit.audit_reference}</p>
              <p className="mt-1 text-sm font-semibold">Portfolio Audit Version {latestAudit.portfolio_version}</p>
              <p className="mt-1 text-xs text-muted-foreground">Submitted {latestAudit.submitted_at ? new Date(latestAudit.submitted_at).toLocaleString() : "date unavailable"}</p>
            </div>
            <StatusBadge status={latestAudit.status} />
          </div>
          {latestAudit.review_findings && <div className="mt-4 rounded-lg border border-border/40 bg-secondary/30 p-4 text-sm whitespace-pre-wrap">{latestAudit.review_findings}</div>}
          {latestAudit.revision_instructions && (
            <div className="mt-4 rounded-lg border border-orange-500/20 bg-orange-500/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-orange-400">Required revision</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/80">{latestAudit.revision_instructions}</p>
            </div>
          )}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border/50 bg-card p-5"><PortfolioProgress submissions={submissions} /></div>
        <div className="lg:col-span-2">
          {portfolioItems.length === 0 ? (
            <EmptyState icon={FileText} title="No portfolio items yet" description="Complete and pass weekly outputs. Items approved as portfolio-ready will appear here." />
          ) : (
            <div className="space-y-4">
              {Object.entries(grouped).map(([category, items]) => (
                <div key={category} className="overflow-hidden rounded-xl border border-border/50 bg-card">
                  <div className="flex items-center justify-between border-b border-border/50 px-5 py-3">
                    <p className="text-sm font-semibold">{category}</p>
                    <span className="font-mono text-[11px] text-muted-foreground">{items.length} item{items.length > 1 ? "s" : ""}</span>
                  </div>
                  <div className="divide-y divide-border/30">
                    {items.map((item) => {
                      const weekData = curriculum.find((week) => week.week === item.week_number);
                      return (
                        <div key={item.id} className="px-5 py-4">
                          <div className="mb-2 flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium">{item.title}</p>
                              <p className="text-xs text-muted-foreground">Week {item.week_number} · Version {item.current_version || 1} · {weekData?.phase}</p>
                            </div>
                            <span className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">Passed</span>
                          </div>
                          {item.content && <p className="line-clamp-3 whitespace-pre-wrap text-sm text-foreground/70">{item.content}</p>}
                          {item.file_urls?.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-3">
                              {item.file_urls.map((fileReference, index) => <SecureFileLink key={`${fileReference}-${index}`} fileReference={fileReference} className="max-w-xs text-xs" />)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {missingCategories.length > 0 && (
        <div className="mb-6 rounded-xl border border-border/50 bg-card p-5">
          <p className="mb-3 text-sm font-semibold">Missing Portfolio Categories</p>
          <div className="flex flex-wrap gap-2">
            {missingCategories.map((category) => <span key={category} className="inline-flex items-center gap-1.5 rounded-lg border border-border/30 bg-secondary/20 px-3 py-1.5 text-xs text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />{category}</span>)}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border/50 bg-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Final Portfolio Audit</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Required: 10 passed outputs and at least 7 portfolio-ready items. Submission locks the selected portfolio version for a human reviewer.</p>
          </div>
          <Button onClick={submitForAudit} disabled={!canSubmitAudit || submittingAudit} className="bg-cyan-500 text-black hover:bg-cyan-400">
            {submittingAudit ? <Loader2 size={15} className="animate-spin" /> : latestAudit?.status === "Revision Required" ? <><RefreshCcw size={15} className="mr-2" /> Resubmit Portfolio</> : <><ShieldCheck size={15} className="mr-2" /> Submit for Human Audit</>}
          </Button>
        </div>
        {!canSubmitAudit && !auditLocked && <p className="mt-3 text-xs text-muted-foreground">Current evidence: {passedSubmissions.length}/10 outputs passed and {portfolioItems.length}/7 portfolio-ready items.</p>}
        {auditLocked && <p className="mt-3 text-xs text-blue-400">Your current portfolio version is locked while the human audit is in progress.</p>}
      </div>
    </div>
  );
}
