import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Users, FileText, AlertTriangle } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import StatusBadge from "@/components/dashboard/StatusBadge";

export default function FacilitatorOverview() {
  const [facilitator, setFacilitator] = useState(null);
  const [students, setStudents] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      const facs = await base44.entities.Facilitator.filter({ email: user.email });
      if (facs.length > 0) {
        const fac = facs[0];
        setFacilitator(fac);
        const allStudents = await base44.entities.Student.filter({ facilitator_id: fac.id });
        setStudents(allStudents);
        if (allStudents.length > 0) {
          const allSubs = await base44.entities.Submission.list("-created_date", 200);
          const studentIds = new Set(allStudents.map(s => s.id));
          setSubmissions(allSubs.filter(s => studentIds.has(s.student_id)));
        }
      }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;

  if (!facilitator) {
    return (
      <div className="text-center py-20">
        <AlertTriangle size={32} className="text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-heading font-bold mb-2">Not registered as facilitator</h2>
        <p className="text-muted-foreground text-sm">Contact admin to be added as a facilitator.</p>
      </div>
    );
  }

  const pendingReview = submissions.filter(s => s.status === "Submitted").length;
  const atRisk = students.filter(s => s.progress_status === "At Risk").length;

  return (
    <div>
      <h1 className="text-xl md:text-2xl font-heading font-bold mb-6">Facilitator Overview</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <StatCard label="Assigned Students" value={students.length} icon={Users} />
        <StatCard label="Pending Review" value={pendingReview} icon={FileText} accent="text-yellow-400" />
        <StatCard label="At Risk" value={atRisk} icon={AlertTriangle} accent="text-red-400" />
        <StatCard label="Total Submissions" value={submissions.length} icon={FileText} />
      </div>

      <div className="rounded-xl border border-border/50 bg-card">
        <div className="px-5 py-4 border-b border-border/50">
          <h2 className="text-sm font-semibold">Your Students</h2>
        </div>
        {students.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No students assigned yet.</div>
        ) : (
          <div className="divide-y divide-border/30">
            {students.map(s => (
              <div key={s.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{s.full_name}</p>
                  <p className="text-xs text-muted-foreground">{s.track} · Week {s.current_week}/10</p>
                </div>
                <StatusBadge status={s.progress_status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}