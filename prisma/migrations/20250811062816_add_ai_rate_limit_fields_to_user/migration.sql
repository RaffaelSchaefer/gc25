-- AlterTable
ALTER TABLE "public"."user" ADD COLUMN     "aiUsageCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "aiUsageLimit" INTEGER,
ADD COLUMN     "aiUsageReset" TIMESTAMP(3);
