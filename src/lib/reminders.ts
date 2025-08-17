import { EventStatus } from "@prisma/client";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import GC25EventReminderEmail from "../../emails/eventReminder";
import GC25GoodieReminderEmail from "../../emails/goodieReminder";

function getBaseUrl() {
  return process.env.BETTER_AUTH_URL
    ? `https://${process.env.BETTER_AUTH_URL}`
    : "http://localhost:3000";
}

export async function sendEventReminders() {
  const now = new Date();
  const nowISO = now.toISOString();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  console.log("[Reminder] Serverzeit:", nowISO, "Zeitzone:", tz);

  // 1 Stunde vorher
  const start1h = new Date(now.getTime() + 60 * 60 * 1000);
  const end1h = new Date(now.getTime() + 61 * 60 * 1000);
  // 15 Minuten vorher
  const start15m = new Date(now.getTime() + 15 * 60 * 1000);
  const end15m = new Date(now.getTime() + 16 * 60 * 1000);

  // Events, die in 1h oder 15min starten
  const events = await prisma.event.findMany({
    where: {
      status: EventStatus.PUBLISHED,
      OR: [
        { startDate: { gte: start1h, lt: end1h } },
        { startDate: { gte: start15m, lt: end15m } },
      ],
    },
    select: {
      name: true,
      slug: true,
      startDate: true,
      participants: {
        where: { reminderEnabled: true },
        select: { user: { select: { name: true, email: true } } },
      },
    },
  });

  console.log(`[Reminder] Gefundene Events:`, events.map(e => ({ name: e.name, startDate: e.startDate })));

  if (events.length === 0) return 0;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const baseUrl = getBaseUrl();

  for (const event of events) {
    const eventUrl = event.slug ? `${baseUrl}/events/${event.slug}` : baseUrl;
    const minutesToStart = Math.round((event.startDate.getTime() - now.getTime()) / 60000);
    let subject = `Reminder: ${event.name} starts soon`;
    let reminderType: "hour" | "15min" = "hour";
    if (minutesToStart <= 16 && minutesToStart >= 15) {
      subject = `Reminder: ${event.name} startet in 15 Minuten`;
      reminderType = "15min";
    } else if (minutesToStart <= 61 && minutesToStart >= 60) {
      subject = `Reminder: ${event.name} startet in einer Stunde`;
      reminderType = "hour";
    }
    for (const participant of event.participants) {
      await resend.emails.send({
        from: "no-reply@mail.raffaelschaefer.de",
        to: participant.user.email,
        subject,
        react: GC25EventReminderEmail({
          userName: participant.user.name,
          eventName: event.name,
          eventDate: event.startDate.toISOString(),
          eventUrl,
          reminderType,
        }),
      });
      console.log(`[Reminder] E-Mail gesendet an:`, participant.user.email, subject);
    }
  }

  return events.length;
}

export async function sendGoodieReminders() {
  const now = new Date();
  const start1h = new Date(now.getTime() + 60 * 60 * 1000);
  const start15m = new Date(now.getTime() + 15 * 60 * 1000);

  // Hole alle Goodies, die in 1h oder 15min starten
  const goodies = await prisma.goodie.findMany({
    where: {
      date: { not: null },
      reminderEnabled: true,
      OR: [
        { date: { gte: start1h, lt: new Date(start1h.getTime() + 60 * 1000) } },
        { date: { gte: start15m, lt: new Date(start15m.getTime() + 60 * 1000) } },
      ],
    },
    select: {
      id: true,
      name: true,
      date: true,
      notifiers: {
        where: { reminderEnabled: true },
        select: { user: { select: { name: true, email: true } } },
      },
    },
  });

  if (goodies.length === 0) return 0;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const baseUrl = getBaseUrl();
  const goodieUrl = `${baseUrl}/home/goodie-tracker`;

  for (const goodie of goodies) {
    for (const notifier of goodie.notifiers) {
      const user = notifier.user;
      if (!user?.email) continue;
      const minutesToStart = Math.round((goodie.date!.getTime() - now.getTime()) / 60000);
      let subject = `Reminder: ${goodie.name} startet bald`;
      let reminderType: "hour" | "15min" = "hour";
      if (minutesToStart <= 16 && minutesToStart >= 15) {
        subject = `Reminder: ${goodie.name} startet in 15 Minuten`;
        reminderType = "15min";
      } else if (minutesToStart <= 61 && minutesToStart >= 60) {
        subject = `Reminder: ${goodie.name} startet in einer Stunde`;
        reminderType = "hour";
      }
      await resend.emails.send({
        from: "no-reply@mail.raffaelschaefer.de",
        to: user.email,
        subject,
        react: GC25GoodieReminderEmail({
          userName: user.name,
          goodieName: goodie.name,
          goodieDate: goodie.date!.toISOString(),
          goodieUrl,
          reminderType,
        }),
      });
      console.log(`[Goodie-Notifier] E-Mail gesendet an:`, user.email, subject);
    }
  }

  return goodies.length;
}
