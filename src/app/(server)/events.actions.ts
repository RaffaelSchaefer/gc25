"use server";

import { prisma } from "@/lib/prisma";
import { EventStatus, EventCategory } from "@prisma/client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Shared types for timelines
export type TimelinedEvent = {
  id: string;
  title: string;
  time: string; // HH:mm (local time as per server locale)
  dateISO: string; // yyyy-MM-dd (UTC date slice of startDate)
  location?: string | null;
  url?: string | null;
  description?: string | null;
  attendees: number;
  userJoined: boolean;
  startDate: string; // ISO
  endDate: string; // ISO
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

export type DayBucket = {
  dateISO: string;
  dayLabel: string; // localized-ish server label
  events: TimelinedEvent[];
  // Whether there is an authenticated user on this request
  isAuthenticated?: boolean;
};

function formatDayLabel(d: Date) {
  try {
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    // Fallback
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${mm}/${dd}`;
  }
}

function toHHmmLocal(d: Date) {
  try {
    return d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    // Fallback to UTC slice
    return d.toISOString().slice(11, 16);
  }
}

export async function getSessionUserId(): Promise<string | null> {
  // Read headers (including cookies) from the current request context and pass them to better-auth
  const hdrs = await headers();
  const session = await auth.api.getSession({ headers: hdrs });
  const userId = session?.user?.id ?? null;
  return userId;
}

/**
 * List published events, grouped by day, enriched with attendee counts and userJoined.
 * Also annotates each bucket with an isAuthenticated flag.
 */
export async function listPublishedEvents(): Promise<DayBucket[]> {
  const userId = await getSessionUserId();
  const isAuthenticated = Boolean(userId);

  const events = await prisma.event.findMany({
    where: {
      status: EventStatus.PUBLISHED,
      ...(isAuthenticated ? {} : { isPublic: true }),
    },
    orderBy: [{ startDate: "asc" }],
    select: {
      id: true,
      name: true,
      description: true,
      startDate: true,
      endDate: true,
      location: true,
      url: true,
      isPublic: true,
      createdById: true,
      createdBy: {
        select: {
          name: true,
          image: true,
        },
      },
      category: true,
      participants: {
        select: {
          userId: true,
          user: {
            select: { id: true, name: true, image: true },
          },
        },
      },
    },
  });

  const byDay = new Map<string, DayBucket>();

  for (const e of events) {
    const start = new Date(e.startDate);
    const dateISO = start.toISOString().slice(0, 10);
    const time = toHHmmLocal(start);

    if (!byDay.has(dateISO)) {
      byDay.set(dateISO, {
        dateISO,
        dayLabel: formatDayLabel(start),
        events: [],
        isAuthenticated,
      });
    }

    const attendees = e.participants.length;
    const userJoined = userId
      ? e.participants.some((p) => p.userId === userId)
      : false;

    byDay.get(dateISO)!.events.push({
      id: e.id,
      title: e.name,
      time,
      dateISO,
      location: e.location,
      url: e.url,
      description: e.description,
      attendees,
      userJoined,
      startDate: e.startDate.toISOString(),
      endDate: e.endDate.toISOString(),
      createdById: e.createdById,
      createdBy: {
        name: e.createdBy.name,
        image: e.createdBy.image,
      },
      category: e.category,
      isPublic: e.isPublic,
      participants: e.participants
        .map((p) => p.user)
        .filter((u): u is { id: string; name: string; image: string | null } =>
          Boolean(u),
        ),
    });
  }

  const buckets = Array.from(byDay.values()).sort((a, b) =>
    a.dateISO.localeCompare(b.dateISO),
  );
  for (const b of buckets) {
    b.events.sort((a, c) => a.time.localeCompare(c.time));
  }
  return buckets;
}

/**
 * Create a new event. Requires authentication.
 * Note: Authorization can be extended (e.g., roles).
 */
export async function createEvent(input: {
  name: string;
  description?: string;
  startDate: string; // ISO
  endDate: string; // ISO
  location?: string;
  url?: string;
  isPublic?: boolean;
  isFixed?: boolean;
  status?: EventStatus;
  category?: EventCategory;
}) {
  const userId = await getSessionUserId();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const start = new Date(input.startDate);
  const end = new Date(input.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Invalid dates");
  }

  const ev = await prisma.event.create({
    data: {
      name: input.name,
      description: input.description ?? "",
      startDate: start,
      endDate: end,
      location: input.location,
      url: input.url,
      isPublic: input.isPublic ?? false,
      isFixed: input.isFixed ?? false,
      status: input.status ?? EventStatus.PUBLISHED,
      category: input.category ?? EventCategory.MEETUP,
      createdById: userId,
    },
    select: {
      id: true,
      name: true,
      description: true,
      startDate: true,
      endDate: true,
      location: true,
      url: true,
      createdById: true,
      category: true,
    },
  });

  await broadcast({
    type: "event_created",
    event: {
      id: ev.id,
      title: ev.name,
      description: ev.description,
      location: ev.location,
      url: ev.url ?? undefined,
      startDate: ev.startDate.toISOString(),
      endDate: ev.endDate.toISOString(),
      createdById: ev.createdById,
      category: ev.category,
    },
  });

  return ev;
}

/**
 * Update an event. Only the creator can update.
 */
export async function updateEvent(
  id: string,
  patch: Partial<{
    name: string;
    description: string;
    startDate: string; // ISO
    endDate: string; // ISO
    location: string;
    url: string;
    status: EventStatus;
    isPublic: boolean;
    isFixed: boolean;
    category: EventCategory;
  }>,
) {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("Unauthorized");

  const existing = await prisma.event.findUnique({
    where: { id },
    select: { createdById: true },
  });
  if (!existing) throw new Error("Not found");
  if (existing.createdById !== userId) throw new Error("Forbidden");

  const data: Record<string, unknown> = {};
  if (patch.name !== undefined) data.name = patch.name;
  if (patch.description !== undefined) data.description = patch.description;
  if (patch.location !== undefined) data.location = patch.location;
  if (patch.url !== undefined) data.url = patch.url;
  if (patch.status !== undefined) data.status = patch.status;
  if (patch.isPublic !== undefined) data.isPublic = patch.isPublic;
  if (patch.isFixed !== undefined) data.isFixed = patch.isFixed;
  if (patch.category !== undefined) data.category = patch.category;
  if (patch.startDate !== undefined) {
    const d = new Date(patch.startDate);
    if (Number.isNaN(d.getTime())) throw new Error("Invalid startDate");
    data.startDate = d;
  }
  if (patch.endDate !== undefined) {
    const d = new Date(patch.endDate);
    if (Number.isNaN(d.getTime())) throw new Error("Invalid endDate");
    data.endDate = d;
  }

  const ev = await prisma.event.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      description: true,
      startDate: true,
      endDate: true,
      location: true,
      url: true,
      createdById: true,
      category: true,
    },
  });

  await broadcast({
    type: "event_updated",
    event: {
      id: ev.id,
      title: ev.name,
      description: ev.description,
      location: ev.location,
      url: ev.url ?? undefined,
      startDate: ev.startDate.toISOString(),
      endDate: ev.endDate.toISOString(),
      createdById: ev.createdById,
      category: ev.category,
    },
  });

  return ev;
}

/**
 * Delete an event. Only the creator can delete.
 */
export async function deleteEvent(id: string) {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("Unauthorized");

  const existing = await prisma.event.findUnique({
    where: { id },
    select: { createdById: true },
  });
  if (!existing) throw new Error("Not found");
  if (existing.createdById !== userId) throw new Error("Forbidden");

  await prisma.event.delete({ where: { id } });

  await broadcast({
    type: "event_deleted",
    id,
  });

  return { ok: true };
}

/**
 * Join an event (create participation). Requires authentication.
 */
export async function joinEvent(eventId: string) {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("Unauthorized");

  // Upsert-like behavior: ignore if already joined
  try {
    await prisma.eventParticipant.create({
      data: { userId, eventId },
    });
  } catch {
    // unique(userId,eventId) may throw if already exists; ignore
  }

  const attendees = await prisma.eventParticipant.count({
    where: { eventId },
  });

  await broadcast({
    type: "participant_changed",
    eventId,
    attendees,
  });

  return { ok: true, attendees };
}

/**
 * Cancel participation in an event. Requires authentication.
 */
export async function cancelJoin(eventId: string) {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("Unauthorized");

  await prisma.eventParticipant.deleteMany({
    where: { userId, eventId },
  });

  const attendees = await prisma.eventParticipant.count({
    where: { eventId },
  });

  await broadcast({
    type: "participant_changed",
    eventId,
    attendees,
  });

  return { ok: true, attendees };
}

/**
 * Simple in-memory pub/sub broadcasting for WS consumers.
 * A dedicated WS route will register sockets in this set.
 */
export type BroadcastMessage =
  | {
      type: "event_created" | "event_updated";
      event: {
        id: string;
        title: string;
        description?: string | null;
        location?: string | null;
        url?: string | null;
        startDate: string;
        endDate: string;
        createdById: string;
        category: EventCategory;
      };
    }
  | { type: "event_deleted"; id: string }
  | { type: "participant_changed"; eventId: string; attendees: number }
  | {
      type: "comment_created" | "comment_updated" | "comment_deleted";
      eventId: string;
      comment?: {
        id: string;
        content: string;
        createdAt: string;
        createdById: string;
        createdBy?: { id: string; name: string; image: string | null };
      };
      commentId?: string;
    };

type WSClient = {
  send: (data: string) => void;
  readyState?: number;
};

const subscribers = new Set<WSClient>();

// Not a server action: keep it internal and non-exported to avoid server action constraints.
function registerWsSubscriber(client: WSClient) {
  subscribers.add(client);
  return () => subscribers.delete(client);
}

async function broadcast(msg: BroadcastMessage) {
  const payload = JSON.stringify(msg);
  for (const ws of subscribers) {
    try {
      ws.send(payload);
    } catch {
      // Remove dead clients defensively
      subscribers.delete(ws);
    }
  }

  // Mirror to Socket.IO if available
  try {
    const { emitToClients } = await import("@/lib/io");
    // Das Socket.IO-Protokoll sendet rohe Objekte, nicht Strings
    const objectPayload = typeof msg === "string" ? JSON.parse(msg) : msg;
    emitToClients("events:update", objectPayload);
  } catch {
    // ignore if socket.io not initialized
  }
}

export { registerWsSubscriber as registerSubscriber };

// =========================
// Comments (CRUD)
// =========================

export type EventComment = {
  id: string;
  content: string;
  createdAt: string;
  createdById: string;
  createdBy?: { id: string; name: string; image: string | null };
};

/** List comments for an event (newest first). Public. */
export async function listComments(eventId: string): Promise<EventComment[]> {
  const comments = await prisma.comment.findMany({
    where: { eventId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      content: true,
      createdAt: true,
      createdById: true,
      createdBy: { select: { id: true, name: true, image: true } },
    },
  });
  return comments.map((c) => ({
    id: c.id,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    createdById: c.createdById,
    createdBy: c.createdBy ?? undefined,
  }));
}

/** Create a comment on an event. Requires authentication. */
export async function addComment(
  eventId: string,
  content: string,
): Promise<EventComment> {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("Unauthorized");
  const trimmed = (content ?? "").trim();
  if (!trimmed) throw new Error("Content required");

  const created = await prisma.comment.create({
    data: { eventId, content: trimmed, createdById: userId },
    select: {
      id: true,
      content: true,
      createdAt: true,
      createdById: true,
      createdBy: { select: { id: true, name: true, image: true } },
    },
  });

  const result: EventComment = {
    id: created.id,
    content: created.content,
    createdAt: created.createdAt.toISOString(),
    createdById: created.createdById,
    createdBy: created.createdBy ?? undefined,
  };

  await broadcast({
    type: "comment_created",
    eventId,
    comment: result,
  });

  return result;
}

/** Update a comment's content. Only the author can edit. */
export async function updateComment(
  commentId: string,
  content: string,
): Promise<EventComment> {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("Unauthorized");
  const trimmed = (content ?? "").trim();
  if (!trimmed) throw new Error("Content required");

  const existing = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { createdById: true, eventId: true },
  });
  if (!existing) throw new Error("Not found");
  if (existing.createdById !== userId) throw new Error("Forbidden");

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: { content: trimmed },
    select: {
      id: true,
      content: true,
      createdAt: true,
      createdById: true,
      createdBy: { select: { id: true, name: true, image: true } },
    },
  });

  const result: EventComment = {
    id: updated.id,
    content: updated.content,
    createdAt: updated.createdAt.toISOString(),
    createdById: updated.createdById,
    createdBy: updated.createdBy ?? undefined,
  };

  await broadcast({
    type: "comment_updated",
    eventId: existing.eventId,
    comment: result,
  });

  return result;
}

/** Delete a comment. Only the author can delete. */
export async function deleteCommentById(
  commentId: string,
): Promise<{ ok: true }> {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("Unauthorized");

  const existing = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { createdById: true, eventId: true },
  });
  if (!existing) throw new Error("Not found");
  if (existing.createdById !== userId) throw new Error("Forbidden");

  await prisma.comment.delete({ where: { id: commentId } });

  await broadcast({
    type: "comment_deleted",
    eventId: existing.eventId,
    commentId,
  });

  return { ok: true };
}
