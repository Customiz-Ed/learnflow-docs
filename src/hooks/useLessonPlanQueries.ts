import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { lessonPlanApi } from "@/api/lessonPlanApi";
import type {
  LessonPlanUiStatus,
  TriggerSubjectLessonPlanRequest,
  TeacherStudentLessonPlansData,
} from "@/types/api.types";

// Query key constants
export const lessonPlanKeys = {
  all: ["lessonPlans"] as const,
  student: (studentId: string, suiteId?: string, includeContent?: boolean) =>
    ["lessonPlans", "student", studentId, suiteId ?? "all", includeContent ?? false] as const,
};

const TERMINAL_STATUSES: LessonPlanUiStatus[] = ["READY", "FAILED", "NOT_STARTED"];

/**
 * Hook to fetch lesson plans for a student
 * - Supports polling with refetchInterval
 * - Use includeContent=false for initial fast load
 * - Use includeContent=true when viewing detailed content
 */
export function useTeacherStudentLessonPlans(args: {
  studentId: string;
  suiteId?: string;
  includeContent?: boolean;
  enabled?: boolean;
}) {
  const { studentId, suiteId, includeContent = false, enabled = true } = args;

  return useQuery({
    queryKey: lessonPlanKeys.student(studentId, suiteId, includeContent),
    queryFn: () =>
      lessonPlanApi
        .getTeacherStudentLessonPlans(studentId, { suiteId, includeContent })
        .then((r) => r.data.data),
    enabled: enabled && !!studentId,
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to trigger lesson plan generation for a subject
 * - Automatically invalidates queries after success
 * - Provides mutation state (isPending, isError, etc.)
 */
export function useTriggerSubjectLessonPlan(args: {
  studentId: string;
  suiteId?: string;
  onSuccess?: (data: TeacherStudentLessonPlansData) => void;
}) {
  const qc = useQueryClient();
  const { studentId, suiteId, onSuccess } = args;

  return useMutation({
    mutationFn: (payload: TriggerSubjectLessonPlanRequest) =>
      lessonPlanApi.triggerSubject(payload).then((r) => r.data.data),
    onSuccess: () => {
      // Invalidate both non-content and content versions so they refetch
      qc.invalidateQueries({
        queryKey: lessonPlanKeys.student(studentId, suiteId, false),
      });
      qc.invalidateQueries({
        queryKey: lessonPlanKeys.student(studentId, suiteId, true),
      });

      // Fetch fresh data immediately
      qc.refetchQueries({
        queryKey: lessonPlanKeys.student(studentId, suiteId, false),
      });

      if (onSuccess) {
        // Call onSuccess after refetch
        setTimeout(() => {
          const data = qc.getQueryData<TeacherStudentLessonPlansData>(
            lessonPlanKeys.student(studentId, suiteId, false),
          );
          if (data) onSuccess(data);
        }, 0);
      }
    },
  });
}

/**
 * Hook to poll lesson plan status until all jobs complete
 * - Automatically stops polling when no QUEUED/PROCESSING subjects remain
 * - Useful for real-time updates during job processing
 */
export function useLessonPlanPolling(args: {
  studentId: string;
  suiteId?: string;
  includeContent?: boolean;
  pollMs?: number;
  enabled?: boolean;
}) {
  const { studentId, suiteId, includeContent = false, pollMs = 7000, enabled = true } = args;

  return useQuery({
    queryKey: lessonPlanKeys.student(studentId, suiteId, includeContent),
    queryFn: () =>
      lessonPlanApi
        .getTeacherStudentLessonPlans(studentId, { suiteId, includeContent })
        .then((r) => r.data.data),
    refetchInterval: (q) => {
      // Don't refetch if query disabled
      if (!enabled) return false;

      const data = q.state.data;
      if (!data) return pollMs;

      // Check if any subject is still in-flight (QUEUED or PROCESSING)
      const hasInFlight = data.subjectSummaries.some(
        (s) => s.status === "QUEUED" || s.status === "PROCESSING",
      );

      // Stop polling once all jobs are terminal
      return hasInFlight ? pollMs : false;
    },
    enabled: enabled && !!studentId,
  });
}
