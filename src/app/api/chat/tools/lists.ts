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
    day: z.string().date().optional(),
    mineOnly: z.boolean().optional(),
    joinedOnly: z.boolean().optional(),
    search: z.string().trim().min(1).max(200).optional(),
    location: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().min(1).max(500).optional(),
    sortBy: z
      .enum(["startDate", "name", "createdAt"])
      .optional()
      .default("startDate"),
    sortOrder: z
      .enum(["asc", "desc"])
      .optional()
      .default("asc"),
    limit: z.number().int().min(1).max(100).default(20),
  }),
  execute: async (args, options) => {
    const ctx = ctxOf(options);
    const now = Date.now();
    const where: any = {};
    if (args.category) where.category = args.category;
    if (args.search)
      where.name = { contains: args.search, mode: "insensitive" };
    if (args.location)
      where.location = { contains: args.location, mode: "insensitive" };
    if (args.description)
      where.description = {
        contains: args.description,
        mode: "insensitive",
      };
    const startDate: any = {};
    if (args.dateFrom) startDate.gte = new Date(args.dateFrom);
    if (args.dateTo) startDate.lte = new Date(args.dateTo);
    if (args.day) {
      const start = new Date(args.day);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      startDate.gte = start;
      startDate.lt = end;
    }
    if (Object.keys(startDate).length > 0) where.startDate = startDate;
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
    if (args.joinedOnly && ctx.session)
      where.participants = { some: { userId: ctx.session.user.id } };

    const select: any = { ...baseSelect };
    if (ctx.session)
      select.participants = {
        where: { userId: ctx.session.user.id },
        select: { id: true },
      };

    const rows = await prisma.event.findMany({
      where,
      orderBy: { [args.sortBy ?? "startDate"]: args.sortOrder ?? "asc" },
      take: args.limit,
      select,
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
      startsInMs: new Date(e.startDate).getTime() - now,
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
    const now = Date.now();

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
      return rows.map((e) => ({
        ...e,
        joined: true,
        createdByMe: true,
        startsInMs: e.startDate.getTime() - now,
      }));
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
      startsInMs: p.event.startDate.getTime() - now,
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
    location: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().min(1).max(500).optional(),
    day: z.string().date().optional(),
    sortBy: z
      .enum(["startDate", "name", "createdAt"])
      .optional()
      .default("startDate"),
    sortOrder: z
      .enum(["asc", "desc"])
      .optional()
      .default("asc"),
    limit: z.number().int().min(1).max(50).optional().default(20),
  }),
  execute: async (
    {
      upcomingOnly,
      search,
      location,
      description,
      day,
      sortBy,
      sortOrder,
      limit,
    },
    options,
  ) => {
    const ctx = (
      options as {
        experimental_context?: { session?: Session; headers?: Headers };
      }
    ).experimental_context;
    let session = ctx?.session ?? null;
    if (!session && ctx?.headers)
      session = await getSessionFromHeaders(ctx.headers);
    const now = Date.now();

    const where: any = {};
    if (search) where.name = { contains: search, mode: "insensitive" };
    if (location)
      where.location = { contains: location, mode: "insensitive" };
    if (description)
      where.description = { contains: description, mode: "insensitive" };
    const startDate: any = {};
    if (day) {
      const start = new Date(day);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      startDate.gte = start;
      startDate.lt = end;
    } else if (upcomingOnly) {
      startDate.gte = new Date();
    }
    if (Object.keys(startDate).length > 0) where.startDate = startDate;
    if (!session) where.isPublic = true;

    const rows = await prisma.event.findMany({
      where,
      orderBy: { [sortBy ?? "startDate"]: sortOrder ?? "asc" },
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
      startsInMs: new Date(e.startDate).getTime() - now,
    }));
  },
});

export const getGoodies = tool({
  description: "List goodies (optional filters).",
  inputSchema: z.object({
    type: z.enum(["GIFT", "FOOD", "DRINK"]).optional(),
    collectedOnly: z.boolean().optional(),
    search: z.string().trim().min(1).max(200).optional(),
    location: z.string().trim().min(1).max(200).optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    day: z.string().date().optional(),
    sortBy: z
      .enum(["createdAt", "date", "name"])
      .optional()
      .default("createdAt"),
    sortOrder: z
      .enum(["asc", "desc"])
      .optional()
      .default("desc"),
    limit: z.number().int().min(1).max(50).optional().default(20),
  }),
  execute: async (
    {
      type,
      collectedOnly,
      search,
      location,
      dateFrom,
      dateTo,
      day,
      sortBy,
      sortOrder,
      limit,
    },
    options,
  ) => {
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
    if (search)
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { instructions: { contains: search, mode: "insensitive" } },
      ];
    if (location)
      where.location = { contains: location, mode: "insensitive" };
    const date: any = {};
    if (dateFrom) date.gte = new Date(dateFrom);
    if (dateTo) date.lte = new Date(dateTo);
    if (day) {
      const start = new Date(day);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      date.gte = start;
      date.lt = end;
    }
    if (Object.keys(date).length > 0) where.date = date;

    const rows = await prisma.goodie.findMany({
      where,
      orderBy: { [sortBy ?? "createdAt"]: sortOrder ?? "desc" },
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
