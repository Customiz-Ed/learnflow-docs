import api from "./axios";
import type { ApiResponse, Division } from "@/types/api.types";

export const divisionApi = {
  update: (id: string, data: { name?: string; teacherId?: string | null }) =>
    api.patch<ApiResponse<Division>>(`/divisions/${id}`, data),

  remove: (id: string) =>
    api.delete<ApiResponse<null>>(`/divisions/${id}`),
};
