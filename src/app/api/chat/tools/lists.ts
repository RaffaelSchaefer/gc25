import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  ctxOf,
  fromCache,
  assertAuthSession,
  getSessionFromHeaders,
  Session,
} from "../utils";

export const getEventParticipants = tool({
  description: "List participants for an event (top N) + total count.",
  inputSchema: z.object({
    eventId: z.string().min(1),
    limit: z.number().int().min(1).max(24).default(8),
  }),
  execute: async ({ eventId, limit }, options) =>
    fromCache(options, `evt:participants:${eventId}:${limit}`, async () => {
      const rows = await prisma.eventParticipant.findMany({
        where: { eventId },
        take: limit,
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, name: true, image: true } } },
      });
      const total = await prisma.eventParticipant.count({ where: { eventId } });
      return {
        total,
        participants: rows.map((p) => ({
          id: p.user.id,
          name: p.user.name,
          image: p.user.image ?? null,
        })),
      };
    }),
});

export const getStats = tool({
  description: "Quick stats (counts) for dashboard-ish summaries.",
  inputSchema: z.object({}),
  execute: async () => {
    const [events, goodies, votes] = await Promise.all([
      prisma.event.count(),
      prisma.goodie.count(),
      prisma.goodieVote.count(),
    ]);
    return { events, goodies, votes };
  },
});

export const getEventsAdvanced = tool({
  description: "Advanced event listing with filters.",
  inputSchema: z.object({
    category: z
      .nativeEnum({
        MEETUP: "MEETUP",
        EXPO: "EXPO",
        FOOD: "FOOD",
        PARTY: "PARTY",
        TRAVEL: "TRAVEL",
        TOURNAMENT: "TOURNAMENT",
      } as const)
      .optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    mineOnly: z.boolean().optional(),
    joinedOnly: z.boolean().optional(),
    search: z.string().trim().min(1).max(200).optional(),
    limit: z.number().int().min(1).max(100).default(20),
  }),
  execute: async (args, options) => {
    const ctx = ctxOf(options);
    const where: any = {};
    if (args.category) where.category = args.category;
    if (args.search)
      where.name = { contains: args.search, mode: "insensitive" };
    if (args.dateFrom || args.dateTo) {
      where.startDate = {};
      if (args.dateFrom) where.startDate.gte = new Date(args.dateFrom);
      if (args.dateTo) where.startDate.lte = new Date(args.dateTo);
    }
    if (!ctx.session) where.isPublic = true;

    const baseSelect: any = {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      location: true,
      isPublic: true,
      category: true,
      createdById: true,
    };

    if (args.mineOnly || args.joinedOnly) {
      if (!ctx.session) return { error: "auth-required" };
    }
    if (args.mineOnly && ctx.session) where.createdById = ctx.session.user.id;

    const rows = await prisma.event.findMany({
      where,
      orderBy: { startDate: "asc" },
      take: args.limit,
      ...(args.joinedOnly && ctx.session
        ? {
            include: {
              participants: {
                where: { userId: ctx.session.user.id },
                select: { id: true },
              },
            },
          }
        : { select: baseSelect }),
      include: {
        participants: {
          where: {
            userId: "",
          },
          select: {
            id: true,
          },
        },
      },
    });

    const mapped = rows.map((e: any) => ({
      id: e.id,
      name: e.name,
      startDate: e.startDate,
      endDate: e.endDate,
      location: e.location,
      isPublic: e.isPublic,
      category: e.category,
      joined: !!(
        ctx.session &&
        Array.isArray((e as any).participants) &&
        e.participants.length > 0
      ),
      createdByMe: !!(ctx.session && e.createdById === ctx.session.user.id),
    }));

    return mapped;
  },
});

export const getMyEvents = tool({
  description: "List events the current user joined or created.",
  inputSchema: z.object({
    role: z.enum(["joined", "created"]).default("joined"),
    limit: z.number().int().min(1).max(50).default(20),
  }),
  execute: async ({ role, limit }, options) => {
    const ctx = ctxOf(options);
    const err = assertAuthSession(ctx);
    if (err) return err;

    if (role === "created") {
      const rows = await prisma.event.findMany({
        where: { createdById: ctx.session!.user.id },
        orderBy: { startDate: "asc" },
        take: limit,
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
          location: true,
          category: true,
        },
      });
      return rows.map((e) => ({ ...e, joined: true, createdByMe: true }));
    }

    const rows = await prisma.eventParticipant.findMany({
      where: { userId: ctx.session!.user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        event: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            location: true,
            category: true,
          },
        },
      },
    });
    return rows.map((p) => ({
      id: p.event.id,
      name: p.event.name,
      startDate: p.event.startDate,
      endDate: p.event.endDate,
      location: p.event.location,
      category: p.event.category,
      joined: true,
      createdByMe: false,
    }));
  },
});

