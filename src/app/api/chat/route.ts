// apps/web/app/api/ai/route.ts
import { streamText, UIMessage, convertToModelMessages, tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

/** Prisma → Node runtime */
export const runtime = "nodejs";
/** Streaming timeout */
export const maxDuration = 30;

/* ----------------------------- OpenRouter Client ---------------------------- */
const OPENROUTER_KEY =
  process.env.OPENROUTER_API_KEY ?? process.env.OPEN_ROUTER_API_KEY ?? "";
if (!OPENROUTER_KEY && process.env.NODE_ENV !== "production") {
  console.warn("[ai] Missing OPENROUTER_API_KEY / OPEN_ROUTER_API_KEY");
}
const openrouter = createOpenRouter({ apiKey: OPENROUTER_KEY });

/* --------------------------------- Helpers --------------------------------- */
type Session = { user: { id: string } } | null;

async function getSessionFromHeaders(headers: Headers): Promise<Session> {
  try {
    const s = await auth.api.getSession({ headers });
    return s ?? null;
  } catch {
    return null;
  }
}

/* --------------------------------- SYSTEM ---------------------------------- */
const SYSTEM_PROMPT = `You are "Pixi", the in-platform AI assistant of the gc25 app.

STYLE
- Default Deutsch (sonst Nutzersprache spiegeln). Kurz, sachlich, 1–2 Sätze. Bullet Points nur für Listen.

SHOW CARDS
- Wenn ein Event/Goodie erwähnt wird (Name, Slug oder ID), rufe GENAU EINMAL:
  - getEventInformation (für Events) oder
  - getGoodieInformation (für Goodies)
- Falls nur Name/Slug vorhanden: nutze resolve*-Tools, dann das passende *Information-Tool.
- Duplikate in derselben Antwort vermeiden.

SCOPE
- Events (Titel/Zeiten/Ort/Teilnahme), Goodies (Typ/Ort/Datum/Collected).
- Off-Topic höflich zur Plattform zurückführen.

TEXT-FORMAT
- Event: Titel – Datum(kurz) – Ort(optional) – Teilgenommen: ja/nein.
- Goodie: Name (Typ, Gesammelt: ja/nein).
- >8 Items: Top 8 + Gesamtzahl. Keine Roh-URLs.

ACTIONS
- Auf Nachfrage: joinEvent/leaveEvent, voteGoodie, clearGoodieVote, toggleCollectGoodie.

DATA GUARD
- Nichts erfinden. Nach Tool-Result sofort kurz antworten (DE) + Karten.`;

/* --------------------------------- RESOLVERS -------------------------------- */
const resolveEventByName = tool({
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
      select: { id: true, name: true, slug: true, startDate: true, location: true, category: true },
    });
    const q = query.toLowerCase();
    const rank = (n: string) =>
      n.toLowerCase() === q ? 100 : n.toLowerCase().startsWith(q) ? 80 : n.toLowerCase().includes(q) ? 50 : 0;
    return items.sort((a, b) => rank(b.name) - rank(a.name)).slice(0, limit);
  },
});

const resolveEventBySlug = tool({
  description: "Resolve a single event by slug.",
  inputSchema: z.object({ slug: z.string().trim().min(1) }),
  execute: async ({ slug }) => {
    const e = await prisma.event.findFirst({
      where: { slug },
      select: { id: true, name: true, slug: true },
    });
    return e ?? { error: "Event not found" };
  },
});

const resolveGoodieByName = tool({
  description: "Resolve goodies by (partial) name (limit 3).",
  inputSchema: z.object({
    query: z.string().trim().min(1).max(200),
    limit: z.number().int().min(1).max(5).optional().default(3),
  }),
  execute: async ({ query, limit }) => {
    const items = await prisma.goodie.findMany({
      where: { name: { contains: query, mode: "insensitive" } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, name: true, type: true, location: true, date: true },
    });
    const q = query.toLowerCase();
    const score = (n: string) =>
      n.toLowerCase() === q ? 100 : n.toLowerCase().startsWith(q) ? 80 : n.toLowerCase().includes(q) ? 50 : 0;
    return items.sort((a, b) => score(b.name) - score(a.name)).slice(0, limit);
  },
});

