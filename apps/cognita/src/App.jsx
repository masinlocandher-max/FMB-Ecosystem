import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter, HashRouter, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';

const AppRouter = import.meta.env.VITE_DEPLOY_TARGET === 'github-pages' ? HashRouter : BrowserRouter;

const PublicLayout = lazy(() => import('@/components/public/PublicLayout'));
const Home = lazy(() => import('@/pages/Home'));
const About = lazy(() => import('@/pages/About'));
const Organization = lazy(() => import('@/pages/Organization'));
const Program = lazy(() => import('@/pages/Program'));
const Tracks = lazy(() => import('@/pages/Tracks'));
const Faq = lazy(() => import('@/pages/Faq'));
const Apply = lazy(() => import('@/pages/Apply'));
const Verify = lazy(() => import('@/pages/Verify'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const Terms = lazy(() => import('@/pages/Terms'));
const Contact = lazy(() => import('@/pages/Contact'));
const Partner = lazy(() => import('@/pages/Partner'));
const Waitlist = lazy(() => import('@/pages/Waitlist'));
const Teach = lazy(() => import('@/pages/Teach'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const AdminDashboardWrapper = lazy(() => import('@/pages/AdminDashboardWrapper'));
const FacilitatorDashboardWrapper = lazy(() => import('@/pages/FacilitatorDashboardWrapper'));
const StudentDashboardWrapper = lazy(() => import('@/pages/StudentDashboardWrapper'));
const AdminOverview = lazy(() => import('@/pages/admin/AdminOverview'));
const AdminApplications = lazy(() => import('@/pages/admin/AdminApplications'));
const AdminStudents = lazy(() => import('@/pages/admin/AdminStudents'));
const AdminBatches = lazy(() => import('@/pages/admin/AdminBatches'));
const AdminFacilitators = lazy(() => import('@/pages/admin/AdminFacilitators'));
const AdminSubmissions = lazy(() => import('@/pages/admin/AdminSubmissions'));
const AdminPortfolioAudits = lazy(() => import('@/pages/admin/AdminPortfolioAudits'));
const AdminCertificates = lazy(() => import('@/pages/admin/AdminCertificates'));
const AdminTracks = lazy(() => import('@/pages/admin/AdminTracks'));
const AdminLessons = lazy(() => import('@/pages/admin/AdminLessons'));
const AdminPlayStore = lazy(() => import('@/pages/admin/AdminPlayStore'));
const AdminAnnouncements = lazy(() => import('@/pages/admin/AdminAnnouncements'));
const AdminQuizzes = lazy(() => import('@/pages/admin/AdminQuizzes'));
const AdminMessages = lazy(() => import('@/pages/admin/AdminMessages'));
const AdminTeacherApplications = lazy(() => import('@/pages/admin/AdminTeacherApplications'));
const AdminAnalytics = lazy(() => import('@/pages/admin/AdminAnalytics'));
const AdminPayments = lazy(() => import('@/pages/admin/AdminPayments'));
const AdminInvoices = lazy(() => import('@/pages/admin/AdminInvoices'));
const AdminReceipts = lazy(() => import('@/pages/admin/AdminReceipts'));
const AdminRefunds = lazy(() => import('@/pages/admin/AdminRefunds'));
const AdminPartnerInquiries = lazy(() => import('@/pages/admin/AdminPartnerInquiries'));
const AdminLeads = lazy(() => import('@/pages/admin/AdminLeads'));
const AdminWaitlist = lazy(() => import('@/pages/admin/AdminWaitlist'));
const AdminSupportTickets = lazy(() => import('@/pages/admin/AdminSupportTickets'));
const StudentDashboard = lazy(() => import('@/pages/student/StudentDashboard'));
const StudentProgram = lazy(() => import('@/pages/student/StudentProgram'));
const StudentLesson = lazy(() => import('@/pages/student/StudentLesson'));
const StudentPortfolio = lazy(() => import('@/pages/student/StudentPortfolio'));
const StudentCertificate = lazy(() => import('@/pages/student/StudentCertificate'));
const StudentPayments = lazy(() => import('@/pages/student/StudentPayments'));
const StudentAnnouncements = lazy(() => import('@/pages/student/StudentAnnouncements'));
const StudentMessages = lazy(() => import('@/pages/student/StudentMessages'));
const StudentQuiz = lazy(() => import('@/pages/student/StudentQuiz'));
const StudentEnrollmentAgreement = lazy(() => import('@/pages/student/StudentEnrollmentAgreement'));
const StudentRegistrar = lazy(() => import('@/pages/student/StudentRegistrar'));
const StudentLibrary = lazy(() => import('@/pages/student/StudentLibrary'));
const FacilitatorOverview = lazy(() => import('@/pages/facilitator/FacilitatorOverview'));
const FacilitatorStudents = lazy(() => import('@/pages/facilitator/FacilitatorStudents'));
const FacilitatorSubmissions = lazy(() => import('@/pages/facilitator/FacilitatorSubmissions'));
const FacilitatorMessages = lazy(() => import('@/pages/facilitator/FacilitatorMessages'));

const RouteLoadingFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background" role="status" aria-live="polite">
    <div className="w-8 h-8 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
    <span className="sr-only">Loading page</span>
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/organization" element={<Organization />} />
          <Route path="/program" element={<Program />} />
          <Route path="/tracks" element={<Tracks />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/apply" element={<Apply />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/partner" element={<Partner />} />
          <Route path="/waitlist" element={<Waitlist />} />
          <Route path="/teach" element={<Teach />} />
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
          <Route element={<AdminDashboardWrapper />}>
            <Route path="/dashboard" element={<AdminOverview />} />
            <Route path="/dashboard/analytics" element={<AdminAnalytics />} />
            <Route path="/dashboard/applications" element={<AdminApplications />} />
            <Route path="/dashboard/teacher-applications" element={<AdminTeacherApplications />} />
            <Route path="/dashboard/students" element={<AdminStudents />} />
            <Route path="/dashboard/batches" element={<AdminBatches />} />
            <Route path="/dashboard/facilitators" element={<AdminFacilitators />} />
            <Route path="/dashboard/submissions" element={<AdminSubmissions />} />
            <Route path="/dashboard/portfolio-audits" element={<AdminPortfolioAudits />} />
            <Route path="/dashboard/certificates" element={<AdminCertificates />} />
            <Route path="/dashboard/tracks" element={<AdminTracks />} />
            <Route path="/dashboard/lessons" element={<AdminLessons />} />
            <Route path="/dashboard/quizzes" element={<AdminQuizzes />} />
            <Route path="/dashboard/announcements" element={<AdminAnnouncements />} />
            <Route path="/dashboard/messages" element={<AdminMessages />} />
            <Route path="/dashboard/support" element={<AdminSupportTickets />} />
            <Route path="/dashboard/playstore" element={<AdminPlayStore />} />
            <Route path="/dashboard/payments" element={<AdminPayments />} />
            <Route path="/dashboard/invoices" element={<AdminInvoices />} />
            <Route path="/dashboard/receipts" element={<AdminReceipts />} />
            <Route path="/dashboard/refunds" element={<AdminRefunds />} />
            <Route path="/dashboard/partners" element={<AdminPartnerInquiries />} />
            <Route path="/dashboard/leads" element={<AdminLeads />} />
            <Route path="/dashboard/waitlist" element={<AdminWaitlist />} />
          </Route>

          <Route element={<FacilitatorDashboardWrapper />}>
            <Route path="/facilitator" element={<FacilitatorOverview />} />
            <Route path="/facilitator/students" element={<FacilitatorStudents />} />
            <Route path="/facilitator/submissions" element={<FacilitatorSubmissions />} />
            <Route path="/facilitator/messages" element={<FacilitatorMessages />} />
          </Route>

          <Route element={<StudentDashboardWrapper />}>
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/student/program" element={<StudentProgram />} />
            <Route path="/student/lesson/:week" element={<StudentLesson />} />
            <Route path="/student/portfolio" element={<StudentPortfolio />} />
            <Route path="/student/certificate" element={<StudentCertificate />} />
            <Route path="/student/registrar" element={<StudentRegistrar />} />
            <Route path="/student/payments" element={<StudentPayments />} />
            <Route path="/student/library" element={<StudentLibrary />} />
            <Route path="/student/announcements" element={<StudentAnnouncements />} />
            <Route path="/student/messages" element={<StudentMessages />} />
            <Route path="/student/quiz/:week" element={<StudentQuiz />} />
            <Route path="/student/enrollment-agreement" element={<StudentEnrollmentAgreement />} />
          </Route>
        </Route>

        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <AppRouter>
          <ScrollToTop />
          <AuthenticatedApp />
        </AppRouter>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
