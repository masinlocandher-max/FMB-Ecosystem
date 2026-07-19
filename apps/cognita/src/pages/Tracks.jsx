import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Briefcase, Clock, GraduationCap, Palette, Rocket } from "lucide-react";

const TRACKS_DATA = [
  {
    icon: Palette,
    name: "AI for Creatives",
    tagline: "Design, content, and creative production with AI",
    who: "Designers, writers, content creators, marketers, artists, and creative professionals.",
    focus: [
      "AI-assisted content creation and ideation",
      "Visual design and image-generation workflows",
      "Writing, copywriting, and editorial AI tools",
      "Creative portfolio development",
    ],
    active: true,
  },
  {
    icon: Briefcase,
    name: "AI for Professionals and Virtual Assistants",
    tagline: "Productivity, operations, and professional workflows",
    who: "Virtual assistants, operations staff, executive assistants, freelancers, and office professionals.",
    focus: [
      "Email, scheduling, and communication workflows",
      "Document creation and data processing",
      "Client management and reporting systems",
      "Professional procedures and SOPs with AI",
    ],
    active: true,
  },
  {
    icon: Rocket,
    name: "AI for Entrepreneurs",
    tagline: "Business strategy, marketing, and startup tools",
    who: "Founders, small-business owners, solopreneurs, and aspiring entrepreneurs.",
    focus: [
      "Market research and competitive analysis",
      "Business-plan and pitch development",
      "Marketing systems and lead-generation workflows",
      "Revenue-focused AI applications",
    ],
    active: false,
  },
  {
    icon: GraduationCap,
    name: "AI for Students",
    tagline: "Academic productivity and responsible research skills",
    who: "College students, graduate students, researchers, and academic professionals.",
    focus: [
      "Research assistance and literature review",
      "Academic writing and citation workflows",
      "Study systems and exam preparation",
      "Thesis and project development with AI",
    ],
    active: false,
  },
];

export default function Tracks() {
  return (
    <div className="apple-surface min-h-screen">
      <section className="relative overflow-hidden px-5 pb-16 pt-24 sm:px-6 md:pb-24 md:pt-32">
        <div className="absolute left-1/2 top-0 h-[28rem] w-[54rem] -translate-x-1/2 rounded-full bg-sky-400/[0.075] blur-[130px]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-4xl">
            <p className="apple-eyebrow">Specialization tracks</p>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.03] tracking-[-0.055em] text-white sm:text-5xl md:text-7xl">
              Applied AI for different professional contexts.
            </h1>
            <p className="mt-7 max-w-3xl text-base leading-8 text-slate-300/75 md:text-xl">
              In the 10-Week Professional AI Program, learners complete the common AI Foundation before entering a specialization pathway for Weeks 5 to 9. Track availability depends on the active cohort.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-6 md:pb-28">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {TRACKS_DATA.map(({ icon: Icon, name, tagline, who, focus, active }) => (
            <article key={name} className={`apple-card p-6 md:p-8 ${active ? "" : "opacity-70"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="apple-icon-tile">
                  <Icon size={25} className="text-sky-300" />
                </div>
                <span className="apple-status-pill">
                  {active ? "Active track" : <><Clock size={10} className="mr-1" /> Planned track</>}
                </span>
              </div>

              <h2 className="mt-7 text-2xl font-semibold tracking-[-0.035em] text-white">{name}</h2>
              <p className="mt-2 text-sm font-medium text-sky-300/80">{tagline}</p>

              <div className="mt-6 rounded-2xl border border-white/[0.075] bg-white/[0.025] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">Designed for</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{who}</p>
              </div>

              <div className="mt-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">Focus areas</p>
                <ul className="mt-3 space-y-3">
                  {focus.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm leading-6 text-slate-400">
                      <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-sky-300/70" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-white/[0.065]">
        <div className="mx-auto max-w-7xl px-5 py-16 text-center sm:px-6 md:py-20">
          <p className="mx-auto max-w-2xl text-base leading-7 text-slate-400">
            Applicants indicate a preferred track during admission. Final placement depends on the active cohort, learner goals, and available facilitation.
          </p>
          <Link to="/apply" className="apple-button-primary mt-7 gap-2 px-7 py-3.5 text-sm font-semibold">
            Apply to the 10-week program
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
