"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Calendar, MapPin, Gamepad2, Users, Utensils, Car } from "lucide-react";

type TimelinedEvent = {
  id: string;
  title: string;
  time: string; // HH:mm
  dateISO: string;
  location?: string | null;
  description?: string | null;
  attendees: number;
  userJoined: boolean;
  startDate: string;
  endDate: string;
  createdById: string;
  // New: event category identifier (string or enum name)
  category?: string;
};

type DayBucket = {
  dateISO: string;
  dayLabel: string;
  events: TimelinedEvent[];
  // whether user is authenticated on server request (optional)
  isAuthenticated?: boolean;
};

type Props = {
  days: DayBucket[];
};

function iconForCategory(category?: string) {
  switch (category) {
    case "MEETUP":
      return Users;
    case "EXPO":
      return Gamepad2;
    case "FOOD":
      return Utensils;
    case "TRAVEL":
      return Car;
    case "TOURNAMENT":
      return Gamepad2;
    case "PARTY":
      return Gamepad2;
    default:
      // If a location is present we prefer MapPin elsewhere; keep generic Gamepad2 here
      return Gamepad2;
  }
}

export default function TimelineSchedule({ days }: Props) {
  const t = useTranslations("schedule");
  const [activeDay, setActiveDay] = useState(1);
  const [scrollProgress, setScrollProgress] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Keep a local, live-updating copy for realtime WS merges
  const [liveDays, setLiveDays] = useState<DayBucket[]>(days);
  const totalDays = liveDays.length;

  // Merge initial props when they change (SSR -> CSR hydration)
  useEffect(() => {
    setLiveDays(days);
  }, [days]);

  // WebSocket subscription with live data merging
  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      ws = new WebSocket(
        `${protocol}://${window.location.host}/api/events/stream`,
      );
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg?.type === "participant_changed") {
            const { eventId, attendees } = msg;
            setLiveDays((prev) =>
              prev.map((d) => ({
                ...d,
                events: d.events.map((e) =>
                  e.id === eventId ? { ...e, attendees } : e,
                ),
              })),
            );
          } else if (msg?.type === "event_deleted") {
            const { id } = msg;
            setLiveDays((prev) =>
              prev
                .map((d) => ({
                  ...d,
                  events: d.events.filter((e) => e.id !== id),
                }))
                .filter((d) => d.events.length > 0 || true),
            );
          } else if (
            msg?.type === "event_created" ||
            msg?.type === "event_updated"
          ) {
            const e = msg.event;
            const start = new Date(e.startDate);
            const label = start.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            });
            const hhmm = start
              .toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })
              .toString();

            setLiveDays((prev) => {
              // Remove existing instance if event_updated might have moved across days
              const withoutOld = prev.map((d) => ({
                ...d,
                events: d.events.filter((ev) => ev.id !== e.id),
              }));
              // Find or create bucket by day label
              let idx = withoutOld.findIndex((d) => d.dayLabel === label);
              const next = [...withoutOld];
              if (idx === -1) {
                next.push({
                  dateISO: start.toISOString().slice(0, 10),
                  dayLabel: label,
                  events: [],
                  isAuthenticated: withoutOld[0]?.isAuthenticated,
                });
                idx = next.length - 1;
              }
              const cat = e.category as string | undefined;
              next[idx] = {
                ...next[idx],
                events: [
                  ...next[idx].events,
                  {
                    id: e.id,
                    title: e.title,
                    time: hhmm,
                    dateISO: start.toISOString().slice(0, 10),
                    location: e.location ?? null,
                    description: e.description ?? null,
                    attendees:
                      next[idx].events.find((x) => x.id === e.id)?.attendees ??
                      0,
                    userJoined: false,
                    startDate: e.startDate,
                    endDate: e.endDate,
                    createdById: e.createdById,
                    category: cat,
                  },
                ].sort((a, b) => a.time.localeCompare(b.time)),
              };
              // Keep days sorted by date
              next.sort((a, b) => a.dateISO.localeCompare(b.dateISO));
              return next;
            });
          }
        } catch {
          // ignore malformed frames
        }
      };
    } catch {
      // ignore WS construction errors
    }
    return () => {
      try {
        ws?.close();
      } catch {
        // ignore
      }
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const elementTop = rect.top;
        const elementHeight = rect.height;

        const progress = Math.max(
          0,
          Math.min(
            1,
            (windowHeight - elementTop) / (windowHeight + elementHeight),
          ),
        );
        setScrollProgress(progress);

        const dayIndex = Math.floor(progress * totalDays);
        setActiveDay(Math.min(totalDays, Math.max(1, dayIndex + 1)));
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [totalDays]);

  const scheduleData = useMemo(() => {
    return liveDays.map((bucket, idx) => ({
      day: idx + 1,
      date: bucket.dayLabel,
      title: bucket.dayLabel,
      activities: bucket.events.map((e) => ({
        time: e.time,
        activity: e.title + (e.location ? ` • ${e.location}` : ""),
        // prefer category icon; fallback to location-based icon
        icon: e.category
          ? `cat:${e.category}`
          : e.location
            ? "MapPin"
            : "Gamepad2",
      })),
    }));
  }, [liveDays]);

  return (
    <div
      id="schedule-section"
      ref={timelineRef}
      className="min-h-screen bg-gray-900 py-20"
    >
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
              {t("title")}
            </h2>
            <p className="text-xl text-gray-300">{t("subtitle")}</p>
          </div>

          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-700">
              <div
                className="w-full bg-gradient-to-b from-purple-500 to-purple-400 transition-all duration-300 ease-out"
                style={{ height: `${scrollProgress * 100}%` }}
              />
            </div>

            <div className="space-y-12">
              {scheduleData.map(
                (dayData: {
                  day: number;
                  date: string;
                  title: string;
                  activities: {
                    time: string;
                    activity: string;
                    icon: string;
                  }[];
                }) => {
                  return (
                    <div
                      key={dayData.day}
                      className={`relative pl-20 transition-all duration-500 ${
                        activeDay >= dayData.day
                          ? "opacity-100 transform translate-x-0"
                          : "opacity-50 transform translate-x-4"
                      }`}
                    >
                      <div
                        className={`absolute left-6 w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                          activeDay >= dayData.day
                            ? "bg-purple-500 border-purple-400 shadow-lg shadow-purple-500/50"
                            : "bg-gray-700 border-gray-600"
                        }`}
                      />

                      <div
                        className={`bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border transition-all duration-300 ${
                          activeDay === dayData.day
                            ? "border-purple-500/40 shadow-lg shadow-purple-500/10"
                            : "border-gray-700/50"
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-purple-400 font-bold text-lg">
                                Day {dayData.day}
                              </span>
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-300">
                                {dayData.date}
                              </span>
                            </div>
                            <h3 className="text-2xl font-bold text-white">
                              {dayData.title}
                            </h3>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {dayData.activities.map(
                            (
                              activity: {
                                time: string;
                                activity: string;
                                icon: string;
                              },
                              activityIndex: number,
                            ) => {
                              let Icon = Gamepad2;
                              if (activity.icon.startsWith("cat:")) {
                                Icon = iconForCategory(activity.icon.slice(4));
                              } else if (activity.icon === "MapPin") {
                                Icon = MapPin;
                              } else {
                                Icon = Gamepad2;
                              }
                              return (
                                <div
                                  key={activityIndex}
                                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors"
                                >
                                  <div className="flex-shrink-0 w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                    <Icon className="w-4 h-4 text-purple-400" />
                                  </div>
                                  <div>
                                    <div className="text-purple-300 text-sm font-medium">
                                      {activity.time}
                                    </div>
                                    <div className="text-gray-200 text-sm">
                                      {activity.activity}
                                    </div>
                                  </div>
                                </div>
                              );
                            },
                          )}
                        </div>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </div>

          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 backdrop-blur-sm">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-sm">{t("notice")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
