import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Clock3,
  FileCheck2,
  Layers3,
  Mail,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import BrandLockup from "@/components/BrandLockup";
import FounderPreview from "@/components/FounderPreview";
import ProgramPortfolio from "@/components/ProgramPortfolio";
import SchoolExperienceSection from "@/components/SchoolExperienceSection";
import { OFFICIAL_EMAILS } from "@/lib/governance";
import { EDITORIAL_ASSETS, FLAGSHIP_PROGRAM } from "@/lib/program-portfolio";

const WAITLIST_EMAIL = OFFICIAL_EMAILS.admissions;

const STATS = [
  { value: "4", label: "Professional learning pathways" },
  { value: "10", label: "Weeks in the flagship program" },
  { value: "Human", label: "Review for guided submissions" },
  { value: "Verified", label: "Completion before credentialing" },
];

const STANDARDS = [
  {
    icon: Layers3,
    title: "Structured learning",
    description: "Every pathway has a defined purpose, audience, delivery model, and completion standard.",
  },
  {
    icon: UsersRound,
    title: "Human-guided when promised",
    description: "Facilitator support is clearly separated from self-paced access so learners know what they are purchasing.",
  },
  {
    icon: FileCheck2,
    title: "Evidence before credentials",
    description: "Certificates and verified records depend on reviewed work and published completion requirements.",
  },
  {
    icon: ShieldCheck,
    title: "Honest institutional positioning",
    description: "Cognita is presented as a private professional training institute offering non-degree programs.",
  },
];

