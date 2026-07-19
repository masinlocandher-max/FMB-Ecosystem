import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  Building2,
  GraduationCap,
  Headphones,
  Landmark,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";

const FOUNDER_IMAGE =
  "https://media.base44.com/images/public/6a4eddeaf17a430019587b35/3653ed958_IMG_7778.jpg";

const ORGANIZATION_VISUAL =
  "https://platform-cs-jpn3.adobe.io/rendition/id/urn:aaid:sc:AP:7f7c4b19-b3b0-46af-bd17-35f1a47a0949?size=1800";

const CORE_TEAM = [
  {
    icon: GraduationCap,
    title: "Academic Affairs",
    image: "https://platform-cs-jpn3.adobe.io/rendition/id/urn:aaid:sc:AP:c1a3db27-104b-4d95-968d-a523abc17ec7?size=1000",
    imageAlt: "Cognita Institute Academic Affairs employee portrait",
    description: "Curriculum development, lesson quality, facilitator coordination, and academic standards.",
  },
  {
    icon: ShieldCheck,
    title: "Quality Assurance",
    image: "https://platform-cs-jpn3.adobe.io/rendition/id/urn:aaid:sc:AP:a7cbe345-a676-46af-af44-308e77b98eb1?size=1000",
    imageAlt: "Cognita Institute Quality Assurance employee portrait",
    description: "Human review controls, portfolio checks, credential protection, and policy compliance.",
  },
  {
    icon: Headphones,
    title: "Learner Support",
    image: "https://platform-cs-jpn3.adobe.io/rendition/id/urn:aaid:sc:AP:0828cb0f-b8dd-463b-be3a-e1246c479e73?size=1000",
    imageAlt: "Cognita Institute Learner Support employee portrait",
    description: "Student onboarding, account assistance, learning concerns, and service follow-through.",
  },
  {
    icon: BookOpenCheck,
    title: "Admissions and Registrar",
    image: "https://platform-cs-jpn3.adobe.io/rendition/id/urn:aaid:sc:AP:ca4ae3da-3af9-46d4-8f75-a568d0509f1f?size=1000",
    imageAlt: "Cognita Institute Admissions and Registrar employee portrait",
    description: "Applications, enrollment coordination, learner status, records, and completion documents.",
  },
];

const OFFICES = [
  {
    icon: Landmark,
    title: "Office of the Founder",
    description:
      "Institutional direction, academic standards, brand governance, partnerships, and final accountability.",
  },
  {
    icon: GraduationCap,
    title: "Academic Affairs",
    description:
      "Curriculum design, lesson quality, learning standards, facilitator coordination, and academic review.",
  },
  {
    icon: BookOpenCheck,
    title: "Admissions and Registrar",
    description:
      "Applications, enrollment records, learner status, completion documentation, and official credentials.",
  },
  {
    icon: Headphones,
    title: "Learner Support",
    description:
      "Student onboarding, account support, learning assistance, concerns, and service follow-through.",
  },
  {
    icon: ShieldCheck,
    title: "Assessment and Quality Assurance",
    description:
      "Human review, portfolio audits, credential controls, policy compliance, and standards protection.",
  },
  {
    icon: Building2,
    title: "Institutional Partnerships",
    description:
      "Customized training for schools, companies, NGOs, government offices, and professional teams.",
  },
];

