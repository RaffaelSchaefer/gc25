"use server";

import { PrismaClient } from "@prisma/client";

export async function exportAllUserData(userID: string) {
  const prisma = new PrismaClient();
  try {
    const userData = await prisma.user.findUnique({
      where: { id: userID },
      include: {
        accounts: true,
        comments: true,
        createdEvents: true,
        updatedEvents: true,
        participants: true,
        sessions: true,
        goodies: true,
        goodieVotes: true,
        goodieCollections: true,
      },
    });
    if (!userData) throw new Error("User not found");
    return userData;
  } catch (error) {
    console.error("Error exporting user data:", error);
    throw new Error("Failed to export user data");
  } finally {
    await prisma.$disconnect();
  }
}
