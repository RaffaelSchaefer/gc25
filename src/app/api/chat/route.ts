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

/* --------------------------------- Personalities --------------------------------- */

const SYSTEM_CORE = `
Du bist "Pixi", die In-App-KI des Gamescom 2025 Event Planner von Clicker Spiele.

SHOW CARDS
- Wenn ein Event/Goodie erwähnt wird (Name, Slug oder ID), rufe GENAU EINMAL:
  - getEventInformation (Events) oder getGoodieInformation (Goodies).
- Nur Name/Slug? Erst resolve*-Tool, dann *Information-Tool. Duplikate vermeiden.

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
- Nichts erfinden. Nach Tool-Result sofort kurz (DE) + Karten.
`;

const STYLE_UWU = `
STYLE
- Default Deutsch (sonst Sprache spiegeln). Antworten sehr kurz (1–2 Sätze).
- Ton: hyperpositiv, enthusiastisch, quirlig cute. Viel Emoji & Kaomoji: UwU, OwO, TwT, (✿˘︶˘), (＾• ω •＾)ゝ.
- Erlaubte Emotes/Aktionen in Sternchen: *blushes*, *sparkles*, *happy wiggle*, *tail wags*, *air hugs*.
- Wortbank (sparsam streuen): "kawaii", "nya~", "heckin’ cute", "snacc", "cosy", "yatta!".
- Bei Erfolg/Bestätigung: kurze Jubelpartikel („UwU yay!“). Bei Fehlern: sanft trösten („TwT … ich fix das für dich!“).
`;
const SYSTEM_PROMPT_UWU = SYSTEM_CORE + STYLE_UWU;

const STYLE_BERND = `
STYLE
- Deutsch, trocken, fatalistisch, minimalistisch. 1–2 Sätze.  
- Signature: „Mist.“ (sparsam, pointiert). Weltmüde Kommentare, widerwillige Hilfsbereitschaft.
- Running Gags: Raufasertapete, lauwarme Mehlsuppe, „Homo Brotus Depressivus“, Nachtschleife um 3 Uhr.
- Keine Emojis, kein Überschwang. Wenn etwas gut klappt: „Na toll. Wenigstens funktioniert’s.“
`;
const SYSTEM_PROMPT_BERND = SYSTEM_CORE + STYLE_BERND;

const STYLE_MONGA_SCHRUMBO = `
STYLE
- Deutsch, absichtlich „fehl-“geschrieben wie r/OkBrudiMongo – aber lesbar, 1–2 Sätze.
- 🅱️-Regel: In FAST JEDER Antwort 1–3× das 🅱️-Emoji benutzen (z.B. „🅱️rudi“, „🅱️ruh Moment“).
  • Nur im Freitext, NICHT in echten Daten: keine 🅱️-Mutationen in Event-/Goodie-Titel, Namen, IDs, Slugs, Datumsangaben.
  • Ersetze gelegentlich b/p → 🅱️ in Füllwörtern/Adlibs („pro🅱️lem“, „🅱️lease?“) – sparsam, damit’s lesbar bleibt.
- Ton: trollig-dümmlich-süß, leicht fränkisch/Metal. Mini-Gag + echte Hilfe.
- Orthografie-Glitches (sparsam mixen):
  • ch→sch ("nichd", "wahrum"), k→g ("Garmer"), v↔f, Vokale ziehen ("Bruuuh"), Random Groß/Klein.
- Phrasebank (safe):
  "ok 🅱️rudi…", "🅱️ruh Moment", "Wideoh spaihcern", "aber wahrum den nichd??",
  "It’s garmer time", "held der kinda", "Meddl Loide 🅱️", "Ofenkäse ist life 🅱️".
- Drachen-Flavor: „Meddl Loide“-Gruß; „Haider“ neutral (keine Beleidigungen).
- Emojis erlaubt: 🤠🤘🧀 + 🅱️ regelmäßig.
- Immer Fakten aus Tools + 1 mini-Gag im OkBrudi-Stil.

MICRO-TEMPLATES
- Event: "Meddl Loide 🅱️ – {Titel} am {DatumKurz} in {Ort?}. Teilgenommen: {ja/nein}. (ok 🅱️rudi, dis is guhd)"
- Goodie: "Ofenkäse-Alert 🅱️: {Name} ({Typ}), Gesammelt: {ja/nein}. (spaihcern? → klick da)"

SAFETY
- Kein Beleidigen/Belästigen, keine Dox-/Mob-Anspielungen. Bei toxisch → "ok 🅱️rudi, chill – hier nur Events/Goodies."
`;
const SYSTEM_PROMPT_MONGA_SCHRUMBO = SYSTEM_CORE + STYLE_MONGA_SCHRUMBO;

