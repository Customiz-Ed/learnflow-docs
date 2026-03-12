import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { GraduationCap, ArrowRight, Shield, BookOpen, Users, BarChart3 } from "lucide-react";

export default function LandingPage() {
  const roles = [
    { label: "Admin", path: "/admin/login", icon: <Shield size={24} />, desc: "Manage schools, classes, and divisions" },
    { label: "Teacher", path: "/teacher/login", icon: <BookOpen size={24} />, desc: "Create tests, manage students" },
    { label: "Student", path: "/student/login", icon: <Users size={24} />, desc: "Take tests, track your progress" },
    { label: "Parent", path: "/parent/login", icon: <BarChart3 size={24} />, desc: "Monitor your child's learning" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-4 lg:px-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <GraduationCap size={24} className="text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold text-foreground">CustomizEd</span>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", duration: 0.6, bounce: 0 }} className="text-center">
          <h1 className="text-heading-1 font-bold text-foreground">Focus on what matters.</h1>
          <p className="mx-auto mt-4 max-w-lg text-lg text-muted-foreground">
            An AI-powered adaptive education platform that personalizes learning for every student.
          </p>
        </motion.div>

        <div className="mt-12 grid w-full max-w-3xl gap-4 sm:grid-cols-2">
          {roles.map((role, i) => (
            <motion.div key={role.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08, type: "spring", duration: 0.5, bounce: 0 }}>
              <Link to={role.path}>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-4 rounded-xl bg-card p-6 shadow-surface transition-shadow hover:shadow-surface-md">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {role.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{role.label}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">{role.desc}</p>
                  </div>
                  <ArrowRight size={20} className="text-muted-foreground" />
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </main>

      <footer className="px-6 py-6 text-center text-sm text-muted-foreground">
        © 2026 CustomizEd. All rights reserved.
      </footer>
    </div>
  );
}
