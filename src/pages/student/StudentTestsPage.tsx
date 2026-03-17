import { useMutation, useQuery } from "@tanstack/react-query";
import { testApi } from "@/api/testApi";
import { useNavigate } from "react-router-dom";
import { PageHeader, EmptyState } from "@/components/ui/page-helpers";
import { motion } from "framer-motion";
import { FileText, Clock, ArrowRight } from "lucide-react";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import type { BaselineSubject, BaselineTestCard } from "@/types/api.types";

export default function StudentTestsPage() {
  const navigate = useNavigate();

  const { data: baselineSuite, isLoading, refetch, isError, error } = useQuery({
    queryKey: ["baseline-suite"],
    queryFn: () => testApi.getBaseline().then((r) => r.data.data),
    retry: 1,
  });

  const startAttemptMutation = useMutation({
    mutationFn: (testId: string) => testApi.startAttempt({ testId }),
    onSuccess: (res, testId) => {
      navigate(`/student/tests/${testId}?attemptId=${res.data.data.id}`);
    },
    onError: (err) => {
      if (isAxiosError(err)) {
        const status = err.response?.status;

        if (status === 409) {
          toast.error("Attempt already exists. Refreshing your suite status.");
          void refetch();
          return;
        }

        if (status === 429 || (status !== undefined && status >= 500)) {
          toast.error("Server is busy. Please retry in a moment.");
          return;
        }

        if (status === 401 || status === 403) {
          toast.error("Session expired. Please log in again.");
          return;
        }

        toast.error(err.response?.data?.message || "Failed to start test.");
        return;
      }

      toast.error("Failed to start test.");
    },
  });

  const subjectOrder: BaselineSubject[] = ["ENGLISH", "MATHS", "LSA"];

  const testsBySubject = subjectOrder.map((subject) => ({
    subject,
    test: baselineSuite?.tests.find((item) => item.baselineSubject === subject) || null,
  }));

  const attemptStatusLabel = (test: BaselineTestCard) => {
    if (!test.attempt) return "Not Started";
    if (test.attempt.status === "IN_PROGRESS") return "In Progress";
    return "Submitted";
  };

  return (
    <div>
      <PageHeader title="Baseline Suite" description="Complete ENGLISH, MATHS, and LSA assessments to unlock full reporting." />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-44 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : isError && !(isAxiosError(error) && error.response?.status === 404) ? (
        <EmptyState
          title="Unable to load baseline suite"
          description="Please retry. If this continues, contact your teacher."
          icon={<FileText size={32} />}
          action={<button onClick={() => void refetch()} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Retry</button>}
        />
      ) : !baselineSuite?.tests?.length ? (
        <EmptyState title="No active baseline suite assigned" description="Your teacher has not assigned a baseline suite yet." icon={<FileText size={32} />} />
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl bg-card p-4 text-sm text-muted-foreground shadow-surface">
            Suite Status: <span className="font-semibold text-foreground">{baselineSuite.suiteStatus}</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {testsBySubject.map(({ subject, test }, i) => (
              <motion.div
                key={subject}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-xl bg-card p-6 shadow-surface"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{subject}</span>
                  <span className="text-xs text-muted-foreground">{test ? attemptStatusLabel(test) : "Not Assigned"}</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">{test?.name || `${subject} Baseline`}</h3>
                <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                  {test?.duration && <p className="flex items-center gap-1"><Clock size={14} /> {test.duration} min</p>}
                  {test?.totalMarks !== null && test && <p>{test.totalMarks} marks</p>}
                  <p>Status: {test?.status || "PENDING"}</p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => test && startAttemptMutation.mutate(test.id)}
                  disabled={startAttemptMutation.isPending || !test}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  {!test ? "Not Available" : startAttemptMutation.isPending ? "Starting..." : "Start Test"} <ArrowRight size={16} />
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
