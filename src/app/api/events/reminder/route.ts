import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { EventStatus } from "@prisma/client";
import GC25EventReminderEmail from "../../../../../emails/eventReminder";

export async function GET() {
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
        select: {
          user: { select: { name: true, email: true } },
        },
      },
    },
  });

  if (events.length === 0) {
    return NextResponse.json({ message: "No events starting in one hour" });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const baseUrl = process.env.BETTER_AUTH_URL
    ? `https://${process.env.BETTER_AUTH_URL}`
    : "http://localhost:3000";

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

  return NextResponse.json({
    message: "Reminders sent",
    events: events.length,
  });
}
