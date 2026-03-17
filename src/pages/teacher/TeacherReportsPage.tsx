import { useDeferredValue, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { isAxiosError } from "axios";
import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  ChevronRight,
  GraduationCap,
  Search,
  UserRound,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, EmptyState, StatCard } from "@/components/ui/page-helpers";
import { baselineReportApi } from "@/api/baselineReportApi";
import { reportSuiteLabels } from "@/lib/report-center";
import type { ReportSuiteKind } from "@/types/api.types";

type SuiteFilter = ReportSuiteKind | "ALL";

const suiteFilterOptions: SuiteFilter[] = ["ALL", "BASELINE", "MIDLINE", "ENDLINE"];

export default function TeacherReportsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [suiteFilter, setSuiteFilter] = useState<SuiteFilter>("ALL");
  const deferredSearch = useDeferredValue(searchTerm);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["teacher-report-students", deferredSearch, suiteFilter],
    queryFn: () =>
      baselineReportApi
        .listTeacherStudents({
          search: deferredSearch.trim() || undefined,
          suiteType: suiteFilter,
          page: 1,
          pageSize: 50,
        })
        .then((r) => r.data.data),
    retry: (failureCount, err) => {
      if (isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 401 || status === 403) return false;
      }
      return failureCount < 2;
    },
  });

  const filteredStudents = data?.items ?? [];
  const summaryStats = data?.summary ?? {
    students: 0,
    ready: 0,
    inFlight: 0,
    attention: 0,
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reports"
        description="Select a student to review their report readiness and trigger generation."
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Students"
          value={summaryStats.students}
          icon={<GraduationCap size={20} />}
        />
        <StatCard
          label="Reports Ready"
          value={summaryStats.ready}
          icon={<BadgeCheck size={20} />}
          trend="Available to open"
        />
        <StatCard
          label="In Queue"
          value={summaryStats.inFlight}
          icon={<BarChart3 size={20} />}
          trend="Queued or processing"
        />
        <StatCard
          label="Needs Attention"
          value={summaryStats.attention}
          icon={<AlertTriangle size={20} />}
          trend="Failed or waiting"
        />
      </div>

      {/* Search + filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            placeholder="Search by name, username, class, or division..."
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {suiteFilterOptions.map((option) => (
            <Button
              key={option}
              variant={suiteFilter === option ? "default" : "outline"}
              size="sm"
              onClick={() => setSuiteFilter(option)}
            >
              {option === "ALL" ? "All suites" : reportSuiteLabels[option]}
            </Button>
          ))}
        </div>
      </div>

      {/* Student list */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-muted/40" />
          ))}
        </div>
      )}

      {!isLoading && isError && (
        <EmptyState
          title="Unable to load students"
          description={isAxiosError(error) ? error.response?.data?.message || "Please try again." : "Please try again."}
          icon={<AlertTriangle size={28} />}
        />
      )}

      {!isLoading && !isError && !filteredStudents.length ? (
        <EmptyState
          title="No students match the current filters"
          description="Try widening the search term or clearing the suite filter."
          icon={<UserRound size={28} />}
        />
      ) : !isLoading && !isError ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {filteredStudents.map((student, i) => (
            <button
              key={student.id}
              type="button"
              onClick={() => navigate(`/teacher/reports/${student.id}`)}
              className={`flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/40${
                i > 0 ? " border-t border-border" : ""
              }`}
            >
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage
                  src={student.profilePhotoUrl ?? student.avatarCartoonUrl ?? undefined}
                  alt={student.name}
                />
                <AvatarFallback className="text-sm">{getInitials(student.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-foreground">{student.name}</p>
                  <Badge variant="outline" className="text-xs">
                    Grade {student.grade}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {student.className} &middot; Div {student.divisionName}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">@{student.username}</p>
              </div>
              <div className="hidden shrink-0 items-center gap-6 text-right sm:flex">
                <div>
                  <p className="text-xs text-muted-foreground">Readiness</p>
                  <p className="mt-0.5 font-semibold text-foreground">{student.reportReadiness}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Latest report</p>
                  <p className="mt-0.5 font-semibold text-foreground">
                    {student.latestReportAt
                      ? formatDistanceToNow(new Date(student.latestReportAt), { addSuffix: true })
                      : "Pending"}
                  </p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
