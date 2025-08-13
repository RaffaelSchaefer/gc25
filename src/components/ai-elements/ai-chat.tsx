"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { useChat } from "@ai-sdk/react";
import posthog from "posthog-js";

import { ChatMessages } from "./chat-messages";
import { Suggestion, Suggestions } from "./suggestion";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  PromptInputSubmit,
  PromptInputButton,
  PromptInputModelSelect,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
} from "./prompt-input";
import type { ToolCallSummary, ToolCallPart } from "@/app/(server)/tool-summary.actions";
import type { UIMessage } from "ai";
import { generateToolSummary } from "@/app/(server)/tool-summary.actions";
import { generateSuggestions } from "@/app/(server)/generate-suggestions.actions";

interface AIChatProps {
  open: boolean;
  session: any;
  userAvatar?: string;
}

function isToolUIPart(part: any): part is { type: string; toolCallId: string } {
  return (
    typeof part === "object" &&
    part !== null &&
    typeof part.type === "string" &&
    part.type.startsWith("tool-") &&
    typeof (part as any).toolCallId === "string"
  );
}

export function AIChat({ open, session, userAvatar }: AIChatProps) {
  const locale = useLocale() ?? "de";

  const [input, setInput] = useState("");
  const [persona, setPersonaState] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("ai-persona") || "neutral";
      } catch {
        return "neutral";
      }
    }
    return "neutral";
  });
  function setPersona(value: string) {
    setPersonaState(value);
    try {
      localStorage.setItem("ai-persona", value);
    } catch {}
  }

  const { messages, status, error, sendMessage, regenerate, stop } = useChat();
  const isLoading = status === "submitted" || status === "streaming";

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    posthog.capture("ai_message_sent", {
      button_name: "Send",
      page: "home",
    });
    const value = input.trim();
    if (!value || isLoading) return;
    sendMessage(
      { role: "user", parts: [{ type: "text", text: value }] },
      { headers: { "x-persona": persona } },
    );
    setInput("");
  }

  const [toolSummaries, setToolSummaries] = useState<Record<string, ToolCallSummary>>({});
  const inFlight = useRef<Set<string>>(new Set());

  useEffect(() => {
    try {
      const parts =
        messages.flatMap((m) => (m.parts as any[]).filter(isToolUIPart)) ?? [];
      parts.forEach(async (p: any) => {
        const id = p?.toolCallId as string | undefined;
        if (!id) return;
        if (p?.state !== "output-available") return;
        if (toolSummaries[id] || inFlight.current.has(id)) return;

        inFlight.current.add(id);
        const slim: ToolCallPart = {
          type: p.type,
          toolCallId: id,
          state: p.state,
          input: undefined,
          output: p.output,
        };

        try {
          const summary = await generateToolSummary({
            part: slim,
            locale,
            session: session.session,
          });
          setToolSummaries((prev) => ({ ...prev, [id]: summary }));
        } catch (err) {
          console.error("generateToolSummary failed", err);
          const fallback: ToolCallSummary = {
            type: "Action",
            label: p.type
              .replace(/^tool-/, "")
              .replace(/([a-z])([A-Z])/g, "$1 $2"),
            description: "Ich habe das Tool ausgeführt.",
          } as ToolCallSummary;
          setToolSummaries((prev) => ({ ...prev, [id]: fallback }));
        } finally {
          inFlight.current.delete(id);
        }
      });
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, locale]);

  const [sugs, setSugs] = useState<string[]>([]);
  const [sugsLoading, setSugsLoading] = useState(false);
  const [sugsError, setSugsError] = useState<string | null>(null);

  const fetchSuggestions = async (history: UIMessage[]) => {
    if (!session?.user) return;
    try {
      setSugsLoading(true);
      setSugsError(null);
      const items = await generateSuggestions({
        session: session.session,
        locale,
        messages: history,
      });
      setSugs(items ?? []);
      posthog.capture("ai_suggestions_loaded", { count: items?.length ?? 0 });
    } catch (e: any) {
      setSugsError(e?.message || "Konnte Vorschläge nicht laden.");
    } finally {
      setSugsLoading(false);
    }
  };

  useEffect(() => {
    if (open && session?.user && messages.length === 0) {
      fetchSuggestions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, session?.user?.id, locale]);

  const lastAssistantId = useRef<string | null>(null);
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (
      status === "ready" &&
      last?.role === "assistant" &&
      last.id !== lastAssistantId.current
    ) {
      lastAssistantId.current = last.id;
      fetchSuggestions(messages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, status]);

  const handleSuggestionClick = (suggestion: string) => {
    if (!suggestion || isLoading) return;
    posthog.capture("ai_suggestion_clicked", { suggestion });
    sendMessage(
      { role: "user", parts: [{ type: "text", text: suggestion }] },
      { headers: { "x-persona": persona } },
    );
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="flex-1 min-h-0 overflow-auto">
        <ChatMessages
          messages={messages}
          status={status}
          error={error}
          session={session}
          userAvatar={userAvatar}
          toolSummaries={toolSummaries}
          onRegenerate={regenerate}
        />
      </div>

      <div className="mt-2">
        <Suggestions className="px-1">
          {sugsLoading && <Suggestion suggestion="Lade Vorschläge…" disabled />}
          {!sugsLoading && sugsError && (
            <Suggestion suggestion={sugsError} disabled />
          )}
          {!sugsLoading &&
            !sugsError &&
            (sugs.length
              ? sugs
              : [
                  "Was sind die Top-Goodies heute?",
                  "Plane meine nächsten zwei Events",
                  "Wo sind Free Drinks in der Nähe?",
                ]
            ).map((s) => (
              <Suggestion
                key={s}
                suggestion={s}
                onClick={handleSuggestionClick}
              />
            ))}
        </Suggestions>
      </div>

      <PromptInput
        onSubmit={onSubmit}
        className="mt-2 mb-2 relative border border-fuchsia-400/30 bg-gradient-to-br from-fuchsia-500/15 via-background/60 to-background/40 backdrop-blur-xl shadow-sm"
      >
        <PromptInputTextarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Frage eingeben..."
          minHeight={80}
        />
        <PromptInputToolbar className="px-2 text-fuchsia-700 dark:text-fuchsia-200">
          <PromptInputTools>
            <PromptInputButton
              title="Letzte Antwort neu generieren"
              disabled={!messages.some((m) => m.role === "assistant") || isLoading}
              onClick={() => regenerate()}
            >
              ↻
            </PromptInputButton>
            {isLoading && (
              <PromptInputButton onClick={stop} title="Stop">
                Stop
              </PromptInputButton>
            )}
            <PromptInputModelSelect
              onValueChange={(value) => setPersona(value)}
              value={persona}
            >
              <PromptInputModelSelectTrigger className="bg-transparent">
                <PromptInputModelSelectValue />
              </PromptInputModelSelectTrigger>
              <PromptInputModelSelectContent>
                <PromptInputModelSelectItem value="neutral">
                  Normal
                </PromptInputModelSelectItem>
                <PromptInputModelSelectItem value="uwu">
                  Kawaii 🎀
                </PromptInputModelSelectItem>
                <PromptInputModelSelectItem value="bernd">
                  Bernd das Brot 🍞
                </PromptInputModelSelectItem>
                <PromptInputModelSelectItem value="monga">
                  Monga 🅱️
                </PromptInputModelSelectItem>
                <PromptInputModelSelectItem value="denglish">
                  Money Boy 💸
                </PromptInputModelSelectItem>
                <PromptInputModelSelectItem value="apored">
                  ApoRed 👟
                </PromptInputModelSelectItem>
              </PromptInputModelSelectContent>
            </PromptInputModelSelect>
          </PromptInputTools>
          <PromptInputSubmit
            className="absolute right-2 bottom-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-sm ring-1 ring-fuchsia-400/40 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!input.trim() || isLoading}
            status={status}
            variant="default"
          />
        </PromptInputToolbar>
      </PromptInput>
    </div>
  );
}

export default AIChat;

