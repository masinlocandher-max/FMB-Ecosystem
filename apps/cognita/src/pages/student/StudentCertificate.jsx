import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Award, ShieldCheck, CheckCircle, Circle } from "lucide-react";
import CertificateBadge from "@/components/curriculum/CertificateBadge";
import CertificateTemplate from "@/components/CertificateTemplate";
import { getEffectiveCertificateStatus, getCertificateRequirements } from "@/lib/curriculum-utils";
import { HUMAN_REVIEW_NOTICE, OFFICIAL_CREDENTIAL_TITLE } from "@/lib/governance";

export default function StudentCertificate() {
  const [student, setStudent] = useState(null);
  const [certificate, setCertificate] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        if (currentStudent.certificate_id) {
          const certificates = await base44.entities.Certificate.filter({ serial_number: currentStudent.certificate_id });
          if (certificates.length > 0) setCertificate(certificates[0]);
        }
      }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;
  if (!student) return <div className="py-20 text-center text-muted-foreground">Not enrolled yet.</div>;

  const certificateStatus = getEffectiveCertificateStatus(student, submissions);
  const requirements = getCertificateRequirements(submissions);
  const latestAudit = audits[0] || null;
  const auditPassed = ["Cognita Standard Met", "Credential Approved", "Closed"].includes(latestAudit?.status);
  const credentialApproved = ["Credential Approved", "Closed"].includes(latestAudit?.status) || student.certificate_status === "Approved" || student.certificate_status === "Issued";
  const completeRequirements = [
    ...requirements,
    { label: "Human portfolio audit completed", done: auditPassed, value: latestAudit?.status || "Not submitted" },
    { label: "Credential issuance approved", done: credentialApproved, value: credentialApproved ? "Approved" : "Pending" },
  ];

  if (certificate) {
    return (
      <div>
        <h1 className="mb-6 text-xl font-bold md:text-2xl">Your {certificate.title || OFFICIAL_CREDENTIAL_TITLE}</h1>
        <CertificateTemplate certificate={certificate} />
        <div className="mx-auto mt-6 max-w-[800px] rounded-lg border border-border/50 bg-card p-4 text-center">
          <p className="text-xs text-muted-foreground"><ShieldCheck size={14} className="mr-1.5 inline text-cyan-400" />Serial: <span className="font-mono">{certificate.serial_number}</span> · Verify through the public credential registry.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold md:text-2xl">{OFFICIAL_CREDENTIAL_TITLE}</h1>

      <div className="mb-6 rounded-xl border border-border/50 bg-card p-6 text-center md:p-8">
        <Award size={40} className="mx-auto mb-4 text-muted-foreground" />
        <h2 className="mb-2 text-lg font-semibold">Credential Not Yet Issued</h2>
        <div className="mb-4"><CertificateBadge status={certificateStatus} size="lg" /></div>
        <p className="mx-auto mb-4 max-w-lg text-sm text-muted-foreground">{HUMAN_REVIEW_NOTICE}</p>
        {latestAudit && <p className="text-xs text-cyan-400">Latest portfolio audit: {latestAudit.audit_reference} · {latestAudit.status}</p>}
      </div>

      <div className="rounded-xl border border-border/50 bg-card p-5">
        <p className="mb-4 text-sm font-semibold">Eligibility and Approval Requirements</p>
        <div className="space-y-3">
          {completeRequirements.map((requirement) => (
            <div key={requirement.label} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {requirement.done ? <CheckCircle size={16} className="text-emerald-400" /> : <Circle size={16} className="text-muted-foreground" />}
                <span className={`text-sm ${requirement.done ? "text-foreground" : "text-muted-foreground"}`}>{requirement.label}</span>
              </div>
              <span className="text-right font-mono text-xs text-muted-foreground">{requirement.value}</span>
            </div>
          ))}
        </div>

        {latestAudit?.status === "Revision Required" && (
          <div className="mt-4 rounded-lg border border-orange-500/20 bg-orange-500/5 p-3 text-sm text-orange-400">Your portfolio needs revision. Open the Portfolio Center for the reviewer&apos;s instructions and resubmission workflow.</div>
        )}
        {latestAudit?.status === "Cognita Standard Met" && (
          <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-400">Your portfolio met the Cognita Standard. Credential authorization is pending.</div>
        )}
        {credentialApproved && student.certificate_status !== "Issued" && (
          <div className="mt-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 text-sm text-cyan-400">Credential issuance has been approved. The Registrar must create the official record and serial number.</div>
        )}
      </div>
    </div>
  );
}
