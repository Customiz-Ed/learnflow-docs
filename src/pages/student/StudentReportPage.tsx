import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { formatDistanceToNow } from "date-fns";
import { BarChart3, BookOpenCheck, FileText, Sparkles } from "lucide-react";
import { baselineReportApi } from "@/api/baselineReportApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { EmptyState, PageHeader, StatCard } from "@/components/ui/page-helpers";
import { useAuth } from "@/context/AuthContext";
import {
  reportSubjects,
  reportSuiteLabels,
  type ReportGenerationStatus,
  type ReportPreview,
  type ReportSuitePreview,
} from "@/lib/report-center";
import type { BaselineSubject, StudentBaselineReport } from "@/types/api.types";

const statusStyles: Record<ReportGenerationStatus, string> = {
  READY: "bg-success/10 text-success",
  COMPLETED: "bg-success/10 text-success",
  QUEUED: "bg-primary/10 text-primary",
  VALIDATION: "bg-primary/10 text-primary",
  PROCESSING: "bg-primary/10 text-primary",
  STATUS_UPDATE: "bg-primary/10 text-primary",
  GENERATION: "bg-primary/10 text-primary",
  CALLBACK: "bg-primary/10 text-primary",
  FAILED: "bg-destructive/10 text-destructive",
  NOT_STARTED: "bg-muted text-muted-foreground",
};

const statusLabels: Record<ReportGenerationStatus, string> = {
  READY: "Ready",
  COMPLETED: "Ready",
  QUEUED: "Queued",
  VALIDATION: "Validation",
  PROCESSING: "Processing",
  STATUS_UPDATE: "Status update",
  GENERATION: "Generation",
  CALLBACK: "Callback",
  FAILED: "Failed",
  NOT_STARTED: "Not started",
};

const inFlightReportStatuses: ReportGenerationStatus[] = [
  "QUEUED",
  "VALIDATION",
  "PROCESSING",
  "STATUS_UPDATE",
  "GENERATION",
  "CALLBACK",
];

const isReadyReportStatus = (status: ReportGenerationStatus) => status === "READY" || status === "COMPLETED";

