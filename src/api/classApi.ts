import api from "./axios";
import type { ApiResponse, Class, Division } from "@/types/api.types";

export const classApi = {
  create: (data: { name: string; schoolId: string; teacherId?: string }) =>
    api.post<ApiResponse<Class>>("/classes", data),

  list: (schoolId?: string) =>
    api.get<ApiResponse<Class[]>>("/classes", { params: schoolId ? { schoolId } : {} }),

  getById: (id: string) =>
    api.get<ApiResponse<Class>>(`/classes/${id}`),

  update: (id: string, data: { name?: string; teacherId?: string | null }) =>
    api.patch<ApiResponse<Class>>(`/classes/${id}`, data),

  remove: (id: string) =>
    api.delete<ApiResponse<null>>(`/classes/${id}`),

  getByTeacher: (teacherId: string) =>
    api.get<ApiResponse<Class[]>>(`/classes/teacher/${teacherId}`),

  createDivision: (classId: string, data: { name: string; teacherId?: string }) =>
    api.post<ApiResponse<Division>>(`/classes/${classId}/divisions`, data),

  listDivisions: (classId: string) =>
    api.get<ApiResponse<Division[]>>(`/classes/${classId}/divisions`),
};
