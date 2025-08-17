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
  const start = new Date(now.getTime() + 60 * 60 * 1000);
  const end = new Date(now.getTime() + 61 * 60 * 1000);

  const events = await prisma.event.findMany({
    where: {
      status: EventStatus.PUBLISHED,
      startDate: {
        gte: start,
        lt: end,
      },
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

  if (events.length === 0) return 0;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const baseUrl = getBaseUrl();

  for (const event of events) {
    const eventUrl = event.slug ? `${baseUrl}/events/${event.slug}` : baseUrl;
    for (const participant of event.participants) {
      await resend.emails.send({
        from: "no-reply@mail.raffaelschaefer.de",
        to: participant.user.email,
        subject: `Reminder: ${event.name} starts in one hour`,
        react: GC25EventReminderEmail({
          userName: participant.user.name,
          eventName: event.name,
          eventDate: event.startDate.toISOString(),
          eventUrl,
        }),
      });
    }
  }

  return events.length;
}

export async function sendGoodieReminders() {
  const now = new Date();
  const start = new Date(now.getTime() + 60 * 60 * 1000);
  const end = new Date(now.getTime() + 61 * 60 * 1000);

  const goodies = await prisma.goodie.findMany({
    where: {
      date: {
        gte: start,
        lt: end,
      },
      reminderEnabled: true,
    },
    select: {
      name: true,
      date: true,
      createdBy: { select: { name: true, email: true } },
    },
  });

  if (goodies.length === 0) return 0;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const baseUrl = getBaseUrl();
  const goodieUrl = `${baseUrl}/home/goodie-tracker`;

  for (const goodie of goodies) {
    await resend.emails.send({
      from: "no-reply@mail.raffaelschaefer.de",
      to: goodie.createdBy.email,
      subject: `Reminder: ${goodie.name} starts in one hour`,
      react: GC25GoodieReminderEmail({
        userName: goodie.createdBy.name,
        goodieName: goodie.name,
        goodieDate: goodie.date!.toISOString(),
        goodieUrl,
      }),
    });
  }

  return goodies.length;
}