export default function Home() {
  return (
    <div className="apple-surface">
      <section className="relative overflow-hidden px-5 pb-20 pt-16 sm:px-6 md:pb-28 md:pt-24">
        <div className="absolute left-1/2 top-0 h-[34rem] w-[58rem] -translate-x-1/2 rounded-full bg-sky-400/[0.08] blur-[130px]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.94fr_1.06fr] lg:gap-16">
          <div>
            <BrandLockup size="md" className="mb-9 items-start" />

            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/15 bg-amber-200/[0.055] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-100/85">
              <Clock3 size={14} />
              Temporary launch announcement
            </div>

            <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-[1.02] tracking-[-0.055em] text-white sm:text-5xl md:text-7xl">
              Cognita Institute is currently
              <span className="block text-sky-300">under maintenance.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-7 text-slate-300/75 md:text-xl md:leading-8">
              We are refining the learning platform, admissions process, student portal, support systems, and public information before the next phase of access opens.
            </p>

            <div className="mt-8 rounded-2xl border border-white/[0.075] bg-white/[0.025] p-5">
              <p className="text-sm leading-7 text-slate-300/85">
                No automatic enrollment or payment is being processed while maintenance is ongoing. Join the waitlist to receive verified launch updates and early-access notices.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#waitlist" className="apple-button-primary gap-2 px-7 py-3.5 text-sm font-semibold">
                Join the waitlist
                <ArrowRight size={16} />
              </a>
              <a
                href={`mailto:${WAITLIST_EMAIL}?subject=Cognita%20Institute%20Inquiry`}
                className="apple-button-secondary gap-2 px-7 py-3.5 text-sm font-medium"
              >
                Email Cognita
                <Mail size={16} />
              </a>
            </div>
          </div>

          <div className="relative min-h-[30rem] overflow-hidden rounded-[2.4rem] border border-white/10 bg-slate-950 shadow-[0_48px_120px_rgba(0,0,0,0.42)] md:min-h-[38rem]">
            <img
              src={EDITORIAL_ASSETS.hero}
              alt="Cognita self-paced learner studying artificial intelligence on an HP laptop in a focused home learning environment."
              loading="eager"
              decoding="async"
              fetchPriority="high"
              referrerPolicy="no-referrer"
              className="absolute inset-0 h-full w-full object-cover"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#050914]/20 via-transparent to-black/10" aria-hidden="true" />
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#050914] via-[#050914]/30 to-transparent" aria-hidden="true" />

            <div className="absolute left-6 top-6 rounded-full border border-white/15 bg-[#050914]/66 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.17em] text-sky-100/85 backdrop-blur-xl md:left-8 md:top-8">
              Official Self-Paced Learning visual
            </div>

            <div className="absolute inset-x-5 bottom-5 rounded-[1.5rem] border border-white/12 bg-[#07101f]/82 p-5 shadow-2xl backdrop-blur-2xl md:inset-x-7 md:bottom-7 md:p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300/70">Cognita Open Learning</p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em] text-white md:text-2xl">Learn independently. Build with purpose.</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Structured self-paced lessons, practical exercises, and resources designed for flexible independent study.
              </p>
            </div>
          </div>
        </div>

        <div id="waitlist" className="apple-card relative mx-auto mt-12 max-w-5xl scroll-mt-32 p-6 md:p-9">
          <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <div>
              <p className="apple-eyebrow">Temporary manual intake</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em] text-white md:text-4xl">
                Be notified when Cognita is ready.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-400 md:text-base">
                Your waitlist submission will be delivered directly to the official Cognita Institute email for manual review.
              </p>
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-sky-300/10 bg-sky-300/[0.035] p-4">
                <ShieldCheck size={18} className="mt-0.5 flex-shrink-0 text-sky-300" />
                <p className="text-xs leading-6 text-slate-400">
                  Official contact: {WAITLIST_EMAIL}. Joining the waitlist is not an enrollment offer and does not require payment.
                </p>
              </div>
            </div>

            <form
              action={`https://formsubmit.co/${WAITLIST_EMAIL}`}
              method="POST"
              className="grid gap-4 sm:grid-cols-2"
            >
              <input type="hidden" name="_subject" value="New Cognita Institute Waitlist Submission" />
              <input type="hidden" name="_template" value="table" />
              <input type="hidden" name="_captcha" value="false" />
              <input type="hidden" name="source" value="Cognita landing page maintenance announcement" />

              <div>
                <label htmlFor="waitlist-name" className="mb-2 block text-xs font-medium text-slate-400">
                  Full name
                </label>
                <input
                  id="waitlist-name"
                  name="full_name"
                  type="text"
                  autoComplete="name"
                  required
                  placeholder="Your full name"
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.035] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-sky-300/45 focus:ring-2 focus:ring-sky-300/10"
                />
              </div>

              <div>
                <label htmlFor="waitlist-email" className="mb-2 block text-xs font-medium text-slate-400">
                  Email address
                </label>
                <input
                  id="waitlist-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.035] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-sky-300/45 focus:ring-2 focus:ring-sky-300/10"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="waitlist-interest" className="mb-2 block text-xs font-medium text-slate-400">
                  Primary interest
                </label>
                <select
                  id="waitlist-interest"
                  name="primary_interest"
                  required
                  defaultValue=""
                  className="h-12 w-full rounded-xl border border-white/10 bg-[#0a1324] px-4 text-sm text-white outline-none transition focus:border-sky-300/45 focus:ring-2 focus:ring-sky-300/10"
                >
                  <option value="" disabled>
                    Select your interest
                  </option>
                  <option value="Student or learner">Student or learner</option>
                  <option value="Working professional">Working professional</option>
                  <option value="School or organization">School or organization</option>
                  <option value="Teaching or facilitation">Teaching or facilitation</option>
                  <option value="General updates">General updates</option>
                </select>
              </div>

              <button type="submit" className="apple-button-primary h-12 w-full px-6 text-sm font-semibold sm:col-span-2">
                Submit to the Cognita waitlist
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="border-y border-white/[0.065] bg-white/[0.015]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px px-5 py-10 sm:px-6 md:grid-cols-4 md:py-14">
          {STATS.map((stat) => (
            <div key={stat.label} className="px-3 py-4 text-center md:px-6">
              <p className="text-2xl font-semibold tracking-[-0.04em] text-white md:text-3xl">{stat.value}</p>
              <p className="mt-2 text-xs leading-5 text-slate-500 md:text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <SchoolExperienceSection />

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-6 md:py-28">
        <div className="mx-auto mb-12 max-w-3xl text-center md:mb-16">
          <p className="apple-eyebrow">One institute, four pathways</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em] text-white md:text-5xl">
            Choose the level of structure and support you actually need.
          </h2>
          <p className="mt-5 text-base leading-7 text-slate-400 md:text-lg">
            The divisions are intentionally separated so self-paced access, guided training, assessment, and organizational delivery are never confused with one another.
          </p>
        </div>
        <ProgramPortfolio />
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-6 md:pb-28">
        <div className="apple-card grid gap-10 p-7 md:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:p-14">
          <div>
            <p className="apple-eyebrow">Flagship guided offering</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em] text-white md:text-5xl">
              {FLAGSHIP_PROGRAM.name}
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-300/75">
              {FLAGSHIP_PROGRAM.description}
            </p>
            <Link to="/program#flagship-program" className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-sky-300">
              View the complete curriculum
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Weeks 1–4", "AI Foundation", "Core concepts, responsible use, prompting, research, and workflow fundamentals."],
              ["Weeks 5–9", "Specialization", "Track-specific practical work with progressive outputs and facilitator review."],
              ["Week 10", "Capstone", "A final applied project that demonstrates the learner's ability to use AI professionally."],
              ["Completion", "Credential review", "Portfolio evidence and program requirements are checked before a Certificate of Completion is issued."],
            ].map(([period, title, description]) => (
              <div key={title} className="rounded-2xl border border-white/[0.075] bg-white/[0.025] p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300/70">{period}</p>
                <h3 className="mt-2 text-base font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/[0.065] bg-white/[0.012]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 md:py-28">
          <div className="mb-12 max-w-3xl">
            <p className="apple-eyebrow">The Cognita standard</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em] text-white md:text-5xl">
              Credibility comes from clear promises and consistent operations.
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {STANDARDS.map(({ icon: Icon, title, description }) => (
              <div key={title} className="apple-card p-6 md:p-8">
                <div className="apple-icon-tile">
                  <Icon size={25} className="text-sky-300" />
                </div>
                <h3 className="mt-6 text-xl font-semibold tracking-[-0.025em] text-white">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FounderPreview />

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-6 md:py-28">
        <div className="apple-card p-8 text-center md:p-16">
          <p className="apple-eyebrow">Cognita Admissions</p>
          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.045em] text-white md:text-5xl">
            Prepare for the next verified learning pathway.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-400">
            Cognita is collecting early-access and guided-program interest while final learner operations are being verified.
          </p>
          <a href="#waitlist" className="apple-button-primary mt-8 gap-2 px-7 py-3.5 text-sm font-semibold">
            Join the admissions waitlist
            <ArrowRight size={16} />
          </a>
        </div>
      </section>
    </div>
  );
}
