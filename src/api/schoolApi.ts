import api from "./axios";
import type { ApiResponse, BulkImportResult, School } from "@/types/api.types";

export const schoolApi = {
  create: (data: { name: string; address?: string; city?: string; state?: string; contactEmail?: string; contactPhone?: string }) =>
    api.post<ApiResponse<School>>("/schools", data),

  list: () =>
    api.get<ApiResponse<School[]>>("/schools"),

  getById: (id: string) =>
    api.get<ApiResponse<School>>(`/schools/${id}`),

  update: (id: string, data: Partial<School>) =>
    api.patch<ApiResponse<School>>(`/schools/${id}`, data),

  remove: (id: string) =>
    api.delete<ApiResponse<null>>(`/schools/${id}`),

  downloadStudentsTemplate: (schoolId: string) =>
    api.get(`/admin/schools/${schoolId}/students/bulk-upload/template`, {
      responseType: "blob",
    }),

  bulkUploadStudents: (schoolId: string, file: File, classId: string, divisionId: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("classId", classId);
    formData.append("divisionId", divisionId);
    return api.post<ApiResponse<BulkImportResult>>(
      `/admin/schools/${schoolId}/students/bulk-upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
  },
};
