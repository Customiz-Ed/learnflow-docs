import api from "./axios";
import type { ApiResponse, BaselineSuiteTeacherView, SubjectStatusPayload } from "@/types/api.types";

export const baselineSuiteApi = {
  getById: (suiteId: string) =>
    api.get<ApiResponse<BaselineSuiteTeacherView>>(`/baseline-suites/${suiteId}`),

  getSubjectStatus: (suiteId: string) =>
    api.get<ApiResponse<SubjectStatusPayload>>(`/baseline-suites/${suiteId}/subject-status`),

  createLsa: (suiteId: string) =>
    api.post<ApiResponse<{ id: string }>>(`/baseline-suites/${suiteId}/lsa`, {}),
};
