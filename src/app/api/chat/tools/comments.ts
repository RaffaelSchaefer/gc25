import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ctxOf, assertAuthSession } from "../utils";

export const listEventComments = tool({
  description: "List comments for an event (newest first).",
  inputSchema: z.object({
    eventId: z.string().min(1),
    limit: z.number().int().min(1).max(50).default(20),
  }),
  execute: async ({ eventId, limit }) =>
    await prisma.comment.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { createdBy: { select: { id: true, name: true, image: true } } },
    }),
});

export const createEventComment = tool({
  description: "Create a comment on an event (requires auth).",
  inputSchema: z.object({
    eventId: z.string().min(1),
    content: z.string().trim().min(1).max(2000),
  }),
  execute: async ({ eventId, content }, options) => {
    const ctx = ctxOf(options);
    const err = assertAuthSession(ctx);
    if (err) return err;

    const created = await prisma.comment.create({
      data: { eventId, createdById: ctx.session!.user.id, content },
      include: { createdBy: { select: { id: true, name: true, image: true } } },
    });
    return created;
  },
});

export const deleteMyEventComment = tool({
  description: "Delete my own comment by id (requires auth).",
  inputSchema: z.object({ commentId: z.string().uuid() }),
  execute: async ({ commentId }, options) => {
    const ctx = ctxOf(options);
    const err = assertAuthSession(ctx);
    if (err) return err;

    const c = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { createdById: true },
    });
    if (!c) return { error: "not-found" };
    if (c.createdById !== ctx.session!.user.id) return { error: "forbidden" };
    await prisma.comment.delete({ where: { id: commentId } });
    return { ok: true };
  },
});
