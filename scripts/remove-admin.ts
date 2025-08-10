#!/usr/bin/env tsx
import { prisma } from "../src/lib/prisma";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npm run remove:admin -- <email>");
    process.exit(1);
  }
  const user = await prisma.user
    .update({ where: { email }, data: { isAdmin: false } })
    .catch(async (err: unknown) => {
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code?: string }).code === "P2025"
      ) {
        console.error("User not found");
      } else {
        console.error("Failed to demote user:", err);
      }
      process.exit(1);
    });
  console.log(`User ${user.email} is no longer admin.`);
  await prisma.$disconnect();
}
main();
