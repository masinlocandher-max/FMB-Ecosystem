import React, { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import BrandLockup from "@/components/BrandLockup";

export default function CognitaIntroTransition({ onComplete }) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const timer = window.setTimeout(() => onComplete?.(), reduceMotion ? 250 : 2600);
    return () => window.clearTimeout(timer);
  }, [onComplete, reduceMotion]);

  if (reduceMotion) {
    return <div className="min-h-screen bg-[#050914]" />;
  }

  return (
    <motion.div
      className="fixed inset-0 z-[100] overflow-hidden bg-[#020713] text-white"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.20),transparent_30%),linear-gradient(180deg,#020713_0%,#061326_58%,#020713_100%)]" />

      <motion.div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage: `
            radial-gradient(1px 1px at 8% 18%, rgba(255,255,255,0.95), transparent),
            radial-gradient(1px 1px at 21% 70%, rgba(56,189,248,0.95), transparent),
            radial-gradient(1.5px 1.5px at 36% 27%, rgba(255,255,255,0.85), transparent),
            radial-gradient(1px 1px at 53% 61%, rgba(125,211,252,0.90), transparent),
            radial-gradient(1.5px 1.5px at 69% 15%, rgba(255,255,255,0.82), transparent),
            radial-gradient(1px 1px at 84% 51%, rgba(56,189,248,0.92), transparent),
            radial-gradient(1px 1px at 94% 85%, rgba(255,255,255,0.82), transparent)
          `,
          backgroundSize: "230px 230px, 310px 310px, 390px 390px, 470px 470px, 550px 550px, 630px 630px, 710px 710px",
        }}
        animate={{ y: [0, -24], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 3.2, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-400/20"
        initial={{ scale: 0.72, opacity: 0 }}
        animate={{ scale: 1.12, opacity: [0, 0.75, 0] }}
        transition={{ duration: 2.4, ease: "easeOut" }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10"
        initial={{ scale: 0.55, rotate: -25, opacity: 0 }}
        animate={{ scale: 1.05, rotate: 18, opacity: [0, 0.55, 0] }}
        transition={{ duration: 2.2, delay: 0.15, ease: "easeOut" }}
      />

      <motion.div
        className="absolute inset-x-[-20%] top-1/2 h-px bg-gradient-to-r from-transparent via-sky-300 to-transparent shadow-[0_0_24px_rgba(56,189,248,0.9)]"
        initial={{ y: "-34vh", opacity: 0 }}
        animate={{ y: "34vh", opacity: [0, 1, 0] }}
        transition={{ duration: 1.55, delay: 0.25, ease: "easeInOut" }}
      />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20, scale: 0.94, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.9, delay: 0.25, ease: "easeOut" }}
        >
          <BrandLockup size="lg" />
          <motion.p
            className="mt-9 text-[10px] md:text-xs font-medium uppercase tracking-[0.34em] text-sky-100/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.15, duration: 0.6 }}
          >
            Entering the Cognita learning environment
          </motion.p>
        </motion.div>
      </div>

      <button
        type="button"
        onClick={() => onComplete?.()}
        className="absolute bottom-6 right-6 z-20 text-[10px] font-medium uppercase tracking-[0.22em] text-white/40 hover:text-white/80 transition-colors"
      >
        Skip intro
      </button>
    </motion.div>
  );
}
