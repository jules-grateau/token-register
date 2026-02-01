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
