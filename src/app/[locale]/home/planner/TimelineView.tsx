"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { CreateEventModal } from "./CreateEventModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Plus,
  ChevronDown,
  ChevronUp,
  Star,
  TrendingUp,
  Pencil,
  Trash2,
  Loader2,
  ExternalLink,
  MessageSquare,
  Joystick,
  Utensils,
  PartyPopper,
  Plane,
  Trophy,
} from "lucide-react";
import { EventCategory } from "@prisma/client";
import { AvatarStack } from "@/components/ui/kibo-ui/avatar-stack/AvatarStack";
import { authClient } from "@/lib/auth-client";
import {
  updateEvent,
  deleteEvent,
  listComments as serverListComments,
  addComment as serverAddComment,
  updateComment as serverUpdateComment,
  deleteCommentById as serverDeleteComment,
} from "@/app/(server)/events.actions";
import { toast } from "sonner";

type TimelinedEvent = {
  id: string;
  title: string;
  time: string;
  dateISO: string;
  location?: string | null;
  url?: string | null;
  description?: string | null;
  attendees: number;
  userJoined: boolean;
  startDate: string;
  endDate: string;
  createdById: string;
  createdBy?: {
    name: string;
    image?: string | null;
  };
  category: EventCategory;
  isPublic: boolean;
  participants?: Array<{
    id: string;
    name: string;
    image?: string | null;
  }>;
};

type DayBucket = {
  dateISO: string;
  dayLabel: string;
  events: TimelinedEvent[];
  isAuthenticated?: boolean;
};

type EventComment = {
  id: string;
  content: string;
  createdAt: string;
  createdById: string;
  createdBy?: { id: string; name: string; image?: string | null };
};

interface TimelineViewProps {
  events: DayBucket[];
  viewMode: "grid" | "list";
  onCreateEvent?: () => void;
  onToggleJoin?: (eventId: string, nextJoined: boolean) => void;
}

const categoryTokens = {
  MEETUP: {
    bg: "bg-indigo-500/10",
    text: "text-indigo-600",
    ring: "ring-indigo-500/30",
    gradFrom: "from-indigo-100",
    gradTo: "to-indigo-500/0",
    chipBg: "bg-indigo-500/10",
    btnBg: "bg-indigo-600",
    btnHover: "hover:bg-indigo-700",
    btnOutlineHoverBg: "hover:bg-indigo-500/10",
    hoverText: "group-hover:text-indigo-600",
    linkText: "text-indigo-600",
  linkHover: "hover:text-indigo-700",
  fieldBg: "bg-indigo-50 dark:bg-indigo-900",
  focusRing: "focus-visible:ring-indigo-500",
  },
  EXPO: {
    bg: "bg-violet-500/10",
    text: "text-violet-600",
    ring: "ring-violet-500/30",
    gradFrom: "from-violet-100",
    gradTo: "to-violet-500/0",
    chipBg: "bg-violet-500/10",
    btnBg: "bg-violet-600",
    btnHover: "hover:bg-violet-700",
    btnOutlineHoverBg: "hover:bg-violet-500/10",
    hoverText: "group-hover:text-violet-600",
    linkText: "text-violet-600",
  linkHover: "hover:text-violet-700",
  fieldBg: "bg-violet-50 dark:bg-violet-900",
  focusRing: "focus-visible:ring-violet-500",
  },
  FOOD: {
    bg: "bg-amber-500/10",
    text: "text-amber-700",
    ring: "ring-amber-500/30",
    gradFrom: "from-amber-100",
    gradTo: "to-amber-500/0",
    chipBg: "bg-amber-500/10",
    btnBg: "bg-amber-600",
    btnHover: "hover:bg-amber-700",
    btnOutlineHoverBg: "hover:bg-amber-500/10",
    hoverText: "group-hover:text-amber-600",
    linkText: "text-amber-700",
  linkHover: "hover:text-amber-800",
  fieldBg: "bg-amber-50 dark:bg-amber-900",
  focusRing: "focus-visible:ring-amber-500",
  },
  PARTY: {
    bg: "bg-pink-500/10",
    text: "text-pink-600",
    ring: "ring-pink-500/30",
    gradFrom: "from-pink-100",
    gradTo: "to-pink-500/0",
    chipBg: "bg-pink-500/10",
    btnBg: "bg-pink-600",
    btnHover: "hover:bg-pink-700",
    btnOutlineHoverBg: "hover:bg-pink-500/10",
    hoverText: "group-hover:text-pink-600",
    linkText: "text-pink-600",
  linkHover: "hover:text-pink-700",
  fieldBg: "bg-pink-50 dark:bg-pink-900",
  focusRing: "focus-visible:ring-pink-500",
  },
  TRAVEL: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600",
    ring: "ring-emerald-500/30",
    gradFrom: "from-emerald-100",
    gradTo: "to-emerald-500/0",
    chipBg: "bg-emerald-500/10",
    btnBg: "bg-emerald-600",
    btnHover: "hover:bg-emerald-700",
    btnOutlineHoverBg: "hover:bg-emerald-500/10",
    hoverText: "group-hover:text-emerald-600",
    linkText: "text-emerald-600",
  linkHover: "hover:text-emerald-700",
  fieldBg: "bg-emerald-50 dark:bg-emerald-900",
  focusRing: "focus-visible:ring-emerald-500",
  },
  TOURNAMENT: {
    bg: "bg-rose-500/10",
    text: "text-rose-600",
    ring: "ring-rose-500/30",
    gradFrom: "from-rose-100",
    gradTo: "to-rose-500/0",
    chipBg: "bg-rose-500/10",
    btnBg: "bg-rose-600",
    btnHover: "hover:bg-rose-700",
    btnOutlineHoverBg: "hover:bg-rose-500/10",
    hoverText: "group-hover:text-rose-600",
    linkText: "text-rose-600",
  linkHover: "hover:text-rose-700",
  fieldBg: "bg-rose-50 dark:bg-rose-900",
  focusRing: "focus-visible:ring-rose-500",
  },
} as const;

