"use client";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getClientSocket(): Socket {
  if (socket) return socket;
  const url = typeof window !== "undefined" ? window.location.origin : "";
  const wsUrl = url.replace(/^http/, "ws");
  // Connect to standalone SIO server port
  const port = process.env.NEXT_PUBLIC_SIO_PORT
    ? `:${process.env.NEXT_PUBLIC_SIO_PORT}`
    : ":3100";
  const base = wsUrl.includes(":")
    ? wsUrl.replace(/:\d+$/, port)
    : wsUrl + port;

  socket = io(base, {
    transports: ["websocket"],
  });
  return socket;
}
