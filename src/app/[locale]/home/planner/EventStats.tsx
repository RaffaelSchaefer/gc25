"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, Calendar, TrendingUp, Star, MapPin, Clock } from "lucide-react";
import { EventCategory } from "@prisma/client";

type TimelinedEvent = {
  id: string;
  title: string;
  time: string;
  dateISO: string;
  location?: string | null;
  description?: string | null;
  attendees: number;
  userJoined: boolean;
  startDate: string;
  endDate: string;
  createdById: string;
  category: EventCategory;
};

type DayBucket = {
  dateISO: string;
  dayLabel: string;
  events: TimelinedEvent[];
  isAuthenticated?: boolean;
};

interface EventStatsProps {
  events: DayBucket[];
}

const categoryTokens = {
  MEETUP: {
    bg: "bg-indigo-500/10",
    text: "text-indigo-600",
    ring: "ring-indigo-500/30",
  },
  EXPO: {
    bg: "bg-violet-500/10",
    text: "text-violet-600",
    ring: "ring-violet-500/30",
  },
  FOOD: {
    bg: "bg-amber-500/10",
    text: "text-amber-700",
    ring: "ring-amber-500/30",
  },
  PARTY: {
    bg: "bg-pink-500/10",
    text: "text-pink-600",
    ring: "ring-pink-500/30",
  },
  TRAVEL: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600",
    ring: "ring-emerald-500/30",
  },
  TOURNAMENT: {
    bg: "bg-rose-500/10",
    text: "text-rose-600",
    ring: "ring-rose-500/30",
  },
} as const;