export default function Organization() {
  return (
    <div className="apple-surface">
      <section className="relative overflow-hidden px-5 pb-16 pt-24 sm:px-6 md:pb-24 md:pt-32">
        <div className="absolute left-1/2 top-0 h-[30rem] w-[58rem] -translate-x-1/2 rounded-full bg-sky-400/[0.075] blur-[135px]" />
        <div className="relative mx-auto max-w-7xl">
          <p className="apple-eyebrow">Leadership and organization</p>
          <h1 className="mt-5 max-w-5xl text-4xl font-semibold leading-[1.03] tracking-[-0.055em] text-white sm:text-5xl md:text-7xl">
            A school needs visible responsibility, not just a list of courses.
          </h1>
          <p className="mt-7 max-w-3xl text-base leading-8 text-slate-300/75 md:text-xl">
            Cognita is organized around the complete learner journey: admissions, academic delivery, support, assessment, records, and institutional accountability.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-12 sm:px-6 md:pb-16">
        <div className="apple-card overflow-hidden">
          <div className="grid lg:grid-cols-[0.78fr_1.22fr]">
            <div className="relative min-h-[28rem] overflow-hidden border-b border-white/[0.07] lg:border-b-0 lg:border-r">
              <img
                src={FOUNDER_IMAGE}
                alt="Francine Marie Bautista, founder of Cognita Institute of Artificial Intelligence"
                className="absolute inset-0 h-full w-full object-cover"
                loading="eager"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050914] via-transparent to-transparent" />
              <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-white/10 bg-[#050914]/78 p-5 backdrop-blur-xl">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300/75">Founder and institutional lead</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Francine Marie Bautista</h2>
                <p className="mt-1 text-sm text-slate-400">Creative Director · Strategist · Trainer · AI Learning Designer</p>
              </div>
            </div>

            <div className="flex flex-col justify-center p-7 md:p-10 lg:p-14">
              <div className="apple-icon-tile">
                <BadgeCheck size={25} className="text-sky-300" />
              </div>
              <p className="apple-eyebrow mt-7">Institutional leadership</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em] text-white md:text-5xl">
                The founder remains publicly accountable, supported by four core operating functions.
              </h2>
              <p className="mt-6 text-base leading-8 text-slate-400">
                Cognita is being built as a private professional training institute with clear academic, learner-support, admissions, records, assessment, and quality-control responsibilities.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/about" className="apple-button-secondary gap-2 px-6 py-3 text-sm font-medium">
                  About Cognita
                  <ArrowRight size={15} />
                </Link>
                <Link to="/teach" className="apple-button-primary gap-2 px-6 py-3 text-sm font-semibold">
                  Join the academic team
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-6 md:pb-28">
        <div className="mb-9 flex max-w-3xl items-start gap-4">
          <div className="apple-icon-tile flex-shrink-0">
            <UserRoundCheck size={24} className="text-sky-300" />
          </div>
          <div>
            <p className="apple-eyebrow">Core operating team</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-white md:text-4xl">
              Four key employee functions stand beside the founder.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-400 md:text-base">
              Official portraits are now assigned to Academic Affairs, Quality Assurance, Learner Support, and Admissions and Registrar. Employee names can be added once supplied for publication.
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CORE_TEAM.map(({ icon: Icon, image, imageAlt, title, description }) => (
            <article key={title} className="apple-card overflow-hidden">
              <div className="relative aspect-[4/5] overflow-hidden border-b border-white/[0.07] bg-[#07101f]">
                <img
                  src={image}
                  alt={imageAlt}
                  className="h-full w-full object-cover object-top"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
                <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#07101f]/90 to-transparent" aria-hidden="true" />
                <div className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-[#050914]/70 text-sky-300 backdrop-blur-xl">
                  <Icon size={20} />
                </div>
              </div>
              <div className="p-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-sky-300/65">Core operating team</p>
                <h3 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/[0.065] bg-white/[0.012]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 md:py-28">
          <div className="mb-10 max-w-3xl">
            <p className="apple-eyebrow">Cognita organization</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em] text-white md:text-5xl">
              The approved organization visual is part of the website.
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-400">
              This visual presents the working organizational direction and portrait system. It is not used as proof of legal employment or appointment.
            </p>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[#07101f] shadow-[0_40px_100px_rgba(0,0,0,0.35)]">
            <img
              src={ORGANIZATION_VISUAL}
              alt="Cognita Institute organizational team webpage visual"
              className="h-auto w-full"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-6 md:py-28">
        <div className="mb-12 max-w-3xl">
          <p className="apple-eyebrow">School offices</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em] text-white md:text-5xl">
            Every learner should know which office is responsible.
          </h2>
          <p className="mt-5 text-base leading-7 text-slate-400">
            The website presents Cognita through recognizable school functions rather than as a generic technology company.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {OFFICES.map(({ icon: Icon, title, description }) => (
            <article key={title} className="apple-card p-6 md:p-8">
              <div className="apple-icon-tile">
                <Icon size={24} className="text-sky-300" />
              </div>
              <h3 className="mt-6 text-xl font-semibold tracking-[-0.025em] text-white">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-400">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-white/[0.065]">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-5 py-16 sm:px-6 md:flex-row md:items-center md:py-20">
          <div>
            <p className="apple-eyebrow">Admissions and student services</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-white md:text-3xl">
              Explore the school before joining a launch pathway.
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/program" className="apple-button-secondary gap-2 px-6 py-3 text-sm font-medium">
              View programs
              <ArrowRight size={15} />
            </Link>
            <Link to="/apply" className="apple-button-primary gap-2 px-6 py-3 text-sm font-semibold">
              Admissions waitlist
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
