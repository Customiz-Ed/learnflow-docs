import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api.types";

export type { ApiSuccessResponse, ApiErrorResponse };

export type TestStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type BaselineSubject = "ENGLISH" | "MATHS" | "LSA";
export type AttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "EVALUATED";

export interface TeacherTestClassRef {
  id: string;
  name: string;
}

export interface TeacherTestDivisionRef {
  id: string;
  name: string;
}

export interface TeacherTestListItem {
  id: string;
  name: string;
  description: string;
  status: TestStatus;
  isBaseline: boolean;
  baselineSubject: BaselineSubject | null;
  classId: string;
  divisionId: string | null;
  class?: TeacherTestClassRef | null;
  division?: TeacherTestDivisionRef | null;
  className?: string;
  divisionName?: string;
  createdAt: string;
  duration: number | null;
  totalMarks: number | null;
  deadline: string | null;
}

export interface TeacherTestDetail extends TeacherTestListItem {
  teacherId?: string;
  createdByTeacherId?: string;
  attemptCount: number;
  questions?: TeacherEditableQuestion[];
}

export interface TeacherEditableQuestionOption {
  id?: string;
  text: string;
  isCorrect: boolean;
  order: number;
}

export interface TeacherEditableQuestion {
  id?: string;
  text: string;
  type: "SINGLE" | "MULTI";
  marks?: number;
  order: number;
  options: TeacherEditableQuestionOption[];
}

export interface StudentTestAttempt {
  id: string;
  testId: string;
  status: AttemptStatus;
  totalScore: number | null;
  submittedAt: string | null;
}

export interface StudentBaselineTestListData {
  suiteId: string;
  suiteStatus: string;
  tests: Array<{
    id: string;
    name: string;
    baselineSubject: BaselineSubject | null;
    generationSource: string | null;
    status: TestStatus;
    totalMarks: number | null;
    duration: number | null;
    attempt: StudentTestAttempt | null;
  }>;
}

export interface TeacherCreateTestPayload {
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

export interface TeacherUpdateTestPayload {
  name?: string;
  description?: string;
  duration?: number;
  totalMarks?: number;
  deadline?: string | null;
  status?: TestStatus;
  questions?: TeacherEditableQuestion[];
}

export interface StudentTestQuestionOption {
  id: string;
  text: string;
  order: number;
}

export interface StudentTestQuestion {
  id: string;
  text: string;
  type: "SINGLE" | "MULTI";
  order: number;
  options: StudentTestQuestionOption[];
}

export interface StudentTestDetail {
  id: string;
  name: string;
  description: string;
  status: TestStatus;
  duration: number | null;
  totalMarks: number | null;
  baselineSuiteId?: string | null;
  baselineSubject?: BaselineSubject | null;
  questions: StudentTestQuestion[];
}

export interface SubmitAttemptRequest {
  answers: Array<{
    questionId: string;
    optionId: string;
  }>;
}

export interface SubmitAttemptResult {
  id: string;
  status: AttemptStatus;
  totalScore: number | null;
  submittedAt: string | null;
}

export interface NormalizedApiError extends Error {
  status?: number;
  code?: string;
  details?: unknown;
  timestamp?: string;
  raw?: unknown;
}