export function EventStats({ events }: EventStatsProps) {
  const t = useTranslations("planner");

  const memo = useMemo(() => {
    const allEvents = events.flatMap((d) => d.events);
    const totalEvents = allEvents.length;
    const totalAttendees = allEvents.reduce((sum, e) => sum + e.attendees, 0);
    const totalDays = events.length;

    const categoryStats = Object.values(EventCategory)
      .map((category) => {
        const categoryEvents = allEvents.filter((e) => e.category === category);
        const categoryAttendees = categoryEvents.reduce(
          (sum, e) => sum + e.attendees,
          0,
        );
        return {
          category,
          count: categoryEvents.length,
          attendees: categoryAttendees,
          percentage:
            totalEvents > 0 ? (categoryEvents.length / totalEvents) * 100 : 0,
        };
      })
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count);

    const popularEvents = [...allEvents]
      .sort((a, b) => b.attendees - a.attendees)
      .slice(0, 5);

    const timeSlots = {
      morning: allEvents.filter((e) => parseInt(e.time.split(":")[0]) < 12)
        .length,
      afternoon: allEvents.filter((e) => {
        const hour = parseInt(e.time.split(":")[0]);
        return hour >= 12 && hour < 17;
      }).length,
      evening: allEvents.filter((e) => parseInt(e.time.split(":")[0]) >= 17)
        .length,
    };
    const maxTimeSlot = Math.max(
      timeSlots.morning,
      timeSlots.afternoon,
      timeSlots.evening,
    );

    return {
      allEvents,
      totalEvents,
      totalAttendees,
      totalDays,
      categoryStats,
      popularEvents,
      timeSlots,
      maxTimeSlot,
    };
  }, [events]);

  const {
    totalEvents,
    totalAttendees,
    totalDays,
    categoryStats,
    popularEvents,
    timeSlots,
    maxTimeSlot,
  } = memo;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        role="region"
        aria-label={t("stats.overview")}
      >
        {/* Total Events */}
        <Card className="relative overflow-hidden shadow-sm border-0 ring-1 ring-indigo-500/30 bg-gradient-to-br from-indigo-500/15 via-indigo-500/0 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
              {t("stats.totalEvents")}
            </CardTitle>
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/15 ring-1 ring-indigo-500/30 text-indigo-700 dark:text-indigo-300">
              <Calendar className="h-3.5 w-3.5" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="mt-1 text-4xl md:text-6xl font-extrabold tracking-tight text-indigo-700 dark:text-indigo-300">
              {totalEvents}
            </div>
            <p className="text-xs text-indigo-800/70 dark:text-indigo-200/70">
              {t("stats.acrossDays", { count: totalDays })}
            </p>
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-indigo-500/20 blur-3xl"
            />
          </CardContent>
        </Card>

        {/* Total Attendees */}
        <Card className="relative overflow-hidden shadow-sm border-0 ring-1 ring-emerald-500/30 bg-gradient-to-br from-emerald-500/15 via-emerald-500/0 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              {t("stats.totalAttendees")}
            </CardTitle>
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30 text-emerald-700 dark:text-emerald-300">
              <Users className="h-3.5 w-3.5" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="mt-1 text-4xl md:text-6xl font-extrabold tracking-tight text-emerald-700 dark:text-emerald-300">
              {totalAttendees}
            </div>
            <p className="text-xs text-emerald-800/70 dark:text-emerald-200/70">
              {t("stats.avgPerEvent", {
                value:
                  totalEvents > 0
                    ? Math.round(totalAttendees / totalEvents)
                    : 0,
              })}
            </p>
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-emerald-500/20 blur-3xl"
            />
          </CardContent>
        </Card>

        {/* Categories */}
        <Card className="relative overflow-hidden shadow-sm border-0 ring-1 ring-orange-500/30 bg-gradient-to-br from-orange-500/15 via-orange-500/0 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
              {t("stats.categories")}
            </CardTitle>
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-500/15 ring-1 ring-orange-500/30 text-orange-700 dark:text-orange-300">
              <TrendingUp className="h-3.5 w-3.5" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="mt-1 text-4xl md:text-6xl font-extrabold tracking-tight text-orange-700 dark:text-orange-300">
              {categoryStats.length}
            </div>
            <p className="text-xs text-orange-800/70 dark:text-orange-200/70">
              {t("stats.differentTypes", { count: categoryStats.length })}
            </p>
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-orange-500/20 blur-3xl"
            />
          </CardContent>
        </Card>

        {/* Popular Events */}
        <Card className="relative overflow-hidden shadow-sm border-0 ring-1 ring-violet-500/30 bg-gradient-to-br from-violet-500/15 via-violet-500/0 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-violet-700 dark:text-violet-300">
              {t("stats.popularEvents")}
            </CardTitle>
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-violet-500/15 ring-1 ring-violet-500/30 text-violet-700 dark:text-violet-300">
              <Star className="h-3.5 w-3.5" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="mt-1 text-4xl md:text-6xl font-extrabold tracking-tight text-violet-700 dark:text-violet-300">
              {memo.allEvents.filter((e) => e.attendees > 20).length}
            </div>
            <p className="text-xs text-violet-800/70 dark:text-violet-200/70">
              20+ {t("stats.attendees")}
            </p>
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-violet-500/20 blur-3xl"
            />
          </CardContent>
        </Card>
      </div>

      <div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        role="region"
        aria-label={t("stats.details")}
      >
        {/* Category Breakdown */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {t("stats.eventCategories")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryStats.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                {t("stats.noData")}
              </div>
            ) : (
              <div className="space-y-4">
                {categoryStats.map((stat) => {
                  const tone = (
                    categoryTokens as Record<
                      string,
                      { bg: string; text: string; ring?: string }
                    >
                  )[stat.category] || {
                    bg: "bg-muted",
                    text: "text-foreground/80",
                    ring: "ring-muted",
                  };
                  return (
                    <div key={stat.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${tone.text}`}>
                            {t(`categories.${stat.category.toLowerCase()}`)}
                          </span>
                          <Badge
                            variant="outline"
                            className={`${tone.bg} ring-1 ${tone.ring}`}
                          >
                            {stat.count}
                          </Badge>
                        </div>
                        <span
                          className="text-sm text-muted-foreground"
                          aria-label={t("stats.percentageLabel", {
                            value: stat.percentage.toFixed(1),
                          })}
                        >
                          {stat.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={stat.percentage} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {t("stats.totalAttendeesLabel", {
                            count: stat.attendees,
                          })}
                        </span>
                        <span>
                          {t("stats.avgPerEventShort", {
                            value:
                              stat.count > 0
                                ? Math.round(stat.attendees / stat.count)
                                : 0,
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Time Distribution */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {t("stats.timeDistribution")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {t("stats.morning")}
                  </span>
                  <Badge variant="outline">{timeSlots.morning}</Badge>
                </div>
                <Progress
                  value={
                    maxTimeSlot > 0
                      ? (timeSlots.morning / maxTimeSlot) * 100
                      : 0
                  }
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {t("stats.afternoon")}
                  </span>
                  <Badge variant="outline">{timeSlots.afternoon}</Badge>
                </div>
                <Progress
                  value={
                    maxTimeSlot > 0
                      ? (timeSlots.afternoon / maxTimeSlot) * 100
                      : 0
                  }
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {t("stats.evening")}
                  </span>
                  <Badge variant="outline">{timeSlots.evening}</Badge>
                </div>
                <Progress
                  value={
                    maxTimeSlot > 0
                      ? (timeSlots.evening / maxTimeSlot) * 100
                      : 0
                  }
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Popular Events */}
      {popularEvents.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              {t("stats.mostPopularEvents")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {popularEvents.map((event, index) => {
                const tone = (
                  categoryTokens as Record<string, { bg: string; text: string }>
                )[event.category] || {
                  bg: "bg-muted",
                  text: "text-foreground",
                };
                return (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                        <span className="text-sm font-bold text-primary">
                          #{index + 1}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate max-w-[48ch]">
                            {event.title}
                          </span>
                          <Badge
                            variant="outline"
                            className={`${tone.bg} ${tone.text}`}
                          >
                            {t(`categories.${event.category.toLowerCase()}`)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {event.time}
                          {event.location && (
                            <>
                              <MapPin className="w-3 h-3" />
                              {event.location}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span
                        className="font-semibold"
                        aria-label={t("stats.attendeeCount", {
                          count: event.attendees,
                        })}
                      >
                        {event.attendees}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
