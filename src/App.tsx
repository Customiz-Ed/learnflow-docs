import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/router/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";

import LandingPage from "./pages/LandingPage";
import NotFound from "./pages/NotFound";

import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import SchoolsPage from "./pages/admin/SchoolsPage";
import ClassesPage from "./pages/admin/ClassesPage";
import ClassDetailPage from "./pages/admin/ClassDetailPage";

import TeacherLoginPage from "./pages/teacher/TeacherLoginPage";
import TeacherRegisterPage from "./pages/teacher/TeacherRegisterPage";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherStudentsPage from "./pages/teacher/TeacherStudentsPage";
import TeacherEnrollmentsPage from "./pages/teacher/TeacherEnrollmentsPage";
import TeacherTestsPage from "./pages/teacher/TeacherTestsPage";
import TeacherTestDetailPage from "./pages/teacher/TeacherTestDetailPage";
import TeacherTestCreatePage from "./pages/teacher/TeacherTestCreatePage";
import TeacherProfilePage from "./pages/teacher/TeacherProfilePage";

import StudentLoginPage from "./pages/student/StudentLoginPage";
import StudentRegisterPage from "./pages/student/StudentRegisterPage";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentTestsPage from "./pages/student/StudentTestsPage";
import StudentTestAttemptPage from "./pages/student/StudentTestAttemptPage";
import StudentReportPage from "./pages/student/StudentReportPage";
import StudentProfilePage from "./pages/student/StudentProfilePage";

import ParentLoginPage from "./pages/parent/ParentLoginPage";
import ParentRegisterPage from "./pages/parent/ParentRegisterPage";
import ParentDashboard from "./pages/parent/ParentDashboard";

const queryClient = new QueryClient();

// Init theme
if (localStorage.getItem("theme") === "dark") {
  document.documentElement.classList.add("dark");
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />

            {/* Auth pages */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/teacher/login" element={<TeacherLoginPage />} />
            <Route path="/teacher/register" element={<TeacherRegisterPage />} />
            <Route path="/student/login" element={<StudentLoginPage />} />
            <Route path="/student/register" element={<StudentRegisterPage />} />
            <Route path="/parent/login" element={<ParentLoginPage />} />
            <Route path="/parent/register" element={<ParentRegisterPage />} />

            {/* Admin */}
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><AppLayout><AdminDashboard /></AppLayout></ProtectedRoute>} />
            <Route path="/admin/schools" element={<ProtectedRoute allowedRoles={["admin"]}><AppLayout><SchoolsPage /></AppLayout></ProtectedRoute>} />
            <Route path="/admin/classes" element={<ProtectedRoute allowedRoles={["admin"]}><AppLayout><ClassesPage /></AppLayout></ProtectedRoute>} />
            <Route path="/admin/classes/:id" element={<ProtectedRoute allowedRoles={["admin"]}><AppLayout><ClassDetailPage /></AppLayout></ProtectedRoute>} />

            {/* Teacher */}
            <Route path="/teacher/dashboard" element={<ProtectedRoute allowedRoles={["teacher"]}><AppLayout><TeacherDashboard /></AppLayout></ProtectedRoute>} />
            <Route path="/teacher/students" element={<ProtectedRoute allowedRoles={["teacher"]}><AppLayout><TeacherStudentsPage /></AppLayout></ProtectedRoute>} />
            <Route path="/teacher/enrollments" element={<ProtectedRoute allowedRoles={["teacher"]}><AppLayout><TeacherEnrollmentsPage /></AppLayout></ProtectedRoute>} />
            <Route path="/teacher/tests" element={<ProtectedRoute allowedRoles={["teacher"]}><AppLayout><TeacherTestsPage /></AppLayout></ProtectedRoute>} />
            <Route path="/teacher/tests/new" element={<ProtectedRoute allowedRoles={["teacher"]}><AppLayout><TeacherTestCreatePage /></AppLayout></ProtectedRoute>} />
            <Route path="/teacher/tests/:id" element={<ProtectedRoute allowedRoles={["teacher"]}><AppLayout><TeacherTestDetailPage /></AppLayout></ProtectedRoute>} />
            <Route path="/teacher/profile" element={<ProtectedRoute allowedRoles={["teacher"]}><AppLayout><TeacherProfilePage /></AppLayout></ProtectedRoute>} />

            {/* Student */}
            <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={["student"]}><AppLayout><StudentDashboard /></AppLayout></ProtectedRoute>} />
            <Route path="/student/tests" element={<ProtectedRoute allowedRoles={["student"]}><AppLayout><StudentTestsPage /></AppLayout></ProtectedRoute>} />
            <Route path="/student/tests/:id" element={<ProtectedRoute allowedRoles={["student"]}><AppLayout><StudentTestAttemptPage /></AppLayout></ProtectedRoute>} />
            <Route path="/student/report" element={<ProtectedRoute allowedRoles={["student"]}><AppLayout><StudentReportPage /></AppLayout></ProtectedRoute>} />
            <Route path="/student/profile" element={<ProtectedRoute allowedRoles={["student"]}><AppLayout><StudentProfilePage /></AppLayout></ProtectedRoute>} />

            {/* Parent */}
            <Route path="/parent/dashboard" element={<ProtectedRoute allowedRoles={["parent"]}><AppLayout><ParentDashboard /></AppLayout></ProtectedRoute>} />
            <Route path="/parent/profile" element={<ProtectedRoute allowedRoles={["parent"]}><AppLayout><ParentDashboard /></AppLayout></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
