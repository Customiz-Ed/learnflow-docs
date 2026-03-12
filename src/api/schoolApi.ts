import api from "./axios";
import type { ApiResponse, School } from "@/types/api.types";

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
};
