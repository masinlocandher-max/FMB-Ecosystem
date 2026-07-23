import React from "react";

const SIZES = {
  sm: {
    title: "text-lg",
    subtitle: "text-[7px]",
    dot: "h-1.5 w-1.5 -top-1.5",
    subtitleMargin: "mt-1.5",
  },
  md: {
    title: "text-2xl md:text-3xl",
    subtitle: "text-[8px] md:text-[9px]",
    dot: "h-2 w-2 -top-2",
    subtitleMargin: "mt-2",
  },
  lg: {
    title: "text-4xl md:text-6xl lg:text-7xl",
    subtitle: "text-[10px] md:text-xs",
    dot: "h-3 w-3 -top-3 md:h-3.5 md:w-3.5 md:-top-4",
    subtitleMargin: "mt-3 md:mt-4",
  },
};

export default function BrandLockup({ size = "md", className = "" }) {
  const selectedSize = SIZES[size] || SIZES.md;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div
        className={`relative whitespace-nowrap font-display font-normal uppercase leading-none text-white ${selectedSize.title}`}
        style={{ letterSpacing: "0.22em", paddingLeft: "0.22em" }}
        aria-label="Cognita"
      >
        COGN
        <span className="relative inline-block">
          <span
            className={`absolute left-1/2 -translate-x-1/2 rounded-full bg-sky-300 ${selectedSize.dot}`}
            style={{
              boxShadow: "0 0 7px rgba(125,211,252,1), 0 0 18px rgba(56,189,248,0.8), 0 0 34px rgba(14,165,233,0.4)",
            }}
            aria-hidden="true"
          />
          <span
            className="absolute left-1/2 top-[-1.15em] h-[0.9em] w-px -translate-x-1/2 bg-gradient-to-t from-sky-300/70 to-transparent"
            aria-hidden="true"
          />
          I
        </span>
        TA
      </div>

      <p
        className={`font-display font-normal uppercase text-white/65 ${selectedSize.subtitle} ${selectedSize.subtitleMargin}`}
        style={{ letterSpacing: "0.58em", paddingLeft: "0.58em" }}
      >
        Knowledge &amp; Learning
      </p>
    </div>
  );
}
