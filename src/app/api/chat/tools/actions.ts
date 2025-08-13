import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionFromHeaders, Session } from "../utils";

export const joinEvent = tool({
  description: "Join an event (requires auth).",
  inputSchema: z.object({ eventId: z.string().min(1) }),
  execute: async ({ eventId }, options) => {
    const ctx = (
      options as {
        experimental_context?: { session?: Session; headers?: Headers };
      }
    ).experimental_context;
    let session = ctx?.session ?? null;
    if (!session && ctx?.headers)
      session = await getSessionFromHeaders(ctx.headers);
    if (!session) return { error: "auth-required" };

    await prisma.eventParticipant.upsert({
      where: { userId_eventId: { userId: session.user.id, eventId } },
      create: { userId: session.user.id, eventId },
      update: {},
    });
    return { ok: true };
  },
});

export const leaveEvent = tool({
  description: "Leave an event (requires auth).",
  inputSchema: z.object({ eventId: z.string().min(1) }),
  execute: async ({ eventId }, options) => {
    const ctx = (
      options as {
        experimental_context?: { session?: Session; headers?: Headers };
      }
    ).experimental_context;
    let session = ctx?.session ?? null;
    if (!session && ctx?.headers)
      session = await getSessionFromHeaders(ctx.headers);
    if (!session) return { error: "auth-required" };

    await prisma.eventParticipant.deleteMany({
      where: { userId: session.user.id, eventId },
    });
    return { ok: true };
  },
});

export const voteGoodie = tool({
  description: "Vote a goodie with value -1 or 1 (requires auth).",
  inputSchema: z.object({
    goodieId: z.string().min(1),
    // akzeptiert "1"/"-1" (string) und 1/-1 (number):
    value: z.coerce
      .number()
      .int()
      .refine((v) => v === -1 || v === 1, {
        message: "value must be -1 or 1",
      }),
  }),
  execute: async ({ goodieId, value }, options) => {
    const ctx = (
      options as {
        experimental_context?: { session?: Session; headers?: Headers };
      }
    ).experimental_context;

    let session = ctx?.session ?? null;
    if (!session && ctx?.headers)
      session = await getSessionFromHeaders(ctx.headers);
    if (!session) return { error: "auth-required" };

    // Existenz prüfen (sauberere Fehlermeldung als FK-Error)
    const exists = await prisma.goodie.findUnique({
      where: { id: goodieId },
      select: { id: true },
    });
    if (!exists) return { error: "not-found" };

    // Upsert + neuen Gesamtscore atomar berechnen
    const { totalScore, votes } = await prisma.$transaction(async (tx) => {
      await tx.goodieVote.upsert({
        where: {
          userId_goodieId: { userId: session!.user.id, goodieId },
        },
        create: { userId: session!.user.id, goodieId, value },
        update: { value },
      });

      const agg = await tx.goodieVote.aggregate({
        where: { goodieId },
        _sum: { value: true },
        _count: true,
      });

      return {
        totalScore: agg._sum.value ?? 0,
        votes: agg._count,
      };
    });

    return {
      ok: true,
      myValue: value as -1 | 1,
      totalScore,
      votes,
    };
  },
});

export const clearGoodieVote = tool({
  description: "Clear vote for a goodie (requires auth).",
  inputSchema: z.object({ goodieId: z.string().min(1) }),
  execute: async ({ goodieId }, options) => {
    const ctx = (
      options as {
        experimental_context?: { session?: Session; headers?: Headers };
      }
    ).experimental_context;
    let session = ctx?.session ?? null;
    if (!session && ctx?.headers)
      session = await getSessionFromHeaders(ctx.headers);
    if (!session) return { error: "auth-required" };

    await prisma.goodieVote.deleteMany({
      where: { userId: session.user.id, goodieId },
    });
    return { ok: true };
  },
});

export const toggleCollectGoodie = tool({
  description: "Toggle collected status for a goodie (requires auth).",
  inputSchema: z.object({ goodieId: z.string().min(1) }),
  execute: async ({ goodieId }, options) => {
    const ctx = (
      options as {
        experimental_context?: { session?: Session; headers?: Headers };
      }
    ).experimental_context;
    let session = ctx?.session ?? null;
    if (!session && ctx?.headers)
      session = await getSessionFromHeaders(ctx.headers);
    if (!session) return { error: "auth-required" };

    const existing = await prisma.goodieCollection.findFirst({
      where: { userId: session.user.id, goodieId },
      select: { id: true },
    });
    if (existing) {
      await prisma.goodieCollection.delete({
        where: { id: existing.id },
      });
      return { collected: false };
    } else {
      await prisma.goodieCollection.create({
        data: { userId: session.user.id, goodieId },
      });
      return { collected: true };
    }
  },
});
