"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import posthog from "posthog-js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Calendar,
  Users,
  Music2,
  Settings,
  BarChart3,
  ListChecks,
  MapPin,
  Gift,
  Trophy,
  Sparkles,
  CheckCircle2,
  Utensils,
  CupSoda,
} from "lucide-react";
import type { DayBucket } from "@/app/(server)/events.actions";
import type { GoodieDto } from "@/app/(server)/goodies.actions";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
// AI Chat UI Primitives
import { useChat } from "@ai-sdk/react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
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
} from "@/components/ai-elements/prompt-input";
import {
  Message,
  MessageContent,
  MessageAvatar,
} from "@/components/ai-elements/message";
import { authClient } from "@/lib/auth-client";
import { createAvatar } from "@dicebear/core";
import { adventurer } from "@dicebear/collection";
import { Response } from "@/components/ai-elements/response";

// Reasoning & Task Components
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
  Task,
  TaskContent,
  TaskItem,
  TaskItemFile,
  TaskTrigger,
} from "@/components/ai-elements/task";

/** Type Guard: tool-* UI parts from AI SDK */
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

/** NEW: robust task extractors (data-task, generic data, tool output) */
function getTasksFromPart(part: any): any[] | null {
  if (part?.type === "data-task" && Array.isArray(part?.data?.tasks)) return part.data.tasks;
  if (part?.type === "task" && Array.isArray(part?.tasks)) return part.tasks;

  const isDataType =
    part?.type === "data" || (typeof part?.type === "string" && part.type.startsWith("data-"));
  if (isDataType && Array.isArray(part?.data?.tasks)) return part.data.tasks;

  if (isToolUIPart(part) && part?.output) {
    const out: any = part.output;
    if (Array.isArray(out?.tasks)) return out.tasks;
    if (Array.isArray(out?.data?.tasks)) return out.data.tasks;
  }
  return null;
}

function renderTaskList(tasks: any[], keyBase: string) {
  return (
    <div key={keyBase} className="my-2">
      {tasks.map((task: any, taskIdx: number) => (
        <Task key={taskIdx} className="w-full" defaultOpen={false}>
          <TaskTrigger title={task.title || "Task"} />
          <TaskContent>
            {(task.items ?? []).map((item: any, itemIdx: number) => (
              <TaskItem key={itemIdx}>
                {item.type === "file" && item.file ? (
                  <TaskItemFile>{item.file.name}</TaskItemFile>
                ) : null}
                {item.text}
              </TaskItem>
            ))}
          </TaskContent>
        </Task>
      ))}
    </div>
  );
}

/* ------------ Helper: kurze, lesbare Zeilen für bekannte Tool-Outputs ----------- */
function toLineFromEvent(e: any, formatDateTimeFn: (iso: string) => string) {
  const name = e.name ?? e.title ?? "Unbenannt";
  const dt = e.startDate ? formatDateTimeFn(e.startDate) : (e.dateISO ? formatDateTimeFn(e.dateISO) : "–");
  const loc = e.location && String(e.location).trim() ? e.location : "n/a";
  const joined = e.joined ?? e.userJoined;
  const joinedTxt = typeof joined === "boolean" ? (joined ? "ja" : "nein") : "n/a";
  return `${name} – ${dt} – (Ort: ${loc}) – Teilgenommen: ${joinedTxt}`;
}

function toLineFromGoodie(g: any, formatDateTimeFn: (iso: string) => string) {
  const name = g.name ?? "Unbenannt";
  const type = g.type ?? "—";
  const date = g.date ? formatDateTimeFn(g.date) : (g.createdAt ? formatDateTimeFn(g.createdAt) : "—");
  const loc = g.location && String(g.location).trim() ? g.location : "n/a";
  const collected = typeof g.collected === "boolean" ? (g.collected ? "ja" : "nein") : "n/a";
  return `${name} (${type}) – ${date} – (Ort: ${loc}) – Gesammelt: ${collected}`;
}

function pretty(obj: any) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

