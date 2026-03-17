import api from "./axios";
import type { ApiResponse, BulkImportResult, Division } from "@/types/api.types";

export const divisionApi = {
  update: (id: string, data: { name?: string; teacherId?: string | null }) =>
    api.patch<ApiResponse<Division>>(`/divisions/${id}`, data),

  remove: (id: string) =>
    api.delete<ApiResponse<null>>(`/divisions/${id}`),

  downloadStudentsTemplate: (divisionId: string) =>
    api.get(`/divisions/${divisionId}/students/bulk-upload/template`, {
      responseType: "blob",
    }),

  bulkUploadStudents: (divisionId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post<ApiResponse<BulkImportResult>>(
      `/divisions/${divisionId}/students/bulk-upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
  },
};
