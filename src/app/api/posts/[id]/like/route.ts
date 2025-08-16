import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function getId(url: string) {
  const segments = new URL(url).pathname.split("/").filter(Boolean);
  const likeIndex = segments.lastIndexOf("like");
  return likeIndex > 0 ? segments[likeIndex - 1] : undefined;
}

export async function POST(req: NextRequest) {
  const id = getId(req.url);
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.postLike.findUnique({
    where: { postId_userId: { postId: id, userId: session.user.id } },
  });
  if (existing) {
    await prisma.postLike.delete({ where: { id: existing.id } });
    return NextResponse.json({ liked: false });
  }

  await prisma.postLike.create({
    data: { postId: id, userId: session.user.id },
  });
  return NextResponse.json({ liked: true });
}

