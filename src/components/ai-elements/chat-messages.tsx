"use client";

import type { UIMessage } from "ai";
import {
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Wrench,
  RefreshCcw,
  Copy,
} from "lucide-react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "./conversation";
import { Message, MessageAvatar, MessageContent } from "./message";
import { Response } from "./response";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "./reasoning";
import { Task, TaskContent, TaskItem, TaskTrigger } from "./task";
import { AIChatCardPart } from "./ai-chat-card-part";
import { Actions, Action } from "./actions";
import type { ToolCallSummary } from "@/app/(server)/tool-summary.actions";
import { sendFeedback } from "@/app/(server)/feedback.actions";
import { stripLeadTags } from "./strip-lead-tags";

function isToolUIPart(part: any): part is {
  type: string;
  toolCallId: string;
  state?: string;
  output?: unknown;
  input?: unknown;
} {
  return (
    typeof part === "object" &&
    part !== null &&
    typeof part.type === "string" &&
    part.type.startsWith("tool-") &&
    typeof (part as any).toolCallId === "string"
  );
}

function ToolTypeIcon({
  type,
  className,
}: {
  type: ToolCallSummary["type"];
  className?: string;
}) {
  switch (type) {
    case "Upvote":
      return <ThumbsUp className={className} aria-hidden />;
    case "Downvote":
      return <ThumbsDown className={className} aria-hidden />;
    case "Search":
    case "Action":
    default:
      return <Wrench className={className} aria-hidden />;
  }
}

function renderToolAsTask(
  part: any,
  keyBase: string,
  summary?: ToolCallSummary,
) {
  const toolName = String(part.type).replace(/^tool-/, "");
  const humanLabel = toolName.replace(/([a-z])([A-Z])/g, "$1 $2");
  const isFinal = part?.state === "output-available";

  const title = isFinal
    ? summary?.label
      ? stripLeadTags(summary.label)
      : humanLabel
    : `Running task: ${humanLabel}`;

  return (
    <Task key={keyBase} className="w-full pb-2" defaultOpen={false}>
      <TaskTrigger
        icon={
          <ToolTypeIcon
            type={summary?.type || "Action"}
            className="w-4 h-4 text-muted-foreground"
          />
        }
        title={title}
      />
      <TaskContent>
        {!isFinal ? (
          <TaskItem>
            <div className="w-full rounded-md border border-muted-foreground/20 bg-muted/30 p-3">
              <div className="animate-pulse space-y-2">
                <div className="h-3 w-1/3 rounded bg-muted-foreground/30" />
                <div className="h-3 w-2/3 rounded bg-muted-foreground/20" />
                <div className="text-xs text-muted-foreground/80 mt-1">
                  running task…
                </div>
              </div>
            </div>
          </TaskItem>
        ) : (
          <TaskItem>
            {summary?.description ? (
              <div className="mt-1 text-sm opacity-80">
                {stripLeadTags(summary.description)}
              </div>
            ) : null}
          </TaskItem>
        )}
      </TaskContent>
    </Task>
  );
}

const isFinishPart = (part: any) =>
  part?.type === "finish" ||
  part?.type === "finish-step" ||
  part?.type === "d" ||
  part?.type === "e";

