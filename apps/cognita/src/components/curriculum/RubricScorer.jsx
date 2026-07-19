import React from "react";
import { RUBRIC_CRITERIA, RUBRIC_SCORES } from "@/lib/curriculum";
import { getRubricRecommendation } from "@/lib/curriculum-utils";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

const REC_CONFIG = {
  "Passed": { icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/5", border: "border-emerald-500/20" },
  "Needs Revision": { icon: AlertTriangle, color: "text-orange-400", bg: "bg-orange-500/5", border: "border-orange-500/20" },
  "Failed": { icon: XCircle, color: "text-red-400", bg: "bg-red-500/5", border: "border-red-500/20" },
};

export default function RubricScorer({ scores, onChange }) {
  const recommendation = getRubricRecommendation(scores);
  const recConfig = recommendation ? REC_CONFIG[recommendation] : null;
  const RecIcon = recConfig?.icon;

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
        Rubric Scoring
      </p>
      <div className="space-y-3">
        {RUBRIC_CRITERIA.map(criterion => {
          const currentScore = scores?.[criterion.key];
          return (
            <div key={criterion.key} className="rounded-lg bg-secondary/30 border border-border/30 p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium">{criterion.label}</p>
                  <p className="text-[11px] text-muted-foreground">{criterion.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {RUBRIC_SCORES.map(score => {
                  const isActive = currentScore === score.value;
                  return (
                    <button
                      key={score.value}
                      type="button"
                      onClick={() => onChange({ ...scores, [criterion.key]: score.value })}
                      className={`flex-1 px-2 py-1.5 rounded-md text-[11px] font-medium border transition-all ${
                        isActive
                          ? `${score.color} border-current bg-current/10`
                          : "text-muted-foreground border-border/30 hover:border-border/60 hover:text-foreground"
                      }`}
                    >
                      <span className="block text-sm font-bold">{score.value}</span>
                      <span className="block text-[10px]">{score.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {recommendation && (
        <div className={`mt-3 flex items-center gap-2 p-3 rounded-lg ${recConfig.bg} border ${recConfig.border}`}>
          {RecIcon && <RecIcon size={16} className={recConfig.color} />}
          <span className={`text-sm font-medium ${recConfig.color}`}>
            Recommended: {recommendation}
          </span>
        </div>
      )}
    </div>
  );
}