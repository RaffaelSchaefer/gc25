ALTER TABLE "event_participant" ADD COLUMN "reminderEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "goodie" ADD COLUMN "reminderEnabled" BOOLEAN NOT NULL DEFAULT true;
