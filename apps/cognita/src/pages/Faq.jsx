import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ_ITEMS = [
  {
    q: "What is Cognita Institute?",
    a: "Cognita Institute of Artificial Intelligence is a private professional training institute offering non-degree AI learning programs. Its services are organized into Open Learning, Professional Programs, Assessment and Credentialing, and Institutional Training.",
  },
  {
    q: "Where does the 10-week program belong?",
    a: "The 10-Week Professional AI Program is Cognita's flagship guided cohort offering under Cognita Professional Programs. It includes a fixed schedule, progressive weekly access, required outputs, facilitator review, revision guidance, portfolio development, and final completion review.",
  },
  {
    q: "What is Cognita Open Learning?",
    a: "Open Learning is the self-paced pathway. It is designed for learners who want structured lessons and resources without joining a fixed cohort. Human assessment and credentialing are separate unless a specific Open Learning package expressly includes them.",
  },
  {
    q: "What does Assessment and Credentialing do?",
    a: "This division reviews eligible work and completion evidence, maintains verified training records, and issues approved Certificates of Completion. Buying course access or attending sessions does not automatically produce a credential.",
  },
  {
    q: "What is Institutional Training?",
    a: "Institutional Training serves schools, companies, NGOs, LGUs, associations, and other organizations. Programs may use an existing Cognita curriculum or a scoped plan based on the participants, objectives, schedule, delivery format, and reporting needs.",
  },
  {
    q: "How do I apply to the 10-week program?",
    a: "Submit the Professional Programs application through the website. The Admissions Office reviews your background, goals, availability, preferred track, and ability to complete the weekly requirements before making an enrollment decision.",
  },
  {
    q: "Can I choose my specialization track?",
    a: "You may indicate a preferred track during application. Final placement depends on the active cohort, your goals and background, available facilitators, and program capacity.",
  },
  {
    q: "What happens when an output needs revision?",
    a: "For guided programs, the facilitator may provide feedback and revision instructions. The learner can resubmit within the applicable program rules. Unresolved or missing requirements may affect completion and credential eligibility.",
  },
  {
    q: "How are Certificates of Completion issued?",
    a: "Certificates are issued only after the required work and completion evidence are reviewed. A certificate is not automatic and does not represent a degree, diploma, college credit, CHED recognition, or TESDA registration unless Cognita later receives and clearly states the relevant authority.",
  },
  {
    q: "Can a Cognita credential be verified?",
    a: "Yes. Issued credentials use a unique serial number that can be checked through the public verification registry. The registry shows the official record and whether the credential remains valid.",
  },
  {
    q: "How much time does the 10-week program require?",
    a: "The current guided program expects learners to reserve regular weekly time for lessons, practical output creation, revisions, and portfolio work. The application form records availability so Cognita can assess whether the learner is ready for the commitment.",
  },
  {
    q: "Are refunds automatic?",
    a: "No. Payment, deferment, withdrawal, and refund conditions depend on the applicable enrollment agreement and the circumstances of the request. Learners should review the official terms before paying.",
  },
];

export default function Faq() {
  return (
    <div className="apple-surface min-h-screen px-5 pb-24 pt-24 sm:px-6 md:pt-32">
      <section className="mx-auto max-w-3xl">
        <p className="apple-eyebrow">Frequently asked questions</p>
        <h1 className="mt-5 text-4xl font-semibold leading-[1.03] tracking-[-0.055em] text-white sm:text-5xl md:text-7xl">
          Clear answers about how Cognita works.
        </h1>
        <p className="mt-7 text-base leading-8 text-slate-300/75 md:text-xl">
          These answers explain the four program pathways, the role of the 10-week flagship program, and the difference between learning access and formal credentialing.
        </p>
      </section>

      <section className="mx-auto mt-12 max-w-3xl">
        <Accordion type="single" collapsible className="space-y-3">
          {FAQ_ITEMS.map((item, index) => (
            <AccordionItem key={item.q} value={`item-${index}`} className="apple-card rounded-2xl px-5 md:px-6">
              <AccordionTrigger className="py-5 text-left text-sm font-semibold text-white hover:no-underline md:text-base">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-sm leading-7 text-slate-400">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="mx-auto mt-16 max-w-3xl text-center">
        <p className="text-base leading-7 text-slate-400">
          Questions about a specific program, institutional requirement, payment, or learner record should be sent through the appropriate Cognita office.
        </p>
        <Link to="/contact" className="apple-button-primary mt-7 gap-2 px-7 py-3.5 text-sm font-semibold">
          Contact Cognita
          <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}
