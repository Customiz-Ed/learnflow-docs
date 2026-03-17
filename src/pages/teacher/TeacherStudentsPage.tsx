import { useQuery } from "@tanstack/react-query";
import { teacherApi } from "@/api/teacherApi";
import { PageHeader, EmptyState } from "@/components/ui/page-helpers";
import { motion } from "framer-motion";
import { Users } from "lucide-react";

export default function TeacherStudentsPage() {
  const { data: students, isLoading } = useQuery({
    queryKey: ["teacher-students"],
    queryFn: () => teacherApi.getStudents().then((r) => r.data.data),
  });

  return (
    <div>
      <PageHeader title="My Students" description="Students enrolled in your divisions." />
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : !students?.length ? (
        <EmptyState title="No students yet" description="Students will appear here after their enrollment is accepted." icon={<Users size={32} />} />
      ) : (
        <div className="rounded-xl bg-card shadow-surface overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Username</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Class</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Division</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Baseline</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-foreground">{s.name}</td>
                  <td className="px-6 py-4 font-mono text-sm text-muted-foreground">{s.username}</td>
                  <td className="px-6 py-4 text-sm text-foreground">{s.className || "-"}</td>
                  <td className="px-6 py-4 text-sm text-foreground">{s.divisionName || "-"}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      s.baselineCompleted ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                    }`}>
                      {s.baselineCompleted ? "Completed" : "Pending"}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
