import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { lsaQuestionApi } from "@/api/lsaQuestionApi";
import { EmptyState, PageHeader } from "@/components/ui/page-helpers";
import type { CreateLsaQuestionRequest, LsaLearningStyle } from "@/types/api.types";

const emptyOption = { text: "", learningStyle: "VISUAL" as LsaLearningStyle, order: 1 };

export default function AdminLsaQuestionsPage() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editOrder, setEditOrder] = useState(1);

  const [form, setForm] = useState<CreateLsaQuestionRequest>({
    text: "",
    order: 1,
    options: [
      { ...emptyOption, order: 1 },
      { ...emptyOption, order: 2 },
    ],
  });

  const query = useQuery({
    queryKey: ["admin-lsa-questions"],
    queryFn: () => lsaQuestionApi.list().then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateLsaQuestionRequest) => lsaQuestionApi.create(payload),
    onSuccess: () => {
      toast.success("LSA question created.");
      setForm({ text: "", order: 1, options: [{ ...emptyOption, order: 1 }, { ...emptyOption, order: 2 }] });
      void query.refetch();
    },
    onError: () => toast.error("Failed to create LSA question."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { isActive?: boolean; text?: string; order?: number } }) =>
      lsaQuestionApi.update(id, payload),
    onSuccess: () => {
      toast.success("Question updated.");
      setEditingId(null);
      void query.refetch();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => lsaQuestionApi.remove(id),
    onSuccess: () => {
      toast.success("Question deleted.");
      void query.refetch();
    },
  });

  const validationError = useMemo(() => {
    if (!form.text.trim()) return "Question text is required.";
    if (form.options.length < 2) return "At least 2 options are required.";
    const hasEmptyOption = form.options.some((o) => !o.text.trim());
    if (hasEmptyOption) return "Option text is required.";
    return null;
  }, [form]);

  const submitCreate = () => {
    if (validationError) {
      toast.error(validationError);
      return;
    }

    createMutation.mutate({
      text: form.text,
      order: form.order,
      options: form.options.map((option, index) => ({
        text: option.text,
        learningStyle: option.learningStyle,
        order: index + 1,
      })),
    });
  };

  return (
    <div>
      <PageHeader title="LSA Question Bank" description="Create, update, deactivate, and delete LSA question bank items." />

      <div className="mb-6 rounded-xl bg-card p-6 shadow-surface">
        <h3 className="font-semibold text-foreground">Create LSA Question</h3>
        <div className="mt-4 space-y-3">
          <input
            value={form.text}
            onChange={(e) => setForm((p) => ({ ...p, text: e.target.value }))}
            placeholder="Question text"
            className="h-10 w-full rounded-lg bg-muted px-3 text-sm"
          />
          <input
            type="number"
            value={form.order}
            onChange={(e) => setForm((p) => ({ ...p, order: Number(e.target.value) || 1 }))}
            className="h-10 w-36 rounded-lg bg-muted px-3 text-sm"
          />

          <div className="space-y-2">
            {form.options.map((option, index) => (
              <div key={index} className="grid gap-2 sm:grid-cols-[1fr_180px_auto]">
                <input
                  value={option.text}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      options: p.options.map((o, i) => (i === index ? { ...o, text: e.target.value } : o)),
                    }))
                  }
                  placeholder={`Option ${index + 1}`}
                  className="h-10 rounded-lg bg-muted px-3 text-sm"
                />
                <select
                  value={option.learningStyle}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      options: p.options.map((o, i) => (i === index ? { ...o, learningStyle: e.target.value as LsaLearningStyle } : o)),
                    }))
                  }
                  className="h-10 rounded-lg bg-muted px-3 text-sm"
                >
                  <option value="VISUAL">VISUAL</option>
                  <option value="AUDITORY">AUDITORY</option>
                  <option value="KINESTHETIC">KINESTHETIC</option>
                </select>
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, options: p.options.filter((_, i) => i !== index) }))}
                  className="rounded-lg px-3 text-sm text-destructive"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              setForm((p) => ({
                ...p,
                options: [...p.options, { ...emptyOption, order: p.options.length + 1 }],
              }))
            }
            className="rounded-lg bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground"
          >
            Add Option
          </button>

          <div>
            <button
              onClick={submitCreate}
              disabled={createMutation.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {createMutation.isPending ? "Saving..." : "Create Question"}
            </button>
          </div>
        </div>
      </div>

      {!query.data?.length ? (
        <EmptyState title="No LSA questions" description="Create questions to bootstrap the LSA test bank." />
      ) : (
        <div className="space-y-3">
          {query.data.map((question) => (
            <div key={question.id} className="rounded-xl bg-card p-5 shadow-surface">
              <div className="flex items-start justify-between gap-3">
                <div>
                  {editingId === question.id ? (
                    <div className="space-y-2">
                      <input value={editText} onChange={(e) => setEditText(e.target.value)} className="h-9 w-full rounded-lg bg-muted px-3 text-sm" />
                      <input type="number" value={editOrder} onChange={(e) => setEditOrder(Number(e.target.value) || 1)} className="h-9 w-28 rounded-lg bg-muted px-3 text-sm" />
                    </div>
                  ) : (
                    <>
                      <p className="font-semibold text-foreground">{question.text}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Order: {question.order}</p>
                    </>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {question.options.map((option) => (
                      <span key={option.id} className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-foreground">
                        {option.text} - {option.learningStyle}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  {editingId === question.id ? (
                    <button
                      onClick={() => updateMutation.mutate({ id: question.id, payload: { text: editText.trim(), order: editOrder } })}
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                    >
                      Save
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingId(question.id);
                        setEditText(question.text);
                        setEditOrder(question.order);
                      }}
                      className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    onClick={() => updateMutation.mutate({ id: question.id, payload: { isActive: !question.isActive } })}
                    className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground"
                  >
                    {question.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(question.id)}
                    className="rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isAxiosError(query.error) && query.error.response?.status === 401 && (
        <p className="mt-4 text-sm text-destructive">Unauthorized. Please log in as admin.</p>
      )}
    </div>
  );
}
