-- CreateEnum
CREATE TYPE "public"."GoodieType" AS ENUM ('GIFT', 'FOOD', 'DRINK');

-- CreateTable
CREATE TABLE "public"."goodie" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "type" "public"."GoodieType" NOT NULL,
    "name" VARCHAR(140) NOT NULL,
    "location" VARCHAR(140) NOT NULL,
    "instructions" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "registrationUrl" VARCHAR(300),
    "imageBytes" BYTEA,

    CONSTRAINT "goodie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."goodie_vote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goodieId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goodie_vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."goodie_collection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goodieId" TEXT NOT NULL,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goodie_collection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "goodie_createdById_idx" ON "public"."goodie"("createdById");

-- CreateIndex
CREATE INDEX "goodie_type_idx" ON "public"."goodie"("type");

-- CreateIndex
CREATE INDEX "goodie_date_idx" ON "public"."goodie"("date");

-- CreateIndex
CREATE INDEX "goodie_vote_goodieId_idx" ON "public"."goodie_vote"("goodieId");

-- CreateIndex
CREATE UNIQUE INDEX "goodie_vote_userId_goodieId_key" ON "public"."goodie_vote"("userId", "goodieId");

-- CreateIndex
CREATE INDEX "goodie_collection_goodieId_idx" ON "public"."goodie_collection"("goodieId");

-- CreateIndex
CREATE UNIQUE INDEX "goodie_collection_userId_goodieId_key" ON "public"."goodie_collection"("userId", "goodieId");

-- AddForeignKey
ALTER TABLE "public"."goodie" ADD CONSTRAINT "goodie_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."goodie_vote" ADD CONSTRAINT "goodie_vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."goodie_vote" ADD CONSTRAINT "goodie_vote_goodieId_fkey" FOREIGN KEY ("goodieId") REFERENCES "public"."goodie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."goodie_collection" ADD CONSTRAINT "goodie_collection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."goodie_collection" ADD CONSTRAINT "goodie_collection_goodieId_fkey" FOREIGN KEY ("goodieId") REFERENCES "public"."goodie"("id") ON DELETE CASCADE ON UPDATE CASCADE;
