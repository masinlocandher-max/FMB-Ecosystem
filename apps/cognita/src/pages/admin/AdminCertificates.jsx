import React, { useEffect, useState } from "react";
import { Award, Ban, Eye, Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import CertificateTemplate from "@/components/CertificateTemplate";
import StatusBadge from "@/components/dashboard/StatusBadge";
import EmptyState from "@/components/curriculum/EmptyState";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { generateCertificateSerial, getNextSequence, getTrackCode } from "@/lib/business-utils";
import { OFFICIAL_CREDENTIAL_TITLE } from "@/lib/governance";

export default function AdminCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [issueOpen, setIssueOpen] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [revokeCertificate, setRevokeCertificate] = useState(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [error, setError] = useState("");
  const { toast } = useToast();

  const load = async () => {
    const [certificateData, studentData, batchData, auditData] = await Promise.all([
      base44.entities.Certificate.list("-created_date", 200),
      base44.entities.Student.list("-created_date", 300),
      base44.entities.Batch.list("-created_date", 100),
      base44.entities.PortfolioAudit.list("-created_date", 300).catch(() => []),
    ]);
    setCertificates(certificateData);
    setStudents(studentData);
    setBatches(batchData);
    setAudits(auditData);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getApprovedAudit = (student) => {
    const studentAudits = audits
      .filter((audit) => audit.student_id === student.id && audit.status === "Credential Approved" && audit.human_review_confirmed)
      .sort((a, b) => (b.portfolio_version || 0) - (a.portfolio_version || 0));
    return studentAudits.find((audit) => audit.id === student.last_portfolio_audit_id) || studentAudits[0] || null;
  };

  const readyStudents = students.filter((student) => {
    const alreadyIssued = certificates.some((certificate) => certificate.student_id === student.id && certificate.status === "Issued");
    return !alreadyIssued && student.certificate_status === "Approved" && !!getApprovedAudit(student);
  });

  const generateSerial = (student) => {
    const batch = batches.find((item) => item.id === student.batch_id);
    const year = new Date().getFullYear();
    const batchCode = batch?.batch_code || "B000";
    const trackCode = getTrackCode(student.track);
    const sequence = getNextSequence(certificates, "COG-CERT", year, batchCode);
    return generateCertificateSerial(year, batchCode, trackCode, sequence);
  };

  const issueCertificate = async () => {
    setError("");
    const student = students.find((item) => item.id === selectedStudentId);
    if (!student) return;
    const approvedAudit = getApprovedAudit(student);
    if (!approvedAudit) {
      setError("A human portfolio audit with Credential Approved status is required before issuance.");
      return;
    }

    setIssuing(true);
    try {
      const admin = await base44.auth.me();
      const batch = batches.find((item) => item.id === student.batch_id);
      const serialNumber = generateSerial(student);
      const existing = await base44.entities.Certificate.filter({ serial_number: serialNumber });
      if (existing.length > 0) throw new Error("The generated serial number already exists. Reload and try again.");

      await base44.entities.Certificate.create({
        student_id: student.id,
        student_name: student.full_name,
        serial_number: serialNumber,
        title: OFFICIAL_CREDENTIAL_TITLE,
        track: student.track,
        track_code: getTrackCode(student.track),
        batch_name: batch?.name || "Unknown",
        batch_number: batch?.id || "",
        portfolio_audit_id: approvedAudit.id,
        reviewed_by: approvedAudit.assigned_reviewer_name || "Authorized Human Reviewer",
        approved_by: approvedAudit.approved_by,
        approved_date: approvedAudit.approved_at,
        issued_date: new Date().toISOString().split("T")[0],
        issued_by: admin.full_name || admin.email,
        status: "Issued",
        verification_note: "This Certificate of Completion was issued after a human review of required work and portfolio evidence. It is not a degree, diploma, academic credit, or attendance-only certificate.",
      });

      await base44.entities.Student.update(student.id, {
        certificate_status: "Issued",
        certificate_id: serialNumber,
      });

      toast({ title: `${OFFICIAL_CREDENTIAL_TITLE} issued`, description: serialNumber });
      setIssueOpen(false);
      setSelectedStudentId("");
      await load();
    } catch (issueError) {
      setError(issueError.message || "Credential issuance failed.");
    } finally {
      setIssuing(false);
    }
  };

  const revoke = async () => {
    if (!revokeCertificate || !revokeReason.trim()) return;
    setIssuing(true);
    try {
      const admin = await base44.auth.me();
      const now = new Date().toISOString();
      await base44.entities.Certificate.update(revokeCertificate.id, {
        status: "Revoked",
        revoked_reason: revokeReason.trim(),
        revoked_by: admin.full_name || admin.email,
        revoked_date: now,
      });
      await base44.entities.Student.update(revokeCertificate.student_id, { certificate_status: "Not Eligible" });
      toast({ title: `Credential ${revokeCertificate.serial_number} revoked` });
      setRevokeCertificate(null);
      setRevokeReason("");
      await load();
    } catch (revokeError) {
      toast({ title: "Revocation failed", description: revokeError.message, variant: "destructive" });
    } finally {
      setIssuing(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold md:text-2xl">Credentials</h1>
          <p className="mt-1 text-sm text-muted-foreground">Issue, preview, verify, and revoke {OFFICIAL_CREDENTIAL_TITLE} records.</p>
        </div>
        <Button onClick={() => { setError(""); setSelectedStudentId(""); setIssueOpen(true); }} className="bg-amber-500 text-black hover:bg-amber-400">
          <Award size={14} className="mr-2" /> Issue Credential
        </Button>
      </div>

      <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="flex items-start gap-2">
          <ShieldAlert size={16} className="mt-0.5 flex-shrink-0 text-amber-400" />
          <p className="text-xs leading-6 text-amber-400/90">Issuance requires a completed human portfolio audit, a Cognita Standard Met decision, and a separate Credential Approved record. Weekly completion alone is not sufficient.</p>
        </div>
      </div>

      {readyStudents.length > 0 && (
        <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <p className="mb-3 text-sm font-semibold text-emerald-400">Ready for Registrar Issuance</p>
          <div className="space-y-2">
            {readyStudents.map((student) => (
              <div key={student.id} className="flex flex-col gap-3 rounded-lg border border-emerald-500/15 bg-black/10 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="text-sm font-medium">{student.full_name}</p><p className="text-xs text-muted-foreground">{student.track} · {getApprovedAudit(student)?.audit_reference}</p></div>
                <Button size="sm" onClick={() => { setSelectedStudentId(student.id); setIssueOpen(true); }} className="bg-emerald-500 text-black hover:bg-emerald-400">Issue</Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {certificates.length === 0 ? (
        <EmptyState icon={Award} title="No credentials issued" description="Approved learner credentials will appear here after Registrar issuance." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
          <div className="border-b border-border/50 px-5 py-4"><h2 className="text-sm font-semibold">Credential Registry</h2></div>
          <div className="divide-y divide-border/30">
            {certificates.map((certificate) => (
              <div key={certificate.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-5">
                <div>
                  <p className="text-sm font-medium">{certificate.student_name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{certificate.serial_number}</p>
                  <p className="text-xs text-muted-foreground">{certificate.title || OFFICIAL_CREDENTIAL_TITLE} · {certificate.track} · {certificate.issued_date}</p>
                  {certificate.status === "Revoked" && certificate.revoked_reason && <p className="mt-1 text-xs text-red-400">Revoked: {certificate.revoked_reason}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={certificate.status} />
                  <Button size="sm" variant="outline" onClick={() => setPreview(certificate)} className="h-8 border-border px-2 text-xs"><Eye size={12} className="mr-1" /> Preview</Button>
                  {certificate.status === "Issued" && <Button size="sm" variant="outline" onClick={() => setRevokeCertificate(certificate)} className="h-8 border-red-500/20 px-2 text-xs text-red-400 hover:bg-red-500/5"><Ban size={12} className="mr-1" /> Revoke</Button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
        <DialogContent className="max-w-md border-border bg-card">
          <DialogHeader><DialogTitle>Issue {OFFICIAL_CREDENTIAL_TITLE}</DialogTitle></DialogHeader>
          <div className="mt-2 space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Approved learner</Label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger className="border-border bg-secondary"><SelectValue placeholder="Select learner" /></SelectTrigger>
                <SelectContent>{readyStudents.map((student) => <SelectItem key={student.id} value={student.id}>{student.full_name} · {student.track}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {selectedStudentId && (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs leading-6 text-emerald-300">
                <ShieldCheck size={15} className="mr-2 inline" /> Human portfolio audit and credential approval verified. Proposed serial: <span className="font-mono">{generateSerial(students.find((student) => student.id === selectedStudentId))}</span>
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={issueCertificate} disabled={!selectedStudentId || issuing} className="w-full bg-amber-500 text-black hover:bg-amber-400">{issuing ? <Loader2 size={15} className="animate-spin" /> : `Issue ${OFFICIAL_CREDENTIAL_TITLE}`}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!preview} onOpenChange={(open) => { if (!open) setPreview(null); }}>
        <DialogContent className="max-h-[95vh] max-w-4xl overflow-y-auto border-border bg-card">
          <DialogHeader><DialogTitle>Credential Preview</DialogTitle></DialogHeader>
          {preview && <CertificateTemplate certificate={preview} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!revokeCertificate} onOpenChange={(open) => { if (!open) setRevokeCertificate(null); }}>
        <DialogContent className="max-w-md border-border bg-card">
          <DialogHeader><DialogTitle>Revoke Credential</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Revocation will be visible in the public registry. Record a clear, factual reason.</p>
          <Textarea rows={4} value={revokeReason} onChange={(event) => setRevokeReason(event.target.value)} className="border-border bg-secondary" placeholder="Reason for revocation" />
          <Button onClick={revoke} disabled={!revokeReason.trim() || issuing} className="bg-red-500 text-white hover:bg-red-600">{issuing ? <Loader2 size={15} className="animate-spin" /> : "Confirm Revocation"}</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
