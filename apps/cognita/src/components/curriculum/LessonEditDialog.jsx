import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Save, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

export default function LessonEditDialog({ week, existingOverride, onClose, onSaved }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (existingOverride) {
      setForm({
        title: existingOverride.title || "",
        learning_objective: existingOverride.learning_objective || "",
        lesson_overview: existingOverride.lesson_overview || "",
        required_output: existingOverride.required_output || "",
        submission_instructions: existingOverride.submission_instructions || "",
        rubric_pass: existingOverride.rubric_pass || "",
        rubric_needs_revision: existingOverride.rubric_needs_revision || "",
        rubric_failed: existingOverride.rubric_failed || "",
        is_locked: existingOverride.is_locked || false,
      });
    } else {
      setForm({
        title: week.title,
        learning_objective: week.learningObjective,
        lesson_overview: week.lessonOverview,
        required_output: week.requiredOutput,
        submission_instructions: week.submissionInstructions,
        rubric_pass: week.rubric.pass,
        rubric_needs_revision: week.rubric.needsRevision,
        rubric_failed: week.rubric.failed,
        is_locked: false,
      });
    }
  }, [week, existingOverride]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        week_number: week.week,
        track: week.track || null,
        phase: week.phase,
        title: form.title,
        learning_objective: form.learning_objective,
        lesson_overview: form.lesson_overview,
        required_output: form.required_output,
        submission_instructions: form.submission_instructions,
        rubric_pass: form.rubric_pass,
        rubric_needs_revision: form.rubric_needs_revision,
        rubric_failed: form.rubric_failed,
        portfolio_category: week.portfolioCategory,
        is_locked: form.is_locked,
      };

      if (existingOverride) {
        await base44.entities.Lesson.update(existingOverride.id, data);
      } else {
        await base44.entities.Lesson.create(data);
      }

      toast({ title: "Lesson saved" });
      onSaved();
    } catch (err) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  if (!form) return <div className="flex items-center justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" size={20} /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/30 border border-border/30">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{week.phase}</span>
        <span className="text-[10px] font-mono text-muted-foreground">Week {week.week}</span>
        {week.track && <span className="text-[10px] text-blue-400">{week.track}</span>}
      </div>

      <div>
        <Label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">Title</Label>
        <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="bg-secondary border-border text-sm" />
      </div>

      <div>
        <Label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">Learning Objective</Label>
        <Textarea value={form.learning_objective} onChange={e => setForm({ ...form, learning_objective: e.target.value })} rows={2} className="bg-secondary border-border text-sm" />
      </div>

      <div>
        <Label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">Lesson Overview</Label>
        <Textarea value={form.lesson_overview} onChange={e => setForm({ ...form, lesson_overview: e.target.value })} rows={3} className="bg-secondary border-border text-sm" />
      </div>

      <div>
        <Label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">Required Output</Label>
        <Input value={form.required_output} onChange={e => setForm({ ...form, required_output: e.target.value })} className="bg-secondary border-border text-sm" />
      </div>

      <div>
        <Label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">Submission Instructions</Label>
        <Textarea value={form.submission_instructions} onChange={e => setForm({ ...form, submission_instructions: e.target.value })} rows={4} className="bg-secondary border-border text-sm" />
      </div>

      <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-400 mb-3">Rubric</p>
        <div className="space-y-3">
          <div>
            <Label className="text-[10px] text-emerald-400 mb-1 block">Pass Criteria</Label>
            <Textarea value={form.rubric_pass} onChange={e => setForm({ ...form, rubric_pass: e.target.value })} rows={2} className="bg-secondary border-border text-sm" />
          </div>
          <div>
            <Label className="text-[10px] text-orange-400 mb-1 block">Needs Revision Criteria</Label>
            <Textarea value={form.rubric_needs_revision} onChange={e => setForm({ ...form, rubric_needs_revision: e.target.value })} rows={2} className="bg-secondary border-border text-sm" />
          </div>
          <div>
            <Label className="text-[10px] text-red-400 mb-1 block">Failed Criteria</Label>
            <Textarea value={form.rubric_failed} onChange={e => setForm({ ...form, rubric_failed: e.target.value })} rows={2} className="bg-secondary border-border text-sm" />
          </div>
        </div>
      </div>

      {/* Lock toggle */}
      <label className="flex items-center gap-2.5 cursor-pointer p-3 rounded-lg border border-border/30 bg-secondary/20">
        <button
          type="button"
          onClick={() => setForm({ ...form, is_locked: !form.is_locked })}
          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
            form.is_locked ? "bg-red-500/20 border-red-500/40" : "bg-secondary border-border/50"
          }`}
        >
          {form.is_locked ? <Lock size={12} className="text-red-400" /> : <Unlock size={12} className="text-muted-foreground" />}
        </button>
        <span className="text-sm">{form.is_locked ? "Lesson is locked" : "Lesson is unlocked"}</span>
      </label>

      <div className="flex items-center gap-2 pt-2">
        <Button onClick={handleSave} disabled={saving} className="bg-cyan-500 text-black hover:bg-cyan-400">
          {saving ? <Loader2 size={14} className="animate-spin mr-2" /> : <Save size={14} className="mr-2" />}
          Save Lesson
        </Button>
        <Button onClick={onClose} variant="outline" className="border-border">Cancel</Button>
      </div>
    </div>
  );
}