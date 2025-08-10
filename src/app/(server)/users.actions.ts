"use server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export type AdminUserDto = {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
  lastSessionAt: string | null;
};

async function requireAdmin() {
  const hdrs = await headers();
  const session = await auth.api.getSession({ headers: hdrs });
  if (!session?.user?.isAdmin) throw new Error("Unauthorized");
  return session.user.id;
}

export async function listUsers(): Promise<AdminUserDto[]> {
  await requireAdmin();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      sessions: {
        select: { createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    isAdmin: u.isAdmin,
    createdAt: u.createdAt.toISOString(),
    lastSessionAt: u.sessions[0]?.createdAt.toISOString() ?? null,
  }));
}

export async function deleteUserAdmin(id: string) {
  await requireAdmin();
  // Prevent self-delete via admin panel (use account delete flow instead)
  // Could allow if desired; safer to block
  const hdrs = await headers();
  const session = await auth.api.getSession({ headers: hdrs });
  if (session?.user?.id === id)
    throw new Error("Cannot delete your own user here");
  // Additional rule: do not allow deleting another admin
  const target = await prisma.user.findUnique({
    where: { id },
    select: { isAdmin: true },
  });
  if (!target) throw new Error("User not found");
  if (target.isAdmin) throw new Error("Cannot delete an admin user");
  await prisma.user.delete({ where: { id } });
  return { ok: true };
}
