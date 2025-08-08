import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined;
}

/**
 * Export a single PrismaClient instance across the app.
 * In development, reuse the instance on the global object to avoid
 * creating too many connections during HMR. In production, create
 * a single instance per process.
 */
export const prisma: PrismaClient =
  global.__prisma__ ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__prisma__ = prisma;
}
