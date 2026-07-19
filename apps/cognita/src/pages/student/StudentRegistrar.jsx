import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import EmptyState from "@/components/curriculum/EmptyState";
import StatusBadge from "@/components/dashboard/StatusBadge";
import {
  Award,
  CalendarDays,
  CheckCircle2,
  FileCheck2,
  GraduationCap,
  Landmark,
  Loader2,
  ShieldCheck,
  UserRound,
} from "lucide-react";

function formatDate(value) {
  if (!value) return "Not yet recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export default function StudentRegistrar() {
  const [student, setStudent] = useState(null);
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecord = async () => {
      try {
        const user = await base44.auth.me();
        const students = await base44.entities.Student.filter({ email: user.email });
        const record = students[0] || null;
        setStudent(record);

        if (record?.batch_id) {
          const batchRecord = await base44.entities.Batch.get(record.batch_id).catch(() => null);
          setBatch(batchRecord);
        }
      } finally {
        setLoading(false);
      }
    };

    loadRecord();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-muted-foreground" size={24} />
      </div>
    );
  }

  if (!student) {
    return (
      <EmptyState
        icon={Landmark}
        title="No registrar record yet"
        description="Your learner record will appear after your enrollment has been officially created."
      />
    );
  }

  const recordId = `COG-${String(student.id || "PENDING").slice(-8).toUpperCase()}`;

  const details = [
    { label: "Full name", value: student.full_name, icon: UserRound },
    { label: "Learner record ID", value: recordId, icon: ShieldCheck },
    { label: "Program track", value: student.track, icon: GraduationCap },
    { label: "Batch", value: batch?.name || "Pending assignment", icon: GraduationCap },
    { label: "Date enrolled", value: formatDate(student.enrolled_date), icon: CalendarDays },
    { label: "Current academic week", value: `Week ${student.current_week || 1} of 10`, icon: FileCheck2 },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-400/70">Student Office</p>
        <h1 className="mt-2 text-2xl md:text-3xl font-heading font-bold">Office of the Registrar</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Review your official Cognita learner record, enrollment details, program status, and document eligibility.
        </p>
      </div>

      <section className="corporate-panel rounded-xl overflow-hidden mb-6">
        <div className="flex flex-col gap-4 border-b border-border/60 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-7">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Learner record</p>
            <p className="mt-1 font-mono text-sm text-sky-300">{recordId}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={student.progress_status || "On Track"} />
            <StatusBadge status={student.payment_status || "Payment Pending"} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-px bg-border/40 sm:grid-cols-2 lg:grid-cols-3">
          {details.map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-card/95 px-5 py-5 md:px-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon size={14} />
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">{label}</span>
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">{value || "Not yet recorded"}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="corporate-panel rounded-xl p-5 md:p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-sky-400/20 bg-sky-400/10">
              <FileCheck2 size={18} className="text-sky-300" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Enrollment Record</h2>
              <p className="text-xs text-muted-foreground">Official program enrollment status</p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4 border-b border-border/40 pb-3">
              <span className="text-muted-foreground">Enrollment agreement</span>
              <span className="flex items-center gap-1.5 font-medium">
                {student.enrollment_agreement_signed ? <CheckCircle2 size={14} className="text-emerald-400" /> : null}
                {student.enrollment_agreement_signed ? "Signed" : "Pending"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-border/40 pb-3">
              <span className="text-muted-foreground">Academic standing</span>
              <span className="font-medium">{student.progress_status || "On Track"}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Certificate status</span>
              <span className="font-medium">{student.certificate_status || "Not Eligible"}</span>
            </div>
          </div>
        </section>

        <section className="corporate-panel rounded-xl p-5 md:p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-sky-400/20 bg-sky-400/10">
              <Award size={18} className="text-sky-300" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Official Documents</h2>
              <p className="text-xs text-muted-foreground">Documents available through Cognita</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              ["Enrollment Confirmation", "Available after confirmed enrollment"],
              ["Verified Training Record", "Available as modules are completed"],
              ["Certificate of Completion", "Available only after final approval"],
            ].map(([title, note]) => (
              <div key={title} className="rounded-lg border border-border/50 bg-secondary/20 p-4">
                <p className="text-sm font-medium">{title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{note}</p>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Cognita issues non-degree professional training records. Document availability depends on verified enrollment and completion status.
          </p>
        </section>
      </div>
    </div>
  );
}
