import React from "react";
import { Link } from "react-router-dom";
import { Lock, ChevronRight, CheckCircle, AlertCircle } from "lucide-react";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { getWeekStatus } from "@/lib/curriculum-utils";

const PHASE_STYLES = {
  "AI Foundation": "border-cyan-500/20",
  "Specialization Track": "border-blue-500/20",
  "Final Review": "border-amber-500/20",
};

export default function WeekCard({ week, submissions, student, track, basePath = "/student/lesson" }) {
  const status = getWeekStatus(week.week, submissions);
  const isLocked = status === "Locked";
  const isPassed = status === "Passed";
  const needsRevision = status === "Needs Revision";

  return (
    <div
      className={`rounded-xl border bg-card p-4 md:p-5 transition-all ${
        isLocked ? "opacity-50 border-border/30" : `${PHASE_STYLES[week.phase] || "border-border/50"} hover:border-cyan-500/30`
      }`}
    >
      <div className="flex items-start gap-3 md:gap-4">
        {/* Week number */}
        <div className={`flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center border ${
          isPassed
            ? "bg-emerald-500/10 border-emerald-500/30"
            : isLocked
            ? "bg-secondary border-border/30"
            : "bg-cyan-500/10 border-cyan-500/30"
        }`}>
          {isLocked ? (
            <Lock size={16} className="text-muted-foreground" />
          ) : isPassed ? (
            <CheckCircle size={18} className="text-emerald-400" />
          ) : (
            <span className="text-sm md:text-base font-mono font-bold">{String(week.week).padStart(2, "0")}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full border border-border/50 bg-secondary/30 text-muted-foreground">
              {week.phase}
            </span>
            {week.track && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400">
                {week.track}
              </span>
            )}
            <StatusBadge status={status} />
          </div>

          <h3 className="text-sm md:text-base font-heading font-semibold mb-1">{week.title}</h3>
          <p className="text-xs text-muted-foreground mb-2">
            <span className="font-medium text-foreground/70">Required Output:</span> {week.requiredOutput}
          </p>

          {needsRevision && (
            <div className="flex items-start gap-1.5 mt-2 p-2 rounded-lg bg-orange-500/5 border border-orange-500/20">
              <AlertCircle size={12} className="text-orange-400 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-orange-400">Revision requested — check feedback and resubmit.</p>
            </div>
          )}

          {/* Open lesson button */}
          {!isLocked && (
            <Link
              to={`${basePath}/${week.week}`}
              className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Open Lesson <ChevronRight size={14} />
            </Link>
          )}
          {isLocked && (
            <p className="inline-flex items-center gap-1 mt-3 text-xs text-muted-foreground">
              <Lock size={12} /> Complete previous week to unlock
            </p>
          )}
        </div>
      </div>
    </div>
  );
}