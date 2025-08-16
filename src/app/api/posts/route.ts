import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      _count: { select: { likes: true, comments: true } },
      createdBy: { select: { id: true, name: true, image: true } },
    },
  });
  return NextResponse.json(posts);
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const {
    content,
    imageUrl,
    goodieId,
    eventId,
    taggedUserIds,
  } = await req.json();

  if (!content || typeof content !== "string")
    return NextResponse.json({ error: "Content required" }, { status: 400 });

  const post = await prisma.post.create({
    data: {
      content,
      imageUrl,
      goodieId,
      eventId,
      createdById: session.user.id,
      taggedUsers: Array.isArray(taggedUserIds)
        ? {
            create: taggedUserIds.map((uid: string) => ({ userId: uid })),
          }
        : undefined,
    },
  });

  return NextResponse.json(post, { status: 201 });
}

