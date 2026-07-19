import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Lock, ShieldCheck } from "lucide-react";
import ProgramPortfolio from "@/components/ProgramPortfolio";
import { CURRICULUM } from "@/lib/curriculum";
import { FLAGSHIP_PROGRAM } from "@/lib/program-portfolio";

const phaseBadge = {
  "AI Foundation": "border-sky-300/15 bg-sky-300/[0.07] text-sky-200",
  "Specialization Track": "border-indigo-300/15 bg-indigo-300/[0.07] text-indigo-200",
  "Final Review": "border-amber-300/15 bg-amber-300/[0.07] text-amber-200",
};

export default function Program() {
  const curriculum = CURRICULUM.filter(
    (week, index, weeks) => weeks.findIndex((item) => item.week === week.week) === index
  );

  return (
    <div className="apple-surface">
      <section className="relative overflow-hidden px-5 pb-16 pt-24 sm:px-6 md:pb-24 md:pt-32">
        <div className="absolute left-1/2 top-0 h-[28rem] w-[54rem] -translate-x-1/2 rounded-full bg-sky-400/[0.075] blur-[130px]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-4xl">
            <p className="apple-eyebrow">Cognita program portfolio</p>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.03] tracking-[-0.055em] text-white sm:text-5xl md:text-7xl">
              Four pathways. One standard of clarity.
            </h1>
            <p className="mt-7 max-w-3xl text-base leading-8 text-slate-300/75 md:text-xl">
              Cognita separates learning access, guided professional training, formal assessment, and institutional delivery so every learner and partner understands exactly what is included.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-6 md:pb-28">
        <ProgramPortfolio detailed />
      </section>

      <section id="flagship-program" className="border-y border-white/[0.065] bg-white/[0.012]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 md:py-28">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="apple-eyebrow">Under {FLAGSHIP_PROGRAM.parent}</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white md:text-5xl">
                {FLAGSHIP_PROGRAM.name}
              </h2>
              <p className="mt-5 text-base leading-8 text-slate-300/75">
                {FLAGSHIP_PROGRAM.description}
              </p>

              <div className="mt-8 space-y-3">
                {[
                  "Fixed cohort and progressive weekly access",
                  "Human facilitator review for required outputs",
                  "Revision opportunities based on documented feedback",
                  "Portfolio development throughout the program",
                  "Certificate review after completion requirements are met",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm leading-6 text-slate-300">
                    <CheckCircle2 size={16} className="mt-1 flex-shrink-0 text-sky-300" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-2xl border border-amber-300/12 bg-amber-300/[0.04] p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck size={19} className="mt-0.5 flex-shrink-0 text-amber-200" />
                  <div>
                    <p className="text-sm font-semibold text-amber-100">Credentialing is not automatic</p>
                    <p className="mt-2 text-xs leading-6 text-slate-400">
                      Attendance alone does not earn a certificate. Required outputs, completion evidence, and final review determine eligibility.
                    </p>
                  </div>
                </div>
              </div>

              <Link to="/apply" className="apple-button-primary mt-8 gap-2 px-7 py-3.5 text-sm font-semibold">
                Apply to the next cohort
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="space-y-4">
              {curriculum.map((week) => (
                <article key={week.week} className="apple-card p-5 md:p-7">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.035]">
                      <span className="font-mono text-sm font-semibold text-sky-300">
                        {String(week.week).padStart(2, "0")}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.13em] ${phaseBadge[week.phase]}`}>
                          {week.phase}
                        </span>
                        {week.track && (
                          <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] uppercase tracking-[0.13em] text-slate-400">
                            Track-specific
                          </span>
                        )}
                        {week.week > 1 && (
                          <span className="flex items-center gap-1 text-[10px] text-slate-500">
                            <Lock size={10} /> Progressive access
                          </span>
                        )}
                      </div>

                      <h3 className="mt-4 text-xl font-semibold tracking-[-0.025em] text-white">
                        {week.title}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-slate-400">
                        {week.lessonOverview}
                      </p>

                      <div className="mt-5 rounded-2xl border border-white/[0.07] bg-black/10 p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-sky-300/70">
                          Required output
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-200">
                          {week.requiredOutput}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 text-center sm:px-6 md:py-28">
        <div className="apple-card p-8 md:p-14">
          <p className="apple-eyebrow">Professional Programs admissions</p>
          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.045em] text-white md:text-5xl">
            Applications are reviewed before enrollment.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-400">
            The 10-week program is designed for learners who are prepared to complete weekly practical work and respond to facilitator feedback.
          </p>
          <Link to="/apply" className="apple-button-primary mt-8 gap-2 px-7 py-3.5 text-sm font-semibold">
            Start your application
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
