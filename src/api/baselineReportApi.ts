import api from "./axios";
import type {
  ApiResponse,
  StudentBaselineReport,
  TeacherReportStatusPayload,
  TeacherReportStudentDetailPayload,
  TeacherReportStudentsListPayload,
  TriggerSubjectReportPayload,
  TriggerSubjectReportRequest,
  TriggerSuiteReportPayload,
  TriggerSuiteReportRequest,
} from "@/types/api.types";

export const baselineReportApi = {
  listMine: () => api.get<ApiResponse<StudentBaselineReport[]>>("/reports/me/baseline"),
  listTeacherStudents: (params: {
    search?: string;
    suiteType?: "ALL" | "BASELINE" | "MIDLINE" | "ENDLINE";
    classId?: string;
    divisionId?: string;
    page?: number;
    pageSize?: number;
  }) =>
    api.get<ApiResponse<TeacherReportStudentsListPayload>>("/reports/teacher/students", {
      params,
    }),
  getTeacherStudentDetail: (studentId: string, params?: { suiteId?: string; includeContent?: boolean }) =>
    api.get<ApiResponse<TeacherReportStudentDetailPayload>>(
      `/reports/teacher/students/${studentId}`,
      { params },
    ),
  getTeacherReportStatus: (
    studentId: string,
    params: { suiteId: string; subjects?: string; includeCumulative?: boolean },
  ) =>
    api.get<ApiResponse<TeacherReportStatusPayload>>(
      `/reports/teacher/students/${studentId}/reports/status`,
      { params },
    ),
  triggerSubject: (payload: TriggerSubjectReportRequest) =>
    api.post<ApiResponse<TriggerSubjectReportPayload>>("/reports/trigger/subject", payload),
  triggerSuite: (payload: TriggerSuiteReportRequest) =>
    api.post<ApiResponse<TriggerSuiteReportPayload>>("/reports/trigger/suite", payload),
};
