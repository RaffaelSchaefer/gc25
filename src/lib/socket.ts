import { Server as IOServer } from "socket.io";
import type { Server as HTTPServer } from "http";

let io: IOServer | null = null;

export function getSocketServer(server: HTTPServer) {
  if (!io) {
    io = new IOServer(server, {
      path: "/api/events/stream",
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });
  }
  return io;
}