/** NEW: Tools als Task rendern */
function renderToolAsTask(part: any, keyBase: string, formatDateTimeFn: (iso: string) => string) {
  const toolName = String(part.type).replace(/^tool-/, "");
  const state = part.state || "";
  const hasError = !!(part?.output && typeof part.output === "object" && "error" in (part.output as any));
  const titleSuffix =
    state === "input-start" ? "• startet…" :
    state === "input-available" ? "• Input bereit" :
    state === "output-available" ? (hasError ? "• Fehler" : "• fertig") :
    state ? `• ${state}` : "";

  const title = `${toolName}() ${titleSuffix}`.trim();

  // Versuche, „schöne“ Output-Listen zu bauen
  const items: string[] = [];
  if (state === "output-available" && part.output && !hasError) {
    const out = part.output as any;
    if (Array.isArray(out)) {
      // Liste von Events/Goodies?
      for (const o of out) {
        if (o && (o.name || o.title) && (o.startDate || o.date || o.dateISO)) {
          items.push(toLineFromEvent(o, formatDateTimeFn));
        } else if (o && (o.name) && (o.type || o.location || o.collected)) {
          items.push(toLineFromGoodie(o, formatDateTimeFn));
        } else {
          items.push(pretty(o));
        }
      }
    } else if (out && typeof out === "object") {
      // Einzelobjekt (z. B. EventCard / GoodieDto)
      if ((out.name || out.title) && (out.startDate || out.date || out.dateISO)) {
        items.push(toLineFromEvent(out, formatDateTimeFn));
      } else if (out.name && (out.type || out.location || out.collected)) {
        items.push(toLineFromGoodie(out, formatDateTimeFn));
      } else {
        items.push(pretty(out));
      }
    } else {
      items.push(String(out));
    }
  }

  const nestedTasks = getTasksFromPart(part);

  return (
    <Task key={keyBase} className="w-full pb-2" defaultOpen={false}>
      <TaskTrigger title={title} />
      <TaskContent>
        {part.input ? (
          <TaskItem>
            <span className="font-medium">Input:</span>
            <pre className="mt-1 max-h-48 overflow-auto rounded bg-muted/40 p-2 text-xs">{pretty(part.input)}</pre>
          </TaskItem>
        ) : null}

        {hasError ? (
          <TaskItem>
            <span className="font-medium text-red-600">Error:</span>{" "}
            <span className="text-red-600">{String((part.output as any).error)}</span>
          </TaskItem>
        ) : null}

        {state === "output-available" && !hasError ? (
          items.length ? (
            items.map((line, idx) => <TaskItem key={`${keyBase}-out-${idx}`}>{line}</TaskItem>)
          ) : (
            <TaskItem>
              <span className="font-medium">Output:</span>
              <pre className="mt-1 max-h-48 overflow-auto rounded bg-muted/40 p-2 text-xs">{pretty(part.output)}</pre>
            </TaskItem>
          )
        ) : null}

        {/* Falls Tool zusätzlich eigene 'tasks' zurückgibt */}
        {nestedTasks?.length ? (
          <div className="mt-2 w-full">
            {renderTaskList(nestedTasks, `${keyBase}-nested`)}
          </div>
        ) : null}

        {/* Meta dezent */}
        <TaskItem>
          <span className="text-xs text-muted-foreground">
            callId: <code>{part.toolCallId}</code>
          </span>
        </TaskItem>
      </TaskContent>
    </Task>
  );
}

type Props = {
  days: DayBucket[];
  goodies?: GoodieDto[]; // optional, um Home Page rückwärtskompatibel zu halten
};

function formatDateTime(iso: string) {
  try {
    const d = new Date(iso);
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const date = d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone,
    });
    const time = d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone,
    });
    return `${date} · ${time}`;
  } catch {
    return iso;
  }
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone,
    });
  } catch {
    return iso;
  }
}

