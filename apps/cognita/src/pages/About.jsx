import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Eye, Layers3, ShieldCheck, Target } from "lucide-react";
import FounderProfile from "@/components/FounderProfile";

const PRINCIPLES = [
  {
    icon: Target,
    title: "Mission",
    text: "To make practical AI capability easier to build, demonstrate, assess, and apply in professional settings.",
  },
  {
    icon: Eye,
    title: "Vision",
    text: "A professional learning environment where AI education is trusted because the program promise, learner work, and credential standard are clearly defined.",
  },
  {
    icon: Layers3,
    title: "Delivery model",
    text: "Cognita offers separate pathways for self-paced learning, guided professional programs, assessment and credentialing, and institutional training.",
  },
  {
    icon: ShieldCheck,
    title: "Credential standard",
    text: "Certificates and verified records are issued only when the required completion evidence has been reviewed and approved.",
  },
];

export default function About() {
  return (
    <div className="apple-surface">
      <section className="relative overflow-hidden px-5 pb-16 pt-24 sm:px-6 md:pb-24 md:pt-32">
        <div className="absolute left-1/2 top-0 h-[28rem] w-[54rem] -translate-x-1/2 rounded-full bg-sky-400/[0.075] blur-[130px]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-4xl">
            <p className="apple-eyebrow">About Cognita</p>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.03] tracking-[-0.055em] text-white sm:text-5xl md:text-7xl">
              A professional AI learning institute built around clarity.
            </h1>
            <p className="mt-7 max-w-3xl text-base leading-8 text-slate-300/75 md:text-xl">
              Cognita Institute of Artificial Intelligence is a private professional training institute offering non-degree AI learning programs. Its purpose is to help learners and organizations build practical capability through clearly defined pathways, outputs, review standards, and records.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-6 md:pb-28">
        <div className="grid gap-5 md:grid-cols-2">
          {PRINCIPLES.map(({ icon: Icon, title, text }) => (
            <article key={title} className="apple-card p-6 md:p-8">
              <div className="apple-icon-tile">
                <Icon size={25} className="text-sky-300" />
              </div>
              <h2 className="mt-6 text-xl font-semibold tracking-[-0.025em] text-white">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/[0.065] bg-white/[0.012]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-6 md:py-28 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <p className="apple-eyebrow">How the institute is organized</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em] text-white md:text-5xl">
              Different pathways. Consistent standards.
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-400">
              Cognita no longer treats every learner as if they need the same schedule or level of support. The business model separates the learning experience into four clear divisions.
            </p>
          </div>

          <div className="space-y-3">
            {[
              ["Cognita Open Learning", "Self-paced lessons and resources for independent learners."],
              ["Cognita Professional Programs", "Guided, facilitator-led training, including the 10-Week Professional AI Program."],
              ["Cognita Assessment and Credentialing", "Review, verification, completion records, and credential issuance."],
              ["Cognita Institutional Training", "Group and customized programs for organizations."],
            ].map(([name, description], index) => (
              <div key={name} className="apple-card flex gap-4 p-5 md:p-6">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-sky-300/15 bg-sky-300/[0.06] font-mono text-xs text-sky-300">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">{name}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-6 md:py-28">
        <div className="mx-auto max-w-4xl">
          <p className="apple-eyebrow">What remains non-negotiable</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em] text-white md:text-5xl">
            Cognita should never promise more than the service actually provides.
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {[
              "Self-paced access is not described as facilitator-led unless human support is included.",
              "A course purchase does not automatically include assessment or credentialing.",
              "Attendance alone does not qualify a learner for a Certificate of Completion.",
              "Cognita does not claim degree-granting, college-credit, CHED, or TESDA status without formal authority.",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/[0.075] bg-white/[0.025] p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck size={17} className="mt-1 flex-shrink-0 text-sky-300" />
                  <p className="text-sm leading-7 text-slate-400">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-6 md:pb-28">
        <FounderProfile />
      </section>

      <section className="border-t border-white/[0.065]">
        <div className="mx-auto max-w-7xl px-5 py-16 text-center sm:px-6 md:py-20">
          <p className="mx-auto max-w-2xl text-base leading-7 text-slate-400">
            Explore the four pathways and choose the delivery model that matches your goals, schedule, and required level of support.
          </p>
          <Link to="/program" className="apple-button-primary mt-7 gap-2 px-7 py-3.5 text-sm font-semibold">
            Explore Cognita programs
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
