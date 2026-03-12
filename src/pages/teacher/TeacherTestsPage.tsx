import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { testApi } from "@/api/testApi";
import { Link } from "react-router-dom";
import { PageHeader, EmptyState } from "@/components/ui/page-helpers";
import { motion } from "framer-motion";
import { FileText, Plus, Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function TeacherTestsPage() {
  const queryClient = useQueryClient();

  const { data: tests, isLoading } = useQuery({
    queryKey: ["teacher-tests"],
    queryFn: () => testApi.list().then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => testApi.remove(id),
    onSuccess: () => {
      toast.success("Test deleted");
      queryClient.invalidateQueries({ queryKey: ["teacher-tests"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  const statusColors: Record<string, string> = {
    DRAFT: "bg-muted text-muted-foreground",
    ACTIVE: "bg-success/10 text-success",
    ARCHIVED: "bg-secondary text-secondary-foreground",
  };

  return (
    <div>
      <PageHeader
        title="Tests"
        description="Create and manage your tests."
        action={
          <Link to="/teacher/tests/new">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">
              <Plus size={18} /> Create Test
            </motion.button>
          </Link>
        }
      />

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : !tests?.length ? (
        <EmptyState title="No tests created yet" description="Let's make the first one." icon={<FileText size={32} />} />
      ) : (
        <div className="space-y-4">
          {tests.map((test, i) => (
            <motion.div key={test.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="group flex items-center gap-4 rounded-xl bg-card p-6 shadow-surface transition-shadow hover:shadow-surface-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText size={20} />
              </div>
              <div className="flex-1">
                <Link to={`/teacher/tests/${test.id}`} className="font-semibold text-foreground hover:text-primary transition-colors">
                  {test.name}
                </Link>
                <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[test.status]}`}>
                    {test.status}
                  </span>
                  {test.duration && <span className="flex items-center gap-1"><Clock size={14} /> {test.duration} min</span>}
                  {test.totalMarks && <span>{test.totalMarks} marks</span>}
                </div>
              </div>
              {test.status === "DRAFT" && (
                <button onClick={() => deleteMutation.mutate(test.id)}
                  className="rounded-lg p-2 text-muted-foreground opacity-0 hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 transition-all">
                  <Trash2 size={16} />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
