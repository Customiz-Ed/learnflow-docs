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

  getUploadUrl: (data: { fileName: string; fileHash: string }) =>
    api.post<ApiResponse<{ uploadUrl: string | null; key: string; bucket: string; alreadyExists: boolean }>>("/tests/upload-url", data),

  generateBaselineFromS3: (data: {
    s3Key: string;
    grade: string;
    subject: string;
    classId: string;
    divisionId: string;
    testName?: string;
    numberOfQuestions: number;
    difficulty: string;
  }) =>
    api.post<ApiResponse<{ id: string; status: "QUEUED" | "PROCESSING" }>>("/tests/generate-baseline", data),

  getBaselineGenerationJob: (jobId: string) =>
    api.get<ApiResponse<{ id: string; status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED"; errorMessage?: string; generatedTestId?: string }>>(`/tests/generate-baseline/${jobId}`),
};
