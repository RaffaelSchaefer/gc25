"use client";

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ExternalLink,
  Joystick,
  Utensils,
  PartyPopper,
  Plane,
  Trophy,
} from "lucide-react";
import { EventCategory } from "@prisma/client";
import { AvatarStack } from "@/components/ui/kibo-ui/avatar-stack/AvatarStack";

export type EventCardEvent = {
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
  startsInMs?: number;
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

interface EventCardProps {
  event: EventCardEvent;
}

const categoryTokens = {
  MEETUP: {
    bg: "bg-indigo-500/10 dark:bg-indigo-400/10",
    text: "text-indigo-600 dark:text-indigo-300",
    ring: "ring-indigo-500/30 dark:ring-indigo-400/30",
    gradFrom: "from-indigo-100 dark:from-indigo-900/40",
    gradTo: "to-indigo-500/0 dark:to-indigo-950/0",
    chipBg: "bg-indigo-500/10 dark:bg-indigo-400/10",
    linkText: "text-indigo-600 dark:text-indigo-300",
    linkHover: "hover:text-indigo-700 dark:hover:text-indigo-200",
  },
  EXPO: {
    bg: "bg-violet-500/10 dark:bg-violet-400/10",
    text: "text-violet-600 dark:text-violet-300",
    ring: "ring-violet-500/30 dark:ring-violet-400/30",
    gradFrom: "from-violet-100 dark:from-violet-900/40",
    gradTo: "to-violet-500/0 dark:to-violet-950/0",
    chipBg: "bg-violet-500/10 dark:bg-violet-400/10",
    linkText: "text-violet-600 dark:text-violet-300",
    linkHover: "hover:text-violet-700 dark:hover:text-violet-200",
  },
  FOOD: {
    bg: "bg-amber-500/10 dark:bg-amber-400/10",
    text: "text-amber-700 dark:text-amber-300",
    ring: "ring-amber-500/30 dark:ring-amber-400/30",
    gradFrom: "from-amber-100 dark:from-amber-900/30",
    gradTo: "to-amber-500/0 dark:to-amber-950/0",
    chipBg: "bg-amber-500/10 dark:bg-amber-400/10",
    linkText: "text-amber-700 dark:text-amber-300",
    linkHover: "hover:text-amber-800 dark:hover:text-amber-200",
  },
  PARTY: {
    bg: "bg-pink-500/10 dark:bg-pink-400/10",
    text: "text-pink-600 dark:text-pink-300",
    ring: "ring-pink-500/30 dark:ring-pink-400/30",
    gradFrom: "from-pink-100 dark:from-pink-900/40",
    gradTo: "to-pink-500/0 dark:to-pink-950/0",
    chipBg: "bg-pink-500/10 dark:bg-pink-400/10",
    linkText: "text-pink-600 dark:text-pink-300",
    linkHover: "hover:text-pink-700 dark:hover:text-pink-200",
  },
  TRAVEL: {
    bg: "bg-emerald-500/10 dark:bg-emerald-400/10",
    text: "text-emerald-600 dark:text-emerald-300",
    ring: "ring-emerald-500/30 dark:ring-emerald-400/30",
    gradFrom: "from-emerald-100 dark:from-emerald-900/40",
    gradTo: "to-emerald-500/0 dark:to-emerald-950/0",
    chipBg: "bg-emerald-500/10 dark:bg-emerald-400/10",
    linkText: "text-emerald-600 dark:text-emerald-300",
    linkHover: "hover:text-emerald-700 dark:hover:text-emerald-200",
  },
  TOURNAMENT: {
    bg: "bg-rose-500/10 dark:bg-rose-400/10",
    text: "text-rose-600 dark:text-rose-300",
    ring: "ring-rose-500/30 dark:ring-rose-400/30",
    gradFrom: "from-rose-100 dark:from-rose-900/40",
    gradTo: "to-rose-500/0 dark:to-rose-950/0",
    chipBg: "bg-rose-500/10 dark:bg-rose-400/10",
    linkText: "text-rose-600 dark:text-rose-300",
    linkHover: "hover:text-rose-700 dark:hover:text-rose-200",
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

const formatEventTime = (iso?: string) => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d);
  } catch {
    return "";
  }
};

export function EventCard({ event }: EventCardProps) {
  const tone = categoryTokens[event.category] ?? categoryTokens.MEETUP;
  const BgIcon = categoryIcons[event.category] ?? Users;
  const CategoryIcon = categoryIcons[event.category] ?? Users;

  return (
    <div className="break-inside-avoid mb-6">
      <Card
        className={`group relative transition-all duration-200 border-0 ring-1 ${tone.ring} overflow-hidden shadow-[0_1px_0_rgba(255,255,255,0.05)] dark:shadow-[0_1px_0_rgba(0,0,0,0.4)] hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30 backdrop-blur-lg bg-gradient-to-br ${tone.gradFrom} via-background/60 ${tone.gradTo} pt-0`}
      >
        <CardHeader className="relative p-4 sm:p-5 border-b border-border/50">
          <div className="flex items-start justify-between">
            <h3
              className={`font-bold text-lg sm:text-xl transition-colors line-clamp-2 drop-shadow-[0_1px_0_rgba(255,255,255,0.25)] dark:drop-shadow-none ${tone.text}`}
            >
              {event.title}
            </h3>
            <Badge
              variant="outline"
              className={`h-6 px-2 text-[11px] ${tone.text} border-border/50 backdrop-blur-[2px] bg-background/40 hover:bg-background/60 inline-flex items-center gap-1`}
            >
              <CategoryIcon className={`w-3.5 h-3.5 ${tone.text}`} />
              <span>{event.category.toLowerCase()}</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="space-y-2.5 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className={`w-4 h-4 ${tone.text}`} />
              <span className="font-medium">
                {formatEventTime(event.startDate)}
              </span>
            </div>

            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className={`w-4 h-4 ${tone.text}`} />
                <span className="truncate">{event.location}</span>
              </div>
            )}

            {event.attendees > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <Users className={`w-4 h-4 ${tone.text}`} />
                <AvatarStack
                  avatars={
                    event.participants && event.participants.length > 0
                      ? event.participants.map((u) => ({
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
                          { length: Math.min(event.attendees, 5) },
                          (_, i) => ({
                            id: `attendee-${i}`,
                            name: `Attendee ${i + 1}`,
                            fallback: `A${i + 1}`,
                          }),
                        )
                  }
                  size="sm"
                />
              </div>
            )}
          </div>

          {(event.description || event.url) && (
            <>
              <Separator className="my-4" />
              {event.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 group-hover:line-clamp-none transition-all">
                  {event.description}
                </p>
              )}
              {event.url && (
                <div className="mt-2">
                  <a
                    href={event.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-sm break-all inline-flex items-center gap-1 underline-offset-4 hover:underline ${tone.linkText} ${tone.linkHover}`}
                  >
                    <ExternalLink className={`w-4 h-4 ${tone.text}`} />
                    {event.url}
                  </a>
                </div>
              )}
            </>
          )}

          {event.createdBy && (
            <div className="flex items-center gap-2 mt-3">
              <Avatar className="w-5 h-5">
                <AvatarImage src={event.createdBy.image || ""} />
                <AvatarFallback className="text-xs">
                  {event.createdBy.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">
                Created by {event.createdBy.name}
              </span>
            </div>
          )}
        </CardContent>
        <BgIcon
          aria-hidden
          className={`pointer-events-none absolute -right-6 -bottom-6 w-56 h-56 sm:w-64 sm:h-64 rotate-12 opacity-10 blur-xs ${tone.text}`}
        />
      </Card>
    </div>
  );
}
