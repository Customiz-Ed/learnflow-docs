import api from "./axios";
import type { ApiResponse, Teacher, Student } from "@/types/api.types";

export const teacherApi = {
  register: (data: { name: string; email: string; phone: string; password: string; schoolId: string }) =>
    api.post<ApiResponse<{ teacher: Teacher; token: string }>>("/teachers/register", data),

  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<{ teacher: Teacher; token: string }>>("/teachers/login", data),

  getMe: () =>
    api.get<ApiResponse<Teacher>>("/teachers/me"),

  updateProfile: (data: { name?: string; phone?: string; password?: string }) =>
    api.put<ApiResponse<Teacher>>("/teachers/me/profile", data),

  getStudents: () =>
    api.get<ApiResponse<Student[]>>("/teachers/me/students"),
};
