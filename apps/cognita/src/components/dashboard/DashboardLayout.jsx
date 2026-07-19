import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import BrandLockup from "@/components/BrandLockup";
import RouteTransition from "@/components/RouteTransition";
import {
  LayoutDashboard, Users, BookOpen, FileText, Award,
  ClipboardList, ClipboardCheck, LogOut, Menu, X,
  GraduationCap, UserCheck, DollarSign, Layers, BookMarked, ExternalLink, Smartphone,
  Receipt, RefreshCcw, Handshake, UserPlus, Clock, CreditCard,
  Megaphone, HelpCircle, MessageSquare, BarChart, Library, Landmark, LifeBuoy
} from "lucide-react";

const ADMIN_LINKS = [
  { section: "Management", label: "Overview", path: "/dashboard", icon: LayoutDashboard },
  { section: "Management", label: "Analytics", path: "/dashboard/analytics", icon: BarChart },
  { section: "Admissions", label: "Applications", path: "/dashboard/applications", icon: ClipboardList },
  { section: "Admissions", label: "Teacher Applications", path: "/dashboard/teacher-applications", icon: GraduationCap },
  { section: "Academic Operations", label: "Students", path: "/dashboard/students", icon: Users },
  { section: "Academic Operations", label: "Batches", path: "/dashboard/batches", icon: GraduationCap },
  { section: "Academic Operations", label: "Tracks", path: "/dashboard/tracks", icon: Layers },
  { section: "Academic Operations", label: "Lessons", path: "/dashboard/lessons", icon: BookMarked },
  { section: "Academic Operations", label: "Quizzes", path: "/dashboard/quizzes", icon: HelpCircle },
  { section: "Academic Operations", label: "Facilitators", path: "/dashboard/facilitators", icon: UserCheck },
  { section: "Academic Operations", label: "Submissions", path: "/dashboard/submissions", icon: FileText },
  { section: "Academic Operations", label: "Portfolio Audits", path: "/dashboard/portfolio-audits", icon: ClipboardCheck },
  { section: "Academic Operations", label: "Certificates", path: "/dashboard/certificates", icon: Award },
  { section: "Communications", label: "Announcements", path: "/dashboard/announcements", icon: Megaphone },
  { section: "Communications", label: "Messages", path: "/dashboard/messages", icon: MessageSquare },
  { section: "Communications", label: "Support Tickets", path: "/dashboard/support", icon: LifeBuoy },
  { section: "Finance", label: "Payments", path: "/dashboard/payments", icon: DollarSign },
  { section: "Finance", label: "Invoices", path: "/dashboard/invoices", icon: FileText },
  { section: "Finance", label: "Receipts", path: "/dashboard/receipts", icon: Receipt },
  { section: "Finance", label: "Refunds", path: "/dashboard/refunds", icon: RefreshCcw },
  { section: "Growth", label: "Partners", path: "/dashboard/partners", icon: Handshake },
  { section: "Growth", label: "Leads", path: "/dashboard/leads", icon: UserPlus },
  { section: "Growth", label: "Waitlist", path: "/dashboard/waitlist", icon: Clock },
  { section: "Publishing", label: "Play Store", path: "/dashboard/playstore", icon: Smartphone },
];

const FACILITATOR_LINKS = [
  { section: "Faculty Portal", label: "Overview", path: "/facilitator", icon: LayoutDashboard },
  { section: "Faculty Portal", label: "Students", path: "/facilitator/students", icon: Users },
  { section: "Faculty Portal", label: "Submissions", path: "/facilitator/submissions", icon: FileText },
  { section: "Communications", label: "Messages", path: "/facilitator/messages", icon: MessageSquare },
];

