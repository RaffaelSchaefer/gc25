import { NextResponse } from "next/server";
import { sendEventReminders } from "@/lib/reminders";

export async function GET() {
  const count = await sendEventReminders();

  if (count === 0) {
    return NextResponse.json({ message: "No events starting in one hour" });
  }

  return NextResponse.json({ message: "Reminders sent", events: count });
}
