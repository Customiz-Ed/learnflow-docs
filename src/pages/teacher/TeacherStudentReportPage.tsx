import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  RefreshCcw,
  Sparkles,
} from "lucide-react";
import { baselineReportApi } from "@/api/baselineReportApi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/page-helpers";
import { startPolling, type PollingController } from "@/lib/polling";
import { reportSuiteLabels } from "@/lib/report-center";
import type {
  BaselineSubject,
  ReportGenerationStatus,
  TeacherReportPreview,
  TeacherReportSuitePreview,
  TeacherReportStudentPreview,
  TriggerSuiteReportPayload,
  TriggerSuiteSubjectResult,
} from "@/types/api.types";

const statusStyles: Record<ReportGenerationStatus, string> = {
  READY: "bg-success/10 text-success",
  QUEUED: "bg-primary/10 text-primary",
  PROCESSING: "bg-primary/10 text-primary",
  FAILED: "bg-destructive/10 text-destructive",
  NOT_STARTED: "bg-muted text-muted-foreground",
};

const statusLabels: Record<ReportGenerationStatus, string> = {
  READY: "Ready",
  QUEUED: "Queued",
  PROCESSING: "Processing",
  FAILED: "Failed",
  NOT_STARTED: "Not started",
};

export default function TeacherStudentReportPage() {
  const { studentId = "" } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const pollRef = useRef<PollingController | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["teacher-report-student", studentId],
    enabled: Boolean(studentId),
    queryFn: () => baselineReportApi.getTeacherStudentDetail(studentId).then((r) => r.data.data),
  });

  const student = useMemo<TeacherReportStudentPreview | null>(() => {
    if (!data) return null;
    return {
      ...data.student,
      suites: data.suites,
    };
  }, [data]);

  const [selectedSuiteId, setSelectedSuiteId] = useState("");
  useEffect(() => {
    if (!data?.suites?.length) return;
    const defaultSuite = data.selectedSuiteId ?? data.suites[0].id;
    if (!selectedSuiteId || !data.suites.some((suite) => suite.id === selectedSuiteId)) {
      setSelectedSuiteId(defaultSuite);
    }
  }, [data, selectedSuiteId]);

  const selectedSuite =
    data?.suites.find((suite) => suite.id === selectedSuiteId) ?? data?.suites[0] ?? null;

  const allSuiteReports = useMemo(
    () =>
      selectedSuite
        ? [...selectedSuite.subjectReports, selectedSuite.cumulativeReport]
        : [],
    [selectedSuite],
  );

  const [activeReportId, setActiveReportId] = useState("");
  useEffect(() => {
    if (!allSuiteReports.length) return;
    if (!activeReportId || !allSuiteReports.some((report) => report.id === activeReportId)) {
      const preferred = allSuiteReports.find((report) => report.status === "READY") ?? allSuiteReports[0];
      setActiveReportId(preferred.id);
    }
  }, [activeReportId, allSuiteReports]);

  const activeReport =
    allSuiteReports.find((report) => report.id === activeReportId) ?? allSuiteReports[0] ?? null;

  const [queuedSubjectKeys, setQueuedSubjectKeys] = useState<string[]>([]);
  const [queuedSuiteIds, setQueuedSuiteIds] = useState<string[]>([]);
  const [suiteTriggerResult, setSuiteTriggerResult] = useState<TriggerSuiteReportPayload | null>(null);

  useEffect(() => {
    return () => {
      pollRef.current?.cancel();
    };
  }, []);

  const beginPolling = (suiteId: string, subjects?: BaselineSubject[], includeCumulative = false) => {
    if (!studentId) return;

    pollRef.current?.cancel();
    pollRef.current = startPolling({
      fetcher: () =>
        baselineReportApi
          .getTeacherReportStatus(studentId, {
            suiteId,
            subjects: subjects?.join(","),
            includeCumulative,
          })
          .then((r) => r.data.data),
      intervalMs: 5000,
      timeoutMs: 180000,
      stopCondition: (payload) => payload.done || payload.pendingCount === 0,
      onTick: (payload) => {
        if (payload.done || payload.pendingCount === 0) {
          pollRef.current?.cancel();
          void refetch();
          toast.success("Report status refreshed.");
        }
      },
      onError: (_err, retryCount) => {
        if (retryCount >= 3) {
          toast.warning("Polling is taking longer than expected. You can refresh shortly.");
        }
      },
    });
  };

  const triggerSubjectMutation = useMutation({
    mutationFn: (payload: { studentId: string; suiteId: string; subject: BaselineSubject }) =>
      baselineReportApi.triggerSubject(payload).then((r) => r.data.data),
    onSuccess: (response, variables) => {
      setQueuedSubjectKeys((prev) => [...new Set([...prev, `${variables.suiteId}:${variables.subject}`])]);
      toast.success(`Subject report queued (${response.job.subject}). Job: ${response.job.id}`);
      beginPolling(variables.suiteId, [variables.subject], false);
      void refetch();
    },
    onError: (mutationError) => {
      if (isAxiosError(mutationError)) {
        toast.error(mutationError.response?.data?.message ?? "Failed to queue subject report.");
        return;
      }
      toast.error("Failed to queue subject report.");
    },
  });

  const triggerSuiteMutation = useMutation({
    mutationFn: (payload: { studentId: string; suiteId: string; includeCumulative?: boolean }) =>
      baselineReportApi.triggerSuite(payload).then((r) => r.data.data),
    onSuccess: (response, variables) => {
      setSuiteTriggerResult(response);
      setQueuedSuiteIds((prev) => [...new Set([...prev, variables.suiteId])]);
      const queuedCount = response.subjectResults.filter((r) => r.queued).length;
      const failedCount = response.subjectResults.length - queuedCount;
      if (failedCount > 0 || (response.cumulativeResult.skipped && !response.cumulativeResult.queued)) {
        toast.warning(`Suite trigger processed: ${queuedCount} queued, ${failedCount} not queued.`);
      } else {
        toast.success("Suite report jobs queued successfully.");
      }
      beginPolling(variables.suiteId, undefined, variables.includeCumulative !== false);
      void refetch();
    },
    onError: (mutationError) => {
      setSuiteTriggerResult(null);
      if (isAxiosError(mutationError)) {
        toast.error(mutationError.response?.data?.message ?? "Failed to trigger suite reports.");
        return;
      }
      toast.error("Failed to trigger suite reports.");
    },
  });

  const handleTriggerReport = (
    currentStudent: TeacherReportStudentPreview,
    suiteId: string,
    report: TeacherReportPreview,
  ) => {
    if (!report.canTrigger) {
      toast.warning(report.statusMessage);
      return;
    }

    if (!report.subject) {
      triggerSuiteMutation.mutate({
        studentId: currentStudent.id,
        suiteId,
        includeCumulative: true,
      });
      return;
    }

    triggerSubjectMutation.mutate({
      studentId: currentStudent.id,
      suiteId,
      subject: report.subject,
    });
  };

  const getReportRunState = (suite: TeacherReportSuitePreview, report: TeacherReportPreview): "idle" | "queueing" | "queued" => {
    if (report.status === "QUEUED" || report.status === "PROCESSING") return "queued";

    if (report.subject && triggerSubjectMutation.isPending && triggerSubjectMutation.variables?.subject === report.subject) {
      return "queueing";
    }

    if (!report.subject && triggerSuiteMutation.isPending) {
      return "queueing";
    }

    if (report.subject && queuedSubjectKeys.includes(`${suite.id}:${report.subject}`)) {
      return "queued";
    }

    if (!report.subject && queuedSuiteIds.includes(suite.id)) {
      return "queued";
    }

    return "idle";
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/teacher/reports")}>
          <ArrowLeft size={16} />
          Back to Reports
        </Button>
        <EmptyState
          title="Unable to load student reports"
          description={isAxiosError(error) ? error.response?.data?.message || "Please try again." : "Please try again."}
        />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/teacher/reports")}>
          <ArrowLeft size={16} />
          Back to Reports
        </Button>
        <EmptyState
          title="Student not found"
          description="This student either does not exist or you do not have access to their reports."
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Button variant="ghost" size="sm" onClick={() => navigate("/teacher/reports")}>
        <ArrowLeft size={16} />
        Back to Reports
      </Button>

      <Card className="border-border/70">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 border border-border">
                <AvatarImage
                  src={student.profilePhotoUrl ?? student.avatarCartoonUrl ?? undefined}
                  alt={student.name}
                />
                <AvatarFallback className="text-base">{getInitials(student.name)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-semibold text-foreground">{student.name}</h1>
                  <Badge variant="outline">Grade {student.grade}</Badge>
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                    {student.className} &middot; {student.divisionName}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  @{student.username} &middot; Readiness {student.reportReadiness}% &middot;{" "}
                  {formatRelativeTime(student.latestReportAt)}
                </p>
              </div>
            </div>
            {selectedSuite && (
              <Button
                size="sm"
                onClick={() =>
                  triggerSuiteMutation.mutate({
                    studentId: student.id,
                    suiteId: selectedSuite.id,
                    includeCumulative: true,
                  })
                }
                disabled={triggerSuiteMutation.isPending || !selectedSuite.cumulativeReport.canTrigger}
              >
                {triggerSuiteMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {triggerSuiteMutation.isPending ? "Queueing suite..." : selectedSuite.cumulativeReport.triggerLabel}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Suites</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {(student.suites || []).map((suite) => (
            <button
              key={suite.id}
              type="button"
              onClick={() => setSelectedSuiteId(suite.id)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                selectedSuite?.id === suite.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/40"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {reportSuiteLabels[suite.suiteType]}
                  </p>
                  <p className="mt-1 font-medium text-foreground">{suite.title}</p>
                </div>
                <Badge variant="outline">{suite.reportsReady}/4</Badge>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {suite.submittedSubjects}/{suite.totalSubjects} submitted &middot;{" "}
                {formatRelativeTime(suite.lastGeneratedAt)}
              </p>
            </button>
          ))}
        </CardContent>
      </Card>

      {selectedSuite && activeReport && (
        <>
          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
            {selectedSuite.subjectReports.map((report) => (
              <ReportTile
                key={report.id}
                report={report}
                active={activeReport.id === report.id}
                onOpen={() => setActiveReportId(report.id)}
                onTrigger={() => handleTriggerReport(student, selectedSuite.id, report)}
                runState={getReportRunState(selectedSuite, report)}
                queueing={triggerSubjectMutation.isPending}
              />
            ))}
            <ReportTile
              report={selectedSuite.cumulativeReport}
              active={activeReport.id === selectedSuite.cumulativeReport.id}
              onOpen={() => setActiveReportId(selectedSuite.cumulativeReport.id)}
              onTrigger={() => handleTriggerReport(student, selectedSuite.id, selectedSuite.cumulativeReport)}
              runState={getReportRunState(selectedSuite, selectedSuite.cumulativeReport)}
              queueing={triggerSuiteMutation.isPending}
            />
          </div>

          {suiteTriggerResult && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Latest Suite Trigger Result</CardTitle>
                <CardDescription>
                  Immediate queue feedback from backend for ENGLISH, MATHS, LSA and cumulative.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {suiteTriggerResult.subjectResults.map((result) => (
                  <SuiteResultRow key={result.subject} label={result.subject} result={result} />
                ))}
                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                  <span className="font-medium text-foreground">CUMULATIVE</span>
                  <span className="text-muted-foreground">
                    {suiteTriggerResult.cumulativeResult.queued
                      ? "Queued"
                      : suiteTriggerResult.cumulativeResult.skipped
                        ? `Skipped: ${suiteTriggerResult.cumulativeResult.reason ?? "Not eligible"}`
                        : suiteTriggerResult.cumulativeResult.error ?? "Not queued"}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-xl">{activeReport.title}</CardTitle>
                  <CardDescription>{activeReport.statusMessage}</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className={statusStyles[activeReport.status]}>
                    {statusLabels[activeReport.status]}
                  </Badge>
                  <Badge variant="outline">{formatRelativeTime(activeReport.generatedAt)}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-3">
                {activeReport.metrics.map((metric) => (
                  <div key={metric.label} className="rounded-xl border border-border bg-muted/40 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {metric.label}
                    </p>
                    <p className="mt-2 font-semibold text-foreground">{metric.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-5 xl:grid-cols-[0.95fr_1.35fr]">
                <div className="rounded-xl border border-border bg-muted/30 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Teacher Notes
                  </p>
                  <div className="mt-4 space-y-2 text-sm text-foreground">
                    {activeReport.highlights.map((highlight) => (
                      <div key={highlight} className="rounded-lg bg-background px-4 py-3">
                        {highlight}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-background p-5">
                  {activeReport.markdownContent ? (
                    <MarkdownRenderer content={activeReport.markdownContent} />
                  ) : (
                    <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-sm text-muted-foreground">
                      {activeReport.statusMessage}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function ReportTile({
  report,
  active,
  onOpen,
  onTrigger,
  runState,
  queueing,
}: {
  report: TeacherReportPreview;
  active: boolean;
  onOpen: () => void;
  onTrigger: () => void;
  runState: "idle" | "queueing" | "queued";
  queueing: boolean;
}) {
  return (
    <Card className={active ? "border-primary bg-primary/5" : "border-border/70"}>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {report.subject ?? "Cumulative"}
            </p>
            <h3 className="mt-1.5 font-semibold leading-tight text-foreground">{report.title}</h3>
          </div>
          <Badge className={`shrink-0 ${statusStyles[report.status]}`}>
            {statusLabels[report.status]}
          </Badge>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">{report.statusMessage}</p>

        <div className="mt-3 space-y-1.5 text-sm">
          {report.metrics.slice(0, 2).map((metric) => (
            <div
              key={metric.label}
              className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
            >
              <span className="text-muted-foreground">{metric.label}</span>
              <span className="font-medium text-foreground">{metric.value}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant={active ? "default" : "outline"} size="sm" onClick={onOpen}>
            <FileText size={13} />
            Open
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={!report.canTrigger || queueing}
            onClick={onTrigger}
          >
            {runState === "queueing" ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            {runState === "queued" ? "Queued" : runState === "queueing" ? "Queueing..." : report.triggerLabel}
          </Button>
        </div>

        {runState === "queued" && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-primary">
            <RefreshCcw size={12} />
            Processing in queue
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SuiteResultRow({
  label,
  result,
}: {
  label: string;
  result: TriggerSuiteSubjectResult;
}) {
  const Icon = result.queued ? CheckCircle2 : AlertCircle;
  return (
    <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <Icon size={14} className={result.queued ? "text-success" : "text-destructive"} />
        {result.queued ? `Queued${result.jobId ? ` (${result.jobId})` : ""}` : result.error ?? "Failed"}
      </span>
    </div>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatRelativeTime(timestamp: string | null) {
  if (!timestamp) return "Pending";
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
}
