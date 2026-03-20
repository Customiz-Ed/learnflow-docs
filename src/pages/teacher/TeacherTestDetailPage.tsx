import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { testsApi } from "@/features/tests/api";
import { getUiErrorMessage, normalizeApiError } from "@/features/tests/errors";
import { PageHeader } from "@/components/ui/page-helpers";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { TestStatus } from "@/features/tests/types";

export default function TeacherTestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: test, isLoading } = useQuery({
    queryKey: ["test", id],
    queryFn: () => testsApi.getTeacherTestById(id as string),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: { status?: TestStatus }) => testsApi.updateTeacherTest(id as string, data),
    onSuccess: () => {
      toast.success("Test updated.");
      queryClient.invalidateQueries({ queryKey: ["test", id] });
      queryClient.invalidateQueries({ queryKey: ["teacher-tests"] });
    },
    onError: (error) => {
      const normalized = normalizeApiError(error);
      console.error("Teacher detail update failed", {
        code: normalized.code,
        status: normalized.status,
        details: normalized.details,
      });
      toast.error(getUiErrorMessage(error, "Failed to update test."));
    },
  });

  if (isLoading) return <div className="h-40 animate-pulse rounded-xl bg-muted" />;
  if (!test) return <p className="text-muted-foreground">Test not found.</p>;

  const statusColors: Record<string, string> = {
    DRAFT: "bg-muted text-muted-foreground",
    ACTIVE: "bg-success/10 text-success",
    ARCHIVED: "bg-secondary text-secondary-foreground",
  };

  return (
    <div>
      <PageHeader
        title={test.name}
        description={test.description}
        action={
          test.status === "DRAFT" ? (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => updateMutation.mutate({ status: "ACTIVE" })}
              disabled={updateMutation.isPending}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">
              Publish Test
            </motion.button>
          ) : test.status === "ACTIVE" ? (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => updateMutation.mutate({ status: "ARCHIVED" })}
              className="rounded-lg bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground">
              Archive Test
            </motion.button>
          ) : null
        }
      />

      <div className="mb-6 flex flex-wrap gap-4">
        <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${statusColors[test.status]}`}>{test.status}</span>
        {test.duration && <span className="text-sm text-muted-foreground">{test.duration} min</span>}
        {test.totalMarks && <span className="text-sm text-muted-foreground">{test.totalMarks} marks</span>}
        {test.deadline && <span className="text-sm text-muted-foreground">Due: {new Date(test.deadline).toLocaleDateString()}</span>}
      </div>

      <h2 className="mb-4 text-heading-3 font-semibold text-foreground">Questions ({test.questions?.length || 0})</h2>
      <div className="space-y-4">
        {test.questions?.map((q, i) => (
          <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="rounded-xl bg-card p-6 shadow-surface">
            <div className="flex items-start justify-between">
              <p className="font-medium text-foreground">
                <span className="mr-2 text-muted-foreground">{i + 1}.</span>{q.text}
              </p>
              <span className="ml-2 shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{q.type}</span>
            </div>
            <div className="mt-3 space-y-2">
              {q.options.map((opt) => (
                <div key={opt.id} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  opt.isCorrect ? "bg-success/10 text-success" : "bg-muted text-foreground"
                }`}>
                  <div className={`h-4 w-4 rounded-full border-2 ${opt.isCorrect ? "border-success bg-success" : "border-muted-foreground"}`} />
                  {opt.text}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
