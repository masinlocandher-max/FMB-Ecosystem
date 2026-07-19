import React from "react";

const MESSAGE =
  "Maintenance is currently ongoing • Cognita Institute is being carefully updated • Join the waitlist for launch news and early access";

function MessageGroup() {
  return (
    <div className="flex shrink-0 items-center gap-8 pr-8" aria-hidden="true">
      {[0, 1, 2].map((item) => (
        <span
          key={item}
          className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-50/90 sm:text-[11px]"
        >
          {MESSAGE}
        </span>
      ))}
    </div>
  );
}

export default function MaintenanceTicker() {
  return (
    <div
      className="relative h-8 overflow-hidden border-b border-sky-300/10 bg-sky-400/[0.09]"
      role="status"
      aria-label={MESSAGE}
    >
      <div className="cognita-maintenance-track flex h-full w-max items-center">
        <MessageGroup />
        <MessageGroup />
      </div>

      <style>{`
        .cognita-maintenance-track {
          animation: cognita-marquee-right 30s linear infinite;
          will-change: transform;
        }

        @keyframes cognita-marquee-right {
          from {
            transform: translate3d(-50%, 0, 0);
          }
          to {
            transform: translate3d(0, 0, 0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .cognita-maintenance-track {
            animation: none;
            transform: translate3d(0, 0, 0);
          }
        }
      `}</style>
    </div>
  );
}
