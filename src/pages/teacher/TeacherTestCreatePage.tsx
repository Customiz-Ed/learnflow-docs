import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { testApi } from "@/api/testApi";
import { classApi } from "@/api/classApi";
import { normalizeApiError } from "@/features/tests/errors";
import type { TeacherCreateTestPayload } from "@/features/tests/types";
import { PageHeader } from "@/components/ui/page-helpers";
import { motion } from "framer-motion";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface QuestionForm {
  text: string;
  type: "SINGLE" | "MULTI";
  marks: string;
  options: Array<{ text: string; isCorrect: boolean }>;
}

export default function TeacherTestCreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", description: "", classId: "", divisionId: "", duration: "", totalMarks: "", deadline: "",
  });
  const [questions, setQuestions] = useState<QuestionForm[]>([]);

  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: () => classApi.list().then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: () => {
      const payload: TeacherCreateTestPayload = {
        name: form.name,
        description: form.description,
        classId: form.classId,
      };
      if (form.divisionId) payload.divisionId = form.divisionId;
      if (form.duration) payload.duration = parseInt(form.duration);
      if (form.totalMarks) payload.totalMarks = parseInt(form.totalMarks);
      if (form.deadline) payload.deadline = new Date(form.deadline).toISOString();
      if (questions.length) {
        payload.questions = questions.map((q, i) => ({
          text: q.text,
          type: q.type,
          marks: q.marks ? parseInt(q.marks) : undefined,
          order: i + 1,
          options: q.options.map((o, j) => ({ text: o.text, isCorrect: o.isCorrect, order: j + 1 })),
        }));
      }
      return testApi.create(payload);
    },
    onSuccess: (res) => {
      toast.success(res.data.message);
      navigate("/teacher/tests");
    },
    onError: (error) => {
      const normalized = normalizeApiError(error);
      console.error("Create test failed", {
        code: normalized.code,
        status: normalized.status,
        details: normalized.details,
      });
      toast.error(normalized.message || "Failed");
    },
  });

  const addQuestion = () => {
    setQuestions([...questions, { text: "", type: "SINGLE", marks: "", options: [{ text: "", isCorrect: false }, { text: "", isCorrect: false }] }]);
  };

  const removeQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const updateQuestion = <K extends keyof QuestionForm>(idx: number, field: K, value: QuestionForm[K]) => {
    setQuestions(questions.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const addOption = (qIdx: number) => {
    setQuestions(questions.map((q, i) => i === qIdx ? { ...q, options: [...q.options, { text: "", isCorrect: false }] } : q));
  };

  const updateOption = (qIdx: number, oIdx: number, field: "text" | "isCorrect", value: string | boolean) => {
    setQuestions(questions.map((q, qi) =>
      qi === qIdx ? { ...q, options: q.options.map((o, oi) => oi === oIdx ? { ...o, [field]: value } : o) } : q
    ));
  };

  const removeOption = (qIdx: number, oIdx: number) => {
    setQuestions(questions.map((q, qi) =>
      qi === qIdx ? { ...q, options: q.options.filter((_, oi) => oi !== oIdx) } : q
    ));
  };

  return (
    <div>
      <Link to="/teacher/tests" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={16} /> Back to tests
      </Link>
      <PageHeader title="Create Test" description="Build a new test with questions and options." />

      <div className="space-y-6">
        <div className="rounded-xl bg-card p-6 shadow-surface">
          <h3 className="mb-4 font-semibold text-foreground">Test Details</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-foreground">Name *</label>
              <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Midterm Exam"
                className="h-10 w-full rounded-lg bg-muted px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-foreground">Description *</label>
              <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Test description"
                className="w-full rounded-lg bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" rows={3} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Class *</label>
              <select value={form.classId} onChange={(e) => setForm((p) => ({ ...p, classId: e.target.value }))}
                className="h-10 w-full rounded-lg bg-muted px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Select class</option>
                {classes?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Duration (min)</label>
              <input type="number" value={form.duration} onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))} placeholder="30"
                className="h-10 w-full rounded-lg bg-muted px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Total Marks</label>
              <input type="number" value={form.totalMarks} onChange={(e) => setForm((p) => ({ ...p, totalMarks: e.target.value }))} placeholder="100"
                className="h-10 w-full rounded-lg bg-muted px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Deadline</label>
              <input type="datetime-local" value={form.deadline} onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))}
                className="h-10 w-full rounded-lg bg-muted px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="flex items-center justify-between">
          <h3 className="text-heading-3 font-semibold text-foreground">Questions ({questions.length})</h3>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={addQuestion}
            className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground">
            <Plus size={16} /> Add Question
          </motion.button>
        </div>

        {questions.map((q, qIdx) => (
          <motion.div key={qIdx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-card p-6 shadow-surface">
            <div className="flex items-start justify-between">
              <span className="text-sm font-semibold text-muted-foreground">Q{qIdx + 1}</span>
              <button onClick={() => removeQuestion(qIdx)} className="text-muted-foreground hover:text-destructive"><Trash2 size={16} /></button>
            </div>
            <div className="mt-3 space-y-3">
              <input value={q.text} onChange={(e) => updateQuestion(qIdx, "text", e.target.value)} placeholder="Question text"
                className="h-10 w-full rounded-lg bg-muted px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              <div className="flex gap-3">
                <select value={q.type} onChange={(e) => updateQuestion(qIdx, "type", e.target.value as "SINGLE" | "MULTI")}
                  className="h-10 rounded-lg bg-muted px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="SINGLE">Single Choice</option>
                  <option value="MULTI">Multiple Choice</option>
                </select>
                <input type="number" value={q.marks} onChange={(e) => updateQuestion(qIdx, "marks", e.target.value)} placeholder="Marks"
                  className="h-10 w-24 rounded-lg bg-muted px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="space-y-2">
                {q.options.map((opt, oIdx) => (
                  <div key={oIdx} className="flex items-center gap-2">
                    <button onClick={() => updateOption(qIdx, oIdx, "isCorrect", !opt.isCorrect)}
                      className={`h-5 w-5 shrink-0 rounded-full border-2 transition-colors ${
                        opt.isCorrect ? "border-success bg-success" : "border-muted-foreground"
                      }`} />
                    <input value={opt.text} onChange={(e) => updateOption(qIdx, oIdx, "text", e.target.value)} placeholder={`Option ${oIdx + 1}`}
                      className="h-10 flex-1 rounded-lg bg-muted px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                    {q.options.length > 2 && (
                      <button onClick={() => removeOption(qIdx, oIdx)} className="text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                    )}
                  </div>
                ))}
                <button onClick={() => addOption(qIdx)} className="text-sm text-primary hover:underline">+ Add option</button>
              </div>
            </div>
          </motion.div>
        ))}

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={() => createMutation.mutate()}
          disabled={!form.name || !form.description || !form.classId || createMutation.isPending}
          className="flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 font-medium text-primary-foreground disabled:opacity-50">
          {createMutation.isPending ? "Creating..." : "Create Test"}
        </motion.button>
      </div>
    </div>
  );
}
