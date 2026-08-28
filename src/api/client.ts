export interface SystemInfo {
  name: string;
  environment: string;
  api: string;
}

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function getSystemInfo(): Promise<SystemInfo> {
  const response = await fetch(`${API_BASE_URL}/api/system/info`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch system info: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}
