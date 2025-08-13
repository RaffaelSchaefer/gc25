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

  const userData = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      accounts: true,
      comments: true,
      createdEvents: true,
      updatedEvents: true,
      participants: true,
      sessions: true,
      goodies: true,
      goodieVotes: true,
      goodieCollections: true,
    },
  });

  if (!userData) {
    throw new Error(`No user found for id: ${session.userId}`);
  }

  const prompt = `
You generate personalized suggestions for the user based on their stored user data. Suggestions should be relevant to the user’s interests, focusing on events and goodies they are likely to enjoy.
Use the locale: ${locale} for all output.
Write the suggestions from the user’s perspective, as if they are asking a question about the event or goodie.

USER DATA

${JSON.stringify(userData)}
    `;

  const resultObj = await generateObject({
    model: openrouter("openai/gpt-4.1-nano"),
    schema: z.object({
      suggestions: z.array(z.string().max(100)).min(3).max(3),
    }),
    prompt: prompt,
    experimental_telemetry: {
      isEnabled: true,
      functionId: `generate/suggestions`,
    },
  });

  const jsonResponse = resultObj.toJsonResponse();
  const parsed = await jsonResponse.json();
  const suggestions = parsed.suggestions;

  return suggestions as string[];
}
