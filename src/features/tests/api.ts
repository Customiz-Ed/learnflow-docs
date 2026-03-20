import type { AxiosResponse } from "axios";
import api from "@/api/axios";
import {
  normalizeApiError,
  unwrapSuccessEnvelope,
} from "@/features/tests/errors";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  StudentBaselineTestListData,
  StudentTestAttempt,
  StudentTestDetail,
  SubmitAttemptRequest,
  SubmitAttemptResult,
  TeacherCreateTestPayload,
  TeacherTestDetail,
  TeacherTestListItem,
  TeacherUpdateTestPayload,
} from "@/features/tests/types";

interface TeacherTestsApiRow {
  id: string;
  name: string;
  description: string;
  status: TeacherTestListItem["status"];
  isBaseline: boolean;
  baselineSubject: TeacherTestListItem["baselineSubject"];
  classId: string;
  divisionId: string | null;
  class?: { id: string; name: string } | null;
  division?: { id: string; name: string } | null;
  createdAt: string;
  duration: number | null;
  totalMarks: number | null;
  deadline: string | null;
}

interface TeacherTestDetailApiRow extends TeacherTestsApiRow {
  teacherId?: string;
  createdByTeacherId?: string;
  attemptCount?: number;
}

async function requestWithEnvelope<T>(
  request: Promise<AxiosResponse<ApiSuccessResponse<T> | ApiErrorResponse>>,
): Promise<T> {
  try {
    const response = await request;
    return unwrapSuccessEnvelope(response.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export const testsApi = {
  listTeacherTests: async (): Promise<TeacherTestListItem[]> => {
    const rows = await requestWithEnvelope<TeacherTestsApiRow[]>(api.get("/tests"));

    return rows.map((row) => ({
      ...row,
      className: row.class?.name,
      divisionName: row.division?.name,
    }));
  },

  getTeacherTestById: async (id: string): Promise<TeacherTestDetail> => {
    const row = await requestWithEnvelope<TeacherTestDetailApiRow>(api.get(`/tests/${id}`));

    return {
      ...row,
      teacherId: row.teacherId || row.createdByTeacherId,
      createdByTeacherId: row.createdByTeacherId,
      attemptCount: row.attemptCount ?? 0,
      className: row.class?.name,
      divisionName: row.division?.name,
    };
  },

  createTeacherTest: async (payload: TeacherCreateTestPayload): Promise<TeacherTestDetail> =>
    requestWithEnvelope(api.post("/tests", payload)),

  updateTeacherTest: async (id: string, payload: TeacherUpdateTestPayload): Promise<TeacherTestDetail> =>
    requestWithEnvelope(api.patch(`/tests/${id}`, payload)),

  deleteTeacherTest: async (id: string): Promise<null> =>
    requestWithEnvelope(api.delete(`/tests/${id}`)),

  listStudentBaselineTests: async (): Promise<StudentBaselineTestListData> =>
    requestWithEnvelope(api.get("/tests/baseline")),

  getStudentTestById: async (id: string): Promise<StudentTestDetail> =>
    requestWithEnvelope(api.get(`/tests/${id}`)),

  startStudentAttempt: async (testId: string): Promise<StudentTestAttempt> =>
    requestWithEnvelope(api.post("/tests/attempts", { testId })),

  submitStudentAttempt: async (
    attemptId: string,
    payload: SubmitAttemptRequest,
  ): Promise<SubmitAttemptResult> =>
    requestWithEnvelope(api.post(`/tests/attempts/${attemptId}/submit`, payload)),
};
