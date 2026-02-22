/**
 * Standard API response envelope.
 * All endpoints return { success, data?, error? }.
 */

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export function ok<T>(data: T): ApiSuccessResponse<T> {
  return { success: true, data };
}

export function fail(code: string, message: string, details?: Record<string, unknown>): ApiErrorResponse {
  return {
    success: false,
    error: { code, message, ...(details ? { details } : {}) },
  };
}
