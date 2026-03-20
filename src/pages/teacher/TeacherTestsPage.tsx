import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, Plus } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { PageHeader, EmptyState } from "@/components/ui/page-helpers";
import { testsApi } from "@/features/tests/api";
import { getUiErrorMessage, normalizeApiError } from "@/features/tests/errors";
import { TeacherTestsTable } from "@/features/tests/components/TeacherTestsTable";
import type { TestStatus } from "@/features/tests/types";

export default function TeacherTestsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | TestStatus>("ALL");
  const [baselineFilter, setBaselineFilter] = useState<"ALL" | "BASELINE" | "NON_BASELINE">("ALL");

  const { data: tests, isLoading } = useQuery({
    queryKey: ["teacher-tests"],
    queryFn: testsApi.listTeacherTests,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TestStatus }) =>
      testsApi.updateTeacherTest(id, { status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["teacher-tests"] });

      const previous = queryClient.getQueryData(["teacher-tests"]);

      queryClient.setQueryData(["teacher-tests"], (existing: typeof tests) => {
        if (!existing) return existing;
        return existing.map((item) => (item.id === id ? { ...item, status } : item));
      });

      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["teacher-tests"], context.previous);
      }

      const normalized = normalizeApiError(error);
      console.error("Status update failed", {
        code: normalized.code,
        status: normalized.status,
        details: normalized.details,
      });

      toast.error(getUiErrorMessage(error, "Unable to update test status."));
    },
    onSuccess: () => {
      toast.success("Test status updated.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-tests"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => testsApi.deleteTeacherTest(id),
    onSuccess: () => {
      toast.success("Test deleted.");
      queryClient.invalidateQueries({ queryKey: ["teacher-tests"] });
    },
    onError: (error) => {
      const normalized = normalizeApiError(error);
      console.error("Delete failed", {
        code: normalized.code,
        status: normalized.status,
        details: normalized.details,
      });
      toast.error(getUiErrorMessage(error, "Unable to delete test."));
    },
  });

  const filteredTests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return (tests || []).filter((test) => {
      const statusMatch = statusFilter === "ALL" || test.status === statusFilter;
      const baselineMatch =
        baselineFilter === "ALL" ||
        (baselineFilter === "BASELINE" ? test.isBaseline : !test.isBaseline);
      const searchMatch = !query || test.name.toLowerCase().includes(query);
      return statusMatch && baselineMatch && searchMatch;
    });
  }, [baselineFilter, search, statusFilter, tests]);

  return (
    <div>
      <PageHeader
        title="Tests"
        description="Create and manage your tests. Students can only access ACTIVE tests."
        action={
          <Link to="/teacher/tests/new">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
            >
              <Plus size={18} />
              Create Test
            </motion.button>
          </Link>
        }
      />

      <div className="mb-5 grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-3">
        <Input
          placeholder="Search by test name"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as "ALL" | TestStatus)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="ALL">All Statuses</option>
          <option value="DRAFT">DRAFT</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="ARCHIVED">ARCHIVED</option>
        </select>

        <select
          value={baselineFilter}
          onChange={(event) =>
            setBaselineFilter(event.target.value as "ALL" | "BASELINE" | "NON_BASELINE")
          }
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="ALL">All Test Types</option>
          <option value="BASELINE">Baseline</option>
          <option value="NON_BASELINE">Non-Baseline</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : !tests?.length ? (
        <EmptyState
          title="No tests created yet"
          description="Create your first test and publish it when ready for students."
          icon={<FileText size={32} />}
        />
      ) : !filteredTests.length ? (
        <EmptyState
          title="No tests match these filters"
          description="Try another status or baseline filter."
          icon={<FileText size={32} />}
        />
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <TeacherTestsTable
            tests={filteredTests}
            pendingStatusId={statusMutation.isPending ? statusMutation.variables?.id || null : null}
            pendingDeleteId={deleteMutation.isPending ? deleteMutation.variables || null : null}
            onEdit={(id) => navigate(`/teacher/tests/${id}/edit`)}
            onStatusUpdate={(id, status) => statusMutation.mutate({ id, status })}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        </motion.div>
      )}
    </div>
  );
}
