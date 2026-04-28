const API_DOMAIN = import.meta.env.VITE_API_DOMAIN;
const AUTH_PORT = import.meta.env.VITE_AUTH_SERVICE_PORT;
const MANAGEMENT_PORT = import.meta.env.VITE_MANAGEMENT_SERVICE_PORT;

const AUTH_BASE_URL = `${API_DOMAIN}:${AUTH_PORT}/api/auth`;
const API_BASE_URL = `${API_DOMAIN}:${MANAGEMENT_PORT}/api`;

interface RequestOptions extends RequestInit {
  token?: string | null;
}

const request = async (url: string, options: RequestOptions = {}) => {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const authApi = {
  login: (credentials: any) => request(`${AUTH_BASE_URL}/login`, {
    method: "POST",
    body: JSON.stringify(credentials),
  }),
  register: (userData: any) => request(`${AUTH_BASE_URL}/register`, {
    method: "POST",
    body: JSON.stringify(userData),
  }),
  verify: () => request(`${AUTH_BASE_URL}/verify`),
  logout: () => request(`${AUTH_BASE_URL}/logout`, { method: "POST" }),
};

export const api = {
  get: (endpoint: string) => request(`${API_BASE_URL}${endpoint}`),
  post: (endpoint: string, data: any) => request(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    body: JSON.stringify(data),
  }),
  put: (endpoint: string, data?: any) => request(`${API_BASE_URL}${endpoint}`, {
    method: "PUT",
    ...(data !== undefined && { body: JSON.stringify(data) }),
  }),
  delete: (endpoint: string) => request(`${API_BASE_URL}${endpoint}`, {
    method: "DELETE",
  }),
};
