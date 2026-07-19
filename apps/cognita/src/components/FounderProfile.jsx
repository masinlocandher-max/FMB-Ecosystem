import React from "react";

const FOUNDER_IMAGE = "https://media.base44.com/images/public/6a4eddeaf17a430019587b35/3653ed958_IMG_7778.jpg";
const ORGANIZATION_BOARD = "https://photoshop-api.adobe.io/v2/short-url/urn:aaid:ps:US:9c54750b-4199-4599-a721-18cc36c351f1";

const HIGHLIGHTS = [
  "Founder of Cognita Institute of Artificial Intelligence",
  "Pioneer Trainer",
  "Creative Director and Brand Strategist",
  "PR and Communications Practitioner",
  "Photography and Visual Storytelling Background",
  "Education and Training Experience",
  "AI Learning Systems Designer",
  "Portfolio-Based Learning Advocate",
];

const ORGANIZATION = [
  {
    name: "Paolo Santos",
    role: "Executive Director",
    department: "Executive Leadership",
    responsibility:
      "Leads day-to-day institute operations, cross-functional coordination, implementation priorities, and institutional accountability.",
  },
  {
    name: "Jomar Reyes",
    role: "Academic Director",
    department: "Academic Affairs",
    responsibility:
      "Oversees curriculum quality, facilitator standards, learning outcomes, assessment integrity, and academic review processes.",
  },
  {
    name: "Angela Garcia",
    role: "Registrar",
    department: "Records and Credentialing",
    responsibility:
      "Maintains enrollment records, learner status, completion documentation, credential records, and verification controls.",
  },
  {
    name: "Marianne Mendoza",
    role: "Head of Admissions",
    department: "Admissions",
    responsibility:
      "Manages applications, eligibility review, applicant communication, onboarding coordination, and admissions records.",
  },
  {
    name: "Joshua Villanueva",
    role: "Finance and Billing Officer",
    department: "Finance and Administration",
    responsibility:
      "Coordinates billing, statements of account, payment records, receipts, reconciliations, and approved financial controls.",
  },
  {
    name: "Lourdes Ramos",
    role: "Library Services Head",
    department: "Learning Resource Center",
    responsibility:
      "Maintains the controlled source library, reference records, learning resources, review schedules, and access standards.",
  },
  {
    name: "Bianca Aquino",
    role: "Student Affairs Officer",
    department: "Learner Experience",
    responsibility:
      "Coordinates learner support, welfare concerns, accommodations, communications, escalation, and student-experience records.",
  },
  {
    name: "Teresa Flores",
    role: "Quality Assurance Officer",
    department: "Quality and Compliance",
    responsibility:
      "Audits program delivery, documentation, reviewer consistency, policy compliance, and continuous-improvement actions.",
  },
];

