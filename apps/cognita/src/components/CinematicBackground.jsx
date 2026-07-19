import React from "react";

export default function CinematicBackground({ children, className = "", grid = true }) {
  return (
    <div className={`relative isolate overflow-hidden bg-[#050914] ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_14%,rgba(14,116,144,0.13),transparent_30%),linear-gradient(180deg,#050914_0%,#08101f_100%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/50 to-transparent" />
      <div className="absolute left-1/2 top-[20%] h-[30rem] w-[30rem] -translate-x-1/2 rounded-full border border-sky-400/10" aria-hidden="true" />
      <div className="absolute left-1/2 top-[27%] h-[20rem] w-[20rem] -translate-x-1/2 rounded-full border border-slate-400/5" aria-hidden="true" />

      {grid && (
        <div
          className="absolute inset-0 pointer-events-none opacity-45"
          style={{
            backgroundImage: `
              linear-gradient(rgba(148,163,184,0.035) 1px, transparent 1px),
              linear-gradient(90deg, rgba(148,163,184,0.035) 1px, transparent 1px)
            `,
            backgroundSize: "72px 72px",
            maskImage: "linear-gradient(to bottom, black, transparent 90%)",
            WebkitMaskImage: "linear-gradient(to bottom, black, transparent 90%)",
          }}
        />
      )}

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-sky-500/5 to-transparent" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
