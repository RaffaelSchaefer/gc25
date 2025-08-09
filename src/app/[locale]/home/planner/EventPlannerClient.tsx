"use client";

import { useState, useEffect } from "react";
import type { BroadcastMessage } from "@/types/realtime";
import { useTranslations } from "next-intl";
import { Calendar, Users, Plus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { EventCategory } from "@prisma/client";
import { CreateEventModal, CreateEventData } from "./CreateEventModal";
import { TimelineView } from "./TimelineView";
import { EventStats } from "./EventStats";
import {
  createEvent,
  joinEvent,
  cancelJoin,
} from "../../../(server)/events.actions";
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

interface EventPlannerClientProps {
  initialEvents: DayBucket[];
}

export function EventPlannerClient({ initialEvents }: EventPlannerClientProps) {
  const t = useTranslations("planner");
  const [events, setEvents] = useState<DayBucket[]>(initialEvents);
  const [viewMode] = useState<"grid" | "list">("grid");
  const [searchTerm] = useState("");
  const [selectedCategory] = useState<string>("all");
  const [selectedDate] = useState<string>("all");
  const [showJoinedOnly, setShowJoinedOnly] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [, setIsCreating] = useState(false);
  const [isCmdOpen] = useState(false);

  // Socket.IO connection for real-time updates
  useEffect(() => {
    let unsubscribe = () => {};

    const toHHmmLocal = (d: Date) => {
      try {
        return d.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
      } catch {
        return d.toISOString().slice(11, 16);
      }
    };

    const formatDayLabel = (d: Date) => {
      try {
        return d.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        });
      } catch {
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${mm}/${dd}`;
      }
    };

    const upsertEvent = (payload: {
      id: string;
      title: string;
      description?: string | null;
      location?: string | null;
      url?: string | null;
      startDate: string;
      endDate: string;
      createdById: string;
      category: EventCategory;
    }) => {
      const start = new Date(payload.startDate);
      const dateISO = start.toISOString().slice(0, 10);
      const time = toHHmmLocal(start);

      const newEvent: TimelinedEvent = {
        id: payload.id,
        title: payload.title,
        description: payload.description ?? "",
        location: payload.location ?? "",
        url: payload.url ?? "",
        attendees: 0,
        userJoined: false,
        startDate: payload.startDate,
        endDate: payload.endDate,
        createdById: payload.createdById,
        category: payload.category,
        time,
        dateISO,
        isPublic: false,
      };

      setEvents((prev) => {
        // Remove any previous instance
        const stripped = prev.map((b) => ({
          ...b,
          events: b.events.filter((e) => e.id !== payload.id),
        }));
        // Insert to correct bucket
        const idx = stripped.findIndex((b) => b.dateISO === dateISO);
        let next = stripped;
        if (idx === -1) {
          next = [
            ...stripped,
            { dateISO, dayLabel: formatDayLabel(start), events: [newEvent] },
          ];
        } else {
          const bucket = { ...stripped[idx] };
          bucket.events = [...bucket.events, newEvent];
          next = [
            ...stripped.slice(0, idx),
            bucket,
            ...stripped.slice(idx + 1),
          ];
        }
        next.sort((a, b) => a.dateISO.localeCompare(b.dateISO));
        for (const b of next)
          b.events.sort((a, c) => a.time.localeCompare(c.time));
        return next;
      });
    };

    const deleteEventLocal = (id: string) => {
      setEvents((prev) =>
        prev
          .map((b) => ({ ...b, events: b.events.filter((e) => e.id !== id) }))
          .filter((b) => b.events.length > 0),
      );
    };

    (async () => {
      try {
        const { getClientSocket } = await import("@/lib/io-client");
        const socket = getClientSocket();
        const handler = (msg: BroadcastMessage) => {
          if (msg?.type === "participant_changed") {
            const { eventId, attendees } = msg;
            setEvents((prev) =>
              prev.map((d) => ({
                ...d,
                events: d.events.map((e) =>
                  e.id === eventId ? { ...e, attendees } : e,
                ),
              })),
            );
            return;
          }
          if (msg?.type === "event_created" || msg?.type === "event_updated") {
            upsertEvent(msg.event);
            return;
          }
          if (msg?.type === "event_deleted") {
            deleteEventLocal(msg.id);
            return;
          }
        };
        socket.on("events:update", handler);
        unsubscribe = () => socket.off("events:update", handler);
      } catch {}
    })();

    return () => unsubscribe();
  }, []);

  // Filter events based on search and filters
  const filteredEvents = events
    .map((day) => ({
      ...day,
      events: day.events.filter((event) => {
        const matchesSearch =
          event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.location?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory =
          selectedCategory === "all" || event.category === selectedCategory;
        const matchesDate =
          selectedDate === "all" || day.dateISO === selectedDate;
        const matchesJoined = !showJoinedOnly || event.userJoined;

        return (
          matchesSearch &&
          matchesCategory &&
          matchesDate &&
          matchesJoined
        );
      }),
    }))
    .filter((day) => day.events.length > 0);

  const handleCreateEvent = async (eventData: CreateEventData) => {
    setIsCreating(true);
    try {
      await createEvent(eventData);
      toast.success(t("toast.created"));
      // TODO: optional refresh
    } catch (error) {
      toast.error(t("toast.create_error"));
      console.error("Error creating event:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleJoin = async (eventId: string, nextJoined: boolean) => {
    try {
      if (nextJoined) {
        const result = await joinEvent(eventId);
        toast.success(t("toast.joined"));

        // Update local state immediately for better UX
        setEvents((prev) =>
          prev.map((day) => ({
            ...day,
            events: day.events.map((event) =>
              event.id === eventId
                ? { ...event, userJoined: true, attendees: result.attendees }
                : event,
            ),
          })),
        );
      } else {
        const result = await cancelJoin(eventId);
        toast.success(t("toast.left"));

        // Update local state immediately for better UX
        setEvents((prev) =>
          prev.map((day) => ({
            ...day,
            events: day.events.map((event) =>
              event.id === eventId
                ? { ...event, userJoined: false, attendees: result.attendees }
                : event,
            ),
          })),
        );
      }
    } catch (error) {
      toast.error(t("toast.join_error"));
      console.error("Error toggling join:", error);
    }
  };

  // clearFilters removed along with reset button

  // Simple Skeletons for loading/empty polish
  function KpiSkeleton() {
    return (
      <Card className="shadow-sm">
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-12 mt-2" />
        </CardContent>
      </Card>
    );
  }

  // Calculate total stats
  const totalEvents = events.reduce(
    (total, day) => total + day.events.length,
    0,
  );
  const totalAttendees = events.reduce(
    (total, day) =>
      total +
      day.events.reduce((dayTotal, event) => dayTotal + event.attendees, 0),
    0,
  );
  const categoriesCount = Array.from(
    new Set(events.flatMap((d) => d.events.map((e) => e.category))),
  ).length;

  return (
    <div className="space-y-6">
      {/* Planner Header / Hero */}
      <header role="banner" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                {t("title")}
              </h1>
              <p className="text-sm md:text-base text-muted-foreground mt-2">
                {t("banner")}
              </p>
            </div>
            {/* Quick KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {events.length === 0 ? (
                <>
                  <KpiSkeleton />
                  <KpiSkeleton />
                  <div className="hidden sm:block">
                    <KpiSkeleton />
                  </div>
                </>
              ) : (
                <>
                  {/* Total Events */}
                  <Card className="relative overflow-hidden shadow-sm border-0 ring-1 ring-indigo-500/30 bg-gradient-to-br from-indigo-500/15 via-indigo-500/0 to-transparent">
                    <CardContent className="py-4 px-5">
                      <div className="flex items-center gap-2 text-xs text-indigo-700 dark:text-indigo-300">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/15 ring-1 ring-indigo-500/30">
                          <Calendar className="w-3.5 h-3.5" />
                        </span>
                        {t("stats.totalEvents")}
                      </div>
                      <div className="mt-1 text-4xl md:text-6xl font-extrabold tracking-tight text-indigo-700 dark:text-indigo-300">
                        {totalEvents}
                      </div>
                      <div
                        aria-hidden
                        className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-indigo-500/20 blur-3xl"
                      />
                    </CardContent>
                  </Card>
                  {/* Total Attendees */}
                  <Card className="relative overflow-hidden shadow-sm border-0 ring-1 ring-emerald-500/30 bg-gradient-to-br from-emerald-500/15 via-emerald-500/0 to-transparent">
                    <CardContent className="py-4 px-5">
                      <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30">
                          <Users className="w-3.5 h-3.5" />
                        </span>
                        {t("stats.totalAttendees")}
                      </div>
                      <div className="mt-1 text-4xl md:text-6xl font-extrabold tracking-tight text-emerald-700 dark:text-emerald-300">
                        {totalAttendees}
                      </div>
                      <div
                        aria-hidden
                        className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-emerald-500/20 blur-3xl"
                      />
                    </CardContent>
                  </Card>
                  {/* Categories */}
                  <Card className="relative overflow-hidden shadow-sm border-0 hidden sm:block ring-1 ring-orange-500/30 bg-gradient-to-br from-orange-500/15 via-orange-500/0 to-transparent">
                    <CardContent className="py-4 px-5">
                      <div className="flex items-center gap-2 text-xs text-orange-700 dark:text-orange-300">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-500/15 ring-1 ring-orange-500/30">
                          <TrendingUp className="w-3.5 h-3.5" />
                        </span>
                        {t("stats.categories")}
                      </div>
                      <div className="mt-1 text-4xl md:text-6xl font-extrabold tracking-tight text-orange-700 dark:text-orange-300">
                        {categoriesCount}
                      </div>
                      <div
                        aria-hidden
                        className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-orange-500/20 blur-3xl"
                      />
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>

          {/* Actions / Interactive Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="flex-1">
              {/* This is just spacing to align with filters below */}
              <Separator className="hidden md:block" />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-9 items-center gap-2 rounded-md border bg-background px-3">
                <Label htmlFor="joined-only" className="text-sm font-medium">
                  {t("filters.mine")}
                </Label>
                <Switch
                  id="joined-only"
                  checked={showJoinedOnly}
                  onCheckedChange={setShowJoinedOnly}
                />
              </div>
              <Button
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white ring-1 ring-indigo-400/40 hover:from-indigo-500 hover:to-indigo-600 shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t("actions.new")}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Events Display */}
      <Tabs
        defaultValue="timeline"
        className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timeline">{t("tabs.timeline")}</TabsTrigger>
          <TabsTrigger value="stats">{t("tabs.analytics")}</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-8 mt-8">
          {/* Empty-state when filters yield no results */}
          {filteredEvents.length === 0 ? (
            <Card className="max-w-3xl mx-auto shadow-sm">
              <CardHeader className="text-center">
                <CardTitle className="text-xl">{t("empty.headline")}</CardTitle>
                <CardDescription>{t("empty.sub")}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center gap-3 pb-6">
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white ring-1 ring-indigo-400/40 hover:from-indigo-500 hover:to-indigo-600 shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t("empty.cta")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <TimelineView
              events={filteredEvents}
              viewMode={viewMode}
              onCreateEvent={() => setIsCreateModalOpen(true)}
              onToggleJoin={handleToggleJoin}
            />
          )}
        </TabsContent>

        <TabsContent value="stats" className="space-y-8 mt-8">
          <EventStats events={filteredEvents} />
        </TabsContent>
      </Tabs>

      {/* Global lightweight skeletons for initial mount (if needed in future streaming) */}
      {false && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <Skeleton className="h-6 w-40" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      )}

      {/* Lightweight command palette hint */}
      <div className="sr-only" aria-live="polite">
        {isCmdOpen ? "Command palette opened" : "Command palette closed"}
      </div>

      {/* Bottom create button removed as requested */}

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateEvent}
      />
    </div>
  );
}

/* segmented Grid/List toggle and reset filter button removed as requested */
