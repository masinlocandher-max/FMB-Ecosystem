import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import BrandLockup from "@/components/BrandLockup";
import CinematicBackground from "@/components/CinematicBackground";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  const reduceMotion = useReducedMotion();

  return (
    <CinematicBackground className="min-h-screen flex items-center justify-center px-4 py-20" grid>
      <motion.div
        className="w-full max-w-md"
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: "easeOut" }}
      >
        <div className="text-center mb-8">
          <BrandLockup size="md" className="mb-8" />
          {Icon && (
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-sky-400/20 bg-sky-400/10">
              <Icon size={18} className="text-sky-300" />
            </div>
          )}
          <h1 className="text-2xl font-heading font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-2 text-sm">{subtitle}</p>}
        </div>
        <div className="corporate-panel rounded-xl p-6 md:p-8">
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
        )}
      </motion.div>
    </CinematicBackground>
  );
}
