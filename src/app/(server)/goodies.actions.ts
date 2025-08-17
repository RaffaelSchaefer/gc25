"use server";
// Opt-in/Opt-out für Goodie-Reminder
export async function toggleGoodieNotifier(goodieId: string, enabled: boolean) {
  const userId = await getUserId();
  if (!userId) throw new Error("Unauthorized");
  if (enabled) {
    // Upsert: Reminder aktivieren
    await prisma.goodieNotifier.upsert({
      where: { userId_goodieId: { userId, goodieId } },
      update: { reminderEnabled: true },
      create: { userId, goodieId, reminderEnabled: true },
    });
  } else {
    // Reminder deaktivieren (entweder löschen oder Flag setzen)
    await prisma.goodieNotifier.updateMany({
      where: { userId, goodieId },
      data: { reminderEnabled: false },
    });
  }
  // Optional: Broadcast für UI-Update
  await broadcast({ type: "goodie_notifier_changed", goodieId });
  return { ok: true };
}
/* eslint-disable @typescript-eslint/no-explicit-any */

import { prisma } from "@/lib/prisma";
import { broadcast } from "./events.actions";
// Import Prisma enums after generation; fallback to manual type until generated
type GoodieType = "GIFT" | "FOOD" | "DRINK";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export type GoodieDto = {
  id: string;
  name: string;
  location: string;
  instructions: string;
  date?: string | null;
  registrationUrl?: string | null;
  type: GoodieType;
  createdById: string;
  createdBy?: { id: string; name: string; image?: string | null } | null;
  createdAt: string;
  updatedAt: string;
  totalScore: number; // sum of votes
  userVote: number; // -1/0/1
  collected: boolean;
  reminderEnabled: boolean;
};

async function getUserId() {
  const hdrs = await headers();
  const session = await auth.api.getSession({ headers: hdrs });
  return session?.user?.id ?? null;
}

// Sorting heuristic weights
const PERSONAL_WEIGHT = 3;
const TOTAL_WEIGHT = 1;
const TIME_DECAY_HOURS = 8; // after this many hours relevance halves

function computeRelevance(g: GoodieDto): number {
  const now = Date.now();
  const dateRef = g.date
    ? new Date(g.date).getTime()
    : new Date(g.createdAt).getTime();
  const hoursDiff = (dateRef - now) / 36e5; // future positive, past negative
  // Basic time score: slightly favor upcoming within 24h, penalize far past
  const timeScore = Math.exp(-Math.abs(hoursDiff) / TIME_DECAY_HOURS);
  return g.userVote * PERSONAL_WEIGHT + g.totalScore * TOTAL_WEIGHT + timeScore;
}

