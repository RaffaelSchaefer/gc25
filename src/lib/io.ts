import 'server-only';
import type { Server as IOServer } from "socket.io";

// Run a standalone Socket.IO server on its own port (default 3100)
// This avoids tight coupling with Next.js request lifecycle.
const PORT = Number(process.env.SIO_PORT || 3100);

let io: IOServer | null = null;
let started = false;

export function getIO(): IOServer | null {
  return io;
}

export async function ensureIOServer(): Promise<IOServer> {
  // Ensure only on Node.js runtime
  if (process.env.NEXT_RUNTIME && process.env.NEXT_RUNTIME !== 'nodejs') {
    throw new Error('Socket.IO can only be started on the Node.js runtime');
  }
  if (io && started) return io;

  // Start a standalone HTTP server with Socket.IO
  const { Server } = await import('socket.io');
  io = new Server({
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  if (!started) {
    await new Promise<void>((resolve) => {
      io!.listen(PORT, {
        // Backlog default
      });
      io!.once("listening", () => resolve());
      // 'listening' is not emitted by socket.io, so resolve immediately
      setTimeout(() => resolve(), 0);
    });
    started = true;
  }

  // Basic connection logging
  io.on("connection", (socket) => {
    // Clients can join a default room if needed
    socket.join("events");

    socket.on("disconnect", () => {
      // no-op
    });
  });

  return io;
}

export function emitToClients(event: string, payload: unknown) {
  if (!io) return;
  io.to("events").emit(event, payload);
}
