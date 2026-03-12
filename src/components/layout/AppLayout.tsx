import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, School, BookOpen, Users, ClipboardList,
  FileText, BarChart3, User, LogOut, Menu, X, ChevronRight,
  GraduationCap, UserCheck, Settings,
} from "lucide-react";
import type { Role } from "@/types/api.types";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navByRole: Record<Role, NavItem[]> = {
  admin: [
    { label: "Dashboard", path: "/admin/dashboard", icon: <LayoutDashboard size={20} /> },
    { label: "Schools", path: "/admin/schools", icon: <School size={20} /> },
    { label: "Classes", path: "/admin/classes", icon: <BookOpen size={20} /> },
  ],
  teacher: [
    { label: "Dashboard", path: "/teacher/dashboard", icon: <LayoutDashboard size={20} /> },
    { label: "Classes", path: "/teacher/classes", icon: <BookOpen size={20} /> },
    { label: "Students", path: "/teacher/students", icon: <Users size={20} /> },
    { label: "Enrollments", path: "/teacher/enrollments", icon: <UserCheck size={20} /> },
    { label: "Tests", path: "/teacher/tests", icon: <FileText size={20} /> },
    { label: "Generate Baseline", path: "/teacher/tests/generate-baseline", icon: <FileText size={20} /> },
    { label: "Profile", path: "/teacher/profile", icon: <User size={20} /> },
  ],
  student: [
    { label: "Dashboard", path: "/student/dashboard", icon: <LayoutDashboard size={20} /> },
    { label: "Tests", path: "/student/tests", icon: <FileText size={20} /> },
    { label: "Report", path: "/student/report", icon: <BarChart3 size={20} /> },
    { label: "Profile", path: "/student/profile", icon: <User size={20} /> },
  ],
  parent: [
    { label: "Dashboard", path: "/parent/dashboard", icon: <LayoutDashboard size={20} /> },
    { label: "Profile", path: "/parent/profile", icon: <User size={20} /> },
  ],
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { role, userName, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!role) return null;

  const navItems = navByRole[role];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-card shadow-surface-md transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <GraduationCap size={20} className="text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold text-foreground">CustomizEd</span>
          <button
            className="ml-auto rounded-lg p-1.5 text-muted-foreground hover:bg-muted lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {item.icon}
                {item.label}
                {isActive && (
                  <ChevronRight size={16} className="ml-auto text-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {userName?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-foreground">{userName}</p>
              <p className="truncate text-xs text-muted-foreground capitalize">{role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center gap-4 border-b border-border bg-card px-4 lg:px-8">
          <button
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <ThemeToggle />
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  const toggle = () => {
    document.documentElement.classList.toggle("dark");
    setDark(!dark);
    localStorage.setItem("theme", !dark ? "dark" : "light");
  };

  return (
    <button
      onClick={toggle}
      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      title="Toggle theme"
    >
      {dark ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      )}
    </button>
  );
}
