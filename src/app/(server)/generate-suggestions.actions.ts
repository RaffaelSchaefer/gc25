"use server";

import { prisma } from "@/lib/prisma";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import { Session } from "better-auth";
import z from "zod";

export async function generateSuggestions({
  session,
  locale,
}: {
  session: Session;
  locale: string;
}) {
  const OPENROUTER_KEY =
    process.env.OPENROUTER_API_KEY ?? process.env.OPEN_ROUTER_API_KEY ?? "";
  if (!OPENROUTER_KEY && process.env.NODE_ENV !== "production") {
    console.warn("[ai] Missing OPENROUTER_API_KEY / OPEN_ROUTER_API_KEY");
  }
  const openrouter = createOpenRouter({ apiKey: OPENROUTER_KEY });

  // Prüfe, ob userId vorhanden ist
  if (!session.userId) {
    throw new Error("Session userId is undefined. Cannot fetch user data.");
  }

  const TAKE = 5;
  const userData = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      name: true,
      comments: {
        select: {
          content: true,
          event: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: TAKE,
      },
      createdEvents: {
        select: {
          name: true,
          description: true,
        },
        orderBy: { startDate: "desc" },
        take: TAKE,
      },
      goodies: {
        select: {
          name: true,
          type: true,
          location: true,
        },
        orderBy: { createdAt: "desc" },
        take: TAKE,
      },
    },
  });

  if (!userData) {
    throw new Error(`No user found for id: ${session.userId}`);
  }

  const truncate = (s: string, len: number) =>
    (s.length > len ? s.slice(0, len) + "…" : s);

  const compact = {
    name: userData.name,
    comments: userData.comments.map((c) => ({
      event: c.event.name,
      content: truncate(c.content, 80),
    })),
    events: userData.createdEvents.map((e) => ({
      name: e.name,
      description: truncate(e.description, 120),
    })),
    goodies: userData.goodies.map((g) => ({
      name: g.name,
      type: g.type,
      location: g.location,
    })),
  };

  const prompt = `
Generate exactly three personalized suggestions for the user based on the data below.

- Use locale: ${locale}
- Phrase each suggestion as a short question from the user's perspective
- Reference events or goodies when relevant
- Keep suggestions concise

USER DATA:
${JSON.stringify(compact)}
  `.trim();

  const resultObj = await generateObject({
    model: openrouter("openai/gpt-4.1-nano"),
    schema: z.object({
      suggestions: z.array(z.string()).min(3).max(3),
    }),
    prompt: prompt,
    experimental_telemetry: {
      isEnabled: true,
      functionId: `generate/suggestions`,
      metadata: {
        userId: session.userId
      }
    },
  });

  const jsonResponse = resultObj.toJsonResponse();
  const parsed = await jsonResponse.json();
  const suggestions = parsed.suggestions;

  return suggestions as string[];
}