const categoryIcons = {
  MEETUP: Users,
  EXPO: Joystick,
  FOOD: Utensils,
  PARTY: PartyPopper,
  TRAVEL: Plane,
  TOURNAMENT: Trophy,
};

const getPriorityTone = (attendees: number) => {
  if (attendees > 50) return "text-red-500";
  if (attendees > 20) return "text-orange-500";
  if (attendees > 10) return "text-amber-600";
  return "text-emerald-600";
};

export function TimelineView({
  events,
  viewMode,
  onCreateEvent,
  onToggleJoin,
}: TimelineViewProps) {
  const t = useTranslations("planner");
  const { data: session } = authClient.useSession();
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  // Optimistic overlays: patches per eventId and deletions set
  const [eventPatches, setEventPatches] = useState<Record<string, Partial<TimelinedEvent>>>({});
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  // Edit modal via CreateEventModal reuse
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TimelinedEvent | null>(null);
  // no dedicated editing transition needed here
  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TimelinedEvent | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDeleting] = useTransition();

  // Comments state per event
  const [commentsState, setCommentsState] = useState<Record<string, {
    open: boolean;
    loading: boolean;
    loaded: boolean;
    error?: string | null;
    items: EventComment[];
    newContent: string;
    editing: Record<string, string>; // commentId -> content being edited
    pending: boolean;
  }>>({});

  const toggleComments = (eventId: string) => {
    let shouldFetch = false;
    setCommentsState((prev) => {
      const cur = prev[eventId];
      if (!cur) {
        shouldFetch = true;
        return {
          ...prev,
          [eventId]: {
            open: true,
            loading: true,
            loaded: false,
            error: null,
            items: [],
            newContent: "",
            editing: {},
            pending: false,
          },
        };
      }
      const nextOpen = !cur.open;
      const next = { ...cur, open: nextOpen };
      if (nextOpen && !cur.loaded && !cur.loading) {
        next.loading = true;
        shouldFetch = true;
      }
      return { ...prev, [eventId]: next };
    });
    if (shouldFetch) {
      serverListComments(eventId)
        .then((items) => {
          setCommentsState((prev) => ({
            ...prev,
            [eventId]: {
              ...(prev[eventId] ?? {
                open: true,
                loading: false,
                loaded: true,
                error: null,
                items: [],
                newContent: "",
                editing: {},
                pending: false,
              }),
              loading: false,
              loaded: true,
              items,
              error: null,
            },
          }));
        })
        .catch((err) => {
          setCommentsState((prev) => ({
            ...prev,
            [eventId]: {
              ...(prev[eventId] ?? {
                open: true,
                loading: false,
                loaded: false,
                error: null,
                items: [],
                newContent: "",
                editing: {},
                pending: false,
              }),
              loading: false,
              loaded: false,
              error: (err as Error)?.message ?? "Failed to load comments",
            },
          }));
        });
    }
  };

  const toggleDayExpansion = (dateISO: string) => {
    const next = new Set(expandedDays);
    if (next.has(dateISO)) {
      next.delete(dateISO);
    } else {
      next.add(dateISO);
    }
    setExpandedDays(next);
  };
  // no longer needed: editTone handled by CreateEventModal itself

  const isExpanded = (dateISO: string) => expandedDays.has(dateISO);

  // Helpers
  const currentUserId = session?.user?.id ?? null;
  const canManage = (ev: TimelinedEvent) => !!currentUserId && ev.createdById === currentUserId;
  // no-op helper removed; keep local formatting inline to avoid tz pitfalls

  const openEdit = (ev: TimelinedEvent) => {
    setEditTarget(ev);
    setEditOpen(true);
  };

  const confirmDelete = (ev: TimelinedEvent) => {
    setDeleteTarget(ev);
    setDeleteError(null);
    setDeleteOpen(true);
  };

  // Global loading skeletons - removed since loading is handled upstream
  if (events.length === 0) {
    return (
      <Card className="border border-border/60 shadow-sm shadow-black/5 dark:shadow-black/20 backdrop-blur-xl bg-background/70">
        <CardContent className="p-12 text-center">
          <div className="text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">
              {t("empty.headline")}
            </h3>
            <p className="mb-4">{t("empty.sub")}</p>
            <Button onClick={onCreateEvent}>
              <Plus className="w-4 h-4 mr-2" />
              {t("empty.cta")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
  <div className="space-y-8">
      {/* Optional future: show skeletons if loading state is present */}
      {/* Example: if (loading) return ( ...many skeletons... ) */}
      {events.map((day) => {
        const totalAttendees = day.events.reduce(
          (sum, e) => sum + e.attendees,
          0,
        );
        const dayCategories = Array.from(
          new Set(day.events.map((e) => e.category)),
        );

        return (
          <div key={day.dateISO} className="relative">
            {/* Glassmorphism with subtle gradient + ring to match KPI styling */}
            <Card className="relative overflow-hidden border-0 ring-1 ring-indigo-500/20 shadow-[0_1px_0_rgba(255,255,255,0.05)] dark:shadow-[0_1px_0_rgba(0,0,0,0.4)] hover:shadow-2xl hover:shadow-black/20 dark:hover:shadow-black/40 transition-all backdrop-blur-xl bg-gradient-to-br from-indigo-500/5 via-background/60 to-background/50">
              <Collapsible
                open={isExpanded(day.dateISO)}
                onOpenChange={() => toggleDayExpansion(day.dateISO)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="relative cursor-pointer transition-colors p-5 sm:p-6 hover:bg-muted/30 border-b border-border/50">
                    <div className="relative">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="relative flex items-center justify-center w-12 h-12 rounded-full text-primary-foreground shrink-0">
                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] ring-2 ring-indigo-500/40" />
                            <div className="relative z-10">
                              <Calendar className="w-6 h-6" />
                            </div>
                          </div>
                                       <div className="min-w-0">
                            <CardTitle className="text-sm sm:text-base font-semibold truncate">
                              {day.dayLabel}
                            </CardTitle>
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                              <Badge variant="secondary" className="h-6 backdrop-blur-[2px] bg-background/50 border-border/50">
                                {t("timeline.eventsCount", {
                                  count: day.events.length,
                                })}
                              </Badge>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <TrendingUp className="w-4 h-4" />
                                <span>
                                  {t("timeline.totalAttendees", {
                                    count: totalAttendees,
                                  })}
                                </span>
                              </div>
                              {/* Category summary chips */}
                              <div className="flex flex-wrap gap-1.5">
                                {dayCategories.map((cat) => {
                                  const IconComp = categoryIcons[cat];
                                  return (
                                    <span
                                      key={cat}
                                      className={`inline-flex items-center gap-1 h-6 px-2 rounded-full border ${categoryTokens[cat].chipBg} ${categoryTokens[cat].text} border-border/50 backdrop-blur-[2px]`}
                                      aria-label={`${t("timeline.categories")} ${cat}`}
                                    >
                                      <IconComp className={`w-3.5 h-3.5 ${categoryTokens[cat].text}`} />
                                      <span className="text-xs font-medium">
                                        {t(`categories.${cat.toLowerCase()}`)}
                                      </span>
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
 
                        <div className="flex items-center gap-2">
                          {isExpanded(day.dateISO) ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="mt-4">
                    {/* Per-day body: loading -> skeletons, not loading -> events or compact empty */}
                      <div
                        className={
                          viewMode === "grid"
                            ? "columns-1 md:columns-2 lg:columns-3 gap-x-6"
                            : "space-y-6"
                        }
                      >
                      {day.events.length === 0 ? (
                        <div className="col-span-full">
                          <div className="flex items-center justify-between p-4 rounded-md border bg-muted/40">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {t("timeline.eventsCount", { count: 0 })}
                              </span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={onCreateEvent}
                            className="backdrop-blur-[2px] bg-gradient-to-r from-indigo-600 to-indigo-500 text-white ring-1 ring-indigo-400/40 hover:from-indigo-500 hover:to-indigo-600 shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 border-0"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              {t("timeline.ctaStrip.add")}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        day.events
                          .filter((e) => !deletedIds.has(e.id))
                          .map((event) => {
                          const tone = categoryTokens[event.category];
                          const priorityTone = getPriorityTone(event.attendees);
                          const patched = eventPatches[event.id] ?? {};
                          const merged: TimelinedEvent = {
                            ...event,
                            ...patched,
                          } as TimelinedEvent;

                          return (
                            <div key={merged.id} className={viewMode === "grid" ? "break-inside-avoid mb-6" : ""}>
                              <Card
                                className={`group relative transition-all duration-200 border-0 ring-1 ${tone.ring} overflow-hidden shadow-[0_1px_0_rgba(255,255,255,0.05)] dark:shadow-[0_1px_0_rgba(0,0,0,0.4)] hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30 backdrop-blur-lg bg-gradient-to-br ${tone.gradFrom} via-background/60 ${tone.gradTo} pt-0`}
                              >
                              <CardContent className="p-0">
                                {/* Event Header - compact */}
                                <div className="relative p-4 sm:p-5 border-b border-border/50 hover:bg-muted/20">
                                  <div className="relative z-10 flex items-start justify-between">
                                    <div className="min-w-0" />
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge
                                        variant="outline"
                                        className={`h-6 px-2 text-[11px] ${tone.text} border-border/50 backdrop-blur-[2px] bg-background/40 hover:bg-background/60 inline-flex items-center gap-1`}
                                      >
                                        {(() => {
                                          const IconComp = categoryIcons[merged.category];
                                          return <IconComp className={`w-3.5 h-3.5 ${tone.text}`} />;
                                        })()}
                                        <span>
                                          {t(
                                            `categories.${merged.category.toLowerCase()}`,
                                          )}
                                        </span>
                                      </Badge>
                                      {merged.attendees > 20 && (
                                        <Star
                                          className={`w-4 h-4 ${priorityTone}`}
                                          aria-label={t("timeline.popular")}
                                        />
                                      )}
                                      {canManage(merged) && (
                                        <div className="flex items-center gap-1">
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label={t("tooltips.edit")}
                                                onClick={() => openEdit(merged)}
                                              >
                                                <Pencil className={`w-4 h-4 ${tone.text}`} />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>{t("tooltips.edit")}</TooltipContent>
                                          </Tooltip>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label={t("tooltips.delete")}
                                                onClick={() => confirmDelete(merged)}
                                              >
                                                <Trash2 className={`w-4 h-4 ${tone.text}`} />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>{t("tooltips.delete")}</TooltipContent>
                                          </Tooltip>
                                        </div>
                                      )}
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Comments"
                                        onClick={() => toggleComments(merged.id)}
                                      >
                                        <MessageSquare className={`w-4 h-4 ${tone.text}`} />
                                      </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Comments</TooltipContent>
                                      </Tooltip>
                                      <div className="basis-full sm:basis-auto sm:ml-2">
                                        <Button
                                          variant={merged.userJoined ? "default" : "outline"}
                                          size="sm"
                                          className={`w-full sm:w-auto justify-center text-xs group-hover:scale-105 transition-transform shadow-sm hover:shadow ${
                                            merged.userJoined
                                              ? `${tone.btnBg} ${tone.btnHover} text-white border-0`
                                              : `${tone.text} ${tone.btnOutlineHoverBg}`
                                          }`}
                                          onClick={() => {
                                            if (onToggleJoin) {
                                              onToggleJoin(merged.id, !merged.userJoined);
                                            }
                                          }}
                                        >
                                          {merged.userJoined ? t("joined") : t("join")}
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Event Content */}
                                <div className="p-5">
                                  {/* Title */}
                                  <h3 className={`font-bold text-lg sm:text-xl mb-3 transition-colors line-clamp-2 drop-shadow-[0_1px_0_rgba(255,255,255,0.25)] dark:drop-shadow-none ${tone.text}`}>
                                    {merged.title}
                                  </h3>

                                  {/* Details */}
                                  <div className="space-y-2.5 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                      <Clock className={`w-4 h-4 ${tone.text}`} />
                                      <span className="font-medium">
                                        {merged.time}
                                      </span>
                                    </div>

                                    {merged.location && (
                                      <div className="flex items-center gap-2">
                                        <MapPin className={`w-4 h-4 ${tone.text}`} />
                                        <span className="truncate">
                                          {merged.location}
                                        </span>
                                      </div>
                                    )}

                                    {merged.attendees > 0 && (
                                      <div className="flex flex-wrap items-center gap-2">
                                        <Users className={`w-4 h-4 ${tone.text}`} />
                                        <AvatarStack
                                          avatars={
                                            merged.participants && merged.participants.length > 0
                                              ? merged.participants.map((u) => ({
                                                  id: u.id,
                                                  name: u.name,
                                                  image: u.image ?? undefined,
                                                  fallback: u.name
                                                    .split(" ")
                                                    .map((n) => n[0])
                                                    .join("")
                                                    .slice(0, 2)
                                                    .toUpperCase(),
                                                }))
                                              : Array.from(
                                                  { length: Math.min(merged.attendees, 5) },
                                                  (_, i) => ({
                                                    id: `attendee-${i}`,
                                                    name: `Attendee ${i + 1}`,
                                                    fallback: `A${i + 1}`,
                                                  }),
                                                )
                                          }
                                          size="sm"
                                        />
                                        {merged.attendees > 10 && (
                                          <Badge
                                            variant="outline"
                                            className="text-xs backdrop-blur-[2px] bg-background/40 border-border/50"
                                          >
                                            {t("timeline.popular")}
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Description */}
                                  {(merged.description || merged.url) && (
                                    <>
                                      <Separator className="my-4" />
                                      {merged.description && (
                                        <p className="text-sm text-muted-foreground line-clamp-2 group-hover:line-clamp-none transition-all">
                                          {merged.description}
                                        </p>
                                      )}
                                      {merged.url && (
                                        <div className="mt-2">
                                          <a
                                            href={merged.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`text-sm break-all inline-flex items-center gap-1 underline-offset-4 hover:underline ${tone.linkText} ${tone.linkHover}`}
                                          >
                                            <ExternalLink className={`w-4 h-4 ${tone.text}`} />
                                            {merged.url}
                                          </a>
                                        </div>
                                      )}
                                    </>
                                  )}

                                  {/* Avatare oben in Details angezeigt; unten keine zweite Anzeige */}

                                  {/* Creator */}
                                  {merged.createdBy && (
                                    <div className="flex items-center gap-2 mt-3">
                                      <Avatar className="w-5 h-5">
                                        <AvatarImage src={merged.createdBy.image || ""} />
                                        <AvatarFallback className="text-xs">
                                          {merged.createdBy.name
                                            .split(' ')
                                            .map(n => n[0])
                                            .join('')
                                            .slice(0, 2)
                                            .toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-xs text-muted-foreground">
                                        {t("timeline.createdBy", {
                                          name: merged.createdBy.name,
                                        })}
                                      </span>
                                    </div>
                                  )}

                                  {/* Comments */}
                                  {(() => {
                                    const cs = commentsState[merged.id];
                                    if (!cs?.open) return null;
                                    return (
                                      <div className={`mt-4 rounded-lg border-0 ring-1 ${tone.ring} bg-background p-3`}>
                                        {cs.loading ? (
                                          <div className="text-sm text-muted-foreground">Loading comments…</div>
                                        ) : cs.error ? (
                                          <div className="text-sm text-destructive">{cs.error}</div>
                                        ) : (
                                          <div className="space-y-3">
                                            {cs.items.length === 0 ? (
                                              <div className="text-sm text-muted-foreground">No comments yet</div>
                                            ) : (
                                              cs.items.map((c) => {
                                                const isOwner = currentUserId === c.createdById;
                                                const isEditing = cs.editing[c.id] !== undefined;
                                                return (
                                                  <div key={c.id} className={`rounded-md border-0 ring-1 ${tone.ring} bg-background p-2`}>
                                                    <div className="flex items-start justify-between gap-2">
                                                      <div className="flex items-start gap-2 min-w-0">
                                                        <Avatar className="w-6 h-6 mt-0.5">
                                                          <AvatarImage src={c.createdBy?.image || ""} />
                                                          <AvatarFallback className="text-[10px]">
                                                            {(c.createdBy?.name || "?")
                                                              .split(" ")
                                                              .map((n) => n[0])
                                                              .join("")
                                                              .slice(0, 2)
                                                              .toUpperCase()}
                                                          </AvatarFallback>
                                                        </Avatar>
                                                        <div className="min-w-0">
                                                          <div className="text-xs text-muted-foreground truncate">
                                                            {c.createdBy?.name || "Anonymous"} · {new Date(c.createdAt).toLocaleString()}
                                                          </div>
                                                          {isEditing ? (
                                                            <div className="mt-2 space-y-2">
                                                              <Textarea
                                                                value={cs.editing[c.id]}
                                                                onChange={(e) =>
                                                                  setCommentsState((prev) => ({
                                                                    ...prev,
                                                                    [merged.id]: {
                                                                      ...prev[merged.id],
                                                                      editing: { ...prev[merged.id].editing, [c.id]: e.target.value },
                                                                    },
                                                                  }))
                                                                }
                                                                className={`border-2 rounded-md border-border/50 bg-background ring-1 ${tone.ring}`}
                                                              />
                                                              <div className="flex gap-2">
                                                                <Button
                                                                  size="sm"
                                                                  className={`text-xs ${tone.btnBg} ${tone.btnHover} text-white border-0 ring-1 ${tone.ring} shadow-sm hover:shadow`}
                                                                  onClick={async () => {
                                                                    const content = cs.editing[c.id] || "";
                                                                    try {
                                                                      const updated = await serverUpdateComment(c.id, content);
                                                                      setCommentsState((prev) => {
                                                                        const list = prev[merged.id].items.map((it) => (it.id === c.id ? { ...it, content: updated.content } : it));
                                                                        const nextEditing = { ...prev[merged.id].editing };
                                                                        delete nextEditing[c.id];
                                                                        return { ...prev, [merged.id]: { ...prev[merged.id], items: list, editing: nextEditing } };
                                                                      });
                                                                      toast.success("Comment updated");
                                                                    } catch (err) {
                                                                      toast.error((err as Error)?.message || "Failed to update");
                                                                    }
                                                                  }}
                                                                >
                                                                  Save
                                                                </Button>
                                                                <Button
                                                                  variant="outline"
                                                                  size="sm"
                                                                  className={`text-xs ${tone.text} ${tone.btnOutlineHoverBg}`}
                                                                  onClick={() =>
                                                                    setCommentsState((prev) => {
                                                                      const nextEditing = { ...prev[merged.id].editing };
                                                                      delete nextEditing[c.id];
                                                                      return { ...prev, [merged.id]: { ...prev[merged.id], editing: nextEditing } };
                                                                    })
                                                                  }
                                                                >
                                                                  Cancel
                                                                </Button>
                                                              </div>
                                                            </div>
                                                          ) : (
                                                            <p className={`text-sm break-words whitespace-pre-wrap ${tone.text}`}>{c.content}</p>
                                                          )}
                                                        </div>
                                                      </div>
                                                      {isOwner && !isEditing && (
                                                        <div className="flex items-center gap-1">
                                                          <Tooltip>
                                                            <TooltipTrigger asChild>
                                                              <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                aria-label="Edit comment"
                                                                className={`${tone.btnOutlineHoverBg}`}
                                                                onClick={() =>
                                                                  setCommentsState((prev) => ({
                                                                    ...prev,
                                                                    [merged.id]: {
                                                                      ...prev[merged.id],
                                                                      editing: { ...prev[merged.id].editing, [c.id]: c.content },
                                                                    },
                                                                  }))
                                                                }
                                                              >
                                                                <Pencil className={`w-4 h-4 ${tone.text}`} />
                                                              </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Edit</TooltipContent>
                                                          </Tooltip>

                                                          <Tooltip>
                                                            <TooltipTrigger asChild>
                                                              <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                aria-label="Delete comment"
                                                                className={`${tone.btnOutlineHoverBg}`}
                                                                onClick={async () => {
                                                                  if (!confirm("Delete this comment?")) return;
                                                                  try {
                                                                    await serverDeleteComment(c.id);
                                                                    setCommentsState((prev) => ({
                                                                      ...prev,
                                                                      [merged.id]: { ...prev[merged.id], items: prev[merged.id].items.filter((it) => it.id !== c.id) },
                                                                    }));
                                                                    toast.success("Comment deleted");
                                                                  } catch (err) {
                                                                    toast.error((err as Error)?.message || "Failed to delete");
                                                                  }
                                                                }}
                                                              >
                                                                <Trash2 className={`w-4 h-4 ${tone.text}`} />
                                                              </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Delete</TooltipContent>
                                                          </Tooltip>
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>
                                                );
                                              })
                                            )}
                                            {/* Add comment */}
                                            <div className="pt-2 mt-2 border-t border-border/40">
                                              <div className="flex items-start gap-2">
                                                <Textarea
                                                  placeholder="Write a comment…"
                                                  value={cs.newContent}
                                                  onChange={(e) =>
                                                    setCommentsState((prev) => ({
                                                      ...prev,
                                                      [merged.id]: { ...prev[merged.id], newContent: e.target.value },
                                                    }))
                                                  }
                                                  className={`border-2 rounded-md border-border/50 bg-background`}
                                                />
                                              </div>
                                              <div className="mt-2 flex justify-end">
                                                <Button
                                                  size="sm"
                                                  disabled={!cs.newContent.trim() || cs.pending}
                                                  className={`text-xs ${tone.btnBg} ${tone.btnHover} text-white border-0 ring-1 ${tone.ring} shadow-sm hover:shadow`}
                                                  onClick={async () => {
                                                    setCommentsState((prev) => ({ ...prev, [merged.id]: { ...prev[merged.id], pending: true } }));
                                                    try {
                                                      const created = await serverAddComment(merged.id, cs.newContent);
                                                      setCommentsState((prev) => ({
                                                        ...prev,
                                                        [merged.id]: {
                                                          ...prev[merged.id],
                                                          items: [created, ...prev[merged.id].items],
                                                          newContent: "",
                                                          pending: false,
                                                        },
                                                      }));
                                                      toast.success("Comment added");
                                                    } catch (err) {
                                                      setCommentsState((prev) => ({ ...prev, [merged.id]: { ...prev[merged.id], pending: false } }));
                                                      toast.error((err as Error)?.message || "Failed to add comment");
                                                    }
                                                  }}
                                                >
                                                  Add comment
                                                </Button>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>
                               </CardContent>
                               {(() => {
                                 const BgIcon = categoryIcons[merged.category];
                                 return (
                                   <BgIcon
                                     aria-hidden
                                     className={`pointer-events-none absolute -right-6 -bottom-6 w-56 h-56 sm:w-64 sm:h-64 rotate-12 opacity-10 blur-xs ${tone.text}`}
                                   />
                                 );
                               })()}
                              </Card>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* CTA strip */}
                    <div className="mt-6 pt-6 border-t border-border/50">
                      <div className="relative overflow-hidden rounded-lg border border-border/50">
                        <div className="relative flex items-center justify-between p-4 backdrop-blur-md bg-background/60">
                          <div className="text-sm text-muted-foreground">
                            {t("timeline.ctaStrip.text")}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={onCreateEvent}
                            className="backdrop-blur-[2px] bg-gradient-to-r from-indigo-600 to-indigo-500 text-white ring-1 ring-indigo-400/40 hover:from-indigo-500 hover:to-indigo-600 shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 border-0"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            {t("timeline.ctaStrip.add")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
              <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />
            </Card>
          </div>
        );
      })}

      {/* Edit Modal (reusing CreateEventModal) */}
      {editTarget && (
        <CreateEventModal
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          titleOverride={t("modal.titleEdit")}
          submitTextOverride={t("modal.actions.save")}
          initialData={{
            name: editTarget.title,
            description: editTarget.description ?? "",
            location: editTarget.location ?? "",
            url: editTarget.url ?? "",
            startDate: editTarget.startDate,
            endDate: editTarget.endDate,
            category: editTarget.category,
            isPublic: editTarget.isPublic,
            isFixed: false,
          }}
          onSubmit={async (data) => {
            const target = editTarget;
            if (!target) return;
            const optimistic: Partial<TimelinedEvent> = {
              title: data.name,
              description: data.description,
              location: data.location,
              url: data.url,
              startDate: data.startDate,
              endDate: data.endDate,
              category: data.category,
              isPublic: data.isPublic,
              time: (() => {
                try {
                  return new Date(data.startDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
                } catch {
                  return target.time;
                }
              })(),
            };
            setEventPatches((prev) => ({ ...prev, [target.id]: { ...(prev[target.id] ?? {}), ...optimistic } }));
            try {
              await updateEvent(target.id, {
                name: data.name,
                description: data.description,
                location: data.location ?? undefined,
                url: data.url ?? undefined,
                startDate: data.startDate,
                endDate: data.endDate,
                category: data.category,
                isPublic: data.isPublic,
                isFixed: data.isFixed,
              });
              toast.success(t("toast.updated"));
            } catch {
              setEventPatches((prev) => {
                const cp = { ...prev };
                delete cp[target.id];
                return cp;
              });
              toast.error(t("toast.update_error"));
            } finally {
              setEditOpen(false);
            }
          }}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirm.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && t("confirm.deleteMessage", { title: deleteTarget.title, time: deleteTarget.time })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="text-sm text-destructive" role="alert">{deleteError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>{t("confirm.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleteTarget) return;
                setDeleteError(null);
                startDeleting(async () => {
                  const id = deleteTarget.id;
                  // optimistic removal
                  setDeletedIds((prev) => new Set(prev).add(id));
                  try {
                    await deleteEvent(id);
                    toast.success(t("toast.deleted"));
                    setDeleteOpen(false);
                  } catch (err) {
                    // rollback
                    setDeletedIds((prev) => {
                      const next = new Set(prev);
                      next.delete(id);
                      return next;
                    });
                    setDeleteError((err as Error)?.message || t("toast.delete_error"));
                    toast.error(t("toast.delete_error"));
                  }
                });
              }}
            >
              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("confirm.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Inline edit sheet kept local to this file for cohesion with TimelineView UI.
// It reuses the design system components and mirrors a subset of the create modal fields for editing.