export default function StudentReportPage() {
  const { userName } = useAuth();
  const { data: reports, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["student-baseline-reports"],
    queryFn: () => baselineReportApi.listMine().then((r) => r.data.data),
    refetchInterval: 15000,
    retry: (failureCount, err) => {
      if (isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 404) return false;
      }
      return failureCount < 2;
    },
  });

  const suites = useMemo(() => normalizeLiveReports(reports || []), [reports]);
  const displayName = userName || "Student";

  const [selectedSuiteId, setSelectedSuiteId] = useState(suites[0]?.id ?? "");

  useEffect(() => {
    if (!suites.length) return;
    if (!suites.some((suite) => suite.id === selectedSuiteId)) {
      setSelectedSuiteId(suites[0].id);
    }
  }, [selectedSuiteId, suites]);

  const selectedSuite = suites.find((suite) => suite.id === selectedSuiteId) ?? suites[0] ?? null;
  const allReports = useMemo(
    () => (selectedSuite ? [...selectedSuite.subjectReports, selectedSuite.cumulativeReport] : []),
    [selectedSuite],
  );

  const [activeReportId, setActiveReportId] = useState(allReports[0]?.id ?? "");

  useEffect(() => {
    if (!allReports.length) return;
    if (!allReports.some((report) => report.id === activeReportId)) {
      const preferredReport = allReports.find((report) => isReadyReportStatus(report.status)) ?? allReports[0];
      setActiveReportId(preferredReport.id);
    }
  }, [activeReportId, allReports]);

  const activeReport = allReports.find((report) => report.id === activeReportId) ?? allReports[0] ?? null;

  const totals = useMemo(() => {
    const suiteReports = suites.flatMap((suite) => [...suite.subjectReports, suite.cumulativeReport]);
    return {
      ready: suiteReports.filter((report) => isReadyReportStatus(report.status)).length,
      inFlight: suiteReports.filter((report) => inFlightReportStatuses.includes(report.status)).length,
      pending: suiteReports.filter((report) => report.status === "NOT_STARTED").length,
    };
  }, [suites]);

  if (isLoading) {
    return <div className="space-y-4">{[1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}</div>;
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Reports" description="Track your generated subject and cumulative reports." />
        <EmptyState
          title="Unable to load reports"
          description={isAxiosError(error) ? error.response?.data?.message || "Please try again." : "Please try again."}
          icon={<FileText size={32} />}
          action={
            <Button onClick={() => void refetch()} disabled={isFetching}>
              {isFetching ? "Refreshing..." : "Try again"}
            </Button>
          }
        />
      </div>
    );
  }

  if (!suites.length) {
    return (
      <div>
        <PageHeader title="Baseline Reports" description="Your ENGLISH, MATHS, and LSA baseline report outputs." />
        <EmptyState title="No reports available yet" description="Submit baseline tests to generate subject and cumulative reports." icon={<FileText size={32} />} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Reports"
        description="Track which suites are ready, open subject insights, and understand what to work on next."
        action={
          <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
            <Sparkles size={14} />
            {isFetching ? "Refreshing..." : "Refresh"}
          </Button>
        }
      />

      <Card className="border-border/70 bg-gradient-to-br from-card via-card to-primary/5">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">Report overview</p>
              <h2 className="mt-2 text-3xl font-semibold text-foreground">{displayName}, your learning reports live here.</h2>
              <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
                Students should see a calmer experience than teachers: fewer admin controls, clearer progress, and fast access to the report that matters right now.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background/80 p-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <BookOpenCheck size={16} />
                What to expect
              </div>
              <p className="mt-2 max-w-sm">
                Subject reports appear first. The cumulative report unlocks after all subject attempts are submitted and generated.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Suites" value={suites.length} icon={<BarChart3 size={20} />} />
        <StatCard label="Reports Ready" value={totals.ready} icon={<FileText size={20} />} trend="Available to read now" />
        <StatCard label="Generating" value={totals.inFlight} icon={<Sparkles size={20} />} trend="Still processing" />
        <StatCard label="Pending" value={totals.pending} icon={<BookOpenCheck size={20} />} trend="Waiting on submissions" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Suites</CardTitle>
          <CardDescription>This layout already supports baseline, midline, and endline cycles so students keep the same navigation across the year.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {suites.map((suite) => (
            <button
              key={suite.id}
              type="button"
              onClick={() => setSelectedSuiteId(suite.id)}
              className={`rounded-2xl border p-4 text-left transition-colors ${selectedSuite?.id === suite.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{reportSuiteLabels[suite.suiteType]}</p>
                  <p className="mt-1 font-semibold text-foreground">{suite.title}</p>
                </div>
                <Badge variant="outline">{suite.reportsReady}/4 ready</Badge>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Submissions</p>
                  <p className="mt-1 font-semibold text-foreground">{suite.submittedSubjects}/{suite.totalSubjects}</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Last update</p>
                  <p className="mt-1 font-semibold text-foreground">{formatRelativeTime(suite.lastGeneratedAt)}</p>
                </div>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      {selectedSuite && activeReport ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
            {selectedSuite.subjectReports.map((report) => (
              <StudentReportTile
                key={report.id}
                report={report}
                active={activeReport.id === report.id}
                onOpen={() => setActiveReportId(report.id)}
              />
            ))}
            <StudentReportTile
              report={selectedSuite.cumulativeReport}
              active={activeReport.id === selectedSuite.cumulativeReport.id}
              onOpen={() => setActiveReportId(selectedSuite.cumulativeReport.id)}
            />
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="text-xl">{activeReport.title}</CardTitle>
                  <CardDescription>{activeReport.statusMessage}</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className={statusStyles[activeReport.status]}>{statusLabels[activeReport.status]}</Badge>
                  <Badge variant="outline">{formatRelativeTime(activeReport.generatedAt)}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-3 md:grid-cols-3">
                {activeReport.metrics.map((metric) => (
                  <div key={metric.label} className="rounded-2xl border border-border bg-muted/40 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{metric.label}</p>
                    <p className="mt-2 font-semibold text-foreground">{metric.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 xl:grid-cols-[0.95fr_1.35fr]">
                <div className="rounded-2xl border border-border bg-muted/20 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">What to focus on</p>
                  <div className="mt-4 space-y-3 text-sm text-foreground">
                    {activeReport.highlights.map((highlight) => (
                      <div key={highlight} className="rounded-xl bg-background px-4 py-3">
                        {highlight}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-background p-5">
                  {activeReport.markdownContent ? (
                    <MarkdownRenderer content={activeReport.markdownContent} />
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-sm text-muted-foreground">
                      {activeReport.statusMessage}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-primary/5 p-4 text-sm text-muted-foreground">
                Students do not need manual trigger buttons here. If a report is delayed or failed, the teacher reports page handles regeneration.
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <EmptyState title="No suites available" description="Your reports will appear here as soon as report generation starts." icon={<FileText size={28} />} />
      )}

      <div className="rounded-xl bg-card p-4 text-sm text-muted-foreground shadow-surface">
        <div className="inline-flex items-center gap-2 text-foreground">
          <BarChart3 size={16} />
          Reports refresh automatically after submissions.
        </div>
      </div>
    </div>
  );
}

function StudentReportTile({
  report,
  active,
  onOpen,
}: {
  report: ReportPreview;
  active: boolean;
  onOpen: () => void;
}) {
  return (
    <Card className={`${active ? "border-primary bg-primary/5" : "border-border/70"}`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{report.subject ?? "Cumulative"}</p>
            <h3 className="mt-2 text-lg font-semibold text-foreground">{report.title}</h3>
          </div>
          <Badge className={statusStyles[report.status]}>{statusLabels[report.status]}</Badge>
        </div>

        <p className="mt-3 text-sm text-muted-foreground">{report.statusMessage}</p>

        <div className="mt-4 grid gap-2 text-sm">
          {report.metrics.slice(0, 2).map((metric) => (
            <div key={metric.label} className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2">
              <span className="text-muted-foreground">{metric.label}</span>
              <span className="font-medium text-foreground">{metric.value}</span>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <Button variant={active ? "default" : "outline"} size="sm" onClick={onOpen}>
            <FileText size={14} />
            Open report
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function normalizeLiveReports(reports: StudentBaselineReport[]): ReportSuitePreview[] {
  const groupedReports = new Map<string, StudentBaselineReport[]>();

  reports.forEach((report) => {
    const currentReports = groupedReports.get(report.baselineSuiteId) || [];
    groupedReports.set(report.baselineSuiteId, [...currentReports, report]);
  });

  return Array.from(groupedReports.entries()).map(([suiteId, suiteReports]) => {
    const subjectReports = reportSubjects.map((subject) => {
      const liveReport = suiteReports.find((report) => report.reportScope === "SUBJECT" && report.subject === subject);
      return liveReport ? mapLiveReport(liveReport) : createPendingReport(suiteId, subject);
    });

    const cumulativeLiveReport = suiteReports.find((report) => report.reportScope === "CUMULATIVE");
    const cumulativeReport = cumulativeLiveReport
      ? mapLiveReport(cumulativeLiveReport)
      : {
          id: `${suiteId}-cumulative-pending`,
          reportScope: "CUMULATIVE" as const,
          subject: null,
          title: "Comprehensive Baseline Report",
          status: "NOT_STARTED" as const,
          generatedAt: null,
          markdownContent: "",
          highlights: ["Cumulative insight unlocks when all subject reports are ready."],
          metrics: [{ label: "Ready Subjects", value: `${subjectReports.filter((report) => report.status === "READY").length}/3` }],
          summary: {},
          canTrigger: false,
          triggerLabel: "Generate cumulative",
          statusMessage: "Wait for all subject reports to complete before this report appears.",
        };

    const generatedTimestamps = suiteReports.map((report) => report.generatedAt).filter(Boolean) as string[];
    return {
      id: suiteId,
      suiteType: "BASELINE" as const,
      title: `Baseline Suite ${suiteId.slice(0, 8)}`,
      className: "Assigned class",
      divisionName: "Assigned division",
      academicYear: "Current cycle",
      submittedSubjects: subjectReports.filter((report) => report.status === "READY").length,
      totalSubjects: 3,
      reportsReady: [...subjectReports, cumulativeReport].filter((report) => report.status === "READY").length,
      lastGeneratedAt: generatedTimestamps.sort().at(-1) ?? null,
      subjectReports,
      cumulativeReport,
    };
  });
}

function mapLiveReport(report: StudentBaselineReport): ReportPreview {
  const parsedSummary = parseSummary(report.structuredSummaryJson);
  const metricAndHighlights = deriveSummaryPresentation(parsedSummary, report.subject);

  return {
    id: report.id,
    reportScope: report.reportScope,
    subject: report.subject,
    title: report.reportScope === "CUMULATIVE"
      ? "Comprehensive Baseline Report"
      : report.subject === "LSA"
        ? "Learning Style Assessment"
        : `${report.subject} Baseline Report`,
    status: "READY",
    generatedAt: report.generatedAt,
    markdownContent: report.markdownContent,
    highlights: metricAndHighlights.highlights,
    metrics: metricAndHighlights.metrics,
    summary: parsedSummary,
    canTrigger: false,
    triggerLabel: "Generate report",
    statusMessage: "This report is ready to read.",
  };
}

function createPendingReport(suiteId: string, subject: BaselineSubject): ReportPreview {
  return {
    id: `${suiteId}-${subject.toLowerCase()}-pending`,
    reportScope: "SUBJECT",
    subject,
    title: subject === "LSA" ? "Learning Style Assessment" : `${subject} Baseline Report`,
    status: "NOT_STARTED",
    generatedAt: null,
    markdownContent: "",
    highlights: [`${subject} report will appear here after submission and generation.`],
    metrics: [{ label: "Status", value: "Waiting" }],
    summary: {},
    canTrigger: false,
    triggerLabel: "Generate report",
    statusMessage: "This subject report is not ready yet.",
  };
}

function parseSummary(rawSummary: string | null): Record<string, unknown> {
  if (!rawSummary) return {};

  try {
    const parsed = JSON.parse(rawSummary);
    return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function deriveSummaryPresentation(summary: Record<string, unknown>, subject: BaselineSubject | null): { metrics: Array<{ label: string; value: string }>; highlights: string[] } {
  const metrics: Array<{ label: string; value: string }> = [];
  const highlights: string[] = [];

  const strongTopics = Array.isArray(summary.strongTopics) ? summary.strongTopics as Array<Record<string, unknown>> : [];
  const weakTopics = Array.isArray(summary.weakTopics) ? summary.weakTopics as Array<Record<string, unknown>> : [];
  const focusAreas = Array.isArray(summary.focusAreas) ? summary.focusAreas as string[] : [];
  const integratedInsights = Array.isArray(summary.integratedInsights) ? summary.integratedInsights as string[] : [];
  const dominantStyle = typeof summary.dominantStyle === "string" ? summary.dominantStyle : null;

  if (dominantStyle) {
    metrics.push({ label: "Dominant Style", value: dominantStyle });
    highlights.push(`Your strongest learning style signal is ${dominantStyle.toLowerCase()}.`);
  }

  if (strongTopics[0]?.topicName && typeof strongTopics[0].topicName === "string") {
    metrics.push({ label: "Strongest Topic", value: strongTopics[0].topicName });
    highlights.push(`${strongTopics[0].topicName} is currently a strong area.`);
  }

  if (weakTopics[0]?.topicName && typeof weakTopics[0].topicName === "string") {
    metrics.push({ label: "Main Focus", value: weakTopics[0].topicName });
    highlights.push(`Spend extra practice time on ${weakTopics[0].topicName.toLowerCase()}.`);
  }

  if (focusAreas[0]) {
    highlights.push(`Recommended focus: ${focusAreas[0]}.`);
  }

  if (integratedInsights[0]) {
    highlights.push(integratedInsights[0]);
  }

  if (!metrics.length) {
    metrics.push({ label: "Report Type", value: subject ?? "Cumulative" });
  }

  if (!highlights.length) {
    highlights.push("Detailed guidance will appear here once structured report summaries are connected.");
  }

  return { metrics: metrics.slice(0, 3), highlights: highlights.slice(0, 3) };
}

function formatRelativeTime(timestamp: string | null) {
  if (!timestamp) return "Pending";
  return `${formatDistanceToNow(new Date(timestamp), { addSuffix: true })}`;
}
