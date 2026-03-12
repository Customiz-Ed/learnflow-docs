import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { testApi } from "@/api/testApi";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Clock, Send } from "lucide-react";
import { toast } from "sonner";

export default function StudentTestAttemptPage() {
  const { id: testId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const { data: test } = useQuery({
    queryKey: ["test", testId],
    queryFn: () => testApi.getById(testId!).then((r) => r.data.data),
    enabled: !!testId,
  });

  const startMutation = useMutation({
    mutationFn: () => testApi.startAttempt({ testId: testId! }),
    onSuccess: (res) => {
      setAttemptId(res.data.data.id);
      if (test?.duration) setTimeLeft(test.duration * 60);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to start"),
  });

  const submitMutation = useMutation({
    mutationFn: () => {
      const answerPayload = Object.entries(answers).flatMap(([qId, optIds]) =>
        optIds.map((optId) => ({ questionId: qId, optionId: optId }))
      );
      return testApi.submitAttempt(attemptId!, { answers: answerPayload });
    },
    onSuccess: () => {
      toast.success("Test submitted successfully!");
      navigate("/student/report");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  // Timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const interval = setInterval(() => setTimeLeft((t) => (t !== null ? t - 1 : null)), 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && attemptId) submitMutation.mutate();
  }, [timeLeft]);

  const questions = test?.questions || [];
  const currentQuestion = questions[currentQ];

  const toggleAnswer = (questionId: string, optionId: string, type: "SINGLE" | "MULTI") => {
    setAnswers((prev) => {
      if (type === "SINGLE") return { ...prev, [questionId]: [optionId] };
      const current = prev[questionId] || [];
      return {
        ...prev,
        [questionId]: current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId],
      };
    });
  };

  if (!test) return <div className="h-40 animate-pulse rounded-xl bg-muted" />;

  // Pre-attempt screen
  if (!attemptId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg rounded-xl bg-card p-8 shadow-surface-md text-center">
          <h1 className="text-heading-2 font-bold text-foreground">{test.name}</h1>
          <p className="mt-2 text-muted-foreground">{test.description}</p>
          <div className="mt-4 flex justify-center gap-6 text-sm text-muted-foreground">
            {test.duration && <span className="flex items-center gap-1"><Clock size={16} /> {test.duration} min</span>}
            <span>{questions.length} questions</span>
            {test.totalMarks && <span>{test.totalMarks} marks</span>}
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => startMutation.mutate()} disabled={startMutation.isPending}
            className="mt-8 rounded-lg bg-primary px-8 py-3 font-medium text-primary-foreground disabled:opacity-50">
            {startMutation.isPending ? "Starting..." : "Begin Test"}
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-heading-3 font-bold text-foreground">{test.name}</h1>
        {timeLeft !== null && (
          <div className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-mono font-semibold tabular-nums ${
            timeLeft < 60 ? "bg-destructive/10 text-destructive" : "bg-muted text-foreground"
          }`}>
            <Clock size={16} /> {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {/* Question nav */}
      <div className="mb-6 flex flex-wrap gap-2">
        {questions.map((q, i) => (
          <button key={q.id} onClick={() => setCurrentQ(i)}
            className={`h-9 w-9 rounded-lg text-sm font-medium transition-all ${
              i === currentQ ? "bg-primary text-primary-foreground" :
              answers[q.id]?.length ? "bg-primary/20 text-primary" :
              "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}>
            {i + 1}
          </button>
        ))}
      </div>

      {/* Question */}
      {currentQuestion && (
        <AnimatePresence mode="wait">
          <motion.div key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", duration: 0.3, bounce: 0 }}
            className="rounded-xl bg-card p-8 shadow-surface">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Question {currentQ + 1} of {questions.length}</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{currentQuestion.type}</span>
            </div>
            <p className="text-lg font-medium text-foreground">{currentQuestion.text}</p>

            <div className="mt-6 space-y-3">
              {currentQuestion.options.map((opt) => {
                const selected = answers[currentQuestion.id]?.includes(opt.id);
                return (
                  <motion.button key={opt.id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    onClick={() => toggleAnswer(currentQuestion.id, opt.id, currentQuestion.type)}
                    className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm transition-all ${
                      selected ? "bg-primary/10 text-primary ring-2 ring-primary" : "bg-muted text-foreground hover:bg-muted/80"
                    }`}>
                    <div className={`h-5 w-5 shrink-0 rounded-full border-2 transition-colors ${
                      selected ? "border-primary bg-primary" : "border-muted-foreground"
                    }`} />
                    {opt.text}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <button onClick={() => setCurrentQ(Math.max(0, currentQ - 1))} disabled={currentQ === 0}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30">
          <ArrowLeft size={16} /> Previous
        </button>

        {currentQ < questions.length - 1 ? (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => setCurrentQ(currentQ + 1)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Next <ArrowRight size={16} />
          </motion.button>
        ) : (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
            <Send size={16} /> {submitMutation.isPending ? "Submitting..." : "Submit Test"}
          </motion.button>
        )}
      </div>
    </div>
  );
}
