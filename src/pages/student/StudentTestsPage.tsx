import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, PageHeader } from "@/components/ui/page-helpers";
import { Button } from "@/components/ui/button";
import { testsApi } from "@/features/tests/api";
import { getUiErrorMessage, normalizeApiError } from "@/features/tests/errors";
import { StudentBaselineTestList } from "@/features/tests/components/StudentBaselineTestList";

export default function StudentTestsPage() {
  const {
    data: baselineSuite,
    isLoading,
    refetch,
    isError,
    error,
  } = useQuery({
    queryKey: ["baseline-suite"],
    queryFn: testsApi.listStudentBaselineTests,
    retry: 1,
  });

  useEffect(() => {
    if (!isError) return;

    const normalized = normalizeApiError(error);
    console.error("Failed to load baseline tests", {
      code: normalized.code,
      status: normalized.status,
      details: normalized.details,
    });
    toast.error(getUiErrorMessage(error, "Unable to load baseline tests."));
  }, [error, isError]);

  return (
    <div>
      <PageHeader
        title="Baseline Tests"
        description="Only active tests are shown here. Open a test to begin your attempt."
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-44 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          title="Unable to load baseline tests"
          description="Please retry in a few moments."
          icon={<FileText size={32} />}
          action={<Button onClick={() => void refetch()}>Retry</Button>}
        />
      ) : !baselineSuite?.tests?.length ? (
        <EmptyState
          title="No active baseline tests assigned"
          description="Your teacher has not published any baseline tests yet."
          icon={<FileText size={32} />}
        />
      ) : (
        <StudentBaselineTestList suite={baselineSuite} />
      )}
    </div>
  );
}
