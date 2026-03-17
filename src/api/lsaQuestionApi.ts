import api from "./axios";
import type { ApiResponse, CreateLsaQuestionRequest, LsaQuestionBankItem } from "@/types/api.types";

export const lsaQuestionApi = {
  list: () => api.get<ApiResponse<LsaQuestionBankItem[]>>("/lsa-questions"),

  create: (data: CreateLsaQuestionRequest) =>
    api.post<ApiResponse<LsaQuestionBankItem>>("/lsa-questions", data),

  update: (id: string, data: Partial<CreateLsaQuestionRequest> & { isActive?: boolean }) =>
    api.patch<ApiResponse<LsaQuestionBankItem>>(`/lsa-questions/${id}`, data),

  remove: (id: string) =>
    api.delete<ApiResponse<null>>(`/lsa-questions/${id}`),
};
