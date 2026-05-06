const API_DOMAIN = import.meta.env.VITE_API_DOMAIN;
const AUTH_PORT = import.meta.env.VITE_AUTH_SERVICE_PORT;
const MANAGEMENT_PORT = import.meta.env.VITE_MANAGEMENT_SERVICE_PORT;
const SOCKET_PORT = import.meta.env.VITE_SOCKET_SERVICE_PORT;

const AUTH_BASE_URL = `${API_DOMAIN}:${AUTH_PORT}/api/auth`;
const API_BASE_URL = `${API_DOMAIN}:${MANAGEMENT_PORT}/api`;
const SOCKET_BASE_URL = `${API_DOMAIN}:${SOCKET_PORT}/api`;

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
  createUser: (userData: any) => request(`${AUTH_BASE_URL}/users`, {
    method: "POST",
    body: JSON.stringify(userData),
  }),
  getUsers: () => request(`${AUTH_BASE_URL}/users`),
  deleteUser: (id: string) => request(`${AUTH_BASE_URL}/users/${id}`, {
    method: "DELETE",
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

export const notificationApi = {
  get: () => request(`${SOCKET_BASE_URL}/notifications`),
  read: (id: string) => request(`${SOCKET_BASE_URL}/notifications/${id}/read`, {
    method: "PATCH",
  }),
  readAll: () => request(`${SOCKET_BASE_URL}/notifications/read-all`, {
    method: "PATCH",
  }),
  delete: (id: string) => request(`${SOCKET_BASE_URL}/notifications/${id}/delete`, {
    method: "PATCH",
  }),
  deleteAll: () => request(`${SOCKET_BASE_URL}/notifications/delete-all`, {
    method: "PATCH",
  }),
};
