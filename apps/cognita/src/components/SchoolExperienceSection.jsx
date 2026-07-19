import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  Library,
  LogIn,
  UserRoundCheck,
} from "lucide-react";

const JOURNEY = [
  {
    icon: BookOpen,
    step: "01",
    title: "Explore",
    description: "Compare Open Learning, guided professional programs, assessment, and institutional pathways.",
  },
  {
    icon: UserRoundCheck,
    step: "02",
    title: "Choose a pathway",
    description: "Select the delivery model, level of support, and completion standard that match your goal.",
  },
  {
    icon: LogIn,
    step: "03",
    title: "Enter the student portal",
    description: "Use one account for lessons, records, announcements, support, and approved learning access.",
  },
  {
    icon: Library,
    step: "04",
    title: "Learn and build",
    description: "Move through structured lessons, practical exercises, resources, quizzes, and portfolio outputs.",
  },
  {
    icon: ClipboardCheck,
    step: "05",
    title: "Track completion",
    description: "Progress, submissions, assessment decisions, and official records remain visible in one school system.",
  },
];

export default function SchoolExperienceSection() {
  return (
    <section className="border-y border-white/[0.065] bg-white/[0.012]">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 md:py-28">
        <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16">
          <div>
            <div className="apple-icon-tile">
              <GraduationCap size={25} className="text-sky-300" />
            </div>
            <p className="apple-eyebrow mt-7">The Cognita school experience</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em] text-white md:text-5xl">
              The website should feel like entering a school, not browsing a software company.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-400">
              Programs, admissions, the student portal, lessons, support, assessment, and records are presented as one connected learner journey.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/program" className="apple-button-primary gap-2 px-6 py-3 text-sm font-semibold">
                Explore the school
                <ArrowRight size={15} />
              </Link>
              <Link to="/login" className="apple-button-secondary gap-2 px-6 py-3 text-sm font-medium">
                Student portal
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            {JOURNEY.map(({ icon: Icon, step, title, description }) => (
              <article key={title} className="apple-card flex gap-4 p-5 md:p-6">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-sky-300/15 bg-sky-300/[0.06] text-sky-300">
                  <Icon size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-sky-300/65">Step {step}</p>
                  <h3 className="mt-1.5 text-lg font-semibold tracking-[-0.02em] text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-amber-300/15 bg-amber-300/[0.045] p-5 md:p-6">
          <p className="text-sm leading-7 text-slate-300/85">
            Open Learning remains in phased launch. Early-access interest may be collected now, but public paid self-paced enrollment should open only after live account access, permissions, progress tracking, lesson publishing, support, and payment controls are verified end to end.
          </p>
        </div>
      </div>
    </section>
  );
}
