import { NextRequest } from "next/server";
import { getGoodieImage } from "@/app/(server)/goodies.actions";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const base64 = await getGoodieImage(params.id);
  if (!base64) {
    return new Response("Not found", { status: 404 });
  }
  const bytes = Buffer.from(base64, "base64");
  return new Response(bytes, { status: 200, headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=300" } });
}
