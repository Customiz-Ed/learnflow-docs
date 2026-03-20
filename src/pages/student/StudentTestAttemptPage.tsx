import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Clock, Send } from "lucide-react";
import { toast } from "sonner";
import { baselineReportApi } from "@/api/baselineReportApi";
import { startPolling } from "@/lib/polling";
import { testsApi } from "@/features/tests/api";
import { getUiErrorMessage, normalizeApiError } from "@/features/tests/errors";
import { TestAvailabilityState } from "@/features/tests/components/TestAvailabilityState";

export default function StudentTestAttemptPage() {
  const { id: testId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [attemptId, setAttemptId] = useState<string | null>(searchParams.get("attemptId"));
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submittedScore, setSubmittedScore] = useState<number | null>(null);
  const [reportPollingState, setReportPollingState] = useState<"idle" | "loading" | "success" | "error">("idle");

  const {
    data: test,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["student-test", testId],
    queryFn: () => testsApi.getStudentTestById(testId as string),
    enabled: !!testId,
    retry: 1,
  });

  const isAvailabilityBlocked = isError && normalizeApiError(error).status === 403;

  const startMutation = useMutation({
    mutationFn: () => testsApi.startStudentAttempt(testId as string),
    onSuccess: (attempt) => {
      setAttemptId(attempt.id);
      if (test?.duration) {
        setTimeLeft(test.duration * 60);
      }
    },
    onError: (mutationError) => {
      const normalized = normalizeApiError(mutationError);
      if (normalized.status === 403) {
        queryClient.invalidateQueries({ queryKey: ["baseline-suite"] });
      }
      console.error("Failed to start attempt", {
        code: normalized.code,
        status: normalized.status,
        details: normalized.details,
      });
      toast.error(getUiErrorMessage(mutationError, "Failed to start test."));
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => {
      const answerPayload = Object.entries(answers).flatMap(([questionId, optionIds]) =>
        optionIds.map((optionId) => ({ questionId, optionId })),
      );
      return testsApi.submitStudentAttempt(attemptId as string, { answers: answerPayload });
    },
    onSuccess: (result) => {
      setSubmittedScore(result.totalScore);
      toast.success("Test submitted successfully.");
      setReportPollingState("loading");
    },
    onError: (mutationError) => {
      const normalized = normalizeApiError(mutationError);
      console.error("Failed to submit attempt", {
        code: normalized.code,
        status: normalized.status,
        details: normalized.details,
      });
      toast.error(getUiErrorMessage(mutationError, "Failed to submit test."));
    },
  });

  useEffect(() => {
    if (isError) {
      toast.error(getUiErrorMessage(error, "Unable to load this test."));
    }
  }, [error, isError]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || submitMutation.isSuccess) return;
    const interval = setInterval(() => setTimeLeft((previous) => (previous !== null ? previous - 1 : null)), 1000);
    return () => clearInterval(interval);
  }, [submitMutation.isSuccess, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && attemptId && !submitMutation.isPending && !submitMutation.isSuccess) {
      submitMutation.mutate();
    }
  }, [attemptId, submitMutation, timeLeft]);

  useEffect(() => {
    if (!submitMutation.isSuccess || !test?.baselineSuiteId || !test.baselineSubject) return;

    const controller = startPolling({
      fetcher: async () => {
        const response = await baselineReportApi.listMine();
        return response.data.data;
      },
      intervalMs: 10000,
      timeoutMs: 5 * 60 * 1000,
      stopCondition: (reports) =>
        reports.some(
          (report) =>
            report.baselineSuiteId === test.baselineSuiteId &&
            (report.subject === test.baselineSubject || report.reportScope === "CUMULATIVE"),
        ),
      onTick: (reports) => {
        const hasReport = reports.some(
          (report) =>
            report.baselineSuiteId === test.baselineSuiteId &&
            (report.subject === test.baselineSubject || report.reportScope === "CUMULATIVE"),
        );

        if (hasReport) {
          setReportPollingState("success");
          toast.success("Report generated. Opening reports.");
          navigate("/student/report");
        }
      },
      onError: () => {
        setReportPollingState("error");
      },
    });

    return () => controller.cancel();
  }, [navigate, submitMutation.isSuccess, test?.baselineSubject, test?.baselineSuiteId]);

  const questions = test?.questions || [];
  const currentQuestion = questions[currentQ];

  const toggleAnswer = (questionId: string, optionId: string, type: "SINGLE" | "MULTI") => {
    setAnswers((previous) => {
      if (type === "SINGLE") {
        return { ...previous, [questionId]: [optionId] };
      }

      const current = previous[questionId] || [];
      return {
        ...previous,
        [questionId]: current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId],
      };
    });
  };

  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;

  const summaryText = useMemo(() => {
    if (reportPollingState === "loading") return "Report generation in progress...";
    if (reportPollingState === "error") return "Report generation delayed. Please check Reports page shortly.";
    return "";
  }, [reportPollingState]);

  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-xl bg-muted" />;
  }

  if (isAvailabilityBlocked) {
    return <TestAvailabilityState onBack={() => navigate("/student/tests")} />;
  }

  if (!test) {
    return <p className="text-muted-foreground">This test could not be loaded.</p>;
  }

  if (submittedScore !== null) {
    return (
      <div className="mx-auto max-w-xl rounded-xl bg-card p-8 text-center shadow-surface">
        <h1 className="text-heading-2 font-bold text-foreground">Submission Complete</h1>
        <p className="mt-2 text-muted-foreground">Your immediate score:</p>
        <p className="mt-3 text-4xl font-bold text-primary">{submittedScore}</p>
        {summaryText ? <p className="mt-4 text-sm text-muted-foreground">{summaryText}</p> : null}
        <button
          onClick={() => navigate("/student/report")}
          className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
        >
          Go to Reports
        </button>
      </div>
    );
  }

  if (!attemptId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg rounded-xl bg-card p-8 text-center shadow-surface-md"
        >
          <h1 className="text-heading-2 font-bold text-foreground">{test.name}</h1>
          <p className="mt-2 text-muted-foreground">{test.description}</p>
          <div className="mt-4 flex justify-center gap-6 text-sm text-muted-foreground">
            {test.duration ? (
              <span className="flex items-center gap-1">
                <Clock size={16} /> {test.duration} min
              </span>
            ) : null}
            <span>{questions.length} questions</span>
            {test.totalMarks ? <span>{test.totalMarks} marks</span> : null}
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => startMutation.mutate()}
            disabled={startMutation.isPending}
            className="mt-8 rounded-lg bg-primary px-8 py-3 font-medium text-primary-foreground disabled:opacity-50"
          >
            {startMutation.isPending ? "Starting..." : "Begin Test"}
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-heading-3 font-bold text-foreground">{test.name}</h1>
        {timeLeft !== null ? (
          <div
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-mono font-semibold tabular-nums ${
              timeLeft < 60 ? "bg-destructive/10 text-destructive" : "bg-muted text-foreground"
            }`}
          >
            <Clock size={16} /> {formatTime(timeLeft)}
          </div>
        ) : null}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {questions.map((question, index) => (
          <button
            key={question.id}
            onClick={() => setCurrentQ(index)}
            className={`h-9 w-9 rounded-lg text-sm font-medium transition-all ${
              index === currentQ
                ? "bg-primary text-primary-foreground"
                : answers[question.id]?.length
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {currentQuestion ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", duration: 0.3, bounce: 0 }}
            className="rounded-xl bg-card p-8 shadow-surface"
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Question {currentQ + 1} of {questions.length}
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {currentQuestion.type}
              </span>
            </div>
            <p className="text-lg font-medium text-foreground">{currentQuestion.text}</p>

            <div className="mt-6 space-y-3">
              {currentQuestion.options.map((option) => {
                const selected = answers[currentQuestion.id]?.includes(option.id);
                return (
                  <motion.button
                    key={option.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => toggleAnswer(currentQuestion.id, option.id, currentQuestion.type)}
                    className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm transition-all ${
                      selected
                        ? "bg-primary/10 text-primary ring-2 ring-primary"
                        : "bg-muted text-foreground hover:bg-muted/80"
                    }`}
                  >
                    <div
                      className={`h-5 w-5 shrink-0 rounded-full border-2 transition-colors ${
                        selected ? "border-primary bg-primary" : "border-muted-foreground"
                      }`}
                    />
                    {option.text}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      ) : null}

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
          disabled={currentQ === 0}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30"
        >
          <ArrowLeft size={16} /> Previous
        </button>

        {currentQ < questions.length - 1 ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setCurrentQ(currentQ + 1)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Next <ArrowRight size={16} />
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => submitMutation.mutate()}
            disabled={submitMutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            <Send size={16} /> {submitMutation.isPending ? "Submitting..." : "Submit Test"}
          </motion.button>
        )}
      </div>
    </div>
  );
}
