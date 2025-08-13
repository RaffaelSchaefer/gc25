import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export const runtime = "nodejs";
export const maxDuration = 30;
export const TOOL_BUDGET = 6;

const OPENROUTER_KEY =
  process.env.OPENROUTER_API_KEY ?? process.env.OPEN_ROUTER_API_KEY ?? "";
if (!OPENROUTER_KEY && process.env.NODE_ENV !== "production") {
  console.warn("[ai] Missing OPENROUTER_API_KEY / OPEN_ROUTER_API_KEY");
}

export const openrouter = createOpenRouter({ apiKey: OPENROUTER_KEY });
