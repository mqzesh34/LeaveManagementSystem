import { io } from "socket.io-client";

const API_DOMAIN = import.meta.env.VITE_API_DOMAIN;
const SOCKET_PORT = import.meta.env.VITE_SOCKET_SERVICE_PORT;

export const socket = io(`${API_DOMAIN}:${SOCKET_PORT}`, {
  autoConnect: false,
  withCredentials: true,
});
