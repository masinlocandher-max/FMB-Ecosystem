import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Lock, CheckCircle, Edit, Users, Award, TrendingUp } from "lucide-react";
import StatusBadge from "@/components/dashboard/StatusBadge";
import StatCard from "@/components/dashboard/StatCard";
import LessonEditDialog from "@/components/curriculum/LessonEditDialog";
import EmptyState from "@/components/curriculum/EmptyState";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CURRICULUM, ACTIVE_TRACKS } from "@/lib/curriculum";
import { computeCertificateEligibility } from "@/lib/curriculum-utils";

const PHASE_STYLES = {
  "AI Foundation": "from-cyan-500/10 to-transparent border-cyan-500/20",
  "Specialization Track": "from-blue-500/10 to-transparent border-blue-500/20",
  "Final Review": "from-amber-500/10 to-transparent border-amber-500/20",
};

export default function AdminLessons() {
  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editWeek, setEditWeek] = useState(null);
  const [tab, setTab] = useState("curriculum");

  const load = async () => {
    const [subs, sts, bts, les] = await Promise.all([
      base44.entities.Submission.list("-created_date", 500),
      base44.entities.Student.list("-created_date", 200),
      base44.entities.Batch.list("-created_date", 50),
      base44.entities.Lesson.list("-created_date", 200),
    ]);
    setSubmissions(subs);
    setStudents(sts);
    setBatches(bts);
    setLessons(les);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getLessonOverride = (week, track) => {
    return lessons.find(l =>
      l.week_number === week &&
      (track ? l.track === track : !l.track)
    );
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;

  const readyForReview = students.filter(s => {
    const subs = submissions.filter(sub => sub.student_id === s.id);
    return computeCertificateEligibility(subs) === "Ready for Review" && s.certificate_status !== "Issued";
  });

  const totalPassed = submissions.filter(s => s.status === "Passed").length;

  // Curriculum tab
  const curriculumTab = (
    <div className="space-y-4">
      {CURRICULUM.map(w => {
        const override = getLessonOverride(w.week, w.track);
        const weekSubs = submissions.filter(s => s.week_number === w.week);
        const passed = weekSubs.filter(s => s.status === "Passed").length;
        const submitted = weekSubs.filter(s => s.status !== "Not Started").length;

        return (
          <div key={`${w.week}-${w.track || "foundation"}`} className={`rounded-xl border bg-gradient-to-r p-4 md:p-6 ${PHASE_STYLES[w.phase] || "border-border/50"}`}>
            <div className="flex flex-col md:flex-row md:items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-lg bg-background/50 flex items-center justify-center border border-border/50">
                  <span className="text-sm font-mono font-bold">{String(w.week).padStart(2, "0")}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full border border-border/50 bg-background/50 text-muted-foreground">
                    {w.phase}
                  </span>
                  {w.track && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400">
                      {w.track}
                    </span>
                  )}
                  {override?.is_locked && (
                    <span className="text-[10px] flex items-center gap-1 text-red-400">
                      <Lock size={10} /> Locked
                    </span>
                  )}
                  {w.week === 10 && (
                    <span className="text-[10px] text-amber-400 flex items-center gap-1">
                      <CheckCircle size={10} /> Certification gateway
                    </span>
                  )}
                </div>

                <h3 className="text-base md:text-lg font-heading font-semibold mb-2">
                  {override?.title || w.title}
                </h3>

                <div className="mb-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Required Output</p>
                  <p className="text-sm text-foreground/90">{override?.required_output || w.requiredOutput}</p>
                </div>

                <div className="flex items-center gap-4 md:gap-6 pt-1">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Submitted</p>
                    <p className="text-sm font-medium">{submitted}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Passed</p>
                    <p className="text-sm font-medium text-emerald-400">{passed}</p>
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0">
                <button
                  onClick={() => setEditWeek(w)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-border/50 bg-background/50 hover:bg-secondary/50 transition-colors"
                >
                  <Edit size={12} /> Edit
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // Batch completion tab
  const batchTab = (
    <div className="space-y-3">
      {batches.length === 0 ? (
        <EmptyState title="No batches" description="No batches have been created yet." />
      ) : (
        batches.map(batch => {
          const batchStudents = students.filter(s => s.batch_id === batch.id);
          const batchSubs = submissions.filter(s =>
            batchStudents.some(st => st.id === s.student_id)
          );
          const passedCount = batchSubs.filter(s => s.status === "Passed").length;
          const totalPossible = batchStudents.length * 10;
          const completionRate = totalPossible > 0 ? Math.round((passedCount / totalPossible) * 100) : 0;

          return (
            <div key={batch.id} className="rounded-xl border border-border/50 bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold">{batch.name}</p>
                  <p className="text-xs text-muted-foreground">{batchStudents.length} students · {batch.status}</p>
                </div>
                <span className="text-lg font-mono font-bold text-cyan-400">{completionRate}%</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-cyan-500/50 rounded-full transition-all" style={{ width: `${completionRate}%` }} />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>{passedCount} passed outputs</span>
                <span>{totalPossible} total</span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  // Certificate review tab
  const reviewTab = (
    <div className="space-y-3">
      {readyForReview.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No students ready for review"
          description="Students who have passed all 10 weekly outputs and the capstone will appear here for certificate review."
        />
      ) : (
        readyForReview.map(student => {
          const studentSubs = submissions.filter(s => s.student_id === student.id);
          const passedCount = studentSubs.filter(s => s.status === "Passed").length;
          const portfolioItems = studentSubs.filter(s => s.is_portfolio_item && s.status === "Passed");
          const batch = batches.find(b => b.id === student.batch_id);

          return (
            <div key={student.id} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold">{student.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {student.track} · {batch?.name || "No batch"} · {student.email}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="text-emerald-400">{passedCount}/10 passed</span>
                    <span className="text-blue-400">{portfolioItems.length} portfolio items</span>
                  </div>
                </div>
                <StatusBadge status={student.certificate_status} />
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  return (
    <div>
      <h1 className="text-xl md:text-2xl font-heading font-bold mb-2">Curriculum & Lessons</h1>
      <p className="text-sm text-muted-foreground mb-6">The 10-week program structure, student progress, and certificate review.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard label="Total Students" value={students.length} icon={Users} />
        <StatCard label="Passed Outputs" value={totalPassed} icon={TrendingUp} accent="text-emerald-400" />
        <StatCard label="Ready for Review" value={readyForReview.length} icon={Award} accent="text-amber-400" />
        <StatCard label="Active Tracks" value={ACTIVE_TRACKS.length} icon={CheckCircle} />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
        {[
          { key: "curriculum", label: "Curriculum" },
          { key: "batches", label: "Batch Completion" },
          { key: "review", label: "Certificate Review" },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              tab === t.key
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                : "text-muted-foreground hover:text-foreground border border-transparent"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "curriculum" && curriculumTab}
      {tab === "batches" && batchTab}
      {tab === "review" && reviewTab}

      {/* Edit dialog */}
      <Dialog open={!!editWeek} onOpenChange={() => setEditWeek(null)}>
        <DialogContent className="max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
          {editWeek && (
            <>
              <DialogHeader>
                <DialogTitle>Edit Lesson</DialogTitle>
              </DialogHeader>
              <LessonEditDialog
                week={editWeek}
                existingOverride={getLessonOverride(editWeek.week, editWeek.track)}
                onClose={() => setEditWeek(null)}
                onSaved={() => { setEditWeek(null); load(); }}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}