-- CreateTable
CREATE TABLE "public"."goodie_notifier" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "goodieId" TEXT NOT NULL,
    "reminderEnabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "goodie_notifier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "goodie_notifier_goodieId_idx" ON "public"."goodie_notifier"("goodieId");

-- CreateIndex
CREATE INDEX "goodie_notifier_userId_idx" ON "public"."goodie_notifier"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "goodie_notifier_userId_goodieId_key" ON "public"."goodie_notifier"("userId", "goodieId");

-- AddForeignKey
ALTER TABLE "public"."goodie_notifier" ADD CONSTRAINT "goodie_notifier_goodieId_fkey" FOREIGN KEY ("goodieId") REFERENCES "public"."goodie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."goodie_notifier" ADD CONSTRAINT "goodie_notifier_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
