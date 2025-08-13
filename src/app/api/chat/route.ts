/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  streamText,
  UIMessage,
  convertToModelMessages,
} from "ai";
import { randomUUID } from "crypto";
import { langfuse } from "@/lib/langfuse";
import { prisma } from "@/lib/prisma";
import { openrouter, runtime, maxDuration } from "./config";
import { getSystemPrompt } from "./prompts";
import { getSessionFromHeaders } from "./utils";
import * as tools from "./tools";

export { runtime, maxDuration };

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const headers = new Headers(req.headers);
  const session = await getSessionFromHeaders(headers);

  // ✨ NEU: IDs & Meta früh bestimmen
  const requestId = headers.get("x-request-id") || randomUUID();

  const personaID = headers.get("x-persona")?.trim() || "neutral";
  // Wenn persona 'denglish', dann immer 'x-ai/grok-3-mini' als Model
  const modelId =
    personaID === "denglish"
      ? "x-ai/grok-3-mini"
      : headers.get("x-model")?.trim() ||
        process.env.OPENROUTER_MODEL ||
        "openai/gpt-oss-120b";

  // ✨ NEU: Parent-Trace in Langfuse anlegen (klares, lesbares Naming)
  const parentTraceId = randomUUID();
  const firstUserMsg =
    messages
      ?.find((m) => m.role === "user")
      ?.parts?.filter((p) => p.type === "text")
      .map((p: any) => p.text)
      .join(" ")
      .slice(0, 140) ?? "";

  langfuse.trace({
    id: parentTraceId,
    name: `pixi/${personaID} → ${modelId}`,
    userId: session?.user?.id || "anon",
    sessionId: requestId,
    metadata: {
      route: "/api/chat",
      modelId,
      persona: personaID,
      preview: firstUserMsg,
    },
    tags: ["pixi", "ai-sdk", "openrouter"],
  });

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

  const result = streamText({
    model: openrouter(modelId),
    system: getSystemPrompt(personaID),
    experimental_telemetry: {
      isEnabled: true,
      functionId: `pixi-run/${personaID}`, // ✨ Root-Span-Name in Langfuse
      metadata: {
        persona: personaID,
        // ✨ WICHTIG: Eltern-Trace verlinken + nützliche Attribute
        langfuseTraceId: parentTraceId,
        langfuseUpdateParent: false,
        userId: session?.user?.id || "anon",
        requestId,
        modelId,
      },
    },
    messages: convertToModelMessages(messages),
    tools,
    experimental_context: { session, headers, requestId },
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
  return result.toUIMessageStreamResponse({ sendReasoning: true });
}
