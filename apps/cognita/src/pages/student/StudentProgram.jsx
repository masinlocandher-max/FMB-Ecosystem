import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, AlertTriangle } from "lucide-react";
import WeekCard from "@/components/curriculum/WeekCard";
import EmptyState from "@/components/curriculum/EmptyState";
import { getCurriculumForTrack } from "@/lib/curriculum-utils";

export default function StudentProgram() {
  const [student, setStudent] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const user = await base44.auth.me();
    const students = await base44.entities.Student.filter({ email: user.email });
    if (students.length > 0) {
      setStudent(students[0]);
      const subs = await base44.entities.Submission.filter({ student_id: students[0].id });
      setSubmissions(subs);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;

  if (!student) {
    return <EmptyState icon={AlertTriangle} title="Not enrolled yet" description="You haven't been enrolled as a student yet." />;
  }

  const curriculum = getCurriculumForTrack(student.track);
  const passedCount = submissions.filter(s => s.status === "Passed").length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-heading font-bold mb-1">10-Week Program</h1>
        <p className="text-xs md:text-sm text-muted-foreground">
          {student.track} · Currently on Week {student.current_week} · {passedCount}/10 outputs passed
        </p>
      </div>

      <div className="space-y-3 md:space-y-4">
        {curriculum.map(week => (
          <WeekCard
            key={`${week.week}-${week.track || "foundation"}`}
            week={week}
            submissions={submissions}
            student={student}
            track={student.track}
          />
        ))}
      </div>
    </div>
  );
}