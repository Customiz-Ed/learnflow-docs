import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { CheckCircle2, FileText, Loader2 } from "lucide-react";
import { baselineSuiteApi } from "@/api/baselineSuiteApi";
import { EmptyState, PageHeader } from "@/components/ui/page-helpers";

export default function TeacherBaselineSuitePage() {
  const { suiteId } = useParams<{ suiteId: string }>();

  const suiteQuery = useQuery({
    queryKey: ["teacher-baseline-suite", suiteId],
    queryFn: () => baselineSuiteApi.getById(suiteId!).then((r) => r.data.data),
    enabled: !!suiteId,
  });

  const subjectStatusQuery = useQuery({
    queryKey: ["teacher-baseline-suite-subject-status", suiteId],
    queryFn: () => baselineSuiteApi.getSubjectStatus(suiteId!).then((r) => r.data.data),
    enabled: !!suiteId,
  });

  const createLsaMutation = useMutation({
    mutationFn: () => baselineSuiteApi.createLsa(suiteId!),
    onSuccess: () => {
      toast.success("LSA test created for this suite.");
      void suiteQuery.refetch();
      void subjectStatusQuery.refetch();
    },
    onError: (err) => {
      if (isAxiosError(err)) {
        if (err.response?.status === 409) {
          toast.error("LSA test already exists. Refreshing suite state.");
          void subjectStatusQuery.refetch();
          return;
        }
        if (err.response?.status === 429 || (err.response?.status && err.response.status >= 500)) {
          toast.error("Server is busy. Retry in a moment.");
          return;
        }
      }
      toast.error("Failed to create LSA test.");
    },
  });

  const readiness = useMemo(() => {
    const status = subjectStatusQuery.data;
    if (!status) return false;
    return !!status.ENGLISH && !!status.MATHS && !!status.LSA;
  }, [subjectStatusQuery.data]);

  if (suiteQuery.isLoading || subjectStatusQuery.isLoading) {
    return <div className="space-y-4">{[1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}</div>;
  }

  if (!suiteQuery.data || !subjectStatusQuery.data) {
    return (
      <EmptyState
        title="Suite not available"
        description="Unable to fetch suite details right now."
        icon={<FileText size={32} />}
      />
    );
  }

  const subjectStatus = subjectStatusQuery.data;

  return (
    <div>
      <PageHeader title="Baseline Suite" description="Monitor ENGLISH and MATHS jobs and create LSA for final readiness." />

      <div className="mb-6 rounded-xl bg-card p-4 shadow-surface">
        <p className="text-sm text-muted-foreground">Suite ID: {suiteQuery.data.id}</p>
        <p className="mt-1 text-sm text-muted-foreground">Current status: <span className="font-semibold text-foreground">{suiteQuery.data.status}</span></p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {(["ENGLISH", "MATHS", "LSA"] as const).map((subject) => {
          const value = subjectStatus[subject];
          return (
            <motion.div key={subject} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-card p-5 shadow-surface">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{subject}</p>
              {value ? (
                <>
                  <p className="mt-2 font-semibold text-foreground">Ready</p>
                  <p className="mt-1 text-xs text-muted-foreground">Test ID: {value.id}</p>
                </>
              ) : (
                <p className="mt-2 font-semibold text-warning">Missing</p>
              )}
            </motion.div>
          );
        })}
      </div>

      {!subjectStatus.LSA && (
        <div className="mt-6 rounded-xl bg-card p-5 shadow-surface">
          <p className="text-sm text-muted-foreground">LSA is missing for this suite.</p>
          <button
            onClick={() => createLsaMutation.mutate()}
            disabled={createLsaMutation.isPending}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {createLsaMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            Create LSA Test
          </button>
        </div>
      )}

      {readiness && (
        <div className="mt-6 rounded-xl bg-success/10 p-4 text-sm text-success">
          Suite is ready: ENGLISH, MATHS, and LSA are all available.
        </div>
      )}

      {!!suiteQuery.data.generationJobs?.length && (
        <div className="mt-6 rounded-xl bg-card p-5 shadow-surface">
          <h3 className="font-semibold text-foreground">Generation Jobs</h3>
          <div className="mt-3 space-y-2">
            {suiteQuery.data.generationJobs.map((job) => (
              <div key={job.id} className="rounded-lg bg-muted p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{job.subject}</span>
                  <span className="text-muted-foreground">{job.status}</span>
                </div>
                {job.errorMessage && <p className="mt-1 text-destructive">{job.errorMessage}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
