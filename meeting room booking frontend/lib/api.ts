const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface ApiOptions extends RequestInit {
  token?: string|null;
}

export async function apiFetch(endpoint: string, options: ApiOptions = {}) {
  const { token, ...fetchOptions } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(fetchOptions.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}`} : {}),
  };

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    console.log("validation errors:", errorBody);
    throw new Error(errorBody?.message ||`Request failed: ${res.status}`);
  }

  return res.json();
}