/* ------------------------------- CARD TOOLS -------------------------------- */
const getEventInformation = tool({
  description: "Return EventCardEvent for a given event ID.",
  inputSchema: z.object({ eventId: z.string().min(1) }),
  execute: async ({ eventId }, options) => {
    const ctx = (options as { experimental_context?: { session?: Session; headers?: Headers } }).experimental_context;
    let session = ctx?.session ?? null;
    if (!session && ctx?.headers) session = await getSessionFromHeaders(ctx.headers);

    const e = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        createdBy: { select: { id: true, name: true, image: true } },
        participants: { include: { user: { select: { id: true, name: true, image: true } } } },
      },
    });
    if (!e) return { error: "Event not found" };

    const userJoined = !!(session && e.participants.some((p) => p.userId === session.user.id));
    const attendees = e.participants.length;
    const participants = e.participants.slice(0, 8).map((p) => ({
      id: p.user.id,
      name: p.user.name,
      image: p.user.image ?? null,
    }));

    // exakt das Shape, das dein <EventCard /> erwartet
    const event = {
      id: e.id,
      title: e.name,
      time: "",
      dateISO: e.startDate.toISOString(),
      location: e.location ?? null,
      url: e.url ?? null,
      description: e.summary ?? (e.description ? e.description.slice(0, 240) : null),
      attendees,
      userJoined,
      startDate: e.startDate.toISOString(),
      endDate: e.endDate.toISOString(),
      createdById: e.createdById,
      createdBy: e.createdBy ? { name: e.createdBy.name, image: e.createdBy.image ?? null } : undefined,
      category: e.category,
      isPublic: e.isPublic,
      participants,
    };

    return event; // Client rendert <EventCard event={event} />
  },
});

const getGoodieInformation = tool({
  description: "Return GoodieDto for a given goodie ID.",
  inputSchema: z.object({ goodieId: z.string().min(1) }),
  execute: async ({ goodieId }, options) => {
    const ctx = (options as { experimental_context?: { session?: Session; headers?: Headers } }).experimental_context;
    let session = ctx?.session ?? null;
    if (!session && ctx?.headers) session = await getSessionFromHeaders(ctx.headers);

    const g = await prisma.goodie.findUnique({
      where: { id: goodieId },
      include: { createdBy: { select: { id: true, name: true, image: true } } },
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

    // Shape kompatibel zu deinem GoodieDto (Client nutzt nur `goodie`)
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
      createdBy: g.createdBy ? { name: g.createdBy.name, image: g.createdBy.image ?? null } : undefined,
    };

    return goodie; // Client rendert <GoodieCard goodie={goodie} />
  },
});

/* --------------------------------- LISTINGS -------------------------------- */
const getEvents = tool({
  description: "List events (optional filters).",
  inputSchema: z.object({
    upcomingOnly: z.boolean().optional(),
    search: z.string().trim().min(1).max(200).optional(),
    limit: z.number().int().min(1).max(50).optional().default(20),
  }),
  execute: async ({ upcomingOnly, search, limit }, options) => {
    const ctx = (options as { experimental_context?: { session?: Session; headers?: Headers } }).experimental_context;
    let session = ctx?.session ?? null;
    if (!session && ctx?.headers) session = await getSessionFromHeaders(ctx.headers);

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
        participants: session ? { where: { userId: session.user.id }, select: { id: true } } : false,
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
      joined: !!(session && Array.isArray(e.participants) && e.participants.length > 0),
    }));
  },
});

const getGoodies = tool({
  description: "List goodies (optional filters).",
  inputSchema: z.object({
    type: z.enum(["GIFT", "FOOD", "DRINK"]).optional(),
    collectedOnly: z.boolean().optional(),
    search: z.string().trim().min(1).max(200).optional(),
    limit: z.number().int().min(1).max(50).optional().default(20),
  }),
  execute: async ({ type, collectedOnly, search, limit }, options) => {
    const ctx = (options as { experimental_context?: { session?: Session; headers?: Headers } }).experimental_context;
    let session = ctx?.session ?? null;
    if (!session && ctx?.headers) session = await getSessionFromHeaders(ctx.headers);

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
        collections: session ? { where: { userId: session.user.id }, select: { id: true } } : false,
      },
    });

    const mapped = rows.map((g: any) => ({
      id: g.id,
      name: g.name,
      type: g.type,
      location: g.location,
      date: g.date,
      collected: !!(session && Array.isArray(g.collections) && g.collections.length > 0),
    }));
    return collectedOnly ? mapped.filter((g) => g.collected) : mapped;
  },
});

/* --------------------------------- ACTIONS --------------------------------- */
const joinEvent = tool({
  description: "Join an event (requires auth).",
  inputSchema: z.object({ eventId: z.string().min(1) }),
  execute: async ({ eventId }, options) => {
    const ctx = (options as { experimental_context?: { session?: Session; headers?: Headers } }).experimental_context;
    let session = ctx?.session ?? null;
    if (!session && ctx?.headers) session = await getSessionFromHeaders(ctx.headers);
    if (!session) return { error: "auth-required" };

    await prisma.eventParticipant.upsert({
      where: { userId_eventId: { userId: session.user.id, eventId } },
      create: { userId: session.user.id, eventId },
      update: {},
    });
    return { ok: true };
  },
});

