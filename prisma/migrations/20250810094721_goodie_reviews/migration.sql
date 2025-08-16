CREATE TABLE "public"."goodie_review" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goodieId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "imageBytes" BYTEA,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "public"."goodie_review"
    ADD CONSTRAINT "goodie_review_pkey" PRIMARY KEY ("id");

CREATE UNIQUE INDEX "goodie_review_userId_goodieId_key" ON "public"."goodie_review"("userId", "goodieId");
CREATE INDEX "goodie_review_goodieId_idx" ON "public"."goodie_review"("goodieId");

ALTER TABLE "public"."goodie_review"
    ADD CONSTRAINT "goodie_review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."goodie_review"
    ADD CONSTRAINT "goodie_review_goodieId_fkey" FOREIGN KEY ("goodieId") REFERENCES "public"."goodie"("id") ON DELETE CASCADE ON UPDATE CASCADE;
