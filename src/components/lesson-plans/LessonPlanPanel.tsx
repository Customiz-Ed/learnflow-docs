import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/page-helpers";
import {
  useTeacherStudentLessonPlans,
  useTriggerSubjectLessonPlan,
  useLessonPlanPolling,
} from "@/hooks/useLessonPlanQueries";
import { LessonPlanStudentView } from "./LessonPlanCard";
import type { LessonPlanSubject } from "@/types/api.types";

interface LessonPlanPanelProps {
  studentId: string;
  suiteId?: string;
  /** Whether this panel is currently visible/active */
  isActive?: boolean;
}

/**
 * Lesson Plan Panel component for student report view
 * - Manages polling, triggers, and expansion state
 * - Renders lesson plans with Markdown support
 * - Integrates seamlessly into report tab structure
 */
export function LessonPlanPanel({ studentId, suiteId, isActive = true }: LessonPlanPanelProps) {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  // Initial fetch without content for fast load
  const { data, isLoading, error, isFetching } = useTeacherStudentLessonPlans({
    studentId,
    suiteId,
    includeContent: false,
    enabled: isActive,
  });

  // Fetch content when user expands a subject detail
  const { data: expandedData } = useTeacherStudentLessonPlans({
    studentId,
    suiteId,
    includeContent: true,
    enabled: isActive && !!selectedSubject,
  });

  // Polling hook to auto-update when jobs are in-flight
  const { isLoading: isPolling } = useLessonPlanPolling({
    studentId,
    suiteId,
    includeContent: false,
    pollMs: 5000,
    enabled: isActive && !!data,
  });

  // Trigger lesson plan generation
  const triggerMutation = useTriggerSubjectLessonPlan({
    studentId,
    suiteId,
  });

  useEffect(() => {
    return () => {
      triggerMutation.reset();
    };
  }, []);

  useEffect(() => {
    if (!data?.subjectSummaries?.length) return;
    if (!selectedSubject || !data.subjectSummaries.some((s) => s.subject === selectedSubject)) {
      const preferred =
        data.subjectSummaries.find((s) => s.status === "READY") ??
        data.subjectSummaries.find((s) => s.status === "PROCESSING" || s.status === "QUEUED") ??
        data.subjectSummaries[0];
      setSelectedSubject(preferred.subject);
    }
  }, [data, selectedSubject]);

  const handleTrigger = (subject: LessonPlanSubject) => {
    if (!data) {
      toast.error("Student data not loaded");
      return;
    }

    triggerMutation.mutate(
      { studentId, suiteId: suiteId || data.student.id, subject },
      {
        onError: (err) => {
          if (isAxiosError(err)) {
            const message = err.response?.data?.message;
            if (message?.includes("no submitted attempt")) {
              toast.error(
                `No submitted attempt for ${subject}. Student must submit baseline first.`,
              );
              return;
            }
            toast.error(message || `Failed to trigger ${subject} lesson plan`);
            return;
          }
          toast.error(`Failed to trigger ${subject} lesson plan`);
        },
        onSuccess: () => {
          toast.success(`${subject} lesson plan generation queued`);
        },
      },
    );
  };

  if (!isActive) {
    return null;
  }

  if (error) {
    const errorMessage = isAxiosError(error)
      ? error.response?.data?.message || "Failed to load lesson plans"
      : "Failed to load lesson plans";

    return (
      <EmptyState
        icon="AlertCircle"
        title="Error Loading Lesson Plans"
        description={errorMessage}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-16 animate-pulse rounded-lg bg-muted" />
        <div className="h-40 animate-pulse rounded-lg bg-muted" />
        <div className="h-40 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (!data || !data.subjectSummaries.length) {
    return (
      <EmptyState
        icon="FileText"
        title="No Lesson Plans"
        description="Start by generating baseline reports for this student"
      />
    );
  }

  // Use expandedData for content if available, fall back to initial data
  const displayData = expandedData && selectedSubject ? expandedData : data;

  return (
    <div className="space-y-4">
      <LessonPlanStudentView
        data={displayData}
        isLoading={isLoading}
        isPolling={isPolling}
        isRefetching={isFetching}
        triggeringSubject={triggerMutation.isPending ? (triggerMutation.variables?.subject as LessonPlanSubject) : null}
        onTrigger={handleTrigger}
        expandedSubject={selectedSubject}
        onExpandSubject={setSelectedSubject}
      />
    </div>
  );
}

interface LessonPlanTabsProps {
  studentId: string;
  suiteId?: string;
}

/**
 * Standalone lesson plans tab component
 * Can be used as a tab within a tabbed interface
 */
export function LessonPlanTab({ studentId, suiteId }: LessonPlanTabsProps) {
  return (
    <Tabs defaultValue="lesson-plans" className="w-full">
      <TabsList>
        <TabsTrigger value="lesson-plans">Lesson Plans</TabsTrigger>
      </TabsList>
      <TabsContent value="lesson-plans" className="mt-4">
        <LessonPlanPanel studentId={studentId} suiteId={suiteId} isActive={true} />
      </TabsContent>
    </Tabs>
  );
}
