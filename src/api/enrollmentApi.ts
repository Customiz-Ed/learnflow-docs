import api from "./axios";
import type { ApiResponse, EnrollmentRequest } from "@/types/api.types";

export const enrollmentApi = {
  create: (data: { divisionId: string }) =>
    api.post<ApiResponse<EnrollmentRequest>>("/enrollment-requests", data),

  getMine: () =>
    api.get<ApiResponse<EnrollmentRequest[]>>("/enrollment-requests/mine"),

  getPending: () =>
    api.get<ApiResponse<EnrollmentRequest[]>>("/enrollment-requests/pending"),

  review: (id: string, data: { status: "ACCEPTED" | "REJECTED" }) =>
    api.patch<ApiResponse<EnrollmentRequest>>(`/enrollment-requests/${id}/review`, data),
};
