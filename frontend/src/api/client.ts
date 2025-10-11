const DEFAULT_API_BASE_URL = "http://localhost:8000";

const rawApiBaseUrl =
  typeof import.meta.env.VITE_API_URL === "string" &&
  import.meta.env.VITE_API_URL.length > 0
    ? import.meta.env.VITE_API_URL
    : DEFAULT_API_BASE_URL;

const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, "");

interface RequestOptions extends RequestInit {
  parseJson?: boolean;
}

export async function request<T>(
  path: string,
  { parseJson = true, headers, ...init }: RequestOptions = {},
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }

  if (!parseJson) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
