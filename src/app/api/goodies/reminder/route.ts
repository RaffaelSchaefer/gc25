import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import GC25GoodieReminderEmail from "../../../../../emails/goodieReminder";

export async function GET() {
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

  if (goodies.length === 0) {
    return NextResponse.json({ message: "No goodies starting in one hour" });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const baseUrl = process.env.BETTER_AUTH_URL
    ? `https://${process.env.BETTER_AUTH_URL}`
    : "http://localhost:3000";
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

  return NextResponse.json({
    message: "Goodie reminders sent",
    goodies: goodies.length,
  });
}
