export type Role = "admin" | "teacher" | "student" | "parent";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta: { timestamp: string };
}

export interface ApiError {
  success: false;
  message: string;
  error: { code: string; details?: unknown };
  meta: { timestamp: string };
}

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
  profilePhotoUrl: string | null;
  avatarCartoonUrl: string | null;
  baselineCompleted: boolean;
  teacherId: string | null;
  divisionId: string | null;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
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
  isCorrect: boolean;
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
  duration: number | null;
  totalMarks: number | null;
  deadline: string | null;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
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
