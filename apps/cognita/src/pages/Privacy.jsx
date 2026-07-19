import React from "react";
import { Shield } from "lucide-react";
import { OFFICIAL_EMAILS, POLICY_VERSIONS } from "@/lib/governance";

const sections = [
  {
    title: "Scope and Status",
    body: "This Privacy Policy explains how Cognita Institute of Artificial Intelligence collects and uses personal information through its website, applications, learning environment, support channels, assessment process, and credential registry. The policy is an operational draft for launch and must be finalized with the legal operator name, business address, processor list, and approved retention schedule before public paid enrollment opens.",
  },
  {
    title: "Information We Collect",
    body: "Cognita may collect identity and contact details, account and authentication records, application responses, enrollment and agreement records, payment and billing records, lesson progress, quiz attempts, learner submissions, private uploaded files, portfolio versions, human review findings, support tickets, consent records, and credential information. We do not ask users to submit passwords, one-time codes, or unnecessary sensitive information through support forms.",
  },
  {
    title: "Why We Use Information",
    body: "Information is used to operate accounts, review applications, manage enrollment and access, provide learning services, track progress, conduct human assessment, process payments, respond to support requests, prevent abuse, maintain academic and financial records, issue and verify credentials, improve quality, and comply with lawful obligations.",
  },
  {
    title: "Human Review and AI",
    body: "Cognita may use automation to route records, check completeness, calculate progress, and assist operations. AI must not make the final decision to pass or fail a portfolio, confirm the Cognita Standard, approve credential issuance, or revoke a credential. Those decisions require an authorized human reviewer or administrator.",
  },
  {
    title: "Private Learner Files",
    body: "Learner submissions and supporting files are intended to be private unless the learner separately authorizes publication. Authorized reviewers may access them only for program delivery, assessment, quality assurance, support, audit, and credentialing. Private file links may be temporary and time-limited.",
  },
  {
    title: "Public Credential Registry",
    body: "The public verification page requires an official serial number. A valid result may display the learner name, credential title, track, cohort, issue date, serial number, and current status. Cognita does not provide a public directory search by learner name or cohort.",
  },
  {
    title: "Sharing and Service Providers",
    body: "Cognita may use service providers for hosting, authentication, file storage, email, payments, analytics, communications, and technical operations. Providers should receive only the information needed for their service and remain subject to applicable agreements and security controls. Cognita does not sell personal information to advertisers.",
  },
  {
    title: "Retention and Deletion",
    body: "Different records require different retention periods. Applications, support records, financial documents, learning evidence, portfolio audits, and credential records must follow an approved retention schedule. Credential and revocation records may need longer retention for verification and fraud prevention. Deletion requests may be limited where records must be retained for legal, financial, security, academic-integrity, or verification purposes.",
  },
  {
    title: "Security",
    body: "Cognita uses role-based access, private file handling, versioned records, audit references, and other reasonable safeguards. No system is perfectly secure. Users should protect their credentials, use strong passwords, avoid sharing one-time codes, and report suspected unauthorized access immediately.",
  },
  {
    title: "Your Requests and Rights",
    body: "Depending on applicable law, a person may request access, correction, deletion, restriction, objection, data portability, withdrawal of consent where consent is the basis, or information about processing. Cognita must verify identity before acting on a request and should record the request through the support-ticket system.",
  },
  {
    title: "Minors",
    body: "Cognita programs are designed primarily for adults and older learners able to enter the applicable agreement. A dedicated minors policy, guardian consent process, and age-appropriate safeguards must be approved before accepting a learner who cannot independently consent under applicable law.",
  },
  {
    title: "Policy Changes",
    body: "Material policy changes should be versioned and communicated. Cognita may require renewed acceptance when a change affects how learner data, submissions, payments, or credentials are handled.",
  },
];

export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-6 pb-20 pt-24">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10"><Shield size={20} className="text-cyan-400" /></div>
        <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">Legal and Privacy</p>
      </div>
      <h1 className="mb-2 text-3xl font-bold md:text-4xl">Privacy Policy</h1>
      <p className="mb-10 text-sm text-muted-foreground">Policy version {POLICY_VERSIONS.privacy} · Updated July 2026</p>

      <div className="space-y-8 text-sm leading-relaxed text-foreground/80">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="mb-3 text-lg font-semibold text-foreground">{section.title}</h2>
            <p>{section.body}</p>
          </section>
        ))}

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">Privacy Contact</h2>
          <p>Submit a Privacy Request through the Contact and Support page or email:</p>
          <div className="mt-3 rounded-lg border border-border/50 bg-secondary/50 p-4">
            <p className="text-sm font-medium">Cognita Institute of Artificial Intelligence</p>
            <a className="text-sm text-cyan-400 hover:underline" href={`mailto:${OFFICIAL_EMAILS.privacy}`}>{OFFICIAL_EMAILS.privacy}</a>
          </div>
        </section>
      </div>
    </div>
  );
}
