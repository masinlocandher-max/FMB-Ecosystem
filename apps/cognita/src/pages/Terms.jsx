import React from "react";
import { FileText } from "lucide-react";
import { OFFICIAL_CREDENTIAL_TITLE, OFFICIAL_EMAILS, POLICY_VERSIONS } from "@/lib/governance";

const sections = [
  {
    title: "Acceptance and Scope",
    body: "These Terms of Use apply to the Cognita Institute of Artificial Intelligence website, applications, learning environment, professional programs, Open Learning services, portfolio assessment, institutional training, support systems, and credential registry. By creating an account, applying, enrolling, submitting work, or using a Cognita service, you agree to the version presented to you at that time.",
  },
  {
    title: "Institutional Positioning",
    body: "Cognita is a private provider of non-degree professional AI training. Unless Cognita expressly states otherwise and has lawful authority to do so, its programs do not award a college degree, diploma, academic credit, professional license, or government accreditation. Marketing language must not be interpreted as such a claim.",
  },
  {
    title: "Applications and Admission",
    body: "Submitting an application does not guarantee acceptance. Cognita may consider readiness, goals, available study time, program fit, cohort capacity, and the applicant's ability to complete required work. Application decisions must be handled through authorized admissions personnel and may be subject to a documented review or appeal process when applicable.",
  },
  {
    title: "Enrollment and Learning Access",
    body: "Acceptance is not the same as enrollment. Access may require account verification, a signed enrollment agreement, payment confirmation or an approved waiver, batch or product assignment, and creation of an active access entitlement. Cognita may suspend or revoke access for unresolved payment, serious policy violations, security concerns, misuse, or the end of an agreed access period, subject to applicable written policy and review.",
  },
  {
    title: "Fees, Payment, Withdrawal, and Refunds",
    body: "The applicable price, discount, payment schedule, due date, withdrawal rule, and refund terms must be shown in the learner's written invoice, enrollment offer, or product terms before payment. A payment is not treated as confirmed until verified by an authorized finance process. Refunds are not automatic and will follow the written policy applicable to the specific transaction. Cognita must not rely on an unwritten case-by-case promise where a clear consumer policy is required.",
  },
  {
    title: "Learning Requirements",
    body: "Learners are responsible for completing required lessons, activities, quizzes, outputs, revisions, portfolio evidence, disclosures, and reflections. Automated progress indicators and self-check quizzes are learning aids. They are not by themselves proof that the Cognita Standard has been met.",
  },
  {
    title: "Human Review and the Cognita Standard",
    body: "Only an authorized human reviewer may require revisions, pass or fail reviewed evidence, confirm that a portfolio meets the Cognita Standard, approve a learner for credential issuance, or revoke a credential. AI and automation may assist with routing, completeness checks, reminders, formatting, record preparation, and quality support, but they must not make the final academic or credentialing decision.",
  },
  {
    title: OFFICIAL_CREDENTIAL_TITLE,
    body: `The ${OFFICIAL_CREDENTIAL_TITLE} is not automatic and is not awarded for attendance alone. Eligibility requires the applicable learning work, required revisions, portfolio evidence, a completed human portfolio audit, confirmation that the Cognita Standard has been met, and a separate authorized credential approval. The credential remains a non-degree professional training record.`,
  },
  {
    title: "Submissions, Versions, and Audit Records",
    body: "When a learner submits or resubmits assessed work, Cognita may preserve an immutable version for review, quality assurance, appeals, integrity checks, and credentialing. A submitted version may be locked while review is pending. Feedback and later revisions do not erase the earlier audit record, subject to applicable retention and privacy rules.",
  },
  {
    title: "Academic Integrity and Responsible AI Use",
    body: "Learners must submit work that reflects their own understanding, decisions, and responsibility. Material AI assistance must be disclosed when required. Learners must verify facts, sources, permissions, privacy, and professional suitability. Plagiarism, fabricated evidence, impersonation, falsified sources, credential fraud, malicious content, or undisclosed outsourcing may lead to revision, failure, suspension, removal, or credential review.",
  },
  {
    title: "Learner Intellectual Property",
    body: "Learners retain ownership of their original submissions, except for third-party content or where a separate written agreement states otherwise. By submitting work, the learner grants Cognita a limited permission to receive, store, reproduce, display privately, assess, annotate, moderate, back up, audit, and retain the work as needed for program delivery, support, quality assurance, records, and credential verification. Public or promotional use of identifiable learner work requires a separate lawful basis or permission.",
  },
  {
    title: "Cognita Materials",
    body: "Cognita curricula, manuals, source packs, templates, rubrics, frameworks, brand assets, interfaces, and original instructional materials may be used only for the learner's authorized program or service. Users may not resell, republish, upload to public repositories, distribute substantial copies, create a competing course from the materials, remove ownership notices, or use the materials to train others without written permission. Third-party sources remain subject to their own rights and licenses.",
  },
  {
    title: "Privacy, Files, and Security",
    body: "Use of Cognita services is also governed by the Privacy Policy. Users must protect passwords and one-time codes, provide accurate information, avoid uploading unnecessary sensitive data, and report suspected unauthorized access. Learner files are intended to remain private unless separately published with authorization.",
  },
  {
    title: "Support, Complaints, Appeals, and Corrections",
    body: "Users should submit concerns through the traceable support system and retain the ticket reference. Academic decisions, payment disputes, privacy requests, credential corrections, and appeals may require different review procedures and identity verification. A support acknowledgment is not a promise that the requested outcome will be granted.",
  },
  {
    title: "Service Availability and Changes",
    body: "Cognita may maintain, update, suspend, discontinue, or phase features and programs. Material changes affecting enrolled learners should be communicated reasonably and must not be used to misrepresent what was purchased or agreed. Open Learning, professional programs, assessment, and institutional services may have separate availability and terms.",
  },
  {
    title: "Limitation and Professional Responsibility",
    body: "AI tools and learning materials can be inaccurate, incomplete, biased, unavailable, or unsuitable for a particular use. Learners remain responsible for verifying outputs and obtaining qualified legal, medical, financial, technical, or other professional advice when needed. Cognita training does not guarantee employment, income, business results, platform availability, or acceptance by a third party.",
  },
  {
    title: "Policy Versioning",
    body: "Cognita records the version of key terms and agreements accepted by users. Material changes may require renewed acceptance. The final governing-law, legal-entity, business-address, consumer-protection, and dispute-resolution clauses must be approved before public paid enrollment opens.",
  },
];