const STUDENT_LINKS = [
  { section: "Cognita Campus", label: "Student Dashboard", path: "/student", icon: LayoutDashboard },
  { section: "Academic Affairs", label: "My Program", path: "/student/program", icon: BookOpen },
  { section: "Academic Affairs", label: "Portfolio Center", path: "/student/portfolio", icon: FileText },
  { section: "Academic Affairs", label: "Certificate", path: "/student/certificate", icon: Award },
  { section: "Student Offices", label: "Office of the Registrar", path: "/student/registrar", icon: Landmark },
  { section: "Student Offices", label: "Finance and Billing", path: "/student/payments", icon: CreditCard },
  { section: "Student Offices", label: "Learning Resource Center", path: "/student/library", icon: Library },
  { section: "Campus Communications", label: "Announcements", path: "/student/announcements", icon: Megaphone },
  { section: "Campus Communications", label: "Messages", path: "/student/messages", icon: MessageSquare },
];

export default function DashboardLayout({ role, user }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const links = role === "admin" ? ADMIN_LINKS : role === "facilitator" ? FACILITATOR_LINKS : STUDENT_LINKS;
  const portalName = role === "admin" ? "Administration" : role === "facilitator" ? "Faculty Portal" : "Student Portal";

  const handleLogout = () => {
    base44.auth.logout("/");
  };

  const isActive = (path) => {
    if (["/student", "/dashboard", "/facilitator"].includes(path)) {
      return location.pathname === path;
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div className="corporate-shell min-h-screen flex">
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-700/40 bg-[#07101f]/98 shadow-2xl transform transition-transform md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-full flex flex-col">
          <div className="min-h-20 flex items-center justify-between px-5 border-b border-slate-700/40">
            <Link to="/" className="flex items-center">
              <BrandLockup size="sm" className="items-start" />
            </Link>
            <button className="md:hidden text-muted-foreground" onClick={() => setSidebarOpen(false)} aria-label="Close navigation">
              <X size={18} />
            </button>
          </div>

          <div className="px-5 py-4 border-b border-slate-700/30">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-400/70">{portalName}</p>
            <p className="mt-1 text-xs text-slate-400">Cognita Institute of AI</p>
          </div>

          <nav className="flex-1 px-3 py-3 overflow-y-auto">
            {links.map((link, index) => {
              const active = isActive(link.path);
              const showSection = index === 0 || links[index - 1].section !== link.section;

              return (
                <React.Fragment key={link.path}>
                  {showSection && (
                    <p className="px-3 pt-4 pb-2 text-[9px] font-semibold uppercase tracking-[0.20em] text-slate-500 first:pt-1">
                      {link.section}
                    </p>
                  )}
                  <Link
                    to={link.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] transition-all ${
                      active
                        ? "bg-sky-500/10 text-sky-300 font-medium border border-sky-400/15 shadow-[inset_3px_0_0_rgba(56,189,248,0.8)]"
                        : "text-slate-400 border border-transparent hover:text-slate-100 hover:bg-white/[0.035]"
                    }`}
                  >
                    <link.icon size={16} className={active ? "text-sky-400" : "text-slate-500 group-hover:text-slate-300"} />
                    {link.label}
                  </Link>
                </React.Fragment>
              );
            })}
          </nav>

          <div className="p-3 border-t border-slate-700/40 bg-black/10">
            <div className="px-3 py-2 text-xs text-slate-500 truncate">{user?.email}</div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-slate-400 hover:text-white hover:bg-white/[0.04] w-full transition-colors"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 min-w-0 md:ml-72">
        <header className="h-16 border-b border-slate-700/40 flex items-center px-4 md:px-8 sticky top-0 bg-[#07101f]/92 backdrop-blur-xl z-20 shadow-sm">
          <button className="md:hidden mr-4 text-foreground" onClick={() => setSidebarOpen(true)} aria-label="Open navigation">
            <Menu size={19} />
          </button>
          <div>
            <p className="text-xs font-semibold text-slate-200">{portalName}</p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Official learning environment</p>
          </div>
          <div className="flex-1" />
          <Link to="/" className="text-xs text-slate-400 hover:text-sky-300 transition-colors flex items-center gap-1.5">
            <ExternalLink size={12} /> Website
          </Link>
        </header>

        <main className="p-4 md:p-8 lg:p-10">
          <RouteTransition>
            <Outlet />
          </RouteTransition>
        </main>
      </div>
    </div>
  );
}
