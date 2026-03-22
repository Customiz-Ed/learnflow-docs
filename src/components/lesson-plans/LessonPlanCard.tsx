import { format } from "date-fns";
import { AlertCircle, CheckCircle2, FileText, Loader2, RefreshCcw, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import type {
  LessonPlanSubjectSummary,
  LessonPlanUiStatus,
  TeacherStudentLessonPlansData,
} from "@/types/api.types";

const statusStyles: Record<LessonPlanUiStatus, string> = {
  READY: "bg-success/10 text-success border-success/20",
  QUEUED: "bg-primary/10 text-primary border-primary/20",
  PROCESSING: "bg-primary/10 text-primary border-primary/20",
  FAILED: "bg-destructive/10 text-destructive border-destructive/20",
  NOT_STARTED: "bg-muted text-muted-foreground border-muted",
};

const statusLabels: Record<LessonPlanUiStatus, string> = {
  READY: "Ready",
  QUEUED: "Queued",
  PROCESSING: "Processing",
  FAILED: "Failed",
  NOT_STARTED: "Not started",
};

const statusIcons: Record<LessonPlanUiStatus, React.ReactNode> = {
  READY: <CheckCircle2 size={16} />,
  QUEUED: <Sparkles size={16} />,
  PROCESSING: <Loader2 size={16} className="animate-spin" />,
  FAILED: <AlertCircle size={16} />,
  NOT_STARTED: <FileText size={16} />,
};

interface LessonPlanSubjectCardProps {
  subject: LessonPlanSubjectSummary;
  isLoading?: boolean;
  isTriggerPending?: boolean;
  onTrigger?: () => void;
  isActive?: boolean;
  onOpen?: () => void;
}

/**
 * Card component for a single subject's lesson plan
 * Shows status, generated time, trigger button, and optionally detailed content
 */
export function LessonPlanSubjectCard({
  subject,
  isLoading,
  isTriggerPending,
  onTrigger,
  isActive,
  onOpen,
}: LessonPlanSubjectCardProps) {
  const isInFlight = subject.status === "QUEUED" || subject.status === "PROCESSING";
  const isFailed = subject.status === "FAILED";
  const isReady = subject.status === "READY";

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen?.();
        }
      }}
      className={`cursor-pointer transition-all ${isActive ? "ring-2 ring-primary" : ""}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileText size={20} className="text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{subject.subject} Lesson Plan</CardTitle>
              <CardDescription className="text-xs">
                {isReady && subject.generatedAt
                  ? `Generated ${format(new Date(subject.generatedAt), "MMM d, yyyy")}`
                  : subject.status === "NOT_STARTED"
                    ? "Ready to generate"
                    : isInFlight
                      ? "Generating in progress"
                      : ""}
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className={statusStyles[subject.status]}>
            <span className="flex items-center gap-1">
              {statusIcons[subject.status]}
              {statusLabels[subject.status]}
            </span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Show error message if failed */}
        {isFailed && subject.jobError && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <p className="font-medium">Generation failed</p>
            <p className="mt-1 text-xs opacity-90">{subject.jobError}</p>
          </div>
        )}

        {/* Show structured summary preview if ready */}
        {isReady && subject.structuredSummaryJson && (
          <div className="space-y-2 rounded-lg bg-muted/50 p-3 text-sm">
            {subject.structuredSummaryJson.score !== null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Score</span>
                <span className="font-semibold">
                  {subject.structuredSummaryJson.score} / {subject.structuredSummaryJson.percentage}%
                </span>
              </div>
            )}
            {subject.structuredSummaryJson.riskLevel && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Risk Level</span>
                <Badge
                  variant="outline"
                  className={
                    subject.structuredSummaryJson.riskLevel === "HIGH"
                      ? "bg-destructive/10 text-destructive"
                      : subject.structuredSummaryJson.riskLevel === "MEDIUM"
                        ? "bg-yellow-500/10 text-yellow-700"
                        : "bg-success/10 text-success"
                  }
                >
                  {subject.structuredSummaryJson.riskLevel}
                </Badge>
              </div>
            )}
            {subject.structuredSummaryJson.strongTopics?.length > 0 && (
              <div>
                <span className="text-muted-foreground">Strong Topics</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {subject.structuredSummaryJson.strongTopics.map((topic) => (
                    <Badge key={topic} variant="secondary" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {subject.structuredSummaryJson.weakTopics?.length > 0 && (
              <div>
                <span className="text-muted-foreground">Topics to Focus</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {subject.structuredSummaryJson.weakTopics.map((topic) => (
                    <Badge key={topic} variant="outline" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          {subject.canTrigger && !isReady && (
            <Button
              size="sm"
              onClick={onTrigger}
              disabled={isTriggerPending || isLoading}
              className="gap-2"
              variant={isFailed ? "default" : "outline"}
            >
              {isTriggerPending && <Loader2 size={14} className="animate-spin" />}
              {subject.triggerLabel}
            </Button>
          )}
          <Button
            size="sm"
            variant={isActive ? "default" : "outline"}
            onClick={(e) => {
              e.stopPropagation();
              onOpen?.();
            }}
            className="gap-2"
          >
            <FileText size={14} />
            {isActive ? "Opened" : "Open"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface LessonPlanStudentViewProps {
  data: TeacherStudentLessonPlansData;
  isLoading?: boolean;
  isPolling?: boolean;
  isRefetching?: boolean;
  triggeringSubject?: string | null;
  onTrigger?: (subject: "ENGLISH" | "MATHS") => void;
  expandedSubject?: string | null;
  onExpandSubject?: (subject: string | null) => void;
}

/**
 * Main view component showing all lesson plans for a student
 * Includes student info and individual subject cards
 */
export function LessonPlanStudentView({
  data,
  isLoading,
  isPolling,
  isRefetching,
  triggeringSubject,
  onTrigger,
  expandedSubject,
  onExpandSubject,
}: LessonPlanStudentViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-16 animate-pulse rounded-lg bg-muted" />
        <div className="h-40 animate-pulse rounded-lg bg-muted" />
        <div className="h-40 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  const selectedSubjectSummary =
    data.subjectSummaries.find((subject) => subject.subject === expandedSubject) ??
    data.subjectSummaries[0];

  return (
    <div className="space-y-4">
      {/* Student Header */}
      <div className="rounded-lg bg-muted/50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{data.student.name}</h3>
            <p className="text-sm text-muted-foreground">
              {data.student.className} • {data.student.divisionName}
            </p>
          </div>
          {isPolling && (
            <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
              <Loader2 size={12} className="animate-spin" />
              Generating plans...
            </div>
          )}
        </div>
      </div>

      {/* Subject Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {data.subjectSummaries.map((subject) => (
          <LessonPlanSubjectCard
            key={subject.subject}
            subject={subject}
            isLoading={isLoading}
            isTriggerPending={triggeringSubject === subject.subject}
            onTrigger={() => onTrigger?.(subject.subject)}
            isActive={selectedSubjectSummary?.subject === subject.subject}
            onOpen={() => onExpandSubject?.(subject.subject)}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-xl">
                {selectedSubjectSummary.subject} Lesson Plan
              </CardTitle>
              <CardDescription>
                {selectedSubjectSummary.status === "READY" && selectedSubjectSummary.generatedAt
                  ? `Generated ${format(new Date(selectedSubjectSummary.generatedAt), "MMM d, yyyy")}`
                  : selectedSubjectSummary.status === "FAILED"
                    ? "Generation failed. Review the error and retry."
                    : selectedSubjectSummary.status === "NOT_STARTED"
                      ? "Generate this lesson plan to view the full markdown."
                      : "Lesson plan generation is in progress."}
              </CardDescription>
            </div>
            <Badge variant="outline" className={statusStyles[selectedSubjectSummary.status]}>
              <span className="flex items-center gap-1">
                {statusIcons[selectedSubjectSummary.status]}
                {statusLabels[selectedSubjectSummary.status]}
              </span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {selectedSubjectSummary.status === "READY" && selectedSubjectSummary.markdownContent ? (
            <div className="min-h-[28rem] rounded-xl border border-border bg-background p-5">
              <MarkdownRenderer content={selectedSubjectSummary.markdownContent} />
            </div>
          ) : (
            <div className="min-h-[20rem] rounded-xl border border-dashed border-border bg-muted/20 p-6 text-sm text-muted-foreground">
              {selectedSubjectSummary.jobError
                ? selectedSubjectSummary.jobError
                : selectedSubjectSummary.status === "NOT_STARTED"
                  ? "This subject does not have a generated lesson plan yet."
                  : selectedSubjectSummary.status === "FAILED"
                    ? "Lesson plan generation failed. Please retry from the subject card."
                    : "Generation is running. The markdown preview will appear here automatically when ready."}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Refresh indicator */}
      {isRefetching && (
        <div className="text-center text-xs text-muted-foreground">
          Updating...
        </div>
      )}
    </div>
  );
}
