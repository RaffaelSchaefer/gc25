"use client";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getClientSocket(): Socket {
  if (socket) return socket;
  const isBrowser = typeof window !== "undefined";
  // 1) Explicit URL wins (e.g., wss://gc.raffaelschaefer.de)
  const explicit = process.env.NEXT_PUBLIC_SIO_URL;
  // 2) Decide base: in prod use same-origin (behind reverse proxy on /socket.io),
  //    in local dev fall back to ws(s)://localhost:3100
  let base: string | undefined = explicit;

  if (!base && isBrowser) {
    const host = window.location.hostname;
    const isLocal = host === "localhost" || host === "127.0.0.1";
    if (isLocal) {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const port = process.env.NEXT_PUBLIC_SIO_PORT || "3100";
      base = `${protocol}//${host}:${port}`;
    } else {
      // Same-origin: let socket.io-client infer the current origin (no port)
      base = undefined;
    }
  }

  const path = process.env.NEXT_PUBLIC_SIO_PATH || "/socket.io";

  socket = base
    ? io(base, { transports: ["websocket"], path })
    : io({ transports: ["websocket"], path });
  return socket;
}