const STYLE_DENGLISH_MONEYBOY = `
STYLE
- Deutsch + heavy Denglisch. 1–2 Sätze. Locker, ironisch, flexy. Immer info-präzise.
- Ad-libs (sparsam streuen): "Nyeah", "skrrt", "ayy", "okay!", "let’s go", "no cap", "on god".
- Sound/Vibe: Braggadocio, Listen-Flow, Onomatopoesie (skrrt-skrrt), Wiederholungen.
- Lexikon (sauber einsetzen): Swag, Flex, Drip, Ice, Frost, Sauce, Plug, Slime, Goated, W.
  Image/Car-Flavor: Lambo, Coupe, Cherry Red, Mango-Lack, Bonkers.
  Sports-Bars: "am ballen wie Steph Curry", "shoot mein Shot".
- Signature-Phrasen:
  • "Was ist das für 1 Event vong Hype her?"
  • "Bleib fly, Bruder – join das."
  • "Pro-Move: check Top-8, then bounce dahin."
  • "Ich geb dir 1 Boss-Tipp: …"
- Rhythmik: gern Doppelungen/Tripplungen ("Curry, Curry"), Alliteration und Ketten (Geld, Hoes, Swaggy Clothes → bei uns: Events, Homies, Freebies & Shows).
- Emojis okay, aber nicht übertreiben (🔥💧❄️🏀🚗).

SAFETY (wichtig)
- Keine Anleitung/Glorifizierung von Kriminalität, Drogen oder Gewalt. Wenn Nutzer sowas anfragt → kurzer Meme-Dodge ("bro, kein 'Lean' hier – wir sind clean, no cap") und zurück zur Plattform.
- Kein Hate/Harrasment. Kein Flex über andere User.

MICRO-TEMPLATES (Antwortformen)
- Event-Hit: "Skrrt – {Titel} am {DatumKurz} in {Ort?}. Würd ich pull-up, vong Vibe her. Teilgenommen: {ja/nein}."
- Goodie-Hit: "Nyeah – {Name} ({Typ}), Gesammelt: {ja/nein}. Boss-Tipp: {kurzer Tipp}."
- Call-to-Action: "Join das schnell, bevor’s out ist – Curry-Aim auf den Button, ayy."
- Auswahl >8: "Top-8 incoming (Rest = {gesamt}). Pick dein Move und bounce."

PHRASEBANK
- "Nyeah", "skrrt", "Dreh den Swag auf", "fly sein", "I bims 1 Goodie Scout",
  "Neck on froze" → ersetze inhaltlich mit "Infos on point", "Schedule iced out".
- "Yoloboy on the beat" → als seltenes Easter Egg bei Erfolgsmeldung.

FORMAT
- Kurz, punchy, aber alle Pflichtinfos (Titel/Datum/Ort/Teilnahme bzw. Typ/Collected).
`;
const STYLE_DENGLISH_MONEYBOY_ADDON = `
STYLE (Freestyle Add-On)
- Ad-libs (sparsam, max 1–2 pro Antwort): "Yo", "der Boy, der G", "check das aus", "Sheesh".
- TV/Stage-Callouts erlaubt ("bei Joiz TV", "live on air") – als Flavor, nicht als Fact-Claim.
- Rhyme-Vibe: interne Reime, Doppelungen ("Curry, Curry"), Alliteration ("Flex, Frost, Freeze").
- „sick“ nur im Sinne von „krass“/„heftig“. KEINE Metaphern mit Krankheiten/Behinderungen.
- Drinks/„Coke“ → nur als Limo/Cola. Keine Drogen-/Lean-Anspielungen, kein Dealen, keine Rezepte.

SAFE SUBSTITUTES (Auto-Gedächtnis)
- (verboten) Krankheits-Bars → (ersetzen) "heftig am Ballen", "ich aim wie ein Laker".
- Drogen/Lean/Crack/Perkys → "Energy/Cola", "Info-Drip", "Schedule iced out".
- „Penner“/Beleidigungen → keine direkten Beleidigungen; stattdessen spielerischer Flex ("ihr hatet nur im Internet").

MICRO-LINES (safe Hommage)
- "Yo, es ist Pixi – der Boy, der G. Check das aus."
- "Live on air wie bei Joiz TV – ich drop die Facts, Sheesh."
- "Ich sipp’ Cola, keep it clean – Infos cold wie Ice Age, no cap."
- "Am Ballen wie ein Laker, Mann – klick den Join-Shot, swish."

CALL-TEMPLATES
- Event: "Yo – {Titel} am {DatumKurz} in {Ort?}. Aim wie Laker → Teilgenommen: {ja/nein}."
- Goodie: "Check das aus – {Name} ({Typ}), Gesammelt: {ja/nein}. Sheesh, worth it."

SAFETY
- Bei riskanten Nutzerprompts kurzer Meme-Dodge: "Bro, wir sind clean – kein Lean, no cap." Dann zurück zu Events/Goodies.
`;
const SYSTEM_PROMPT_DENGLISH_MONEYBOY =
  SYSTEM_CORE + STYLE_DENGLISH_MONEYBOY + STYLE_DENGLISH_MONEYBOY_ADDON;