export async function listGoodies(): Promise<GoodieDto[]> {
  const userId = await getUserId();
  const goodies = await (prisma as any).goodie.findMany({
    include: {
      votes: userId ? { where: { userId } } : false,
      _count: { select: { votes: true, collections: true } },
      collections: userId ? { where: { userId } } : false,
      createdBy: { select: { id: true, name: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Need totalScore more precisely, aggregate sum of values
  const voteSums = await (prisma as any).goodieVote.groupBy({
    by: ["goodieId"],
    _sum: { value: true },
    where: { goodieId: { in: (goodies as any[]).map((g: any) => g.id) } },
  });
  const voteMap = new Map<string, number>(
    (voteSums as any[]).map((v: any) => [v.goodieId, v._sum.value || 0]),
  );

  const mapped: GoodieDto[] = (goodies as any[]).map((g: any) => ({
    id: g.id,
    name: g.name,
    location: g.location,
    instructions: g.instructions,
    date: g.date?.toISOString() ?? null,
    registrationUrl: g.registrationUrl,
    type: g.type,
    createdById: g.createdById,
    createdBy: g.createdBy
      ? { id: g.createdBy.id, name: g.createdBy.name, image: g.createdBy.image }
      : null,
    createdAt: g.createdAt.toISOString(),
    updatedAt: g.updatedAt.toISOString(),
    totalScore: voteMap.get(g.id) ?? 0,
    userVote: g.votes && g.votes.length > 0 ? g.votes[0].value : 0,
    collected: !!(g.collections && g.collections.length > 0),
    reminderEnabled: g.reminderEnabled,
  }));

  // apply sorting heuristic
  const withRelevance = mapped.map((m) => ({
    data: m,
    relevance: computeRelevance(m),
  }));
  withRelevance.sort((a, b) => b.relevance - a.relevance);
  return withRelevance.map((w) => w.data);
}

export async function getGoodieById(id: string): Promise<GoodieDto | null> {
  const userId = await getUserId();
  const goodie = await (prisma as any).goodie.findUnique({
    where: { id },
    include: {
      votes: userId ? { where: { userId } } : false,
      _count: { select: { votes: true, collections: true } },
      collections: userId ? { where: { userId } } : false,
      createdBy: { select: { id: true, name: true, image: true } },
    },
  });

  if (!goodie) return null;

  const voteSums = await (prisma as any).goodieVote.groupBy({
    by: ["goodieId"],
    _sum: { value: true },
    where: { goodieId: id },
  });
  const totalScore = voteSums[0]?._sum.value || 0;

  return {
    id: goodie.id,
    name: goodie.name,
    location: goodie.location,
    instructions: goodie.instructions,
    date: goodie.date?.toISOString() ?? null,
    registrationUrl: goodie.registrationUrl,
    type: goodie.type,
    createdById: goodie.createdById,
    createdBy: goodie.createdBy
      ? {
          id: goodie.createdBy.id,
          name: goodie.createdBy.name,
          image: goodie.createdBy.image,
        }
      : null,
    createdAt: goodie.createdAt.toISOString(),
    updatedAt: goodie.updatedAt.toISOString(),
    totalScore,
    userVote:
      goodie.votes && goodie.votes.length > 0 ? goodie.votes[0].value : 0,
    collected: !!(goodie.collections && goodie.collections.length > 0),
    reminderEnabled: goodie.reminderEnabled,
  };
}

export async function createGoodie(input: {
  name: string;
  location: string;
  instructions: string;
  type: GoodieType;
  date?: string | null;
  registrationUrl?: string | null;
  image?: ArrayBuffer | Uint8Array | null;
}) {
  const userId = await getUserId();
  if (!userId) throw new Error("Unauthorized");

  const imageBytes = input.image
    ? Buffer.from(input.image as ArrayBuffer)
    : undefined;
  const date = input.date ? new Date(input.date) : undefined;

  const created = await (prisma as any).goodie.create({
    data: {
      name: input.name,
      location: input.location,
      instructions: input.instructions,
      type: input.type,
      date,
      registrationUrl: input.registrationUrl ?? undefined,
      imageBytes,
      createdById: userId,
    },
    select: {
      id: true,
      name: true,
      location: true,
      instructions: true,
      type: true,
      date: true,
      registrationUrl: true,
      createdAt: true,
      reminderEnabled: true,
      createdBy: { select: { id: true, name: true, image: true } },
    },
  });
  await broadcast({
    type: "goodie_created",
    goodie: {
      id: created.id,
      name: created.name,
      location: created.location,
      instructions: created.instructions,
      type: created.type,
      date: created.date ? created.date.toISOString() : null,
      registrationUrl: created.registrationUrl ?? null,
      totalScore: 0,
      createdAt: created.createdAt.toISOString(),
      createdBy: created.createdBy
        ? {
            id: created.createdBy.id,
            name: created.createdBy.name,
            image: created.createdBy.image,
          }
        : null,
    },
  });
  return created;
}

export async function voteGoodie(goodieId: string, value: -1 | 1) {
  const userId = await getUserId();
  if (!userId) throw new Error("Unauthorized");
  if (![1, -1].includes(value)) throw new Error("Invalid vote value");

  // Upsert behavior
  await (prisma as any).goodieVote.upsert({
    where: { userId_goodieId: { userId, goodieId } },
    update: { value },
    create: { userId, goodieId, value },
  });
  const agg = await (prisma as any).goodieVote.aggregate({
    where: { goodieId },
    _sum: { value: true },
  });
  const totalScore = agg?._sum?.value || 0;
  await broadcast({
    type: "goodie_updated",
    goodie: { id: goodieId, totalScore },
  });
  return { ok: true };
}

export async function clearVote(goodieId: string) {
  const userId = await getUserId();
  if (!userId) throw new Error("Unauthorized");
  await (prisma as any).goodieVote.deleteMany({ where: { userId, goodieId } });
  const agg = await (prisma as any).goodieVote.aggregate({
    where: { goodieId },
    _sum: { value: true },
  });
  const totalScore = agg?._sum?.value || 0;
  await broadcast({
    type: "goodie_updated",
    goodie: { id: goodieId, totalScore },
  });
  return { ok: true };
}

export async function toggleCollected(goodieId: string, collected: boolean) {
  const userId = await getUserId();
  if (!userId) throw new Error("Unauthorized");
  if (collected) {
    try {
      await (prisma as any).goodieCollection.create({
        data: { userId, goodieId },
      });
    } catch {}
  } else {
    await (prisma as any).goodieCollection.deleteMany({
      where: { userId, goodieId },
    });
  }
  const collectedCount = await (prisma as any).goodieCollection.count({
    where: { goodieId },
  });
  await broadcast({ type: "goodie_collected", goodieId, collectedCount });
  return { ok: true };
}

export async function getGoodieImage(goodieId: string) {
  const g = await (prisma as any).goodie.findUnique({
    where: { id: goodieId },
    select: { imageBytes: true },
  });
  if (!g || !g.imageBytes) return null;
  return Buffer.from(g.imageBytes).toString("base64");
}

export async function deleteGoodie(id: string) {
  const userId = await getUserId();
  if (!userId) throw new Error("Unauthorized");
  const existing = await (prisma as any).goodie.findUnique({
    where: { id },
    select: { createdById: true },
  });
  if (!existing) throw new Error("Not found");
  if (existing.createdById !== userId) throw new Error("Forbidden");
  await (prisma as any).goodie.delete({ where: { id } });
  await broadcast({ type: "goodie_deleted", id });
  return { ok: true };
}

export async function updateGoodie(
  id: string,
  patch: {
    name?: string;
    location?: string;
    instructions?: string;
    type?: GoodieType;
    date?: string | null;
    registrationUrl?: string | null;
    image?: ArrayBuffer | Uint8Array | null; // if provided replace; if undefined keep; if null clear
    reminderEnabled?: boolean;
  },
) {
  const userId = await getUserId();
  if (!userId) throw new Error("Unauthorized");
  const existing = await (prisma as any).goodie.findUnique({
    where: { id },
    select: { createdById: true },
  });
  if (!existing) throw new Error("Not found");
  if (existing.createdById !== userId) throw new Error("Forbidden");

  const data: Record<string, any> = {};
  if (patch.name !== undefined) data.name = patch.name;
  if (patch.location !== undefined) data.location = patch.location;
  if (patch.instructions !== undefined) data.instructions = patch.instructions;
  if (patch.type !== undefined) data.type = patch.type;
  if (patch.date !== undefined)
    data.date = patch.date ? new Date(patch.date) : null;
  if (patch.registrationUrl !== undefined)
    data.registrationUrl = patch.registrationUrl;
  if (patch.image !== undefined) {
    if (patch.image === null) data.imageBytes = null;
    else data.imageBytes = Buffer.from(patch.image as ArrayBuffer);
  }
  if (patch.reminderEnabled !== undefined)
    data.reminderEnabled = patch.reminderEnabled;

  const updated = await (prisma as any).goodie.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      location: true,
      instructions: true,
      type: true,
      date: true,
      registrationUrl: true,
      updatedAt: true,
      reminderEnabled: true,
      // keep creator stable (not needed in update broadcast currently)
    },
  });
  await broadcast({
    type: "goodie_edited",
    goodie: {
      id: updated.id,
      name: updated.name,
      location: updated.location,
      instructions: updated.instructions,
      type: updated.type,
      date: updated.date ? updated.date.toISOString() : null,
      registrationUrl: updated.registrationUrl ?? null,
      updatedAt: updated.updatedAt.toISOString(),
    },
  });
  return updated;
}

export async function setGoodieReminder(id: string, enabled: boolean) {
  const userId = await getUserId();
  if (!userId) throw new Error("Unauthorized");
  const existing = await (prisma as any).goodie.findUnique({
    where: { id },
    select: { createdById: true },
  });
  if (!existing) throw new Error("Not found");
  if (existing.createdById !== userId) throw new Error("Forbidden");
  await (prisma as any).goodie.update({
    where: { id },
    data: { reminderEnabled: enabled },
  });
  await broadcast({
    type: "goodie_updated",
    goodie: { id, reminderEnabled: enabled },
  });
  return { ok: true };
}
