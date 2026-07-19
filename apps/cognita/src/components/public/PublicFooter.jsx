import React from "react";
import { Link } from "react-router-dom";
import BrandLockup from "@/components/BrandLockup";
import { OFFICIAL_EMAILS } from "@/lib/governance";

const linkClass = "block text-sm text-slate-400 transition-colors hover:text-white";

export default function PublicFooter() {
  return (
    <footer className="border-t border-white/[0.07] bg-[#050914]">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 md:py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2">
            <BrandLockup size="sm" className="mb-5 items-start" />
            <p className="mt-4 max-w-sm text-sm leading-7 text-slate-500">
              A private professional AI training institute developing self-paced learning, guided professional programs, human-reviewed assessment and credentialing, and institutional training.
            </p>
            <p className="mt-4 max-w-sm text-xs leading-6 text-slate-600">
              Cognita offers non-degree professional training. Open Learning is being introduced in phases. A Certificate of Completion is never automatic and requires approved human review.
            </p>
            <a href={`mailto:${OFFICIAL_EMAILS.support}`} className="mt-4 inline-block text-xs text-sky-300/80 transition hover:text-sky-200">
              {OFFICIAL_EMAILS.support}
            </a>
          </div>

          <div>
            <h4 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">Institute</h4>
            <div className="space-y-3">
              <Link to="/about" className={linkClass}>About</Link>
              <Link to="/program" className={linkClass}>Programs</Link>
              <Link to="/tracks" className={linkClass}>Specialization Tracks</Link>
              <Link to="/faq" className={linkClass}>Frequently Asked Questions</Link>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">Pathways</h4>
            <div className="space-y-3">
              <Link to="/waitlist" className={linkClass}>Open Learning Early Access</Link>
              <Link to="/apply" className={linkClass}>Professional Programs</Link>
              <Link to="/verify" className={linkClass}>Credential Verification</Link>
              <Link to="/partner" className={linkClass}>Institutional Training</Link>
              <Link to="/login" className={linkClass}>Sign In</Link>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">Governance</h4>
            <div className="space-y-3">
              <Link to="/privacy" className={linkClass}>Privacy Policy</Link>
              <Link to="/terms" className={linkClass}>Terms of Use</Link>
              <Link to="/contact" className={linkClass}>Contact and Support</Link>
              <Link to="/teach" className={linkClass}>Teach with Cognita</Link>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/[0.065] pt-7 text-center text-xs text-slate-600 md:flex-row md:items-center md:justify-between md:text-left">
          <p>© {new Date().getFullYear()} Cognita Institute of Artificial Intelligence. All rights reserved.</p>
          <p>Professional training. Practical outputs. Human-reviewed completion.</p>
        </div>
      </div>
    </footer>
  );
}
