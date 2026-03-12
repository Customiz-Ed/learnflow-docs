import api from "./axios";
import type { ApiResponse, Admin } from "@/types/api.types";

export const adminApi = {
  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<{ admin: Admin; token: string }>>("/admins/login", data),

  getMe: () =>
    api.get<ApiResponse<Admin>>("/admins/me"),
};
