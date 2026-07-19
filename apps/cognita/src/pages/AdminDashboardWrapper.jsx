import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function AdminDashboardWrapper() {
  const [user, setUser] = useState(null);
  const [redirect, setRedirect] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const u = await base44.auth.me();
        if (u.role === "admin") {
          setUser(u);
          setLoading(false);
        } else {
          const students = await base44.entities.Student.filter({ email: u.email }).catch(() => []);
          if (students.length > 0) { setRedirect("/student"); setLoading(false); return; }
          const facs = await base44.entities.Facilitator.filter({ email: u.email }).catch(() => []);
          if (facs.length > 0) { setRedirect("/facilitator"); setLoading(false); return; }
          setRedirect("/"); setLoading(false);
        }
      } catch {
        setRedirect("/login"); setLoading(false);
      }
    };
    check();
  }, []);

  if (loading) return <div className="fixed inset-0 flex items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;
  if (redirect) return <Navigate to={redirect} replace />;

  return <DashboardLayout role="admin" user={user} />;
}