export const getMyGoodies = tool({
  description: "List goodies collected/created by current user.",
  inputSchema: z.object({
    role: z.enum(["collected", "created"]).default("collected"),
    limit: z.number().int().min(1).max(50).default(20),
  }),
  execute: async ({ role, limit }, options) => {
    const ctx = ctxOf(options);
    const err = assertAuthSession(ctx);
    if (err) return err;

    if (role === "created") {
      const rows = await prisma.goodie.findMany({
        where: { createdById: ctx.session!.user.id },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          name: true,
          type: true,
          location: true,
          date: true,
        },
      });
      return rows.map((g) => ({ ...g, collected: true }));
    }

    const rows = await prisma.goodieCollection.findMany({
      where: { userId: ctx.session!.user.id },
      orderBy: { collectedAt: "desc" },
      take: limit,
      include: {
        goodie: {
          select: {
            id: true,
            name: true,
            type: true,
            location: true,
            date: true,
          },
        },
      },
    });
    return rows.map((c) => ({ ...c.goodie, collected: true }));
  },
});

export const getEvents = tool({
  description: "List events (optional filters).",
  inputSchema: z.object({
    upcomingOnly: z.boolean().optional(),
    search: z.string().trim().min(1).max(200).optional(),
    limit: z.number().int().min(1).max(50).optional().default(20),
  }),
  execute: async ({ upcomingOnly, search, limit }, options) => {
    const ctx = (
      options as {
        experimental_context?: { session?: Session; headers?: Headers };
      }
    ).experimental_context;
    let session = ctx?.session ?? null;
    if (!session && ctx?.headers)
      session = await getSessionFromHeaders(ctx.headers);

    const where: any = {};
    if (upcomingOnly) where.startDate = { gte: new Date() };
    if (search) where.name = { contains: search, mode: "insensitive" };
    if (!session) where.isPublic = true;

    const rows = await prisma.event.findMany({
      where,
      orderBy: { startDate: "asc" },
      take: limit,
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        location: true,
        isPublic: true,
        category: true,
        participants: session
          ? {
              where: { userId: session.user.id },
              select: { id: true },
            }
          : false,
      },
    });

    return rows.map((e: any) => ({
      id: e.id,
      name: e.name,
      startDate: e.startDate,
      endDate: e.endDate,
      location: e.location,
      isPublic: e.isPublic,
      category: e.category,
      joined: !!(
        session &&
        Array.isArray(e.participants) &&
        e.participants.length > 0
      ),
    }));
  },
});

export const getGoodies = tool({
  description: "List goodies (optional filters).",
  inputSchema: z.object({
    type: z.enum(["GIFT", "FOOD", "DRINK"]).optional(),
    collectedOnly: z.boolean().optional(),
    search: z.string().trim().min(1).max(200).optional(),
    limit: z.number().int().min(1).max(50).optional().default(20),
  }),
  execute: async ({ type, collectedOnly, search, limit }, options) => {
    const ctx = (
      options as {
        experimental_context?: { session?: Session; headers?: Headers };
      }
    ).experimental_context;
    let session = ctx?.session ?? null;
    if (!session && ctx?.headers)
      session = await getSessionFromHeaders(ctx.headers);

    const where: any = {};
    if (type) where.type = type;
    if (search) where.name = { contains: search, mode: "insensitive" };

    const rows = await prisma.goodie.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        name: true,
        type: true,
        location: true,
        date: true,
        collections: session
          ? {
              where: { userId: session.user.id },
              select: { id: true },
            }
          : false,
      },
    });

    const mapped = rows.map((g: any) => ({
      id: g.id,
      name: g.name,
      type: g.type,
      location: g.location,
      date: g.date,
      collected: !!(
        session &&
        Array.isArray(g.collections) &&
        g.collections.length > 0
      ),
    }));
    return collectedOnly ? mapped.filter((g) => g.collected) : mapped;
  },
});