export default function DashboardOverview({ days, goodies = [] }: Props) {
  const { data: session } = authClient.useSession();
  const userAvatar = session?.user
    ? createAvatar(adventurer, {
        seed: session.user.name ?? session.user.email ?? "user",
      }).toDataUri()
    : undefined;
  const allEvents = days.flatMap((d) => d.events);
  const totalEvents = allEvents.length;
  const joinedEvents = allEvents.filter((e) => e.userJoined).length;

  const now = Date.now();
  const upcoming = allEvents
    .map((e) => ({ e, ts: new Date(e.startDate).getTime() }))
    .filter(({ ts }) => !Number.isNaN(ts) && ts >= now)
    .sort((a, b) => a.ts - b.ts)[0]?.e;

  const todayISO = new Date().toISOString().slice(0, 10);
  const todayEvents = days.find((d) => d.dateISO === todayISO)?.events ?? [];

  // Goodie Kennzahlen
  const totalGoodies = goodies.length;
  const collected = goodies.filter((g) => g.collected).length;
  const topGoodies = [...goodies]
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 3);

  const [aiOpen, setAiOpen] = useState(false);

  // useChat korrekt (AI SDK 5)
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
      {
        headers: {
          "x-persona": persona,
        },
      },
    );
    setInput("");
  }

  return (
    <section className="relative -mt-24 z-10 overflow-x-clip">
      <div className="container mx-auto px-4">
        {/* Intro */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-500 via-emerald-400 to-orange-400 bg-clip-text text-transparent">
            Dein Dashboard
          </h2>
          <p className="text-muted-foreground mt-2">
            Schneller Überblick, praktische Links und aktuelle Events.
          </p>
        </div>

        {/* Masonry container */}
        <div className="columns-1 md:columns-2 xl:columns-3 gap-6 mb-12">
          {/* AI Assistant */}
          <div className="break-inside-avoid mb-6">
            <Card className="group relative overflow-hidden border-0 ring-1 ring-fuchsia-500/20 bg-gradient-to-br from-fuchsia-500/5 via-background/60 to-background/50 backdrop-blur-xl transition-all duration-300">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-12 -top-12 size-56 rounded-full bg-[radial-gradient(circle,rgba(217,70,239,0.25)_0%,transparent_60%)]"
              />
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-fuchsia-700 dark:text-fuchsia-300">
                    AI Assistent
                  </CardTitle>
                  <CardDescription className="text-fuchsia-600 dark:text-fuchsia-200">
                    Schnelle Hilfe & Ideen
                  </CardDescription>
                </div>
                <div className="rounded-lg bg-fuchsia-500/15 p-2 border border-fuchsia-500/30">
                  <Sparkles className="w-6 h-6 text-fuchsia-300" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Öffne den Assistenten, um Fragen zu Events, Goodies oder
                  Planung zu stellen.
                </p>
                <Button
                  onClick={() => {
                    posthog.capture("ai_assistant_opened", {
                      button_name: "Assistent öffnen",
                      page: "Dashboard",
                    });
                    setAiOpen(true);
                  }}
                  className="px-5 bg-gradient-to-r from-fuchsia-600 to-fuchsia-500 hover:from-fuchsia-500 hover:to-fuchsia-600 ring-1 ring-fuchsia-400/40"
                >
                  Assistent öffnen
                </Button>
              </CardContent>
            </Card>
          </div>
          {/* Eventplaner */}
          <div className="break-inside-avoid mb-6">
            <Card className="group relative overflow-hidden border-0 ring-1 ring-indigo-500/20 bg-gradient-to-br from-indigo-500/5 via-background/60 to-background/50 backdrop-blur-xl">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-12 -top-12 size-56 rounded-full bg-[radial-gradient(circle,rgba(79,70,229,0.25)_0%,transparent_60%)]"
              />
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-indigo-700 dark:text-indigo-300">
                    Nächstes Event
                  </CardTitle>
                  <CardDescription className="text-indigo-600 dark:text-indigo-200">
                    Alle Details auf einen Blick
                  </CardDescription>
                </div>
                <div className="rounded-lg bg-indigo-500/15 p-2 border border-indigo-500/30">
                  <Calendar className="w-6 h-6 text-indigo-300" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcoming ? (
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-2 min-w-0">
                      <div className="text-indigo-700 dark:text-indigo-300 text-lg font-semibold truncate">
                        {upcoming.title}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-2">
                          <Calendar className="w-4 h-4" />{" "}
                          {formatDateTime(upcoming.startDate)}
                        </span>
                        {upcoming.location && (
                          <span className="inline-flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> {upcoming.location}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-2">
                          <Users className="w-4 h-4" /> {upcoming.attendees}{" "}
                          Teilnehmer
                        </span>
                      </div>
                    </div>
                    <Link href="/home/planner">
                      <Button className="px-5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 ring-1 ring-indigo-400/40">
                        Zum Planer
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-muted-foreground">
                    Noch keine kommenden Events – lege direkt eins im Planer an.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Today's Plan */}
          <div className="break-inside-avoid mb-6">
            <Card className="group relative overflow-hidden border-0 ring-1 ring-indigo-500/20 bg-gradient-to-br from-indigo-500/5 via-background/60 to-background/50 backdrop-blur-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-indigo-700 dark:text-indigo-300">
                    Tagesplan
                  </CardTitle>
                  <CardDescription className="text-indigo-600 dark:text-indigo-200">
                    Heutige Events im Überblick
                  </CardDescription>
                </div>
                <div className="rounded-lg bg-indigo-500/15 p-2 border border-indigo-500/30">
                  <Calendar className="w-6 h-6 text-indigo-300" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {todayEvents.length > 0 ? (
                  <ul className="space-y-2">
                    {todayEvents.map((e) => (
                      <li
                        key={e.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="min-w-0 truncate pr-2">{e.title}</span>
                        <span className="text-muted-foreground">
                          {formatTime(e.startDate)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-muted-foreground text-sm">
                    Heute stehen keine Events an.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Spotify */}
          <div className="break-inside-avoid mb-6">
            <Card className="group relative overflow-hidden border-0 ring-1 ring-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-background/60 to-background/50 backdrop-blur-xl transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-12 -top-12 size-56 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.25)_0%,transparent_60%)]"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -right-6 -top-6 opacity-10 text-emerald-400/80"
              >
                <Music2 className="h-40 w-40 blur-2xl transform transition-transform duration-300 group-hover:scale-105 group-hover:rotate-1" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-emerald-700 dark:text-emerald-300">
                    Spotify Playlist
                  </CardTitle>
                  <CardDescription className="text-emerald-600 dark:text-emerald-200">
                    Gemeinsame Group-Playlist öffnen
                  </CardDescription>
                </div>
                <div className="rounded-lg bg-emerald-500/15 p-2 border border-emerald-500/30">
                  <Music2 className="w-6 h-6 text-emerald-300" />
                </div>
              </CardHeader>
              <CardContent>
                <a
                  href="https://open.spotify.com/playlist/1cfSC5on08cgvCTnC1Xls0?si=44ab73e2a5054ecc"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <Button
                    size="lg"
                    className="px-5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 ring-1 ring-emerald-400/40"
                  >
                    Playlist öffnen
                  </Button>
                </a>
              </CardContent>
            </Card>
          </div>

          {/* KPIs */}
          <div className="break-inside-avoid mb-6">
            <Card className="relative overflow-hidden border-0 ring-1 ring-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-background/0 to-transparent">
              <CardContent className="flex items-center gap-4 py-6">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/15 ring-1 ring-indigo-500/30 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                    {totalEvents}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Veröffentlichte Events
                  </div>
                </div>
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-indigo-500/20 blur-3xl"
                />
              </CardContent>
            </Card>
          </div>

          <div className="break-inside-avoid mb-6">
            <Card className="relative overflow-hidden border-0 ring-1 ring-sky-500/30 bg-gradient-to-br from-sky-500/10 via-background/0 to-transparent">
              <CardContent className="flex items-center gap-4 py-6">
                <div className="w-10 h-10 rounded-lg bg-sky-500/15 ring-1 ring-sky-500/30 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-sky-300" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-sky-700 dark:text-sky-300">
                    {joinedEvents}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Meine Teilnahmen
                  </div>
                </div>
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-sky-500/20 blur-3xl"
                />
              </CardContent>
            </Card>
          </div>

          {/* Goodies Overview */}
          {goodies.length > 0 && (
            <div className="break-inside-avoid mb-6">
              <Card className="relative overflow-hidden border-0 ring-1 ring-violet-500/30 bg-gradient-to-br from-violet-500/10 via-background/0 to-transparent">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <div>
                    <CardTitle className="text-xl font-extrabold bg-gradient-to-r from-violet-600 via-violet-500 to-violet-400 bg-clip-text text-transparent flex items-center gap-2 tracking-tight">
                      Goodies
                    </CardTitle>
                    <CardDescription className="text-violet-600 dark:text-violet-200 font-medium">
                      Überblick & aktuelle Favoriten
                    </CardDescription>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-violet-500/15 ring-1 ring-violet-500/30 flex items-center justify-center">
                    <Gift className="w-5 h-5 text-violet-300" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-5 pt-0">
                  {/* KPI Row */}
                  <div className="flex flex-wrap items-center gap-6">
                    <div>
                      <div className="text-xl font-semibold text-violet-700 dark:text-violet-300">
                        {totalGoodies}
                      </div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">
                        Gesamt
                      </div>
                    </div>
                    <div>
                      <div className="text-xl font-semibold text-violet-700 dark:text-violet-300">
                        {collected}
                      </div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">
                        Gesammelt
                      </div>
                    </div>
                    <div>
                      <div className="text-xl font-semibold text-violet-700 dark:text-violet-300">
                        {totalGoodies - collected}
                      </div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">
                        Offen
                      </div>
                    </div>
                  </div>
                  {/* Top 3 List */}
                  {topGoodies.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-3 tracking-wide flex items-center gap-1">
                        <Trophy className="w-3 h-3" /> Top 3 nach Score
                      </div>
                      <ol className="space-y-2">
                        {topGoodies.map((g, idx) => {
                          const typeLabel: Record<GoodieDto["type"], string> = {
                            GIFT: "Gift",
                            FOOD: "Food",
                            DRINK: "Drink",
                          };
                          const TypeIcon: Record<
                            GoodieDto["type"],
                            React.ComponentType<{ className?: string }>
                          > = {
                            GIFT: Gift,
                            FOOD: Utensils,
                            DRINK: CupSoda,
                          };
                          const TI = TypeIcon[g.type];
                          return (
                            <li
                              key={g.id}
                              className="flex items-center gap-3 rounded-md bg-violet-500/5 ring-1 ring-violet-500/20 px-3 py-2"
                            >
                              <span
                                className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500/20 text-violet-600 dark:text-violet-300 text-xs font-semibold flex items-center justify-center"
                                aria-label={`Rang ${idx + 1}`}
                              >
                                {idx + 1}
                              </span>
                              <div className="flex-1 min-w-0 truncate text-sm font-medium text-violet-700 dark:text-violet-300">
                                {g.name}
                              </div>
                              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-600 dark:text-violet-300 ring-1 ring-violet-500/30 text-[11px] leading-4">
                                <TI className="w-3 h-3" /> {typeLabel[g.type]}
                              </span>
                              {g.collected && (
                                <span className="inline-flex items-center gap-1 text-violet-600 dark:text-violet-300 text-[11px] leading-4">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Collect
                                </span>
                              )}
                              <span className="flex-shrink-0 text-violet-600 dark:text-violet-300 font-semibold tabular-nums">
                                {g.totalScore}
                              </span>
                            </li>
                          );
                        })}
                      </ol>
                    </div>
                  )}
                  <div className="pt-1">
                    <Link href="/home/goodie-tracker">
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-600 ring-1 ring-violet-400/40"
                      >
                        Zum Tracker
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Useful links / tools */}
          <div className="break-inside-avoid mb-6">
            <Card className="relative overflow-hidden border-0 ring-1 ring-orange-500/20 bg-gradient-to-br from-orange-500/5 via-background/60 to-background/50">
              <CardHeader>
                <CardTitle className="text-lg text-orange-700 dark:text-orange-300">
                  Nützliche Links
                </CardTitle>
                <CardDescription className="text-orange-600 dark:text-orange-200">
                  Schnell zu häufig genutzten Bereichen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link
                  href="/home/planner"
                  className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-orange-500/10"
                >
                  <span className="inline-flex items-center gap-2 text-sm">
                    <ListChecks className="w-4 h-4 text-orange-300" />{" "}
                    Eventplaner
                  </span>
                  <span className="text-xs text-orange-300">Öffnen →</span>
                </Link>
                <Link
                  href="/home/goodie-tracker"
                  className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-orange-500/10"
                >
                  <span className="inline-flex items-center gap-2 text-sm">
                    <Gift className="w-4 h-4 text-orange-300" /> Goodie Tracker
                  </span>
                  <span className="text-xs text-orange-300">Öffnen →</span>
                </Link>
                <a
                  href="https://open.spotify.com/playlist/1cfSC5on08cgvCTnC1Xls0?si=44ab73e2a5054ecc"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-orange-500/10"
                >
                  <span className="inline-flex items-center gap-2 text-sm">
                    <Music2 className="w-4 h-4 text-orange-300" /> Spotify
                    Playlist
                  </span>
                  <span className="text-xs text-orange-300">Öffnen →</span>
                </a>
                <Link
                  href="/home/settings"
                  className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-orange-500/10"
                >
                  <span className="inline-flex items-center gap-2 text-sm">
                    <Settings className="w-4 h-4 text-orange-300" />{" "}
                    Einstellungen
                  </span>
                  <span className="text-xs text-orange-300">Öffnen →</span>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* AI Assistant Sheet */}
      <Sheet open={aiOpen} onOpenChange={setAiOpen}>
        <SheetContent
          side="right"
          className="px-2 sm:max-w-md w-full flex flex-col"
        >
          <SheetHeader>
            <SheetTitle>AI Assistent</SheetTitle>
            <SheetDescription>
              Stelle Fragen zur Planung oder bitte um Ideen.
            </SheetDescription>
          </SheetHeader>

          <Conversation className="mt-4 flex-1 relative">
            <ConversationContent>
              {messages.map((m, idx) => {
                const isUser = m.role === "user";
                const isAssistant = m.role === "assistant";
                const isLast = idx === messages.length - 1;
                const loading = status === "submitted" || status === "streaming";

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
                const bubbleClasses = isUser
                  ? `${bubbleBase} border-indigo-500/40 from-indigo-600/30 via-indigo-600/20 to-indigo-500/10 text-indigo-50 dark:text-indigo-100`
                  : `${bubbleBase} border-fuchsia-400/30 from-fuchsia-500/15 via-background/70 to-background/40 text-fuchsia-900 dark:text-fuchsia-100`;

                const textParts = (m.parts as any[]).filter((p) => p.type === "text") as Array<{ text: string }>;
                const finalText = textParts.map((p) => p.text ?? "").join("");

                const showSpinnerInline =
                  isAssistant && isLast && loading && finalText.trim().length === 0;

                return (
                  <div key={m.id}>
                    {/* PRE-MESSAGE: Reasoning / Tools-as-Tasks / (optional) standalone Tasks – IN ORDER */}
                    {isAssistant && (
                      <div className="space-y-2 mb-2">
                        {(m.parts as any[]).map((part: any, i: number) => {
                          if (part.type === "reasoning") {
                            return (
                              <Reasoning
                                key={m.id + "-reasoning-" + i}
                                className="w-full"
                                isStreaming={loading && isLast}
                              >
                                <ReasoningTrigger />
                                <ReasoningContent>{part.text}</ReasoningContent>
                              </Reasoning>
                            );
                          }

                          if (isToolUIPart(part)) {
                            return renderToolAsTask(part, `${m.id}-tool-${i}`, formatDateTime);
                          }

                          const tasks = getTasksFromPart(part);
                          if (tasks?.length) return renderTaskList(tasks, `${m.id}-tasks-${i}`);

                          return null; // text etc. kommt in die Final-Bubble
                        })}
                      </div>
                    )}

                    {/* FINAL MESSAGE BUBBLE */}
                    <Message from={m.role}>
                      <MessageContent className="bg-transparent p-0">
                        <div className={bubbleClasses}>
                          {showSpinnerInline ? (
                            <div className="flex justify-center items-center">
                              <svg
                                className="animate-spin h-6 w-6 text-fuchsia-500"
                                viewBox="0 0 24 24"
                              >
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
                            </div>
                          ) : isAssistant ? (
                            <Response key={m.id}>{finalText}</Response>
                          ) : (
                            textParts.map((p, i2) => (
                              <Response key={m.id + "-" + i2}>{p.text}</Response>
                            ))
                          )}
                        </div>
                      </MessageContent>
                      {avatarEl}
                    </Message>
                  </div>
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

          <PromptInput
            onSubmit={onSubmit}
            className="mt-4 mb-2 relative border border-fuchsia-400/30 bg-gradient-to-br from-fuchsia-500/15 via-background/60 to-background/40 backdrop-blur-xl shadow-sm"
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
                  disabled={
                    !messages.some((m) => m.role === "assistant") || isLoading
                  }
                  onClick={() => regenerate()}
                >
                  ↻
                </PromptInputButton>
                {isLoading && (
                  <PromptInputButton onClick={stop} title="Stop">
                    Stop
                  </PromptInputButton>
                )}
                {/* Persona-Auswahl statt Model-Auswahl */}
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
        </SheetContent>
      </Sheet>
    </section>
  );
}
