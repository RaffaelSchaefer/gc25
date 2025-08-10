#!/usr/bin/env tsx
import { prisma } from "../src/lib/prisma";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npm run make:admin -- <email>");
    process.exit(1);
  }
  const user = await prisma.user
    .update({ where: { email }, data: { isAdmin: true } })
    .catch(async (err) => {
      if (err.code === "P2025") {
        console.error("User not found");
      } else {
        console.error("Failed to promote user:", err);
      }
      process.exit(1);
    });
  console.log(`User ${user.email} is now admin.`);
  await prisma.$disconnect();
}
main();
