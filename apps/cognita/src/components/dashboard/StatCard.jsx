import React from "react";

export default function StatCard({ label, value, icon: Icon, accent = "text-cyan-400" }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 md:p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] md:text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
        {Icon && <Icon size={16} className={accent} />}
      </div>
      <p className="text-xl md:text-2xl font-heading font-bold">{value}</p>
    </div>
  );
}