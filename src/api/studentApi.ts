import api from "./axios";
import type { ApiResponse, Student, EnrollmentRequest, StudentReport } from "@/types/api.types";

export const studentApi = {
  register: (data: { username: string; name: string; password: string; age?: number; grade: number; schoolId: string; divisionId: string }) =>
    api.post<ApiResponse<{ student: Student; enrollmentRequest: EnrollmentRequest; token: string }>>("/students/register", data),

  login: (data: { username: string; password: string }) =>
    api.post<ApiResponse<{ student: Student; token: string }>>("/students/login", data),

  getMe: () =>
    api.get<ApiResponse<Student>>("/students/me"),

  updateProfile: (data: { name?: string; age?: number; profilePhotoUrl?: string | null; avatarCartoonUrl?: string | null; password?: string }) =>
    api.put<ApiResponse<Student>>("/students/me/profile", data),

  getReport: () =>
    api.get<ApiResponse<StudentReport>>("/students/me/report"),
};
