import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";
import { ACTIVE_TRACKS } from "@/lib/curriculum";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import { formatCurrency } from "@/lib/business-utils";

const PIE_COLORS = ["#00aeff", "#22c55e", "#f59e0b", "#ef4444", "#a855f7", "#64748b"];

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [students, submissions, apps, payments, certs, batches] = await Promise.all([
        base44.entities.Student.list("-created_date", 500),
        base44.entities.Submission.list("-created_date", 500),
        base44.entities.Application.list("-created_date", 500),
        base44.entities.Payment.list("-created_date", 500),
        base44.entities.Certificate.list("-created_date", 500),
        base44.entities.Batch.list("-created_date", 50),
      ]);

      // Track distribution
      const trackDistribution = ACTIVE_TRACKS.map(track => ({
        name: track.split(" ").slice(-1)[0],
        full: track,
        students: students.filter(s => s.track === track).length,
      }));

      // Submission status distribution
      const submissionStatuses = ["Not Started", "Submitted", "Needs Revision", "Passed", "Failed"];
      const submissionDist = submissionStatuses.map(status => ({
        name: status,
        count: submissions.filter(s => s.status === status).length,
      }));

      // Application status distribution
      const appStatuses = ["Pending Review", "Accepted", "Waitlisted", "Rejected", "Enrolled"];
      const appDist = appStatuses.map(status => ({
        name: status,
        count: apps.filter(a => a.status === status).length,
      }));

      // Revenue data
      const confirmedPayments = payments.filter(p => p.payment_status === "Payment Confirmed");
      const totalRevenue = confirmedPayments.reduce((sum, p) => sum + (p.amount_paid || 0), 0);
      const pendingRevenue = payments.filter(p => ["Payment Pending", "Payment Submitted", "Balance Due"].includes(p.payment_status))
        .reduce((sum, p) => sum + (p.balance_due || 0), 0);

      // Weekly pass rate
      const weeklyPassRate = Array.from({ length: 10 }, (_, i) => {
        const week = i + 1;
        const weekSubs = submissions.filter(s => s.week_number === week);
        const passed = weekSubs.filter(s => s.status === "Passed").length;
        const total = weekSubs.filter(s => s.status !== "Not Started").length;
        return {
          week: `W${week}`,
          passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
          submitted: total,
        };
      });

      // Batch enrollment
      const batchEnrollment = batches.map(b => ({
        name: b.name?.length > 15 ? b.name.substring(0, 12) + "..." : b.name,
        enrolled: students.filter(s => s.batch_id === b.id).length,
        capacity: b.max_students || 30,
      }));

      // Certificate status
      const certStatuses = ["Under Review", "Approved", "Issued", "Revoked"];
      const certDist = certStatuses.map(status => ({
        name: status,
        count: certs.filter(c => c.status === status).length,
      }));

      // Progress status
      const progressStatuses = ["On Track", "Needs Attention", "At Risk", "Completed", "Removed"];
      const progressDist = progressStatuses.map(status => ({
        name: status,
        count: students.filter(s => s.progress_status === status).length,
      }));

      setData({
        trackDistribution,
        submissionDist,
        appDist,
        totalRevenue,
        pendingRevenue,
        weeklyPassRate,
        batchEnrollment,
        certDist,
        progressDist,
        totalStudents: students.length,
        totalSubmissions: submissions.length,
        totalApplications: apps.length,
        totalCerts: certs.length,
      });
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;

  return (
    <div>
      <h1 className="text-xl md:text-2xl font-heading font-bold mb-6">Analytics</h1>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Total Revenue</p>
          <p className="text-lg font-bold text-emerald-400 mt-1">{formatCurrency(data.totalRevenue)}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Pending Revenue</p>
          <p className="text-lg font-bold text-orange-400 mt-1">{formatCurrency(data.pendingRevenue)}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Pass Rate Avg</p>
          <p className="text-lg font-bold text-cyan-400 mt-1">
            {Math.round(data.weeklyPassRate.reduce((sum, w) => sum + w.passRate, 0) / 10)}%
          </p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Certificates</p>
          <p className="text-lg font-bold text-amber-400 mt-1">{data.totalCerts}</p>
        </div>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Weekly pass rate */}
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">Weekly Pass Rate</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.weeklyPassRate}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 15%)" />
              <XAxis dataKey="week" stroke="hsl(215 20% 55%)" fontSize={11} />
              <YAxis stroke="hsl(215 20% 55%)" fontSize={11} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: "hsl(224 44% 7%)", border: "1px solid hsl(222 30% 15%)", borderRadius: 8 }} />
              <Line type="monotone" dataKey="passRate" stroke="#00aeff" strokeWidth={2} dot={{ fill: "#00aeff" }} name="Pass Rate %" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Track distribution */}
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">Student Distribution by Track</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={data.trackDistribution} dataKey="students" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {data.trackDistribution.map((entry, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(224 44% 7%)", border: "1px solid hsl(222 30% 15%)", borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Submission status */}
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">Submission Status</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.submissionDist}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 15%)" />
              <XAxis dataKey="name" stroke="hsl(215 20% 55%)" fontSize={10} angle={-20} textAnchor="end" height={50} />
              <YAxis stroke="hsl(215 20% 55%)" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(224 44% 7%)", border: "1px solid hsl(222 30% 15%)", borderRadius: 8 }} />
              <Bar dataKey="count" fill="#00aeff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Student progress */}
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">Student Progress Status</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.progressDist}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 15%)" />
              <XAxis dataKey="name" stroke="hsl(215 20% 55%)" fontSize={10} angle={-20} textAnchor="end" height={50} />
              <YAxis stroke="hsl(215 20% 55%)" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(224 44% 7%)", border: "1px solid hsl(222 30% 15%)", borderRadius: 8 }} />
              <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Batch enrollment */}
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">Batch Enrollment vs Capacity</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.batchEnrollment}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 15%)" />
              <XAxis dataKey="name" stroke="hsl(215 20% 55%)" fontSize={11} />
              <YAxis stroke="hsl(215 20% 55%)" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(224 44% 7%)", border: "1px solid hsl(222 30% 15%)", borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="enrolled" fill="#00aeff" radius={[4, 4, 0, 0]} />
              <Bar dataKey="capacity" fill="hsl(222 30% 20%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Application funnel */}
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">Application Funnel</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.appDist} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 15%)" />
              <XAxis type="number" stroke="hsl(215 20% 55%)" fontSize={11} />
              <YAxis type="category" dataKey="name" stroke="hsl(215 20% 55%)" fontSize={10} width={90} />
              <Tooltip contentStyle={{ background: "hsl(224 44% 7%)", border: "1px solid hsl(222 30% 15%)", borderRadius: 8 }} />
              <Bar dataKey="count" fill="#a855f7" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}