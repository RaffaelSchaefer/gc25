// Diese Route dient nur als Platzhalter für Socket.IO.
// Die eigentliche WebSocket-Kommunikation läuft über den zentralen Socket.IO-Server.
// Explicitly force the Node.js runtime so deployments without Edge runtime work.
export const runtime = "nodejs";

export async function GET() {
  return new Response(
    "Socket.io-Server läuft. Bitte über den Client verbinden.",
    { status: 200 },
  );
}
