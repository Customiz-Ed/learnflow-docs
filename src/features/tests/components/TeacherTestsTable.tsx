import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { TeacherTestListItem, TestStatus } from "@/features/tests/types";
import { Archive, EyeOff, Loader2, Pencil, Play, Trash2 } from "lucide-react";

interface TeacherTestsTableProps {
  tests: TeacherTestListItem[];
  pendingStatusId: string | null;
  pendingDeleteId: string | null;
  onEdit: (id: string) => void;
  onStatusUpdate: (id: string, status: TestStatus) => void;
  onDelete: (id: string) => void;
}

function getStatusVariant(status: TestStatus): "secondary" | "default" | "outline" {
  if (status === "ACTIVE") return "default";
  if (status === "ARCHIVED") return "outline";
  return "secondary";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

function formatDeadline(deadline: string | null): string {
  return deadline ? formatDate(deadline) : "-";
}

export function TeacherTestsTable({
  tests,
  pendingStatusId,
  pendingDeleteId,
  onEdit,
  onStatusUpdate,
  onDelete,
}: TeacherTestsTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card shadow-surface">
      <table className="min-w-full table-fixed divide-y divide-border">
        <thead className="bg-muted/40">
          <tr>
            <th className="w-[160px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subject</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Class</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Division</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Duration</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Marks</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Deadline</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Created</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-border">
          {tests.map((test) => {
            const statusPending = pendingStatusId === test.id;
            const deletePending = pendingDeleteId === test.id;

            return (
              <tr key={test.id}>
                <td className="w-[160px] px-4 py-3">
                  <div className="max-w-[160px]">
                    <p className="truncate font-medium text-foreground" title={test.name}>{test.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1" title={test.description}>{test.description}</p>
                  </div>
                </td>

                <td className="px-4 py-3">
                  <Badge variant={getStatusVariant(test.status)}>{test.status}</Badge>
                </td>

                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {test.isBaseline ? test.baselineSubject || "BASELINE" : "-"}
                </td>

                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {test.class?.name || test.className || test.classId}
                </td>

                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {test.division?.name || test.divisionName || test.divisionId || "All"}
                </td>

                <td className="px-4 py-3 text-sm text-muted-foreground">{test.duration ?? "-"}</td>

                <td className="px-4 py-3 text-sm text-muted-foreground">{test.totalMarks ?? "-"}</td>

                <td className="px-4 py-3 text-sm text-muted-foreground">{formatDeadline(test.deadline)}</td>

                <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(test.createdAt)}</td>

                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 w-9 p-0"
                      aria-label="Edit test"
                      title="Edit test"
                      onClick={() => onEdit(test.id)}
                    >
                      <Pencil size={16} />
                    </Button>

                    {test.status !== "ACTIVE" ? (
                      <Button
                        size="sm"
                        className="h-9 w-9 p-0"
                        aria-label="Publish test"
                        title="Publish test"
                        disabled={statusPending}
                        onClick={() => onStatusUpdate(test.id, "ACTIVE")}
                      >
                        {statusPending ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-9 w-9 p-0"
                          aria-label="Unpublish test"
                          title="Unpublish test"
                          disabled={statusPending}
                          onClick={() => onStatusUpdate(test.id, "DRAFT")}
                        >
                          {statusPending ? <Loader2 size={16} className="animate-spin" /> : <EyeOff size={16} />}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-9 w-9 p-0"
                          aria-label="Archive test"
                          title="Archive test"
                          disabled={statusPending}
                          onClick={() => onStatusUpdate(test.id, "ARCHIVED")}
                        >
                          {statusPending ? <Loader2 size={16} className="animate-spin" /> : <Archive size={16} />}
                        </Button>
                      </>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-9 w-9 p-0"
                          aria-label="Delete test"
                          title="Delete test"
                          disabled={deletePending}
                        >
                          {deletePending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this test?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. If attempts already exist, deletion will be blocked.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(test.id)}>
                            Confirm Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
