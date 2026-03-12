import { useQuery } from "@tanstack/react-query";
import { studentApi } from "@/api/studentApi";
import { PageHeader, EmptyState, StatCard } from "@/components/ui/page-helpers";
import { motion } from "framer-motion";
import { BarChart3, CheckCircle, Clock } from "lucide-react";

export default function StudentReportPage() {
  const { data: report, isLoading } = useQuery({
    queryKey: ["student-report"],
    queryFn: () => studentApi.getReport().then((r) => r.data.data),
  });

  if (isLoading) return <div className="space-y-4">{[1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}</div>;

  return (
    <div>
      <PageHeader title="My Report" description="Your test performance and progress." />

      {!report?.attempts?.length ? (
        <EmptyState title="No test attempts yet" description="Complete a test to see your report here." icon={<BarChart3 size={32} />} />
      ) : (
        <>
          <div className="mb-8 grid gap-6 sm:grid-cols-3">
            <StatCard label="Tests Taken" value={report.summary.totalAttempts} icon={<CheckCircle size={20} />} />
            <StatCard label="Average Score" value={report.summary.averageScore !== null ? `${Math.round(report.summary.averageScore)}%` : "—"} icon={<BarChart3 size={20} />} />
            <StatCard label="Status" value={report.student.baselineCompleted ? "Baseline Done" : "In Progress"} icon={<Clock size={20} />} />
          </div>

          <h2 className="mb-4 text-heading-3 font-semibold text-foreground">Attempt History</h2>
          <div className="space-y-4">
            {report.attempts.map((attempt, i) => (
              <motion.div key={attempt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="rounded-xl bg-card p-6 shadow-surface">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{attempt.test?.name || "Test"}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {attempt.status} • {new Date(attempt.startedAt).toLocaleDateString()}
                    </p>
                  </div>
                  {attempt.totalScore !== null && (
                    <div className="text-right">
                      <p className="text-2xl font-bold tabular-nums text-primary">{attempt.totalScore}</p>
                      <p className="text-xs text-muted-foreground">score</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
