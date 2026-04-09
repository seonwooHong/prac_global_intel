/**
 * Get the API base URL from environment variable.
 * In dev: empty string (uses Vite proxy to same origin)
 * In production: points to fillx_backend server
 */
export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? '';
}

/**
 * Build an API URL with the correct base.
 */
export function apiUrl(path: string): string {
  return `${getApiBaseUrl()}${path}`;
}
