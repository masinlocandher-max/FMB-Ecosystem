import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Plus, Trash2, HelpCircle, Edit2 } from "lucide-react";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import EmptyState from "@/components/curriculum/EmptyState";
import { ACTIVE_TRACKS } from "@/lib/curriculum";

export default function AdminQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ week_number: 1, track: "", title: "", description: "", passing_score_percent: 70, questions: [{ question_text: "", options: ["", "", "", ""], correct_answer_index: 0, explanation: "" }] });
  const { toast } = useToast();

  const load = async () => {
    const data = await base44.entities.Quiz.list("-created_date", 100);
    setQuizzes(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ week_number: 1, track: "", title: "", description: "", passing_score_percent: 70, questions: [{ question_text: "", options: ["", "", "", ""], correct_answer_index: 0, explanation: "" }] });
    setOpen(true);
  };

  const openEdit = (quiz) => {
    setEditing(quiz);
    setForm({
      week_number: quiz.week_number,
      track: quiz.track || "",
      title: quiz.title,
      description: quiz.description || "",
      passing_score_percent: quiz.passing_score_percent || 70,
      questions: quiz.questions || [],
    });
    setOpen(true);
  };

  const updateQuestion = (idx, field, value) => {
    setForm(f => ({
      ...f,
      questions: f.questions.map((q, i) => i === idx ? { ...q, [field]: value } : q),
    }));
  };

  const updateOption = (qIdx, optIdx, value) => {
    setForm(f => ({
      ...f,
      questions: f.questions.map((q, i) => i === qIdx ? { ...q, options: q.options.map((o, j) => j === optIdx ? value : o) } : q),
    }));
  };

  const addQuestion = () => {
    setForm(f => ({ ...f, questions: [...f.questions, { question_text: "", options: ["", "", "", ""], correct_answer_index: 0, explanation: "" }] }));
  };

  const removeQuestion = (idx) => {
    setForm(f => ({ ...f, questions: f.questions.filter((_, i) => i !== idx) }));
  };

  const handleSave = async () => {
    const payload = {
      week_number: Number(form.week_number),
      track: form.track || undefined,
      title: form.title,
      description: form.description,
      passing_score_percent: Number(form.passing_score_percent),
      questions: form.questions,
      status: "Published",
    };
    if (editing) {
      await base44.entities.Quiz.update(editing.id, payload);
      toast({ title: "Quiz updated" });
    } else {
      await base44.entities.Quiz.create(payload);
      toast({ title: "Quiz created" });
    }
    setOpen(false);
    load();
  };

  const handleDelete = async (id) => {
    await base44.entities.Quiz.delete(id);
    toast({ title: "Quiz deleted" });
    load();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-heading font-bold">Quizzes</h1>
          <p className="text-sm text-muted-foreground mt-1">Create quizzes for each week. Students take quizzes alongside their lesson.</p>
        </div>
        <Button onClick={openCreate} className="bg-cyan-500 text-black hover:bg-cyan-400 text-sm">
          <Plus size={14} className="mr-2" /> New Quiz
        </Button>
      </div>

      {quizzes.length === 0 ? (
        <EmptyState icon={HelpCircle} title="No quizzes yet" description="Create a quiz for a specific week and track." />
      ) : (
        <div className="space-y-3">
          {quizzes.map(q => (
            <div key={q.id} className="rounded-xl border border-border/50 bg-card p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{q.title}</p>
                <p className="text-xs text-muted-foreground">Week {q.week_number} · {q.track || "All Tracks"} · {q.questions?.length || 0} questions · Pass: {q.passing_score_percent}%</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={q.status} />
                <Button size="sm" variant="outline" onClick={() => openEdit(q)} className="text-xs border-border h-8 px-2"><Edit2 size={12} className="mr-1" /> Edit</Button>
                <button onClick={() => handleDelete(q.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Quiz" : "New Quiz"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">Week Number</Label>
                <Input type="number" min={1} max={10} value={form.week_number} onChange={e => setForm(f => ({ ...f, week_number: e.target.value }))} className="bg-secondary border-border" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">Track (optional)</Label>
                <Select value={form.track} onValueChange={v => setForm(f => ({ ...f, track: v }))}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="All Tracks" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>All Tracks</SelectItem>
                    {ACTIVE_TRACKS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Quiz Title</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Description</Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Passing Score (%)</Label>
              <Input type="number" min={0} max={100} value={form.passing_score_percent} onChange={e => setForm(f => ({ ...f, passing_score_percent: e.target.value }))} className="bg-secondary border-border" />
            </div>

            {/* Questions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Questions</Label>
                <Button size="sm" variant="outline" onClick={addQuestion} className="text-xs border-border h-7"><Plus size={12} className="mr-1" /> Add Question</Button>
              </div>
              {form.questions.map((q, qIdx) => (
                <div key={qIdx} className="rounded-lg border border-border/50 bg-secondary/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground">Question {qIdx + 1}</p>
                    {form.questions.length > 1 && <button onClick={() => removeQuestion(qIdx)} className="text-red-400 hover:bg-red-500/10 p-1 rounded"><Trash2 size={12} /></button>}
                  </div>
                  <Textarea value={q.question_text} onChange={e => updateQuestion(qIdx, "question_text", e.target.value)} placeholder="Question text..." rows={2} className="bg-secondary border-border text-sm" />
                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuestion(qIdx, "correct_answer_index", optIdx)}
                          className={`w-4 h-4 rounded-full border flex-shrink-0 ${q.correct_answer_index === optIdx ? "border-emerald-400 bg-emerald-400" : "border-muted-foreground/30"}`}
                          title="Mark as correct answer"
                        />
                        <Input value={opt} onChange={e => updateOption(qIdx, optIdx, e.target.value)} placeholder={`Option ${optIdx + 1}`} className="bg-secondary border-border text-sm" />
                      </div>
                    ))}
                  </div>
                  <Input value={q.explanation || ""} onChange={e => updateQuestion(qIdx, "explanation", e.target.value)} placeholder="Explanation (shown after answering)" className="bg-secondary border-border text-sm" />
                </div>
              ))}
            </div>

            <Button onClick={handleSave} disabled={!form.title || form.questions.some(q => !q.question_text)} className="w-full bg-cyan-500 text-black hover:bg-cyan-400">
              {editing ? "Save Changes" : "Create Quiz"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}