export default function Terms() {
  return (
    <div className="mx-auto max-w-3xl px-6 pb-20 pt-24">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10"><FileText size={20} className="text-cyan-400" /></div>
        <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">Legal and Governance</p>
      </div>
      <h1 className="mb-2 text-3xl font-bold md:text-4xl">Terms of Use</h1>
      <p className="mb-10 text-sm text-muted-foreground">Policy version {POLICY_VERSIONS.terms} · Updated July 2026</p>

      <div className="space-y-8 text-sm leading-relaxed text-foreground/80">
        <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
          <h2 className="mb-2 font-semibold text-amber-300">Pre-launch legal notice</h2>
          <p>These are complete operational terms for product and workflow development, but Cognita must add its final legal operator name, business address, governing law, approved refund policy, and qualified Philippine legal review before accepting public paid enrollment.</p>
        </section>

        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="mb-3 text-lg font-semibold text-foreground">{section.title}</h2>
            <p>{section.body}</p>
          </section>
        ))}

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">Contact</h2>
          <p>Questions about these terms may be submitted through Contact and Support or emailed to:</p>
          <div className="mt-3 rounded-lg border border-border/50 bg-secondary/50 p-4">
            <p className="text-sm font-medium">Cognita Institute of Artificial Intelligence</p>
            <a href={`mailto:${OFFICIAL_EMAILS.support}`} className="text-sm text-cyan-400 hover:underline">{OFFICIAL_EMAILS.support}</a>
          </div>
        </section>
      </div>
    </div>
  );
}
