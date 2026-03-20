import { isAxiosError } from "axios";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/features/tests/types";
import type { NormalizedApiError } from "@/features/tests/types";

export function createNormalizedError(
  message: string,
  extras: Partial<NormalizedApiError> = {},
): NormalizedApiError {
  const error = new Error(message) as NormalizedApiError;
  error.status = extras.status;
  error.code = extras.code;
  error.details = extras.details;
  error.timestamp = extras.timestamp;
  error.raw = extras.raw;
  return error;
}

export function normalizeApiError(error: unknown): NormalizedApiError {
  if (isAxiosError<ApiErrorResponse>(error)) {
    const payload = error.response?.data;

    return createNormalizedError(payload?.message || error.message || "Request failed", {
      status: error.response?.status,
      code: payload?.error?.code,
      details: payload?.error?.details,
      timestamp: payload?.meta?.timestamp,
      raw: error,
    });
  }

  if (error instanceof Error) {
    return createNormalizedError(error.message, { raw: error });
  }

  return createNormalizedError("Unexpected error", { raw: error });
}

export function unwrapSuccessEnvelope<T>(payload: ApiSuccessResponse<T> | ApiErrorResponse): T {
  if (!payload.success) {
    const errorPayload = payload as ApiErrorResponse;
    throw createNormalizedError(payload.message, {
      code: errorPayload.error.code,
      details: errorPayload.error.details,
      timestamp: errorPayload.meta.timestamp,
    });
  }

  return payload.data;
}

export function getUiErrorMessage(error: unknown, fallback: string): string {
  const normalized = normalizeApiError(error);

  if (normalized.status === 403) {
    return "This test is not available right now.";
  }

  if (normalized.status === 409) {
    return normalized.message || "This action is blocked because attempts already exist for this test.";
  }

  if (normalized.status === 404) {
    return "This test could not be found.";
  }

  return normalized.message || fallback;
}
