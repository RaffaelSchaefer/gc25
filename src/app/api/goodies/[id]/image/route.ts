import { NextRequest } from "next/server";
import { getGoodieImage } from "@/app/(server)/goodies.actions";

export const dynamic = "force-dynamic";

// Hinweis: Der zweite Context-Parameter wurde entfernt, weil dessen Typannotation
// vom Next.js Type-Checker als ungültig gemeldet wurde. Die id wird jetzt direkt aus der URL extrahiert.
export async function GET(_req: NextRequest) {
  const url = new URL(_req.url);
  // Erwarteter Pfad: /api/goodies/:id/image
  // Greife das vorletzte Segment als id ab.
  const segments = url.pathname.split("/").filter(Boolean);
  // segments z.B.: ['api','goodies','<id>','image']
  const imageIndex = segments.lastIndexOf("image");
  const id = imageIndex > 0 ? segments[imageIndex - 1] : undefined;

  if (!id) {
    return new Response(JSON.stringify({ error: "Missing id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const base64 = await getGoodieImage(id);
  if (!base64) {
    return new Response("Not found", { status: 404 });
  }

  // Falls der gespeicherte Wert evtl. ein Data-URL ist, entferne Präfix.
  const cleaned = base64.replace(/^data:image\/[^;]+;base64,/, "");
  const bytes = Buffer.from(cleaned, "base64");
  return new Response(bytes, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=300",
    },
  });
}
