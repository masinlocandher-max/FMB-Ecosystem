import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Check } from "lucide-react";
import ProgramIcon from "@/components/ProgramIcon";
import { PROGRAM_PORTFOLIO } from "@/lib/program-portfolio";

export default function ProgramPortfolio({ detailed = false }) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:gap-6">
      {PROGRAM_PORTFOLIO.map((program) => (
        <article key={program.id} id={program.id} className="apple-card group flex flex-col p-0">
          <div className="relative aspect-[4/3] overflow-hidden border-b border-white/[0.07] bg-gradient-to-br from-sky-400/10 via-slate-900 to-slate-950">
            <img
              src={program.image}
              alt={program.imageAlt}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.025]"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07101f] via-transparent to-black/10" aria-hidden="true" />
            <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4 md:inset-x-6 md:bottom-6">
              <div className="apple-icon-tile border-white/15 bg-[#07101f]/82 shadow-2xl backdrop-blur-xl">
                <ProgramIcon name={program.icon} size={28} className="text-sky-300" />
              </div>
              <span className="apple-status-pill border-white/15 bg-[#07101f]/75 text-slate-200 backdrop-blur-xl">
                {program.availability}
              </span>
            </div>
          </div>

          <div className="flex flex-1 flex-col p-6 md:p-8">
            <p className="apple-eyebrow">{program.eyebrow}</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-white md:text-3xl">
              {program.name}
            </h3>
            <p className="mt-4 text-sm leading-7 text-slate-300/80 md:text-base">
              {detailed ? program.explanation : program.description}
            </p>

            {detailed && (
              <>
                <div className="mt-6 rounded-2xl border border-white/8 bg-white/[0.025] p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Best suited for</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{program.audience}</p>
                </div>

                <ul className="mt-6 space-y-3">
                  {program.includes.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-slate-300/85">
                      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-sky-400/10 text-sky-300">
                        <Check size={12} />
                      </span>
                      <span className="leading-6">{item}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <Link
              to={program.actionPath}
              className="mt-auto inline-flex items-center gap-2 pt-7 text-sm font-medium text-sky-300 transition group-hover:text-sky-200"
            >
              {program.actionLabel}
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
