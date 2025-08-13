"use server";

import { langfuse } from "@/lib/langfuse";
import { Session } from "better-auth";

export async function sendFeedback({
  session,
  messageId,
  rating,
  message,
}: {
  session: Session;
  messageId: string;
  rating: "up" | "down";
  message: string;
}) {
  try {
    langfuse.trace({
      name: "ai-chat-feedback",
      userId: session.userId,
      metadata: { messageId, rating, message },
    });
    await langfuse.flushAsync?.();
  } catch (err) {
    console.error("sendFeedback failed", err);
  }
}
