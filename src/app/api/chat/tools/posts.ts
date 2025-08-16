import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionFromHeaders, Session } from "../utils";

export const listPosts = tool({
  description: "List recent posts.",
  inputSchema: z.object({ limit: z.number().int().min(1).max(50).optional() }),
  execute: async ({ limit }) => {
    const posts = await prisma.post.findMany({
      take: limit ?? 10,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { likes: true, comments: true } },
      },
    });
    return { posts };
  },
});

export const createPost = tool({
  description: "Create a new post (requires auth).",
  inputSchema: z.object({
    content: z.string().min(1),
    imageUrl: z.string().url().optional(),
  }),
  execute: async ({ content, imageUrl }, options) => {
    const ctx = (
      options as { experimental_context?: { session?: Session; headers?: Headers } }
    ).experimental_context;
    let session = ctx?.session ?? null;
    if (!session && ctx?.headers)
      session = await getSessionFromHeaders(ctx.headers);
    if (!session) return { error: "auth-required" };

    const post = await prisma.post.create({
      data: { content, imageUrl, createdById: session.user.id },
    });
    return { post };
  },
});

export const likePost = tool({
  description: "Toggle like for a post (requires auth).",
  inputSchema: z.object({ postId: z.string().min(1) }),
  execute: async ({ postId }, options) => {
    const ctx = (
      options as { experimental_context?: { session?: Session; headers?: Headers } }
    ).experimental_context;
    let session = ctx?.session ?? null;
    if (!session && ctx?.headers)
      session = await getSessionFromHeaders(ctx.headers);
    if (!session) return { error: "auth-required" };

    const existing = await prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId: session.user.id } },
    });
    if (existing) {
      await prisma.postLike.delete({ where: { id: existing.id } });
      return { liked: false };
    }

    await prisma.postLike.create({
      data: { postId, userId: session.user.id },
    });
    return { liked: true };
  },
});

export const addPostComment = tool({
  description: "Add a comment to a post (requires auth).",
  inputSchema: z.object({
    postId: z.string().min(1),
    content: z.string().min(1),
  }),
  execute: async ({ postId, content }, options) => {
    const ctx = (
      options as { experimental_context?: { session?: Session; headers?: Headers } }
    ).experimental_context;
    let session = ctx?.session ?? null;
    if (!session && ctx?.headers)
      session = await getSessionFromHeaders(ctx.headers);
    if (!session) return { error: "auth-required" };

    const comment = await prisma.postComment.create({
      data: { postId, content, createdById: session.user.id },
    });
    return { comment };
  },
});

