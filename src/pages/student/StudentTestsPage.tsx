import { useQuery } from "@tanstack/react-query";
import { testApi } from "@/api/testApi";
import { Link } from "react-router-dom";
import { PageHeader, EmptyState } from "@/components/ui/page-helpers";
import { motion } from "framer-motion";
import { FileText, Clock, ArrowRight } from "lucide-react";

export default function StudentTestsPage() {
  const { data: baseline, isLoading } = useQuery({
    queryKey: ["baseline-test"],
    queryFn: () => testApi.getBaseline().then((r) => r.data.data),
  });

  return (
    <div>
      <PageHeader title="Tests" description="Your available tests and baseline assessment." />

      {isLoading ? (
        <div className="h-32 animate-pulse rounded-xl bg-muted" />
      ) : !baseline ? (
        <EmptyState title="No baseline test available" description="Your teacher hasn't assigned a baseline test yet. Check back later." icon={<FileText size={32} />} />
      ) : (
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-card p-6 shadow-surface">
            <div className="flex items-start justify-between">
              <div>
                <span className="mb-2 inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">Baseline</span>
                <h3 className="mt-2 text-lg font-semibold text-foreground">{baseline.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{baseline.description}</p>
                <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
                  {baseline.duration && <span className="flex items-center gap-1"><Clock size={14} /> {baseline.duration} min</span>}
                  {baseline.totalMarks && <span>{baseline.totalMarks} marks</span>}
                  <span>{baseline.questions?.length || 0} questions</span>
                </div>
              </div>
              <Link to={`/student/tests/${baseline.id}`}>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">
                  Start <ArrowRight size={16} />
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
