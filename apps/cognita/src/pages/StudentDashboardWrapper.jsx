import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

const PAYMENT_ACCESS_STATUSES = new Set(["Payment Confirmed", "Payment Waived"]);
const BLOCKED_ACCESS_STATUSES = new Set(["Suspended", "Expired", "Revoked"]);

export default function StudentDashboardWrapper() {
  const [user, setUser] = useState(null);
  const [redirect, setRedirect] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const check = async () => {
      try {
        const authenticatedUser = await base44.auth.me();
        const students = await base44.entities.Student.filter({ email: authenticatedUser.email }).catch(() => []);
        if (students.length === 0) {
          setRedirect("/apply");
          setLoading(false);
          return;
        }

        const student = students[0];
        if (!student.enrollment_agreement_signed && location.pathname !== "/student/enrollment-agreement") {
          setRedirect("/student/enrollment-agreement");
          setLoading(false);
          return;
        }

        const paymentAllowsAccess = PAYMENT_ACCESS_STATUSES.has(student.payment_status);
        const explicitAccessBlock = student.access_status && BLOCKED_ACCESS_STATUSES.has(student.access_status);
        const isEnrollmentOfficeRoute = ["/student/payments", "/student/enrollment-agreement"].includes(location.pathname);

        if ((!paymentAllowsAccess || explicitAccessBlock) && !isEnrollmentOfficeRoute) {
          setRedirect("/student/payments");
          setLoading(false);
          return;
        }

        setUser(authenticatedUser);
        setLoading(false);
      } catch {
        setRedirect("/login");
        setLoading(false);
      }
    };
    check();
  }, [location.pathname]);

  if (loading) return <div className="fixed inset-0 flex items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;
  if (redirect) return <Navigate to={redirect} replace />;

  return <DashboardLayout role="student" user={user} />;
}
