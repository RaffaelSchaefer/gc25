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

  const prompt = `
    You generate suggestions for the user based on their user data. The suggestions should be relevant and personalized. The Topic is about the Events and goodies a person is interested in. For the Answers use this locale: ${locale}

    USER DATA

${JSON.stringify(
  await prisma.user.findUnique({
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
  }),
)}

    `;

  const resultObj = await generateObject({
    model: openrouter("openai/gpt-4.1-nano"),
    schema: z.object({
      suggestions: z.array(z.string().max(100)).min(3).max(3),
    }),
    prompt: prompt,
    experimental_telemetry: {
      isEnabled: true,
      functionId: `summary/toolCalling`,
    },
  });

  const jsonResponse = resultObj.toJsonResponse();
  const parsed = await jsonResponse.json();
  const suggestions = parsed.suggestions;

  return suggestions as string[];
}
