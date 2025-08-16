import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function getId(url: string) {
  const segments = new URL(url).pathname.split("/").filter(Boolean);
  const idx = segments.lastIndexOf("comments");
  return idx > 0 ? segments[idx - 1] : undefined;
}

export async function GET(req: NextRequest) {
  const id = getId(req.url);
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const comments = await prisma.postComment.findMany({
    where: { postId: id },
    orderBy: { createdAt: "asc" },
    include: { createdBy: { select: { id: true, name: true, image: true } } },
  });
  return NextResponse.json(comments);
}

export async function POST(req: NextRequest) {
  const id = getId(req.url);
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { content } = await req.json();
  if (!content || typeof content !== "string")
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  const comment = await prisma.postComment.create({
    data: { content, postId: id, createdById: session.user.id },
  });
  return NextResponse.json(comment, { status: 201 });
}

