import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ isAdmin: false }, { status: 401 });
    }

    // Hole den aktuellen Wert direkt aus der DB, falls Session noch alten Stand hat
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isAdmin: true },
      });
      if (!dbUser) {
        return NextResponse.json({ isAdmin: false }, { status: 404 });
      }
      return NextResponse.json({ isAdmin: dbUser.isAdmin });
    } catch (err) {
      console.error("is-admin db lookup failed", err);
      // Fallback auf Session-Wert wenn vorhanden (typed)
      const sessionIsAdmin =
        typeof (session.user as unknown as { isAdmin?: unknown })?.isAdmin ===
        "boolean"
          ? ((session.user as unknown as { isAdmin?: boolean }).isAdmin as boolean)
          : false;
      return NextResponse.json({ isAdmin: sessionIsAdmin });
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ isAdmin: false }, { status: 500 });
  }
}
