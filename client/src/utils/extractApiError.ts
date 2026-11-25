import type { ApiErrorCode } from 'shared-ts';

/** Machine-readable `code` of an RTK Query error response, if any. */
export function extractApiErrorCode(error: unknown): ApiErrorCode | null {
  if (
    error &&
    typeof error === 'object' &&
    'data' in error &&
    error.data &&
    typeof error.data === 'object' &&
    'code' in error.data &&
    typeof error.data.code === 'string'
  ) {
    return error.data.code as ApiErrorCode;
  }
  return null;
}

/**
 * Extracts error message from RTK Query error response.
 * Returns the error message from the API response if available,
 * otherwise returns the provided fallback message.
 */
export function extractApiError(error: unknown, fallback: string): string {
  if (
    error &&
    typeof error === 'object' &&
    'data' in error &&
    error.data &&
    typeof error.data === 'object' &&
    'error' in error.data
  ) {
    return String(error.data.error);
  }
  return fallback;
}
