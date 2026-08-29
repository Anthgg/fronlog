export interface SystemInfo {
  name: string;
  environment: string;
  api: string;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export class ApiError extends Error {
  code: string;
  status: number;
  details?: Record<string, unknown>;

  constructor(status: number, message: string, code: string = "API_ERROR", details?: Record<string, unknown>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

let cachedCsrfToken: string | null = null;

export function setCsrfToken(token: string | null): void {
  cachedCsrfToken = token;
}

export function getCsrfToken(): string | null {
  return cachedCsrfToken;
}

export async function fetchCsrfToken(): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/api/auth/csrf`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) {
    throw new ApiError(res.status, "Error al obtener token CSRF.", "CSRF_FETCH_FAILED");
  }
  const data = await res.json();
  cachedCsrfToken = data.csrf_token;
  return data.csrf_token;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // Mutating requests require X-CSRF-Token
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    if (!cachedCsrfToken) {
      await fetchCsrfToken();
    }
    if (cachedCsrfToken) {
      headers.set("X-CSRF-Token", cachedCsrfToken);
    }
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    method,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    let errorData: Partial<ApiErrorDetail> = {};
    try {
      errorData = await response.json();
    } catch {
      // Non-JSON response body
    }
    const message = errorData.message || response.statusText || `Request failed with status ${response.status}`;
    const code = errorData.code || (response.status === 401 ? "AUTHENTICATION_REQUIRED" : response.status === 403 ? "PERMISSION_DENIED" : "REQUEST_FAILED");
    throw new ApiError(response.status, message, code, errorData.details);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }

  return response.text() as unknown as T;
}

export async function getSystemInfo(): Promise<SystemInfo> {
  return apiFetch<SystemInfo>("/api/system/info");
}
