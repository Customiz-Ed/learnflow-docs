import { useQuery } from "@tanstack/react-query";
import { studentApi } from "@/api/studentApi";
import { enrollmentApi } from "@/api/enrollmentApi";
import { PageHeader, StatCard, EmptyState } from "@/components/ui/page-helpers";
import { motion } from "framer-motion";
import { BarChart3, FileText, CheckCircle, Clock } from "lucide-react";

export default function StudentDashboard() {
  const { data: student } = useQuery({
    queryKey: ["student-me"],
    queryFn: () => studentApi.getMe().then((r) => r.data.data),
  });

  const { data: enrollments } = useQuery({
    queryKey: ["my-enrollments"],
    queryFn: () => enrollmentApi.getMine().then((r) => r.data.data),
  });

  const accepted = enrollments?.find((e) => e.status === "ACCEPTED");
  const pending = enrollments?.filter((e) => e.status === "PENDING");

  return (
    <div>
      <PageHeader title={`Welcome, ${student?.name || "Student"}`} description="Your learning dashboard." />

      {/* Enrollment status */}
      {!accepted && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-xl bg-warning/10 p-6">
          <h3 className="flex items-center gap-2 font-semibold text-warning-foreground">
            <Clock size={20} /> Enrollment Pending
          </h3>
          <p className="mt-1 text-sm text-warning-foreground/80">
            Your enrollment request is waiting for teacher approval. You'll be able to access tests once accepted.
          </p>
          {pending?.map((p) => (
            <div key={p.id} className="mt-3 rounded-lg bg-card p-3 text-sm">
              <p className="text-foreground">Division: {p.division?.name || p.divisionId}</p>
              <p className="text-muted-foreground">Status: {p.status}</p>
            </div>
          ))}
        </motion.div>
      )}

      {accepted && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Grade" value={student?.grade ?? "—"} icon={<BarChart3 size={20} />} />
          <StatCard label="Baseline" value={student?.baselineCompleted ? "Completed" : "Pending"} icon={<CheckCircle size={20} />} />
          <StatCard label="Enrolled" value="✓" icon={<FileText size={20} />} trend="Division active" />
        </div>
      )}
    </div>
  );
}