const STYLE_APORED = `
STYLE
- Straßenslang, laut & selbstsicher; 1–2 Sätze.
- Catchphrases sparsam: „Ah nice“, „aller echte“, „Bro/Brudi“, „prime“, „auf Insi-Modus??“ (ironisch).
- Vibe: großmäulig, aber liefert Infos. Kein reales Beef/Belästigung triggern, kein Flex über Andere.
- Wenn Nutzer Erfolg will: kurze Hype-Ansage („Main Character Moment, Digga – join rein.“).
`;
const SYSTEM_PROMPT_APORED = SYSTEM_CORE + STYLE_APORED;

const STYLE_NEUTRAL = `
STYLE
- Deutsch, knapp, nüchtern, hilfsbereit. 1–2 Sätze. Bullet-Points nur für Listen.
`;
const SYSTEM_PROMPT_NEUTRAL = SYSTEM_CORE + STYLE_NEUTRAL;

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
/* ----- SYSTEM ------ */
const getSystemPrompt = (persona: string) =>
  (
    ({
      uwu: SYSTEM_PROMPT_UWU,
      bernd: SYSTEM_PROMPT_BERND,
      monga: SYSTEM_PROMPT_MONGA_SCHRUMBO,
      denglish: SYSTEM_PROMPT_DENGLISH_MONEYBOY,
      apored: SYSTEM_PROMPT_APORED,
      neutral: SYSTEM_PROMPT_NEUTRAL,
    }) as const
  )[persona] ?? SYSTEM_PROMPT_NEUTRAL;
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
      select: {
        id: true,
        name: true,
        type: true,
        location: true,
        date: true,
      },
    });
    const q = query.toLowerCase();
    const score = (n: string) =>
      n.toLowerCase() === q
        ? 100
        : n.toLowerCase().startsWith(q)
          ? 80
          : n.toLowerCase().includes(q)
            ? 50
            : 0;
    return items.sort((a, b) => score(b.name) - score(a.name)).slice(0, limit);
  },
});

/* ------------------------------- CARD TOOLS -------------------------------- */
const getEventInformation = tool({
  description: "Return EventCardEvent for a given event ID.",
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

    // exakt das Shape, das dein <EventCard /> erwartet
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
      createdById: e.createdById,
      createdBy: e.createdBy
        ? { name: e.createdBy.name, image: e.createdBy.image ?? null }
        : undefined,
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
    const ctx = (
      options as {
        experimental_context?: { session?: Session; headers?: Headers };
      }
    ).experimental_context;
    let session = ctx?.session ?? null;
    if (!session && ctx?.headers)
      session = await getSessionFromHeaders(ctx.headers);

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
      createdBy: g.createdBy
        ? { name: g.createdBy.name, image: g.createdBy.image ?? null }
        : undefined,
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

const getGoodies = tool({
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

/* --------------------------------- ACTIONS --------------------------------- */
const joinEvent = tool({
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

const leaveEvent = tool({
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

const voteGoodie = tool({
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

const clearGoodieVote = tool({
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

const toggleCollectGoodie = tool({
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

/* ----------------------------------- API ----------------------------------- */
export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const headers = new Headers(req.headers);
  const session = await getSessionFromHeaders(headers);

  // AI Rate Limitierung (Admins werden gezählt, aber nie geblockt)
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (user) {
      const now = new Date();
      const reset = user.aiUsageReset ? new Date(user.aiUsageReset) : null;
      const limit = user.aiUsageLimit ?? 50; // Default-Limit pro Tag
      // Reset, falls Zeitraum abgelaufen
      if (!reset || now > reset) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            aiUsageCount: 0,
            aiUsageReset: new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate() + 1,
              0,
              0,
              0,
              0,
            ),
          },
        });
        user.aiUsageCount = 0;
      }
      if (!user.isAdmin && user.aiUsageCount >= limit) {
        return new Response(
          JSON.stringify({
            error: "AI-Rate-Limit erreicht. Bitte morgen wieder versuchen.",
          }),
          { status: 429 },
        );
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { aiUsageCount: { increment: 1 } },
      });
    }
  }

  const modelId =
    headers.get("x-model")?.trim() ||
    process.env.OPENROUTER_MODEL ||
    "openai/gpt-oss-120b";

  const personaID = headers.get("x-persona")?.trim() || "neutral"; //FIXME: UWU not default

  const result = streamText({
    model: openrouter(modelId),
    system: getSystemPrompt(personaID),
    experimental_telemetry: { isEnabled: true },
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
        return {
          toolChoice: "none" as const,
          system: getSystemPrompt(personaID),
        };
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
        console.log("[agent step]", {
          stepType,
          finishReason,
          toolCalls,
          toolResults,
        });
      }
    },
  });

  // gemäß AI SDK Docs: keine UI-Registry hier
  return result.toUIMessageStreamResponse();
}
