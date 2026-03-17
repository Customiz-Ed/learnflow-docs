export type UploadRowStatus = "success" | "duplicate" | "error";

export interface BulkUploadCredentials {
  username: string;
  defaultPassword: string;
}

export interface BulkUploadDetail {
  rowIndex: number;
  username: string;
  status: UploadRowStatus;
  message: string;
  studentId?: string;
  credentials?: BulkUploadCredentials;
}

export interface BulkUploadSummary {
  total: number;
  created: number;
  failed: number;
  duplicates: number;
}

export interface BulkUploadData {
  summary: BulkUploadSummary;
  details: BulkUploadDetail[];
}

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
  meta?: {
    timestamp: string;
  };
}

export interface ApiError {
  success: false;
  message: string;
  error?: {
    code?: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
  };
}

export interface SchoolClassOption {
  id: string;
  name: string;
  schoolId: string;
}

export interface DivisionOption {
  id: string;
  name: string;
  classId: string;
  teacherId: string | null;
  teacherName?: string | null;
}

export interface AdminBulkUploadInput {
  schoolId: string;
  classId: string;
  divisionId: string;
  file: File;
}

export interface TeacherBulkUploadInput {
  divisionId: string;
  file: File;
}
