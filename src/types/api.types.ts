export type Role = "admin" | "teacher" | "student" | "parent";

export type ApiMeta = {
  timestamp: string;
};

export type ApiError = {
  code: string;
  details?: unknown;
};

export type ApiSuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
  meta: ApiMeta;
};

export type ApiErrorResponse = {
  success: false;
  message: string;
  error: ApiError;
  meta: ApiMeta;
  data: never;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export type BaselineSubject = "ENGLISH" | "MATHS" | "LSA";
export type GenerationSource = "AI" | "STATIC";
export type TestStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type AttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "EVALUATED";
export type SuiteStatus = "PENDING" | "ACTIVE" | "COMPLETED";
export type ReportScope = "SUBJECT" | "CUMULATIVE";
export type BaselineGenerationJobStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
export type LsaLearningStyle = "VISUAL" | "AUDITORY" | "KINESTHETIC";

export type BaselineAttemptSummary = {
  id: string;
  testId: string;
  status: AttemptStatus;
  totalScore: number | null;
  submittedAt: string | null;
};

export type BaselineTestCard = {
  id: string;
  name: string;
  baselineSubject: BaselineSubject | null;
  generationSource: GenerationSource | null;
  status: TestStatus;
  totalMarks: number | null;
  duration: number | null;
  attempt: BaselineAttemptSummary | null;
};

export type StudentBaselineSuitePayload = {
  suiteId: string;
  suiteStatus: SuiteStatus;
  tests: BaselineTestCard[];
};

export type StartAttemptRequest = {
  testId: string;
};

export type SubmitAnswerInput = {
  questionId: string;
  optionId: string;
};

export type SubmitAttemptRequest = {
  answers: SubmitAnswerInput[];
};

export type SubmitAttemptResult = {
  id: string;
  status: AttemptStatus;
  totalScore: number | null;
  submittedAt: string | null;
};

export type StudentBaselineReport = {
  id: string;
  studentId: string;
  baselineSuiteId: string;
  reportScope: ReportScope;
  subject: BaselineSubject | null;
  markdownContent: string;
  structuredSummaryJson: string | null;
  generatedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type TriggerSubjectReportRequest = {
  studentId: string;
  suiteId: string;
  subject: BaselineSubject;
};

export type TriggerSubjectReportJob = {
  id: string;
  studentId: string;
  baselineSuiteId: string;
  reportScope: "SUBJECT";
  subject: BaselineSubject;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
};

export type TriggerSubjectReportPayload = {
  job: TriggerSubjectReportJob;
  callbackUrl: string;
};

export type TriggerSuiteReportRequest = {
  studentId: string;
  suiteId: string;
  includeCumulative?: boolean;
};

export type TriggerSuiteSubjectResult = {
  subject: BaselineSubject;
  queued: boolean;
  jobId?: string;
  error?: string;
};

export type TriggerSuiteCumulativeResult = {
  queued: boolean;
  skipped?: boolean;
  reason?: string;
  jobId?: string;
  error?: string;
};

export type TriggerSuiteReportPayload = {
  callbackUrl: string;
  subjectResults: TriggerSuiteSubjectResult[];
  cumulativeResult: TriggerSuiteCumulativeResult;
};

export type ReportGenerationStatus =
  | "READY"
  | "QUEUED"
  | "PROCESSING"
  | "FAILED"
  | "NOT_STARTED";

export type ReportSuiteKind = "BASELINE" | "MIDLINE" | "ENDLINE";

export type TeacherReportMetric = {
  label: string;
  value: string;
};

export type TeacherReportPreview = {
  id: string;
  reportScope: ReportScope;
  subject: BaselineSubject | null;
  title: string;
  status: ReportGenerationStatus;
  generatedAt: string | null;
  markdownContent: string;
  highlights: string[];
  metrics: TeacherReportMetric[];
  summary: Record<string, unknown>;
  canTrigger: boolean;
  triggerLabel: string;
  statusMessage: string;
};

export type TeacherReportSuitePreview = {
  id: string;
  suiteType: ReportSuiteKind;
  title: string;
  className: string;
  divisionName: string;
  academicYear: string;
  submittedSubjects: number;
  totalSubjects: number;
  reportsReady: number;
  lastGeneratedAt: string | null;
  subjectReports: TeacherReportPreview[];
  cumulativeReport: TeacherReportPreview;
};

export type TeacherReportStudentPreview = {
  id: string;
  name: string;
  username: string;
  grade: number;
  age: number | null;
  className: string;
  divisionName: string;
  profilePhotoUrl: string | null;
  avatarCartoonUrl: string | null;
  baselineCompleted: boolean;
  latestReportAt: string | null;
  reportReadiness: number;
  suites: TeacherReportSuitePreview[];
};

export type TeacherReportStudentsListPayload = {
  items: TeacherReportStudentPreview[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  summary: {
    students: number;
    ready: number;
    inFlight: number;
    attention: number;
  };
};

export type TeacherReportStudentDetailPayload = {
  student: Omit<TeacherReportStudentPreview, "suites">;
  suites: TeacherReportSuitePreview[];
  selectedSuiteId?: string;
};

export type TeacherReportStatusItem = {
  reportScope: ReportScope;
  subject: BaselineSubject | null;
  status: ReportGenerationStatus;
  reportId?: string;
  generatedAt?: string;
  error?: string;
};

export type TeacherReportStatusPayload = {
  suiteId: string;
  studentId: string;
  reportStates: TeacherReportStatusItem[];
  done: boolean;
  pendingCount: number;
};

export type TeacherBaselineGenerationJob = {
  id: string;
  s3Key: string;
  pdfFileName: string;
  testName: string | null;
  grade: string;
  subject: string;
  classId: string;
  divisionId: string;
  schoolId: string;
  numberOfQuestions: number;
  difficulty: "Easy" | "Medium" | "Hard";
  status: BaselineGenerationJobStatus;
  generatedTestId: string | null;
  baselineSuiteId: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BaselineSuiteTeacherView = {
  id: string;
  classId: string;
  divisionId: string;
  schoolId: string;
  createdByTeacherId: string;
  status: SuiteStatus;
  tests: Array<{
    id: string;
    name: string;
    baselineSubject: BaselineSubject | null;
    generationSource: GenerationSource | null;
    status: TestStatus;
    totalMarks: number | null;
  }>;
  generationJobs: Array<{
    id: string;
    subject: string;
    status: BaselineGenerationJobStatus;
    errorMessage: string | null;
    createdAt: string;
  }>;
};

export type SubjectStatusPayload = {
  ENGLISH: { id: string; baselineSubject: "ENGLISH"; status: TestStatus } | null;
  MATHS: { id: string; baselineSubject: "MATHS"; status: TestStatus } | null;
  LSA: { id: string; baselineSubject: "LSA"; status: TestStatus } | null;
};

export type LsaOptionBankItem = {
  id: string;
  text: string;
  learningStyle: LsaLearningStyle;
  order: number;
  questionId: string;
};

export type LsaQuestionBankItem = {
  id: string;
  text: string;
  order: number;
  isActive: boolean;
  options: LsaOptionBankItem[];
};

export type CreateLsaQuestionRequest = {
  text: string;
  order: number;
  options: Array<{
    text: string;
    learningStyle: LsaLearningStyle;
    order: number;
  }>;
};

// Auth
export interface AuthUser {
  id: string;
  role: Role;
  token: string;
  name: string;
  email?: string;
  username?: string;
}

// Admin
export interface Admin {
  id: string;
  name: string;
  email: string;
}

// Teacher
export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  teacherCode: string;
  inviteLink: string | null;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
}

// Student
export interface Student {
  id: string;
  username: string;
  name: string;
  age: number | null;
  grade: number;
  classId?: string | null;
  className?: string | null;
  divisionName?: string | null;
  profilePhotoUrl: string | null;
  avatarCartoonUrl: string | null;
  baselineCompleted: boolean;
  requiresPasswordChange?: boolean;
  teacherId: string | null;
  divisionId: string | null;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
}

export type BulkImportRowStatus = "success" | "error" | "duplicate";

export interface BulkImportRowDetail {
  rowIndex: number;
  username: string;
  status: BulkImportRowStatus;
  message: string;
  studentId?: string;
  credentials?: {
    username: string;
    defaultPassword: string;
  };
}

export interface BulkImportSummary {
  total: number;
  created: number;
  failed: number;
  duplicates: number;
}

export interface BulkImportResult {
  summary: BulkImportSummary;
  details: BulkImportRowDetail[];
}

export interface StudentLoginPayload {
  student: Student;
  token: string;
  requiresPasswordChange?: boolean;
}

export interface StudentPasswordChangePayload {
  updated: boolean;
  requiresPasswordChange: boolean;
}

// Parent
export interface Parent {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

// School
export interface School {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  createdAt: string;
  updatedAt: string;
}

// Class
export interface Class {
  id: string;
  name: string;
  schoolId: string;
  teacherId: string | null;
  createdAt: string;
  updatedAt: string;
  school?: { id: string; name: string };
  teacher?: Teacher | null;
  divisions?: Division[];
}

// Division
export interface Division {
  id: string;
  name: string;
  classId: string;
  teacherId: string | null;
  createdAt: string;
  updatedAt: string;
  teacher?: Teacher | null;
}

// Enrollment
export interface EnrollmentRequest {
  id: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  studentId: string;
  schoolId: string;
  divisionId: string;
  teacherId: string;
  createdAt: string;
  reviewedAt: string | null;
  student?: Student;
  division?: Division;
  school?: School;
  teacher?: Teacher;
  class?: Class;
}

// Test
export interface TestOption {
  id: string;
  text: string;
  isCorrect?: boolean;
  learningStyleTag?: LsaLearningStyle | null;
  order: number;
}

export interface TestQuestion {
  id: string;
  text: string;
  type: "SINGLE" | "MULTI";
  marks: number | null;
  order: number;
  options: TestOption[];
}

export interface Test {
  id: string;
  name: string;
  description: string;
  classId: string;
  divisionId: string | null;
  teacherId: string;
  baselineSuiteId?: string | null;
  baselineSubject?: BaselineSubject | null;
  generationSource?: GenerationSource | null;
  duration: number | null;
  totalMarks: number | null;
  deadline: string | null;
  status: TestStatus;
  isBaseline: boolean;
  createdAt: string;
  updatedAt: string;
  questions?: TestQuestion[];
}

export interface TestAttempt {
  id: string;
  status: "IN_PROGRESS" | "SUBMITTED";
  startedAt: string;
  submittedAt: string | null;
  totalScore: number | null;
  studentId: string;
  testId: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentReport {
  student: Student;
  attempts: Array<TestAttempt & { test?: Test }>;
  summary: {
    totalAttempts: number;
    averageScore: number | null;
  };
}

// Catalog
export interface CatalogSchool {
  id: string;
  name: string;
}

export interface CatalogClass {
  id: string;
  name: string;
}

export interface CatalogDivision {
  id: string;
  name: string;
}
