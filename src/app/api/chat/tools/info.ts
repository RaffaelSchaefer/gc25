import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ctxOf, fromCache, getSessionFromHeaders, Session } from "../utils";

export const getEventInformation = tool({
  description: "Return EventCardEvent for a given event ID.",
  inputSchema: z.object({ eventId: z.string().min(1) }),
  execute: async ({ eventId }, options) => {
    const ctx = ctxOf(options);
    const session =
      ctx.session ??
      (ctx.headers ? await getSessionFromHeaders(ctx.headers) : null);

    return fromCache(options, `evt:${eventId}`, async () => {
      const e = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          createdBy: { select: { id: true, name: true, image: true } },
          participants: {
            include: {
              user: { select: { id: true, name: true, image: true } },
            },
          },
        },
      });
      if (!e) return { error: "Event not found" };

      const userJoined = !!(
        session && e.participants.some((p) => p.userId === session.user.id)
      );
      const attendees = e.participants.length;
      const participants = e.participants.slice(0, 8).map((p) => ({
        id: p.user.id,
        name: p.user.name,
        image: p.user.image ?? null,
      }));

      const event = {
        id: e.id,
        title: e.name,
        time: "",
        dateISO: e.startDate.toISOString(),
        location: e.location ?? null,
        url: e.url ?? null,
        description:
          e.summary ?? (e.description ? e.description.slice(0, 240) : null),
        attendees,
        userJoined,
        startDate: e.startDate.toISOString(),
        endDate: e.endDate.toISOString(),
        startsInMs: e.startDate.getTime() - Date.now(),
        createdById: e.createdById,
        createdBy: e.createdBy
          ? { name: e.createdBy.name, image: e.createdBy.image ?? null }
          : undefined,
        category: e.category,
        isPublic: e.isPublic,
        participants,
      };
      return event;
    });
  },
});

export const getGoodieInformation = tool({
  description: "Return GoodieDto for a given goodie ID.",
  inputSchema: z.object({ goodieId: z.string().min(1) }),
  execute: async ({ goodieId }, options) => {
    const ctx = ctxOf(options);
    const session =
      ctx.session ??
      (ctx.headers ? await getSessionFromHeaders(ctx.headers) : null);

    return fromCache(options, `good:${goodieId}`, async () => {
      const g = await prisma.goodie.findUnique({
        where: { id: goodieId },
        include: {
          createdBy: { select: { id: true, name: true, image: true } },
        },
      });
      if (!g) return { error: "Goodie not found" };

      const collected =
        !!session &&
        !!(await prisma.goodieCollection.findFirst({
          where: { userId: session.user.id, goodieId },
          select: { id: true },
        }));

      const votes = await prisma.goodieVote.findMany({
        where: { goodieId },
        select: { value: true },
      });
      const totalScore = votes.reduce((a, v) => a + v.value, 0);

      const goodie = {
        id: g.id,
        createdAt: g.createdAt.toISOString(),
        updatedAt: g.updatedAt.toISOString(),
        createdById: g.createdById,
        type: g.type,
        name: g.name,
        location: g.location,
        instructions: g.instructions,
        date: g.date ? g.date.toISOString() : null,
        registrationUrl: g.registrationUrl ?? null,
        collected,
        totalScore,
        createdBy: g.createdBy
          ? { name: g.createdBy.name, image: g.createdBy.image ?? null }
          : undefined,
      };
      return goodie;
    });
  },
});
