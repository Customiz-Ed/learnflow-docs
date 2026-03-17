import api from "./axios";
import type {
  ApiResponse,
  Student,
  EnrollmentRequest,
  StudentReport,
  StudentLoginPayload,
  StudentPasswordChangePayload,
} from "@/types/api.types";

export const studentApi = {
  register: (data: { username: string; name: string; password: string; age?: number; grade: number; schoolId: string; divisionId: string }) =>
    api.post<ApiResponse<{ student: Student; enrollmentRequest: EnrollmentRequest; token: string }>>("/students/register", data),

  login: (data: { username: string; password: string }) =>
    api.post<ApiResponse<StudentLoginPayload>>("/students/login", data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put<ApiResponse<StudentPasswordChangePayload>>("/students/me/change-password", data),

  getMe: () =>
    api.get<ApiResponse<Student>>("/students/me"),

  updateProfile: (data: { name?: string; age?: number; profilePhotoUrl?: string | null; avatarCartoonUrl?: string | null; password?: string }) =>
    api.put<ApiResponse<Student>>("/students/me/profile", data),

  getReport: () =>
    api.get<ApiResponse<StudentReport>>("/students/me/report"),
};
