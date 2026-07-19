import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, FileText, CheckCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { OFFICIAL_DOMAIN, POLICY_VERSIONS } from "@/lib/governance";

const AGREEMENT_SECTIONS = [
  {
    title: "Program Structure",
    body: "I understand that the 10-Week Professional AI Program is a structured non-degree training program with required learning activities, outputs, revisions, and a final portfolio review.",
  },
  {
    title: "Human-Reviewed Completion",
    body: "I understand that the Certificate of Completion is not automatic and is not issued for attendance alone. Required outputs and the final portfolio must meet the Cognita Standard through human review.",
  },
  {
    title: "Feedback and Revision",
    body: "I understand that an authorized human facilitator or reviewer may provide feedback, request revisions, or determine that evidence is not yet sufficient. I agree to address required revisions before completion can be approved.",
  },
  {
    title: "Academic Integrity and AI Disclosure",
    body: "I will submit work that reflects my own decisions and understanding. I will disclose material AI assistance, verify claims and sources, and will not submit plagiarized, fabricated, deceptive, or harmful work.",
  },
  {
    title: "Payment, Withdrawal, and Refunds",
    body: "I understand that fees, payment schedules, withdrawal rules, and refund eligibility are governed by the written invoice and policy presented before payment. A refund is not promised unless the applicable written policy provides one.",
  },
  {
    title: "Access and Participation",
    body: "I understand that learning access is activated only after enrollment requirements are complete and payment is confirmed or formally waived. Access may be suspended for unresolved payment, serious policy violations, or security concerns, subject to applicable policy and review.",
  },
  {
    title: "Privacy and Records",
    body: "I understand that Cognita will store necessary application, enrollment, learning, submission, review, payment, and credential records for program administration, quality assurance, support, and verification, subject to the Privacy Policy.",
  },
  {
    title: "Intellectual Property",
    body: "I retain ownership of my original learner work. I grant Cognita only the limited permissions needed to store, review, assess, document, and verify it. Cognita materials remain subject to their applicable ownership and license terms.",
  },
];

export default function StudentEnrollmentAgreement() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const user = await base44.auth.me();
        const students = await base44.entities.Student.filter({ email: user.email });
        if (students.length > 0) setStudent(students[0]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;
  if (!student) return <div className="py-20 text-center text-muted-foreground">Not enrolled yet.</div>;

  if (student.enrollment_agreement_signed) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
          <CheckCircle size={40} className="mx-auto mb-4 text-emerald-400" />
          <h1 className="mb-2 text-xl font-bold">Enrollment Agreement Signed</h1>
          <p className="mb-2 text-sm text-muted-foreground">Agreement version: {student.enrollment_agreement_version || "Legacy record"}</p>
          {student.enrollment_agreement_signed_at && <p className="mb-6 text-xs text-muted-foreground">Signed {new Date(student.enrollment_agreement_signed_at).toLocaleString()}</p>}
          <Button onClick={() => navigate("/student/payments")} className="bg-cyan-500 text-black hover:bg-cyan-400">Continue to enrollment status</Button>
        </div>
      </div>
    );
  }

  const handleSign = async () => {
    setSigning(true);
    const signedAt = new Date().toISOString();
    try {
      const user = await base44.auth.me();
      await base44.entities.Student.update(student.id, {
        enrollment_agreement_signed: true,
        enrollment_agreement_version: POLICY_VERSIONS.enrollmentAgreement,
        enrollment_agreement_signed_at: signedAt,
      });

      try {
        await base44.entities.ConsentRecord.create({
          user_id: user.id || user.user_id || "",
          email: user.email,
          context: "Enrollment Agreement",
          terms_version: POLICY_VERSIONS.terms,
          privacy_version: POLICY_VERSIONS.privacy,
          agreement_version: POLICY_VERSIONS.enrollmentAgreement,
          accepted_at: signedAt,
          user_agent: window.navigator.userAgent,
          source_domain: OFFICIAL_DOMAIN,
          acceptance_text: "I read and accepted all sections of the Cognita Enrollment Agreement.",
        });
      } catch (consentError) {
        console.error("Enrollment consent record could not be created:", consentError);
      }

      toast({ title: "Enrollment agreement signed" });
      navigate("/student/payments");
    } catch (error) {
      toast({ title: "Failed to sign", description: error.message, variant: "destructive" });
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-2">
        <FileText size={20} className="text-cyan-400" />
        <div>
          <h1 className="text-xl font-bold md:text-2xl">Enrollment Agreement</h1>
          <p className="text-xs text-muted-foreground">Version {POLICY_VERSIONS.enrollmentAgreement}</p>
        </div>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">Review and accept the agreement before learning access can be activated.</p>

      <div className="mb-6 space-y-3">
        {AGREEMENT_SECTIONS.map((section, index) => (
          <div key={section.title} className="rounded-xl border border-border/50 bg-card p-5">
            <div className="mb-2 flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-cyan-400">{String(index + 1).padStart(2, "0")}</span>
              <h3 className="text-sm font-semibold">{section.title}</h3>
            </div>
            <p className="text-sm leading-relaxed text-foreground/70">{section.body}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-5">
        <div className="flex items-start gap-3">
          <Checkbox checked={agreed} onCheckedChange={(value) => setAgreed(value === true)} className="mt-0.5" />
          <p className="text-sm text-foreground/80">
            I have read and understood all sections above. I accept this Enrollment Agreement, the <Link to="/terms" target="_blank" className="text-cyan-400 hover:underline">Terms of Use</Link>, and acknowledge the <Link to="/privacy" target="_blank" className="text-cyan-400 hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>

      <Button onClick={handleSign} disabled={!agreed || signing} className="h-12 w-full bg-cyan-500 text-black hover:bg-cyan-400">
        {signing ? <Loader2 size={16} className="animate-spin" /> : <><ShieldCheck size={16} className="mr-2" /> Sign Enrollment Agreement</>}
      </Button>
    </div>
  );
}
