import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { testsApi } from "@/features/tests/api";
import { classApi } from "@/api/classApi";
import { getUiErrorMessage, normalizeApiError } from "@/features/tests/errors";
import { buildTeacherUpdatePayload, validateQuestions } from "@/features/tests/teacherTestEditUtils";
import type {
  TeacherEditableQuestion,
  TeacherUpdateTestPayload,
  TestStatus,
} from "@/features/tests/types";
import { PageHeader } from "@/components/ui/page-helpers";

interface QuestionForm {
  id?: string;
  text: string;
  type: "SINGLE" | "MULTI";
  marks: string;
  options: Array<{ id?: string; text: string; isCorrect: boolean }>;
}

interface FormState {
  name: string;
  description: string;
  classId: string;
  divisionId: string;
  duration: string;
  totalMarks: string;
  deadline: string;
  status: TestStatus;
}

function toInputDateValue(deadline: string | null): string {
  if (!deadline) return "";
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default function TeacherTestEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<FormState | null>(null);
  const [questions, setQuestions] = useState<QuestionForm[]>([]);
  const [initialForm, setInitialForm] = useState<FormState | null>(null);
  const [initialQuestions, setInitialQuestions] = useState<TeacherEditableQuestion[]>([]);

  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: () => classApi.list().then((response) => response.data.data),
  });

  const { data: test, isLoading } = useQuery({
    queryKey: ["teacher-test", id],
    queryFn: () => testsApi.getTeacherTestById(id as string),
    enabled: !!id,
  });

  useEffect(() => {
    if (!test) return;

    setForm({
      name: test.name,
      description: test.description,
      classId: test.classId,
      divisionId: test.divisionId || "",
      duration: test.duration != null ? String(test.duration) : "",
      totalMarks: test.totalMarks != null ? String(test.totalMarks) : "",
      deadline: toInputDateValue(test.deadline),
      status: test.status,
    });

    setInitialForm({
      name: test.name,
      description: test.description,
      classId: test.classId,
      divisionId: test.divisionId || "",
      duration: test.duration != null ? String(test.duration) : "",
      totalMarks: test.totalMarks != null ? String(test.totalMarks) : "",
      deadline: toInputDateValue(test.deadline),
      status: test.status,
    });

    setQuestions(
      (test.questions || []).map((question) => ({
        id: question.id,
        text: question.text,
        type: question.type,
        marks: question.marks != null ? String(question.marks) : "",
        options: question.options.map((option) => ({
          id: option.id,
          text: option.text,
          isCorrect: option.isCorrect,
        })),
      })),
    );

    setInitialQuestions(
      (test.questions || []).map((question, questionIndex) => ({
        id: question.id,
        text: question.text,
        type: question.type,
        marks: question.marks,
        order: question.order || questionIndex + 1,
        options: question.options.map((option, optionIndex) => ({
          id: option.id,
          text: option.text,
          isCorrect: option.isCorrect,
          order: option.order || optionIndex + 1,
        })),
      })),
    );
  }, [test]);

  const attemptsExist = (test?.attemptCount || 0) > 0;

  const updateMutation = useMutation({
    mutationFn: (payload: TeacherUpdateTestPayload) => testsApi.updateTeacherTest(id as string, payload),
    onSuccess: () => {
      toast.success("Test updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["teacher-tests"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-test", id] });
      navigate("/teacher/tests");
    },
    onError: (error) => {
      const normalized = normalizeApiError(error);
      console.error("Failed to update test", {
        code: normalized.code,
        status: normalized.status,
        details: normalized.details,
      });
      toast.error(getUiErrorMessage(error, "Unable to update test."));
    },
  });

  const addQuestion = () => {
    setQuestions((previous) => [
      ...previous,
      {
        text: "",
        type: "SINGLE",
        marks: "",
        options: [
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ],
      },
    ]);
  };

  const removeQuestion = (questionIndex: number) => {
    setQuestions((previous) => previous.filter((_, index) => index !== questionIndex));
  };

  const updateQuestion = <K extends keyof QuestionForm>(
    questionIndex: number,
    field: K,
    value: QuestionForm[K],
  ) => {
    setQuestions((previous) =>
      previous.map((question, index) =>
        index === questionIndex ? { ...question, [field]: value } : question,
      ),
    );
  };

  const addOption = (questionIndex: number) => {
    setQuestions((previous) =>
      previous.map((question, index) =>
        index === questionIndex
          ? { ...question, options: [...question.options, { text: "", isCorrect: false }] }
          : question,
      ),
    );
  };

  const updateOption = (
    questionIndex: number,
    optionIndex: number,
    field: "text" | "isCorrect",
    value: string | boolean,
  ) => {
    setQuestions((previous) =>
      previous.map((question, qIndex) =>
        qIndex === questionIndex
          ? {
              ...question,
              options: question.options.map((option, oIndex) =>
                oIndex === optionIndex ? { ...option, [field]: value } : option,
              ),
            }
          : question,
      ),
    );
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    setQuestions((previous) =>
      previous.map((question, qIndex) =>
        qIndex === questionIndex
          ? { ...question, options: question.options.filter((_, index) => index !== optionIndex) }
          : question,
      ),
    );
  };

  const preparedQuestions = useMemo<TeacherEditableQuestion[]>(() => {
    return questions.map((question, questionIndex) => ({
      id: question.id,
      text: question.text,
      type: question.type,
      marks: question.marks ? Number(question.marks) : undefined,
      order: questionIndex + 1,
      options: question.options.map((option, optionIndex) => ({
        id: option.id,
        text: option.text,
        isCorrect: option.isCorrect,
        order: optionIndex + 1,
      })),
    }));
  }, [questions]);

  const handleSave = () => {
    if (!form || !initialForm) return;

    if (!attemptsExist) {
      const validationError = validateQuestions(preparedQuestions);
      if (validationError) {
        toast.error(validationError);
        return;
      }
    }

    const payload = buildTeacherUpdatePayload({
      currentForm: form,
      initialForm,
      preparedQuestions,
      initialQuestions,
      attemptsExist,
    });

    if (Object.keys(payload).length === 0) {
      toast.info("No changes to save.");
      return;
    }

    updateMutation.mutate(payload);
  };

  if (isLoading || !form) {
    return <div className="h-40 animate-pulse rounded-xl bg-muted" />;
  }

  return (
    <div>
      <Link to="/teacher/tests" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={16} /> Back to tests
      </Link>

      <PageHeader
        title="Edit Test"
        description="Update test details, questions, options, and marks."
      />

      {attemptsExist ? (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Attempts already exist. You can only edit name, description, and deadline.
        </div>
      ) : null}

      <div className="space-y-6">
        <div className="rounded-xl bg-card p-6 shadow-surface">
          <h3 className="mb-4 font-semibold text-foreground">Test Details</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-foreground">Name *</label>
              <input
                value={form.name}
                onChange={(event) => setForm((previous) => previous ? { ...previous, name: event.target.value } : previous)}
                className="h-10 w-full rounded-lg bg-muted px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-foreground">Description *</label>
              <textarea
                value={form.description}
                rows={3}
                onChange={(event) => setForm((previous) => previous ? { ...previous, description: event.target.value } : previous)}
                className="w-full rounded-lg bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Class *</label>
              <select
                value={form.classId}
                disabled
                className="h-10 w-full rounded-lg bg-muted px-3 text-sm text-foreground opacity-80"
              >
                {classes?.map((classItem) => (
                  <option key={classItem.id} value={classItem.id}>{classItem.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Status</label>
              <select
                value={form.status}
                disabled={attemptsExist}
                onChange={(event) =>
                  setForm((previous) => previous ? { ...previous, status: event.target.value as TestStatus } : previous)
                }
                className="h-10 w-full rounded-lg bg-muted px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
              >
                <option value="DRAFT">DRAFT</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Duration (min)</label>
              <input
                type="number"
                min={1}
                value={form.duration}
                disabled={attemptsExist}
                onChange={(event) => setForm((previous) => previous ? { ...previous, duration: event.target.value } : previous)}
                className="h-10 w-full rounded-lg bg-muted px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Total Marks</label>
              <input
                type="number"
                min={1}
                value={form.totalMarks}
                disabled={attemptsExist}
                onChange={(event) => setForm((previous) => previous ? { ...previous, totalMarks: event.target.value } : previous)}
                className="h-10 w-full rounded-lg bg-muted px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Deadline</label>
              <input
                type="datetime-local"
                value={form.deadline}
                onChange={(event) => setForm((previous) => previous ? { ...previous, deadline: event.target.value } : previous)}
                className="h-10 w-full rounded-lg bg-muted px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-heading-3 font-semibold text-foreground">Questions ({questions.length})</h3>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={addQuestion}
            disabled={attemptsExist}
            className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground disabled:opacity-60"
          >
            <Plus size={16} /> Add Question
          </motion.button>
        </div>

        {questions.map((question, questionIndex) => (
          <motion.div key={question.id || questionIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-card p-6 shadow-surface">
            <div className="flex items-start justify-between">
              <span className="text-sm font-semibold text-muted-foreground">Q{questionIndex + 1}</span>
              <button
                onClick={() => removeQuestion(questionIndex)}
                disabled={attemptsExist}
                className="text-muted-foreground hover:text-destructive disabled:opacity-60"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <input
                value={question.text}
                disabled={attemptsExist}
                onChange={(event) => updateQuestion(questionIndex, "text", event.target.value)}
                placeholder="Question text"
                className="h-10 w-full rounded-lg bg-muted px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
              />

              <div className="flex gap-3">
                <select
                  value={question.type}
                  disabled={attemptsExist}
                  onChange={(event) => updateQuestion(questionIndex, "type", event.target.value as "SINGLE" | "MULTI")}
                  className="h-10 rounded-lg bg-muted px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                >
                  <option value="SINGLE">Single Choice</option>
                  <option value="MULTI">Multiple Choice</option>
                </select>

                <input
                  type="number"
                  value={question.marks}
                  min={0}
                  disabled={attemptsExist}
                  onChange={(event) => updateQuestion(questionIndex, "marks", event.target.value)}
                  placeholder="Marks"
                  className="h-10 w-24 rounded-lg bg-muted px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                />
              </div>

              <div className="space-y-2">
                {question.options.map((option, optionIndex) => (
                  <div key={option.id || optionIndex} className="flex items-center gap-2">
                    <button
                      onClick={() => updateOption(questionIndex, optionIndex, "isCorrect", !option.isCorrect)}
                      disabled={attemptsExist}
                      className={`h-5 w-5 shrink-0 rounded-full border-2 transition-colors disabled:opacity-60 ${
                        option.isCorrect ? "border-success bg-success" : "border-muted-foreground"
                      }`}
                    />
                    <input
                      value={option.text}
                      disabled={attemptsExist}
                      onChange={(event) => updateOption(questionIndex, optionIndex, "text", event.target.value)}
                      placeholder={`Option ${optionIndex + 1}`}
                      className="h-10 flex-1 rounded-lg bg-muted px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                    />
                    {question.options.length > 2 ? (
                      <button
                        onClick={() => removeOption(questionIndex, optionIndex)}
                        disabled={attemptsExist}
                        className="text-muted-foreground hover:text-destructive disabled:opacity-60"
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : null}
                  </div>
                ))}

                <button
                  onClick={() => addOption(questionIndex)}
                  disabled={attemptsExist}
                  className="text-sm text-primary hover:underline disabled:opacity-60"
                >
                  + Add option
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={!form.name || !form.description || updateMutation.isPending}
          className="flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 font-medium text-primary-foreground disabled:opacity-50"
        >
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </motion.button>
      </div>
    </div>
  );
}
