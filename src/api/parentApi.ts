import api from "./axios";
import type { ApiResponse, Parent } from "@/types/api.types";

export const parentApi = {
  register: (data: { name: string; email: string; phone: string; password: string }) =>
    api.post<ApiResponse<{ parent: Parent; token: string }>>("/parents/register", data),

  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<{ parent: Parent; token: string }>>("/parents/login", data),

  getMe: () =>
    api.get<ApiResponse<Parent>>("/parents/me"),
};
