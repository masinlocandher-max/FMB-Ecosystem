import React, { useEffect, useMemo, useState } from "react";
import { Loader2, ShieldCheck, ClipboardCheck, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import StatusBadge from "@/components/dashboard/StatusBadge";
import EmptyState from "@/components/curriculum/EmptyState";
import { useToast } from "@/components/ui/use-toast";

const REVIEW_STATUSES = [
  "Locked for Review",
  "Assigned to Human Reviewer",
  "Under Human Review",
  "Revision Required",
  "Cognita Standard Met",
  "Credential Approved",
  "Closed",
];

const RUBRIC_FIELDS = [
  ["rubric_understanding", "Problem understanding"],
  ["rubric_responsible_ai", "Responsible AI use"],
  ["rubric_output_quality", "Output quality and usefulness"],
  ["rubric_human_judgment", "Human judgment and decision-making"],
  ["rubric_revision", "Revision and response to feedback"],
  ["rubric_documentation", "Process documentation and evidence"],
  ["rubric_presentation", "Professional presentation"],
];

const initialScores = Object.fromEntries(RUBRIC_FIELDS.map(([field]) => [field, 1]));

export default function AdminPortfolioAudits() {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [scores, setScores] = useState(initialScores);
  const [findings, setFindings] = useState("");
  const [revisionInstructions, setRevisionInstructions] = useState("");
  const [humanConfirmed, setHumanConfirmed] = useState(false);
  const [conflictConfirmed, setConflictConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const load = async () => {
    try {
      const data = await base44.entities.PortfolioAudit.list("-created_date", 300);
      setAudits(data);
    } catch {
      setAudits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => filter === "all" ? audits : audits.filter((audit) => audit.status === filter), [audits, filter]);

  const openAudit = (audit) => {
    setSelected(audit);
    setScores(Object.fromEntries(RUBRIC_FIELDS.map(([field]) => [field, audit[field] || 1])));
    setFindings(audit.review_findings || "");
    setRevisionInstructions(audit.revision_instructions || "");
    setHumanConfirmed(false);
    setConflictConfirmed(false);
    setError("");
  };

  const saveDecision = async (decision) => {
    setError("");
    if (!humanConfirmed || !conflictConfirmed) {
      setError("Confirm both human review and conflict-of-interest declarations.");
      return;
    }
    if (!findings.trim()) {
      setError("Review findings are required.");
      return;
    }
    if (decision === "Revision Required" && !revisionInstructions.trim()) {
      setError("Specific revision instructions are required.");
      return;
    }

    setSaving(true);
    try {
      const reviewer = await base44.auth.me();
      const now = new Date().toISOString();
      await base44.entities.PortfolioAudit.update(selected.id, {
        ...scores,
        status: decision,
        decision,
        review_findings: findings.trim(),
        revision_instructions: decision === "Revision Required" ? revisionInstructions.trim() : "",
        assigned_reviewer_id: reviewer.id || reviewer.user_id || "",
        assigned_reviewer_name: reviewer.full_name || reviewer.email,
        review_started_at: selected.review_started_at || now,
        review_completed_at: now,
        human_review_confirmed: true,
        conflict_of_interest_confirmed: true,
      });

      if (decision === "Revision Required") {
        await base44.entities.Student.update(selected.student_id, { certificate_status: "In Progress" });
      }
      if (decision === "Cognita Standard Met") {
        await base44.entities.Student.update(selected.student_id, { certificate_status: "Ready for Review" });
      }

      toast({ title: decision === "Revision Required" ? "Portfolio returned for revision" : "Cognita Standard recorded as met" });
      setSelected(null);
      await load();
    } catch (saveError) {
      setError(saveError.message || "The portfolio decision could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const approveCredential = async () => {
    if (!selected || selected.status !== "Cognita Standard Met") return;
    setSaving(true);
    try {
      const approver = await base44.auth.me();
      const now = new Date().toISOString();
      await base44.entities.PortfolioAudit.update(selected.id, {
        status: "Credential Approved",
        approved_by: approver.full_name || approver.email,
        approved_at: now,
      });
      await base44.entities.Student.update(selected.student_id, {
        certificate_status: "Approved",
        last_portfolio_audit_id: selected.id,
      });
      toast({ title: "Learner approved for credential issuance" });
      setSelected(null);
      await load();
    } catch (approvalError) {
      setError(approvalError.message || "Credential approval failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold md:text-2xl">Portfolio Audits</h1>
          <p className="mt-1 text-sm text-muted-foreground">Final human review against the Cognita Standard. AI cannot approve or reject portfolios.</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full border-border bg-secondary sm:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ({audits.length})</SelectItem>
            {REVIEW_STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs leading-6 text-amber-300/90">
        Portfolio approval is distinct from weekly submission review. A credential may be issued only after a human portfolio decision is recorded as Cognita Standard Met and a separate authorized approval is completed.
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="No portfolio audits" description="Learner portfolio submissions will appear here after they meet the minimum evidence requirements." />
      ) : (
        <div className="space-y-3">
          {filtered.map((audit) => (
            <button key={audit.id} onClick={() => openAudit(audit)} className="w-full rounded-xl border border-border/50 bg-card p-4 text-left transition-colors hover:bg-secondary/30">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-mono text-xs text-cyan-400">{audit.audit_reference}</p>
                  <p className="mt-1 text-sm font-semibold">{audit.student_name}</p>
                  <p className="text-xs text-muted-foreground">{audit.track} · Portfolio version {audit.portfolio_version}</p>
                  {audit.assigned_reviewer_name && <p className="mt-1 text-xs text-muted-foreground">Reviewer: {audit.assigned_reviewer_name}</p>}
                </div>
                <StatusBadge status={audit.status} />
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" onClick={() => setSelected(null)}>
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs text-cyan-400">{selected.audit_reference}</p>
                <h2 className="mt-1 text-xl font-bold">{selected.student_name}</h2>
                <p className="text-sm text-muted-foreground">{selected.track} · Portfolio version {selected.portfolio_version}</p>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            {selected.status === "Cognita Standard Met" ? (
              <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck size={20} className="mt-0.5 text-emerald-400" />
                  <div>
                    <p className="font-semibold text-emerald-400">Cognita Standard Met</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/75">{selected.review_findings}</p>
                    <Button onClick={approveCredential} disabled={saving} className="mt-5 bg-emerald-500 text-black hover:bg-emerald-400">
                      {saving ? <Loader2 size={15} className="animate-spin" /> : "Approve for Certificate of Completion"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : selected.status === "Credential Approved" ? (
              <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-sm text-emerald-300">Credential issuance has been authorized. The Registrar may now issue the Certificate of Completion.</div>
            ) : (
              <>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  {RUBRIC_FIELDS.map(([field, label]) => (
                    <div key={field}>
                      <Label className="mb-3 flex items-center justify-between text-xs text-muted-foreground"><span>{label}</span><span className="font-mono text-cyan-400">{scores[field]}/4</span></Label>
                      <Slider value={[scores[field]]} onValueChange={(value) => setScores((current) => ({ ...current, [field]: value[0] }))} min={1} max={4} step={1} />
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <Label className="mb-2 text-xs text-muted-foreground">Review findings *</Label>
                  <Textarea rows={5} value={findings} onChange={(event) => setFindings(event.target.value)} className="border-border bg-secondary" placeholder="State the evidence considered and why the portfolio does or does not meet the standard." />
                </div>

                <div className="mt-5">
                  <Label className="mb-2 text-xs text-muted-foreground">Revision instructions</Label>
                  <Textarea rows={4} value={revisionInstructions} onChange={(event) => setRevisionInstructions(event.target.value)} className="border-border bg-secondary" placeholder="Required only when returning the portfolio for revision." />
                </div>

                <div className="mt-5 space-y-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                  <label className="flex items-start gap-3">
                    <Checkbox checked={humanConfirmed} onCheckedChange={(value) => setHumanConfirmed(value === true)} className="mt-0.5" />
                    <span className="text-xs leading-5">I personally reviewed the portfolio evidence. AI did not make the final decision.</span>
                  </label>
                  <label className="flex items-start gap-3">
                    <Checkbox checked={conflictConfirmed} onCheckedChange={(value) => setConflictConfirmed(value === true)} className="mt-0.5" />
                    <span className="text-xs leading-5">I have no undisclosed conflict of interest that would compromise this review.</span>
                  </label>
                </div>

                {error && <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"><AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />{error}</div>}

                <div className="mt-6 flex flex-wrap justify-end gap-2">
                  <Button variant="ghost" onClick={() => setSelected(null)}>Cancel</Button>
                  <Button disabled={saving} onClick={() => saveDecision("Revision Required")} className="border border-orange-500/20 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30">Require Revision</Button>
                  <Button disabled={saving} onClick={() => saveDecision("Cognita Standard Met")} className="bg-emerald-500 text-black hover:bg-emerald-400">
                    {saving ? <Loader2 size={15} className="animate-spin" /> : "Confirm Cognita Standard Met"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
