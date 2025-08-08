import { NextRequest } from "next/server";
import { registerSubscriber } from "@/app/(server)/events.actions";

// Next.js App Router route handler for WebSocket connections
// Runtime must be Node.js (not Edge) for standard WebSocket support.
export const config = {
  runtime: "nodejs",
};

// Disable body parsing for upgrade requests
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Ensure this is a WebSocket upgrade request
  const upgradeHeader = req.headers.get("upgrade") || "";
  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket", { status: 426 });
  }

  // @ts-ignore - Using the underlying Node API available in Next.js Node runtime
  const { socket, response } = Deno.upgradeWebSocket
    ? // If running under Deno (not typical for Next.js), fallback
      // This path will likely not be used in a standard Next.js Node deployment.
      Deno.upgradeWebSocket(req as any)
    : (req as any).nextUrl // trick TS to branch - will be replaced immediately below
      ? (() => {
          // In Node.js runtime for Next.js, we can use the standard WebSocket upgrade via the request's underlying HTTP object.
          // However, the App Router provides a helper:
          // @ts-ignore - This is supported in Next.js Node runtime
          const { 0: client, 1: server } = Object.values(
            new (global as any).WebSocketPair(),
          ) as [WebSocket, WebSocket];
          const response = new Response(null, {
            status: 101,
            // @ts-ignore - Next.js supports WebSocketPair in Node runtime
            webSocket: server,
          });
          return { socket: client, response };
        })()
      : (() => {
          // Fallback in case environment is unexpected
          return {
            socket: null,
            response: new Response("WebSocket not supported", { status: 501 }),
          };
        })();

  // If we couldn't establish a socket, return the response (likely an error)
  if (!socket) return response;

  // Register this socket as a subscriber
  const unsubscribe = registerSubscriber({
    send: (data: string) => {
      try {
        socket.send(data);
      } catch {
        // ignore send errors
      }
    },
  });

  // Setup basic lifecycle handlers
  socket.addEventListener("close", () => {
    unsubscribe();
  });

  socket.addEventListener("error", () => {
    unsubscribe();
    try {
      socket.close();
    } catch {
      // ignore
    }
  });

  // Optional: keep-alive ping/pong
  let pingTimer: NodeJS.Timeout | undefined;
  const ping = () => {
    try {
      socket.send(JSON.stringify({ type: "ping", ts: Date.now() }));
    } catch {
      // ignore
    }
  };
  pingTimer = setInterval(ping, 30000);

  socket.addEventListener("close", () => {
    if (pingTimer) clearInterval(pingTimer);
  });

  // Confirm connection to client
  try {
    socket.send(JSON.stringify({ type: "connected" }));
  } catch {
    // ignore
  }

  return response;
}