const leaveEvent = tool({
  description: "Leave an event (requires auth).",
  inputSchema: z.object({ eventId: z.string().min(1) }),
  execute: async ({ eventId }, options) => {
    const ctx = (options as { experimental_context?: { session?: Session; headers?: Headers } }).experimental_context;
    let session = ctx?.session ?? null;
    if (!session && ctx?.headers) session = await getSessionFromHeaders(ctx.headers);
    if (!session) return { error: "auth-required" };

    await prisma.eventParticipant.deleteMany({
      where: { userId: session.user.id, eventId },
    });
    return { ok: true };
  },
});

const voteGoodie = tool({
  description: "Vote a goodie with value -1 or 1 (requires auth).",
  inputSchema: z.object({ goodieId: z.string().min(1), value: z.enum(["-1", "1"]).transform(Number) }),
  execute: async ({ goodieId, value }, options) => {
    const ctx = (options as { experimental_context?: { session?: Session; headers?: Headers } }).experimental_context;
    let session = ctx?.session ?? null;
    if (!session && ctx?.headers) session = await getSessionFromHeaders(ctx.headers);
    if (!session) return { error: "auth-required" };

    await prisma.goodieVote.upsert({
      where: { userId_goodieId: { userId: session.user.id, goodieId } },
      create: { userId: session.user.id, goodieId, value },
      update: { value },
    });
    return { ok: true };
  },
});

const clearGoodieVote = tool({
  description: "Clear vote for a goodie (requires auth).",
  inputSchema: z.object({ goodieId: z.string().min(1) }),
  execute: async ({ goodieId }, options) => {
    const ctx = (options as { experimental_context?: { session?: Session; headers?: Headers } }).experimental_context;
    let session = ctx?.session ?? null;
    if (!session && ctx?.headers) session = await getSessionFromHeaders(ctx.headers);
    if (!session) return { error: "auth-required" };

    await prisma.goodieVote.deleteMany({
      where: { userId: session.user.id, goodieId },
    });
    return { ok: true };
  },
});

const toggleCollectGoodie = tool({
  description: "Toggle collected status for a goodie (requires auth).",
  inputSchema: z.object({ goodieId: z.string().min(1) }),
  execute: async ({ goodieId }, options) => {
    const ctx = (options as { experimental_context?: { session?: Session; headers?: Headers } }).experimental_context;
    let session = ctx?.session ?? null;
    if (!session && ctx?.headers) session = await getSessionFromHeaders(ctx.headers);
    if (!session) return { error: "auth-required" };

    const existing = await prisma.goodieCollection.findFirst({
      where: { userId: session.user.id, goodieId },
      select: { id: true },
    });
    if (existing) {
      await prisma.goodieCollection.delete({ where: { id: existing.id } });
      return { collected: false };
    } else {
      await prisma.goodieCollection.create({ data: { userId: session.user.id, goodieId } });
      return { collected: true };
    }
  },
});

/* ----------------------------------- API ----------------------------------- */
export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const headers = new Headers(req.headers);
  const session = await getSessionFromHeaders(headers);

  const modelId =
    headers.get("x-model")?.trim() ||
    process.env.OPENROUTER_MODEL ||
    "openai/gpt-oss-120b";

  const result = streamText({
    model: openrouter(modelId),
    system: SYSTEM_PROMPT,
    messages: convertToModelMessages(messages),
    tools: {
      // Resolver
      resolveEventByName,
      resolveEventBySlug,
      resolveGoodieByName,
      // Cards (Client rendert diese beiden!)
      getEventInformation,
      getGoodieInformation,
      // Listings
      getEvents,
      getGoodies,
      // Actions
      joinEvent,
      leaveEvent,
      voteGoodie,
      clearGoodieVote,
      toggleCollectGoodie,
    },
    experimental_context: { session, headers },
    stopWhen: () => false,
    prepareStep: ({ steps }) => {
      const last = steps[steps.length - 1] as any | undefined;
      if (last?.stepType === "tool-result") {
        return { toolChoice: "none" as const, system: SYSTEM_PROMPT };
      }
      if (steps.length >= 6) return { toolChoice: "none" as const };
      return {};
    },
    onStepFinish: (r) => {
      if (process.env.NODE_ENV !== "production") {
        const stepType = (r as any).stepType ?? "?";
        const finishReason = (r as any).finishReason;
        const toolCalls = Array.isArray((r as any).toolCalls)
          ? (r as any).toolCalls.map((c: any) => c?.toolName).filter(Boolean)
          : undefined;
        const toolResults = Array.isArray((r as any).toolResults)
          ? (r as any).toolResults.length
          : undefined;
        console.log("[agent step]", { stepType, finishReason, toolCalls, toolResults });
      }
    },
  });

  // gemäß AI SDK Docs: keine UI-Registry hier
  return result.toUIMessageStreamResponse();
}