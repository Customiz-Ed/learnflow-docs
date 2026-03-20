import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TeacherTestDetail, TeacherUpdateTestPayload, TestStatus } from "@/features/tests/types";

interface TeacherTestEditDialogProps {
  open: boolean;
  test: TeacherTestDetail | null;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: TeacherUpdateTestPayload) => void;
}

interface FormState {
  name: string;
  description: string;
  deadline: string;
  duration: string;
  totalMarks: string;
  status: TestStatus;
}

function toInputDateValue(deadline: string | null): string {
  if (!deadline) return "";
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function buildInitialState(test: TeacherTestDetail | null): FormState {
  return {
    name: test?.name || "",
    description: test?.description || "",
    deadline: toInputDateValue(test?.deadline || null),
    duration: test?.duration != null ? String(test.duration) : "",
    totalMarks: test?.totalMarks != null ? String(test.totalMarks) : "",
    status: test?.status || "DRAFT",
  };
}

export function TeacherTestEditDialog({
  open,
  test,
  pending,
  onOpenChange,
  onSave,
}: TeacherTestEditDialogProps) {
  const [form, setForm] = useState<FormState>(() => buildInitialState(test));

  useEffect(() => {
    if (open) {
      setForm(buildInitialState(test));
    }
  }, [open, test]);

  const attemptsExist = (test?.attemptCount || 0) > 0;

  const isUnchanged = useMemo(() => {
    if (!test) return true;

    return (
      form.name.trim() === test.name &&
      form.description.trim() === test.description &&
      (form.duration.trim() || null) === (test.duration != null ? String(test.duration) : null) &&
      (form.totalMarks.trim() || null) === (test.totalMarks != null ? String(test.totalMarks) : null) &&
      form.status === test.status &&
      (form.deadline.trim() || null) === toInputDateValue(test.deadline)
    );
  }, [form, test]);

  const handleSave = () => {
    if (!test) return;

    const payload: TeacherUpdateTestPayload = {
      name: form.name.trim(),
      description: form.description.trim(),
      deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
    };

    if (!attemptsExist) {
      payload.status = form.status;
      payload.duration = form.duration ? Number(form.duration) : undefined;
      payload.totalMarks = form.totalMarks ? Number(form.totalMarks) : undefined;
    }

    onSave(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Test</DialogTitle>
          <DialogDescription>
            Update test details and visibility settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="test-name">Name</Label>
            <Input
              id="test-name"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="test-description">Description</Label>
            <textarea
              id="test-description"
              value={form.description}
              rows={4}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="test-deadline">Deadline</Label>
              <Input
                id="test-deadline"
                type="datetime-local"
                value={form.deadline}
                onChange={(event) => setForm((prev) => ({ ...prev, deadline: event.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="test-status">Status</Label>
              <select
                id="test-status"
                value={form.status}
                disabled={attemptsExist}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, status: event.target.value as TestStatus }))
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="DRAFT">DRAFT</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="test-duration">Duration (minutes)</Label>
              <Input
                id="test-duration"
                type="number"
                min={1}
                disabled={attemptsExist}
                value={form.duration}
                onChange={(event) => setForm((prev) => ({ ...prev, duration: event.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="test-total-marks">Total Marks</Label>
              <Input
                id="test-total-marks"
                type="number"
                min={1}
                disabled={attemptsExist}
                value={form.totalMarks}
                onChange={(event) => setForm((prev) => ({ ...prev, totalMarks: event.target.value }))}
              />
            </div>
          </div>

          {attemptsExist ? (
            <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Destructive fields are locked because attempts already exist for this test.
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={pending || !form.name.trim() || !form.description.trim() || isUnchanged}
          >
            {pending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