function Spinner() {
  return (
    <svg className="animate-spin h-6 w-6 text-fuchsia-500" viewBox="0 0 24 24">
      <circle
        className="opacity-20"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-70"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

export interface ChatMessagesProps {
  messages: UIMessage[];
  status: "submitted" | "streaming" | "ready" | "error";
  error?: Error;
  session: any;
  userAvatar?: string;
  toolSummaries: Record<string, ToolCallSummary>;
  onRegenerate?: (options?: { messageId?: string }) => void;
}

export function ChatMessages({
  messages,
  status,
  error,
  session,
  userAvatar,
  toolSummaries,
  onRegenerate,
}: ChatMessagesProps) {
  const loading = status === "submitted" || status === "streaming";

  const handleFeedback = async (
    messageId: string,
    rating: "up" | "down",
    text: string,
  ) => {
    try {
      await sendFeedback({
        session: session.session,
        messageId,
        rating,
        message: text,
      });
    } catch (err) {
      console.error("sendFeedback failed", err);
    }
  };

  return (
    <Conversation className="mt-4 flex-1 min-h-0 relative">
      <ConversationContent>
        {messages.map((m, idx) => {
          const isUser = m.role === "user";
          const isAssistant = m.role === "assistant";
          const isLast = idx === messages.length - 1;

          const avatarEl = isUser ? (
            <MessageAvatar
              src={session?.user?.image || userAvatar || ""}
              name={session?.user?.name || "DU"}
              className="shadow ring-indigo-500/30"
            />
          ) : (
            <div className="size-8 flex items-center justify-center rounded-lg bg-fuchsia-500/15 border border-fuchsia-400/30 text-fuchsia-300 shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
          );

          const bubbleBase =
            "relative rounded-xl border backdrop-blur-xl px-4 py-3 text-sm leading-relaxed bg-gradient-to-br shadow-sm break-words";
          const bubbleClassesUser = `${bubbleBase} border-indigo-500/40 from-indigo-600/30 via-indigo-600/20 to-indigo-500/10 text-indigo-50 dark:text-indigo-100`;
          const bubbleClassesAssistant = `${bubbleBase} border-fuchsia-400/30 from-fuchsia-500/15 via-background/70 to-background/40 text-fuchsia-900 dark:text-fuchsia-100`;

          const visibleParts = (m.parts as any[]).filter(
            (p) => !isFinishPart(p),
          );

          if (isAssistant) {
            let printedText = false;
            return (
              <div key={m.id} className="space-y-2 mb-2">
                {visibleParts.map((part: any, i: number) => {
                  if (part?.type === "reasoning") {
                    return (
                      <Reasoning
                        key={m.id + "-reasoning-" + i}
                        className="w-full"
                        isStreaming={loading && isLast}
                      >
                        <ReasoningTrigger />
                        <ReasoningContent>
                          {stripLeadTags(part.text)}
                        </ReasoningContent>
                      </Reasoning>
                    );
                  }

                  if (isToolUIPart(part)) {
                    return (
                      <div key={`${m.id}-tool-${i}`} className="space-y-2">
                        {renderToolAsTask(
                          part,
                          `${m.id}-tooltask-${i}`,
                          (toolSummaries as any)[part.toolCallId],
                        )}
                        <AIChatCardPart part={part} />
                      </div>
                    );
                  }

                  if (part?.type === "text") {
                    printedText = true;
                    const text = stripLeadTags(part.text ?? "");
                    const showSpinner =
                      isLast && loading && text.trim().length === 0;

                    return (
                      <>
                        <Message key={`${m.id}-text-${i}`} from="assistant">
                          <MessageContent className="bg-transparent p-0">
                            <div className={bubbleClassesAssistant}>
                              {showSpinner ? (
                                <Spinner />
                              ) : (
                                <Response>{text}</Response>
                              )}
                            </div>
                          </MessageContent>
                          {avatarEl}
                        </Message>
                        {!showSpinner && isLast && (
                          <Actions className="p-0 -mt-5 ml-10">
                            <Action
                              onClick={() =>
                                onRegenerate?.({ messageId: m.id })
                              }
                              label="Regenerate"
                              tooltip="Regenerate"
                            >
                              <RefreshCcw className="size-3" />
                            </Action>
                            <Action
                              onClick={() => handleFeedback(m.id, "up", text)}
                              label="Thumbs up"
                              tooltip="Thumbs up"
                            >
                              <ThumbsUp className="size-3" />
                            </Action>
                            <Action
                              onClick={() => handleFeedback(m.id, "down", text)}
                              label="Thumbs down"
                              tooltip="Thumbs down"
                            >
                              <ThumbsDown className="size-3" />
                            </Action>
                            <Action
                              onClick={() =>
                                navigator.clipboard.writeText(text)
                              }
                              label="Copy"
                              tooltip="Copy"
                            >
                              <Copy className="size-3" />
                            </Action>
                          </Actions>
                        )}
                      </>
                    );
                  }

                  return (
                    <AIChatCardPart key={`${m.id}-card-${i}`} part={part} />
                  );
                })}

                {!printedText && isLast && loading ? (
                  <Message from="assistant">
                    <MessageContent className="bg-transparent p-0">
                      <div className={bubbleClassesAssistant}>
                        <Spinner />
                      </div>
                    </MessageContent>
                    {avatarEl}
                  </Message>
                ) : null}
              </div>
            );
          }

          const userTextParts = (m.parts as any[]).filter(
            (p) => p.type === "text",
          ) as Array<{ text: string }>;

          return (
            <Message key={m.id} from="user">
              <MessageContent className="bg-transparent p-0">
                <div className={bubbleClassesUser}>
                  {userTextParts.map((p, i2) => (
                    <Response key={m.id + "-" + i2}>
                      {stripLeadTags(p.text)}
                    </Response>
                  ))}
                </div>
              </MessageContent>
              {avatarEl}
            </Message>
          );
        })}

        {error && (
          <Message from="assistant">
            <MessageContent>
              <div className="text-xs text-red-500">
                Fehler: {error.message}
              </div>
            </MessageContent>
          </Message>
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
