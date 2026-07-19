import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Layers, Users, ClipboardList } from "lucide-react";
import { TRACK_DETAILS } from "@/lib/curriculum";

export default function AdminTracks() {
  const [students, setStudents] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [s, a] = await Promise.all([
        base44.entities.Student.list("-created_date", 200),
        base44.entities.Application.list("-created_date", 200),
      ]);
      setStudents(s);
      setApplications(a);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold mb-2">Specialization Tracks</h1>
      <p className="text-sm text-muted-foreground mb-8">Four specialization paths available after the AI Foundation phase.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {TRACK_DETAILS.map((track, i) => {
          const studentCount = students.filter(s => s.track === track.name).length;
          const appCount = applications.filter(a => a.preferred_track === track.name).length;

          return (
            <div key={i} className="rounded-xl border border-border/50 bg-card p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                    <Layers size={20} className="text-cyan-400" />
                  </div>
                  <h3 className="text-base font-heading font-semibold">{track.name}</h3>
                </div>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{track.description}</p>

              <div className="mb-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Core Focus Areas</p>
                <div className="flex flex-wrap gap-1.5">
                  {track.focusAreas.map((area, j) => (
                    <span key={j} className="text-[11px] px-2 py-0.5 rounded-full border border-border/50 bg-secondary/50 text-foreground/70">{area}</span>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Target Profile</p>
                <p className="text-xs text-foreground/70">{track.targetProfile}</p>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-border/30">
                <div className="flex items-center gap-1.5">
                  <Users size={14} className="text-muted-foreground" />
                  <span className="text-sm font-medium">{studentCount}</span>
                  <span className="text-xs text-muted-foreground">enrolled</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ClipboardList size={14} className="text-muted-foreground" />
                  <span className="text-sm font-medium">{appCount}</span>
                  <span className="text-xs text-muted-foreground">applications</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}