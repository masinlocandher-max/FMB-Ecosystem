import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ClipboardList, Users, GraduationCap, Award, FileText, Loader2, DollarSign, Handshake, UserPlus, Clock, AlertTriangle } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Link } from "react-router-dom";

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [recentApps, setRecentApps] = useState([]);
  const [opsItems, setOpsItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [apps, students, batches, certs, subs, payments, invoices, partnerInqs, leads, waitlist] = await Promise.all([
        base44.entities.Application.list("-created_date", 100),
        base44.entities.Student.list("-created_date", 100),
        base44.entities.Batch.list("-created_date", 50),
        base44.entities.Certificate.list("-created_date", 50),
        base44.entities.Submission.list("-created_date", 50),
        base44.entities.Payment.list("-created_date", 200),
        base44.entities.Invoice.list("-created_date", 200),
        base44.entities.PartnerInquiry.list("-created_date", 200),
        base44.entities.Lead.list("-created_date", 200),
        base44.entities.Waitlist.list("-created_date", 200),
      ]);

      setStats({
        applications: apps.length,
        pending: apps.filter(a => a.status === "Pending Review").length,
        students: students.length,
        batches: batches.length,
        certificates: certs.filter(c => c.status === "Issued").length,
        submissions: subs.length,
        paymentsPending: payments.filter(p => ["Payment Pending", "Payment Submitted", "Balance Due"].includes(p.payment_status)).length,
        proofsToReview: payments.filter(p => p.payment_status === "Payment Submitted").length,
        invoicesUnpaid: invoices.filter(i => i.payment_status === "Unpaid" || i.payment_status === "Overdue").length,
        certsReady: students.filter(s => {
          const studentSubs = subs.filter(sub => sub.student_id === s.id);
          const passedCount = studentSubs.filter(s => s.status === "Passed").length;
          return passedCount >= 10 && s.certificate_status !== "Issued";
        }).length,
        partnersPending: partnerInqs.filter(p => p.status === "New").length,
        newLeads: leads.filter(l => l.status === "New").length,
        waitlisted: waitlist.filter(w => w.status === "New" || w.status === "Invited to Apply").length,
      });

      setRecentApps(apps.slice(0, 5));

      // Build ops queue
      const items = [];
      payments.filter(p => p.payment_status === "Payment Submitted").forEach(p => {
        items.push({ type: "payment", text: `${p.student_name} — payment proof to review`, path: "/dashboard/payments", icon: DollarSign, color: "text-yellow-400" });
      });
      invoices.filter(i => i.payment_status === "Unpaid").forEach(i => {
        items.push({ type: "invoice", text: `${i.student_name} — invoice ${i.invoice_number} unpaid`, path: "/dashboard/invoices", icon: FileText, color: "text-orange-400" });
      });
      students.filter(s => {
        const studentSubs = subs.filter(sub => sub.student_id === s.id);
        const passedCount = studentSubs.filter(s => s.status === "Passed").length;
        return passedCount >= 10 && s.certificate_status !== "Issued";
      }).forEach(s => {
        items.push({ type: "cert", text: `${s.full_name} — ready for certificate review`, path: "/dashboard/certificates", icon: Award, color: "text-amber-400" });
      });
      partnerInqs.filter(p => p.status === "New").forEach(p => {
        items.push({ type: "partner", text: `${p.organization_name} — new partnership inquiry`, path: "/dashboard/partners", icon: Handshake, color: "text-cyan-400" });
      });
      leads.filter(l => l.status === "New").forEach(l => {
        items.push({ type: "lead", text: `${l.full_name} — new lead (${l.interest_type})`, path: "/dashboard/leads", icon: UserPlus, color: "text-blue-400" });
      });
      waitlist.filter(w => w.status === "Invited to Apply").forEach(w => {
        items.push({ type: "waitlist", text: `${w.full_name} — invited to apply`, path: "/dashboard/waitlist", icon: Clock, color: "text-purple-400" });
      });

      setOpsItems(items);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;

  return (
    <div>
      <h1 className="text-xl md:text-2xl font-heading font-bold mb-6">Admin Overview</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <StatCard label="Applications" value={stats.applications} icon={ClipboardList} />
        <StatCard label="Pending Review" value={stats.pending} icon={ClipboardList} accent="text-yellow-400" />
        <StatCard label="Students" value={stats.students} icon={Users} />
        <StatCard label="Batches" value={stats.batches} icon={GraduationCap} />
        <StatCard label="Payments Pending" value={stats.paymentsPending} icon={DollarSign} accent="text-orange-400" />
        <StatCard label="Proofs to Review" value={stats.proofsToReview} icon={AlertTriangle} accent="text-yellow-400" />
        <StatCard label="Invoices Unpaid" value={stats.invoicesUnpaid} icon={FileText} accent="text-orange-400" />
        <StatCard label="Certificates Issued" value={stats.certificates} icon={Award} accent="text-amber-400" />
      </div>

      {/* Operations Queue */}
      {opsItems.length > 0 && (
        <div className="rounded-xl border border-border/50 bg-card mb-6">
          <div className="px-5 py-4 border-b border-border/50">
            <h2 className="text-sm font-semibold">Operations Queue</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Items needing your attention</p>
          </div>
          <div className="divide-y divide-border/30">
            {opsItems.slice(0, 10).map((item, i) => (
              <Link key={i} to={item.path} className="flex items-center gap-3 px-5 py-3 hover:bg-secondary/30 transition-colors">
                <item.icon size={14} className={item.color} />
                <p className="text-sm text-foreground/90 flex-1">{item.text}</p>
                <span className="text-xs text-muted-foreground">→</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Additional stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-6">
        <StatCard label="Ready for Review" value={stats.certsReady} icon={Award} accent="text-amber-400" />
        <StatCard label="Partner Inquiries" value={stats.partnersPending} icon={Handshake} accent="text-cyan-400" />
        <StatCard label="New Leads" value={stats.newLeads} icon={UserPlus} accent="text-blue-400" />
        <StatCard label="Waitlisted" value={stats.waitlisted} icon={Clock} accent="text-purple-400" />
        <StatCard label="Submissions" value={stats.submissions} icon={FileText} />
      </div>

      <div className="rounded-xl border border-border/50 bg-card">
        <div className="px-5 py-4 border-b border-border/50">
          <h2 className="text-sm font-semibold">Recent Applications</h2>
        </div>
        {recentApps.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No applications yet.</div>
        ) : (
          <div className="divide-y divide-border/30">
            {recentApps.map(app => (
              <div key={app.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{app.full_name}</p>
                  <p className="text-xs text-muted-foreground">{app.email} · {app.preferred_track}</p>
                </div>
                <StatusBadge status={app.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}