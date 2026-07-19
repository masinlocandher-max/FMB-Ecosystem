import React from "react";
import QRCode from "@/components/QRCode";
import { getVerificationUrl } from "@/lib/business-utils";
import { OFFICIAL_CREDENTIAL_TITLE } from "@/lib/governance";

export default function CertificateTemplate({ certificate, preview = false }) {
  if (!certificate) return null;

  const verificationUrl = getVerificationUrl(certificate.serial_number);
  const title = certificate.title || OFFICIAL_CREDENTIAL_TITLE;

  return (
    <div className="mx-auto w-full max-w-[800px]">
      <div className="relative overflow-hidden rounded-lg border-2 border-cyan-500/30 bg-[#0a1628] p-6 md:p-10">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(0,174,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,174,255,0.5) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="absolute left-3 top-3 h-8 w-8 border-l-2 border-t-2 border-cyan-400/40" />
        <div className="absolute right-3 top-3 h-8 w-8 border-r-2 border-t-2 border-cyan-400/40" />
        <div className="absolute bottom-3 left-3 h-8 w-8 border-b-2 border-l-2 border-cyan-400/40" />
        <div className="absolute bottom-3 right-3 h-8 w-8 border-b-2 border-r-2 border-cyan-400/40" />
        <div className="absolute inset-4 rounded border border-cyan-500/15" />

        <div className="relative text-center">
          <div className="mb-1">
            <p className="text-[10px] font-semibold tracking-[0.3em] text-cyan-400/80 md:text-xs">COGNITA</p>
            <p className="text-[9px] tracking-[0.2em] text-white/40 md:text-[10px]">INSTITUTE OF ARTIFICIAL INTELLIGENCE</p>
          </div>

          <div className="mx-auto my-3 h-px w-24 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent md:w-32" />

          <h1 className="mb-1 text-sm font-bold tracking-wide text-white md:text-lg">{title}</h1>
          {preview && <p className="mb-3 text-[9px] italic text-amber-400/60">PREVIEW</p>}

          <p className="mb-2 mt-4 text-[10px] uppercase tracking-widest text-white/40 md:text-xs">This certificate is awarded to</p>
          <h2 className="mb-1 text-xl font-bold text-white md:text-3xl">{certificate.student_name}</h2>

          <div className="mx-auto my-3 h-px w-32 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent md:w-48" />

          <p className="mx-auto mb-5 max-w-md text-[10px] leading-relaxed text-white/50 md:text-xs">
            for completing the required learning work, revisions, capstone evidence, and human-reviewed portfolio requirements of the Cognita 10-Week Professional AI Program.
          </p>

          <div className="mx-auto mb-5 grid max-w-md grid-cols-3 gap-2 md:gap-6">
            <div>
              <p className="mb-1 text-[8px] uppercase tracking-widest text-cyan-400/60 md:text-[9px]">Track</p>
              <p className="text-[10px] font-medium leading-tight text-white/90 md:text-xs">{certificate.track}</p>
            </div>
            <div>
              <p className="mb-1 text-[8px] uppercase tracking-widest text-cyan-400/60 md:text-[9px]">Batch</p>
              <p className="text-[10px] font-medium leading-tight text-white/90 md:text-xs">{certificate.batch_name}</p>
            </div>
            <div>
              <p className="mb-1 text-[8px] uppercase tracking-widest text-cyan-400/60 md:text-[9px]">Issued</p>
              <p className="text-[10px] font-medium leading-tight text-white/90 md:text-xs">{certificate.issued_date}</p>
            </div>
          </div>

          <div className="mb-5 flex items-center justify-center gap-4 md:gap-6">
            <div className="text-left">
              <p className="mb-1 text-[8px] uppercase tracking-widest text-cyan-400/60 md:text-[9px]">Serial Number</p>
              <p className="font-mono text-[10px] font-bold tracking-wider text-white md:text-xs">{certificate.serial_number}</p>
            </div>
            <div className="rounded bg-white p-1.5"><QRCode data={verificationUrl} size={72} /></div>
          </div>

          <div className="mx-auto max-w-xs border-t border-cyan-500/15 pt-4">
            <p className="mb-1 text-[11px] font-medium italic text-white md:text-sm">Francine Marie Bautista</p>
            <p className="text-[8px] uppercase tracking-widest text-cyan-400/60 md:text-[9px]">Founder and Pioneer Trainer</p>
          </div>

          <div className="mx-auto mt-4 max-w-sm">
            <p className="text-[8px] italic leading-relaxed text-white/30 md:text-[9px]">
              {certificate.verification_note || "This Certificate of Completion was issued after human review of required work and portfolio evidence. It is not a degree, diploma, academic credit, or attendance-only certificate."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
