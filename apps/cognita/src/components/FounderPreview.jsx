import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpenCheck,
  ClipboardList,
  Headphones,
  ShieldCheck,
} from "lucide-react";

const FOUNDER_IMAGE = "https://media.base44.com/images/public/6a4eddeaf17a430019587b35/3653ed958_IMG_7778.jpg";

const CORE_TEAM = [
  {
    icon: BookOpenCheck,
    role: "Academic Affairs",
    image: "https://platform-cs-jpn3.adobe.io/rendition/id/urn:aaid:sc:AP:c1a3db27-104b-4d95-968d-a523abc17ec7?size=1000",
    imageAlt: "Cognita Institute Academic Affairs employee portrait",
    responsibility: "Curriculum, lesson standards, facilitator coordination, and academic development.",
  },
  {
    icon: ShieldCheck,
    role: "Quality Assurance",
    image: "https://platform-cs-jpn3.adobe.io/rendition/id/urn:aaid:sc:AP:a7cbe345-a676-46af-af44-308e77b98eb1?size=1000",
    imageAlt: "Cognita Institute Quality Assurance employee portrait",
    responsibility: "Assessment controls, portfolio review, policy compliance, and standards protection.",
  },
  {
    icon: Headphones,
    role: "Learner Support",
    image: "https://platform-cs-jpn3.adobe.io/rendition/id/urn:aaid:sc:AP:0828cb0f-b8dd-463b-be3a-e1246c479e73?size=1000",
    imageAlt: "Cognita Institute Learner Support employee portrait",
    responsibility: "Onboarding, account assistance, learning concerns, and learner service follow-through.",
  },
  {
    icon: ClipboardList,
    role: "Admissions and Registrar",
    image: "https://platform-cs-jpn3.adobe.io/rendition/id/urn:aaid:sc:AP:ca4ae3da-3af9-46d4-8f75-a568d0509f1f?size=1000",
    imageAlt: "Cognita Institute Admissions and Registrar employee portrait",
    responsibility: "Applicant intake, enrollment coordination, learner records, and completion documentation.",
  },
];

export default function FounderPreview() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-12 sm:px-6 md:py-20">
      <div className="mb-10 text-center">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">Leadership and core operations</p>
        <h2 className="section-title text-2xl font-bold md:text-4xl">
          THE FOUNDER IS SUPPORTED BY A CORE OPERATING TEAM
        </h2>
        <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-slate-400 md:text-base">
          Cognita is structured around academic quality, learner support, admissions, records, and institutional accountability. Employee names will be added when officially provided for publication.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="card-glow overflow-hidden rounded-2xl">
          <div className="grid grid-cols-1 md:grid-cols-5 lg:grid-cols-1 xl:grid-cols-5">
            <div className="relative md:col-span-2 lg:col-span-1 xl:col-span-2">
              <div className="aspect-[4/5] overflow-hidden border-b border-cyan-500/10 md:h-full md:border-b-0 md:border-r lg:aspect-[16/10] lg:border-b lg:border-r-0 xl:aspect-auto xl:h-full xl:border-b-0 xl:border-r">
                <img
                  src={FOUNDER_IMAGE}
                  alt="Francine Marie Bautista"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
            <div className="flex flex-col justify-center p-6 md:col-span-3 md:p-8 lg:col-span-1 xl:col-span-3">
              <p className="mb-2 text-xs uppercase tracking-[0.3em] text-cyan-400">Founder · Institutional Lead</p>
              <h3 className="mb-3 text-xl font-bold md:text-2xl">Francine Marie Bautista</h3>
              <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                Cognita was founded by Francine Marie Bautista, a creative director, strategist, trainer, and AI learning designer who believes AI education should produce real skill, not empty certificates.
              </p>
              <Link
                to="/about"
                className="btn-glow inline-flex items-center gap-2 self-start rounded-lg px-6 py-3 text-sm font-semibold"
              >
                Learn More About Cognita
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {CORE_TEAM.map(({ icon: Icon, role, image, imageAlt, responsibility }) => (
            <article key={role} className="apple-card overflow-hidden">
              <div className="relative aspect-[4/3] overflow-hidden border-b border-white/[0.07] bg-[#07101f]">
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
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#07101f]/85 to-transparent" aria-hidden="true" />
                <div className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-[#050914]/70 text-sky-300 backdrop-blur-xl">
                  <Icon size={19} />
                </div>
              </div>
              <div className="p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300/65">Core operating team</p>
                <h3 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-white">{role}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{responsibility}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
