import React from "react";
import { Target, BookOpen, Lightbulb, FileText, ClipboardList, Award } from "lucide-react";

function Section({ icon: Icon, label, children }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon size={12} className="text-cyan-400" />
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      </div>
      <div className="text-sm text-foreground/80 leading-relaxed">{children}</div>
    </div>
  );
}

export default function LessonDetail({ lesson }) {
  return (
    <div className="space-y-5">
      {/* Learning Objective */}
      <Section icon={Target} label="Learning Objective">
        {lesson.learningObjective}
      </Section>

      {/* Lesson Overview */}
      <Section icon={BookOpen} label="Lesson Overview">
        {lesson.lessonOverview}
      </Section>

      {/* Core Concepts */}
      {lesson.coreConcepts?.length > 0 && (
        <Section icon={Lightbulb} label="Core Concepts">
          <div className="flex flex-wrap gap-2 mt-1">
            {lesson.coreConcepts.map((concept, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-md bg-cyan-500/5 border border-cyan-500/15 text-xs text-foreground/80"
              >
                {concept}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Practical Activity */}
      <Section icon={ClipboardList} label="Practical Activity">
        {lesson.practicalActivity}
      </Section>

      {/* Required Output */}
      <div className="p-4 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
        <div className="flex items-center gap-1.5 mb-1.5">
          <FileText size={12} className="text-cyan-400" />
          <p className="text-[10px] font-semibold uppercase tracking-widest text-cyan-400">Required Output</p>
        </div>
        <p className="text-sm font-medium mb-2">{lesson.requiredOutput}</p>
        <div className="text-sm text-foreground/70 whitespace-pre-wrap leading-relaxed">
          {lesson.submissionInstructions}
        </div>
      </div>

      {/* Rubric */}
      <div className="p-4 rounded-lg bg-secondary/30 border border-border/30">
        <div className="flex items-center gap-1.5 mb-3">
          <Award size={12} className="text-amber-400" />
          <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-400">Rubric</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mt-0.5">PASS</span>
            <p className="text-xs text-foreground/80 leading-relaxed">{lesson.rubric.pass}</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 mt-0.5">REVISE</span>
            <p className="text-xs text-foreground/80 leading-relaxed">{lesson.rubric.needsRevision}</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 mt-0.5">FAIL</span>
            <p className="text-xs text-foreground/80 leading-relaxed">{lesson.rubric.failed}</p>
          </div>
        </div>
      </div>

      {/* Portfolio Connection */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium">Portfolio Category:</span>
        <span className="px-2 py-0.5 rounded-md bg-blue-500/5 border border-blue-500/15 text-blue-400">
          {lesson.portfolioCategory}
        </span>
      </div>
    </div>
  );
}