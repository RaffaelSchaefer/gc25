"use client";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getClientSocket(): Socket {
  if (socket) return socket;
  const isBrowser = typeof window !== "undefined";
  // 1) Explicit URL wins (e.g., wss://gc.raffaelschaefer.de:3100)
  const explicit = process.env.NEXT_PUBLIC_SIO_URL;
  // 2) Else use host + configured port (default 3100)
  const protocol = isBrowser && window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = isBrowser ? window.location.hostname : "localhost";
  const port = process.env.NEXT_PUBLIC_SIO_PORT || "3100";
  // 3) Else fallback to same-origin (no URL): relies on reverse proxy mapping /socket.io
  const base = explicit || `${protocol}//${host}:${port}`;

  socket = io(base, {
    transports: ["websocket"],
  path: process.env.NEXT_PUBLIC_SIO_PATH || "/socket.io",
  });
  return socket;
}
