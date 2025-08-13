import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const resolveGoodieBySlug = tool({
  description: "Resolve a single goodie by slug.",
  inputSchema: z.object({ slug: z.string().trim().min(1) }),
  execute: async ({ slug }) =>
    (await prisma.goodie.findFirst({
      where: {
        // slug,
        name: slug, // fallback: notfalls Name exact
      },
      select: { id: true, name: true },
    })) ?? { error: "Goodie not found" },
});

export const resolveEventById = tool({
  description: "Resolve event by ID (light).",
  inputSchema: z.object({ id: z.string().uuid() }),
  execute: async ({ id }) =>
    (await prisma.event.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true },
    })) ?? { error: "Event not found" },
});

export const resolveGoodieById = tool({
  description: "Resolve goodie by ID (light).",
  inputSchema: z.object({ id: z.string().uuid() }),
  execute: async ({ id }) =>
    (await prisma.goodie.findUnique({
      where: { id },
      select: { id: true, name: true },
    })) ?? { error: "Goodie not found" },
});

export const resolveEventByName = tool({
  description: "Resolve events by (partial) name (limit 3).",
  inputSchema: z.object({
    query: z.string().trim().min(1).max(200),
    limit: z.number().int().min(1).max(5).optional().default(3),
    upcomingOnly: z.boolean().optional(),
  }),
  execute: async ({ query, limit, upcomingOnly }) => {
    const where: any = { name: { contains: query, mode: "insensitive" } };
    if (upcomingOnly) where.startDate = { gte: new Date() };
    const items = await prisma.event.findMany({
      where,
      orderBy: { startDate: "asc" },
      take: 20,
      select: {
        id: true,
        name: true,
        slug: true,
        startDate: true,
        location: true,
        category: true,
      },
    });
    const q = query.toLowerCase();
    const rank = (n: string) =>
      n.toLowerCase() === q
        ? 100
        : n.toLowerCase().startsWith(q)
          ? 80
          : n.toLowerCase().includes(q)
            ? 50
            : 0;
    return items
      .map((i) => ({
        ...i,
        rank: rank(i.name),
      }))
      .sort((a, b) => b.rank - a.rank)
      .slice(0, limit);
  },
});

export const resolveEventBySlug = tool({
  description: "Resolve a single event by slug.",
  inputSchema: z.object({ slug: z.string().trim().min(1) }),
  execute: async ({ slug }) =>
    (await prisma.event.findFirst({
      where: { slug },
      select: { id: true, name: true, slug: true },
    })) ?? { error: "Event not found" },
});

export const resolveGoodieByName = tool({
  description: "Resolve goodies by (partial) name (limit 3).",
  inputSchema: z.object({
    query: z.string().trim().min(1).max(200),
    limit: z.number().int().min(1).max(5).optional().default(3),
  }),
  execute: async ({ query, limit }) => {
    const where: any = { name: { contains: query, mode: "insensitive" } };
    const items = await prisma.goodie.findMany({
      where,
      orderBy: { name: "asc" },
      take: 20,
      select: { id: true, name: true },
    });
    const q = query.toLowerCase();
    const rank = (n: string) =>
      n.toLowerCase() === q
        ? 100
        : n.toLowerCase().startsWith(q)
          ? 80
          : n.toLowerCase().includes(q)
            ? 50
            : 0;
    return items
      .map((i) => ({ ...i, rank: rank(i.name) }))
      .sort((a, b) => b.rank - a.rank)
      .slice(0, limit);
  },
});
