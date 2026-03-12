import api from "./axios";
import type { ApiResponse, Test, TestAttempt } from "@/types/api.types";

interface TestCreateData {
  name: string;
  description: string;
  classId: string;
  divisionId?: string;
  duration?: number;
  totalMarks?: number;
  deadline?: string;
  questions?: Array<{
    text: string;
    type: "SINGLE" | "MULTI";
    marks?: number;
    order: number;
    options: Array<{ text: string; isCorrect: boolean; order: number }>;
  }>;
}

export const testApi = {
  create: (data: TestCreateData) =>
    api.post<ApiResponse<Test>>("/tests", data),

  list: () =>
    api.get<ApiResponse<Test[]>>("/tests"),

  getById: (id: string) =>
    api.get<ApiResponse<Test>>(`/tests/${id}`),

  update: (id: string, data: Partial<Pick<Test, "name" | "description" | "duration" | "totalMarks" | "deadline" | "status">>) =>
    api.patch<ApiResponse<Test>>(`/tests/${id}`, data),

  remove: (id: string) =>
    api.delete<ApiResponse<null>>(`/tests/${id}`),

  getBaseline: () =>
    api.get<ApiResponse<Test | null>>("/tests/baseline"),

  startAttempt: (data: { testId: string }) =>
    api.post<ApiResponse<TestAttempt>>("/tests/attempts", data),

  submitAttempt: (attemptId: string, data: { answers: Array<{ questionId: string; optionId: string }> }) =>
    api.post<ApiResponse<TestAttempt>>(`/tests/attempts/${attemptId}/submit`, data),
};
