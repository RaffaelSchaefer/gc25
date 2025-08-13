// app/(server)/tool-summary.actions.ts
"use server";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import { Session } from "better-auth";
import z from "zod";

export type ToolCallPart = {
  type: string; // e.g. "tool-resolveGoodieByName"
  toolCallId: string;
  state?: string;
  input?: unknown;
  output?: unknown;
};

export type ToolCallSummary = {
  icon: string; // emoji
  type: "Action" | "Search" | "Upvote" | "Downvote";
  label: string; // readable function name (localized)
  description: string; // first-person summary ("Ich habe …" / "I …")
};

export async function generateToolSummary({
  part,
  locale,
  session
}: {
  part: ToolCallPart;
  locale: string;
  session: Session;
}): Promise<ToolCallSummary> {
  const OPENROUTER_KEY =
    process.env.OPENROUTER_API_KEY ?? process.env.OPEN_ROUTER_API_KEY ?? "";
  if (!OPENROUTER_KEY && process.env.NODE_ENV !== "production") {
    console.warn("[ai] Missing OPENROUTER_API_KEY / OPEN_ROUTER_API_KEY");
  }
  const openrouter = createOpenRouter({ apiKey: OPENROUTER_KEY });
  const safe = JSON.stringify(trimLarge(part));

  const prompt = `
You summarize tool calls into four fields: {icon, type, label, description}.
Write the description in first-person ("I ...") and in the user's locale: ${locale}.
Valid "type" values: Action | Search | Upvote | Downvote.
Create a readable function label from the tool name (camelCase → words), localized.

TOOL CALL (JSON):
${safe}
  `.trim();

  const resultObj = await generateObject({
    model: openrouter("openai/gpt-4.1-nano"),
    schema: z.object({
      type: z.enum(["Action", "Search", "Upvote", "Downvote"]),
      label: z.string().min(2).max(80),
      description: z.string().min(5).max(200),
    }),
    prompt,
    experimental_telemetry: {
      isEnabled: true,
      functionId: `summary/toolCalling`,
      metadata: {
        userId: session.userId
      }
    },
  });

  const json = await resultObj.toJsonResponse().json();
  return json as ToolCallSummary;
}

/* -------------------------------- utilities -------------------------------- */

function trimLarge<T extends object>(obj: T): T {
  try {
    return JSON.parse(
      JSON.stringify(obj, (_k, val) => {
        if (typeof val === "string" && val.length > 400)
          return val.slice(0, 400) + "…";
        if (Array.isArray(val) && val.length > 20)
          return [...val.slice(0, 20), `…(+${val.length - 20} more)`];
        return val;
      }),
    );
  } catch {
    return obj;
  }
}