export default function FounderProfile() {
  return (
    <div className="space-y-12 md:space-y-20">
      <div className="max-w-3xl">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">Leadership</p>
        <h2 className="section-title text-3xl font-bold leading-tight tracking-tight md:text-5xl">
          FOUNDER-LED,
          <br />
          <span className="text-cyan-400">STANDARDS-DRIVEN</span>
        </h2>
      </div>

      <div className="card-glow overflow-hidden rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-5">
          <div className="relative md:col-span-2">
            <div className="aspect-[4/5] overflow-hidden border-b border-cyan-500/10 md:h-full md:border-b-0 md:border-r">
              <img
                src={FOUNDER_IMAGE}
                alt="Francine Marie Bautista"
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#02050e] via-transparent to-transparent md:bg-gradient-to-r" />
            </div>
          </div>

          <div className="p-6 md:col-span-3 md:p-10">
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-cyan-400">Founder · Pioneer Trainer</p>
            <h3 className="mb-2 text-2xl font-bold md:text-3xl">Francine Marie Bautista</h3>
            <p className="mb-1 text-sm text-muted-foreground md:text-base">
              Founder, Cognita Institute of Artificial Intelligence
            </p>
            <p className="mb-4 text-sm text-muted-foreground">Pioneer Trainer</p>
            <p className="mb-6 text-xs font-medium uppercase tracking-[0.2em] text-cyan-400/70">
              Creative Director · Strategist · AI Learning Designer · Trainer
            </p>

            <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                Francine Marie Bautista is a creative director, strategist, trainer, storyteller, branding consultant, and founder of Cognita Institute of Artificial Intelligence. Her work sits at the intersection of communications, technology, education, culture, identity, and practical skill-building.
              </p>
              <p>
                As Cognita&apos;s Founder and Pioneer Trainer, she designed the institute to move beyond passive AI learning. Her approach focuses on practical execution, guided outputs, portfolio proof, and human judgment. Cognita was built for learners who want to produce real work using AI with clarity, confidence, and responsibility.
              </p>
              <p>
                Francine brings together her background in teaching, training, creative strategy, branding, public relations, storytelling, and digital systems to make AI education more accessible, structured, and useful for real-world work.
              </p>
            </div>

            <div className="mt-8">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Key Highlights</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {HIGHLIGHTS.map((highlight) => (
                  <div
                    key={highlight}
                    className="flex items-center gap-2.5 rounded-lg border border-cyan-500/10 bg-cyan-500/5 px-3 py-2"
                  >
                    <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(0,174,255,0.6)]" />
                    <span className="text-xs text-foreground/80">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mt-8 border-l-2 border-cyan-500/30 pl-6">
              <p className="text-base italic leading-relaxed text-foreground/90 md:text-lg">
                &quot;AI should not make people passive. It should make them sharper, clearer, and more capable.&quot;
              </p>
            </div>

            <p className="mt-6 text-sm italic text-muted-foreground">With love, FMB</p>
          </div>
        </div>
      </div>

      <section id="organization" className="scroll-mt-28">
        <div className="mx-auto max-w-4xl text-center">
          <p className="apple-eyebrow">Organization</p>
          <h3 className="mt-4 text-3xl font-semibold tracking-[-0.045em] text-white md:text-5xl">
            A complete operating structure for credible learning and human review.
          </h3>
          <p className="mx-auto mt-5 max-w-3xl text-sm leading-7 text-slate-400 md:text-base">
            Cognita separates executive leadership, academic governance, admissions, records, finance, learner support, learning resources, and quality assurance so no single person controls the entire learner journey.
          </p>
        </div>

        <div className="relative mt-10 overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-[0_35px_90px_rgba(0,0,0,0.32)]">
          <img
            src={ORGANIZATION_BOARD}
            alt="Proposed Cognita organization showing Paolo Santos, Jomar Reyes, Angela Garcia, Marianne Mendoza, Joshua Villanueva, Lourdes Ramos, Bianca Aquino, and Teresa Flores in their respective operating roles."
            className="h-auto w-full"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
          <div className="absolute left-4 top-4 rounded-full border border-slate-900/10 bg-white/90 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-700 shadow-sm backdrop-blur md:left-6 md:top-6 md:text-[10px]">
            Proposed organizational roster
          </div>
        </div>

        <p className="mx-auto mt-4 max-w-3xl text-center text-xs leading-6 text-slate-500">
          The names and portraits shown are working organizational profiles for launch planning. Final appointments, biographies, credentials, and public representation must be confirmed before the roster is presented as active staff.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {ORGANIZATION.map((person) => (
            <article key={person.name} className="apple-card p-5 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300/70">
                    {person.department}
                  </p>
                  <h4 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-white">{person.name}</h4>
                  <p className="mt-1 text-sm font-medium text-sky-300">{person.role}</p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Proposed
                </span>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-400">{person.responsibility}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-sky-300/10 bg-sky-300/[0.035] p-5 md:p-6">
          <p className="text-sm leading-7 text-slate-300/85">
            Portfolio approval remains a human responsibility. Automated systems may track completion, prepare audit records, and route submissions, but only an authorized human reviewer may require revisions, confirm that the Cognita Standard has been met, or approve a learner for credential issuance.
          </p>
        </div>
      </section>
    </div>
  );
}
