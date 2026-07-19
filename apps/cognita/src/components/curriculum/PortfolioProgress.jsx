import React from "react";
import { CheckCircle, Circle, FolderOpen } from "lucide-react";
import { PORTFOLIO_CATEGORIES } from "@/lib/curriculum";
import { getPortfolioByCategory, computePortfolioStatus } from "@/lib/curriculum-utils";
import StatusBadge from "@/components/dashboard/StatusBadge";

export default function PortfolioProgress({ submissions }) {
  const grouped = getPortfolioByCategory(submissions);
  const status = computePortfolioStatus(submissions);
  const completedCount = Object.values(grouped).flat().length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FolderOpen size={16} className="text-blue-400" />
          <p className="text-sm font-semibold">Portfolio Progress</p>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="space-y-2">
        {PORTFOLIO_CATEGORIES.map(category => {
          const items = grouped[category] || [];
          const isComplete = items.length > 0;
          return (
            <div
              key={category}
              className={`flex items-center justify-between p-2.5 rounded-lg border ${
                isComplete
                  ? "bg-emerald-500/5 border-emerald-500/15"
                  : "bg-secondary/20 border-border/20"
              }`}
            >
              <div className="flex items-center gap-2">
                {isComplete ? (
                  <CheckCircle size={14} className="text-emerald-400" />
                ) : (
                  <Circle size={14} className="text-muted-foreground" />
                )}
                <span className={`text-xs ${isComplete ? "text-foreground" : "text-muted-foreground"}`}>
                  {category}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground font-mono">
                {items.length > 0 ? `${items.length} item${items.length > 1 ? "s" : ""}` : "Missing"}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-muted-foreground mt-3 text-center">
        {completedCount} of {PORTFOLIO_CATEGORIES.length} categories complete
      </p>
    </div>
  );
}