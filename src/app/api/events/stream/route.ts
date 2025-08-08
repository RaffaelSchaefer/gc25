// Diese Route dient nur als Platzhalter für socket.io.
// Die eigentliche WebSocket-Kommunikation läuft über den zentralen socket.io-Server.
export async function GET() {
  return new Response(
    "Socket.io-Server läuft. Bitte über den Client verbinden.",
    { status: 200 },
  );
}
