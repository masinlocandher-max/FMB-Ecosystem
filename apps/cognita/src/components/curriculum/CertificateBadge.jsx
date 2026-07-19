import React from "react";
import { ShieldCheck, ShieldAlert, Clock, Award } from "lucide-react";

const CONFIG = {
  "Not Eligible": { icon: ShieldAlert, color: "text-gray-400", bg: "bg-gray-500/5", border: "border-gray-500/20" },
  "In Progress": { icon: Clock, color: "text-blue-400", bg: "bg-blue-500/5", border: "border-blue-500/20" },
  "Ready for Review": { icon: ShieldCheck, color: "text-amber-400", bg: "bg-amber-500/5", border: "border-amber-500/20" },
  "Approved": { icon: ShieldCheck, color: "text-emerald-400", bg: "bg-emerald-500/5", border: "border-emerald-500/20" },
  "Issued": { icon: Award, color: "text-amber-400", bg: "bg-amber-500/5", border: "border-amber-500/20" },
};

export default function CertificateBadge({ status, size = "default" }) {
  const config = CONFIG[status] || CONFIG["Not Eligible"];
  const Icon = config.icon;
  const padding = size === "lg" ? "p-5" : "p-3";
  const iconSize = size === "lg" ? 28 : 16;
  const textSize = size === "lg" ? "text-base" : "text-xs";

  return (
    <div className={`inline-flex items-center gap-2 ${padding} rounded-lg ${config.bg} border ${config.border}`}>
      <Icon size={iconSize} className={config.color} />
      <span className={`${textSize} font-medium ${config.color}`}>{status}</span>
    </div>
  );
}