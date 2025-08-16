import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function getId(url: string) {
  const segments = new URL(url).pathname.split("/").filter(Boolean);
  return segments[segments.length - 1];
}

export async function GET(req: NextRequest) {
  const id = getId(req.url);
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      _count: { select: { likes: true, comments: true } },
      comments: {
        include: {
          createdBy: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      createdBy: { select: { id: true, name: true, image: true } },
    },
  });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(post);
}

export async function PUT(req: NextRequest) {
  const id = getId(req.url);
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.post.findUnique({
    where: { id },
    select: { createdById: true },
  });
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.createdById !== session.user.id && !session.user.isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { content, imageUrl } = await req.json();
  const post = await prisma.post.update({
    where: { id },
    data: { content, imageUrl },
  });
  return NextResponse.json(post);
}

export async function DELETE(req: NextRequest) {
  const id = getId(req.url);
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.post.findUnique({
    where: { id },
    select: { createdById: true },
  });
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.createdById !== session.user.id && !session.user.isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

