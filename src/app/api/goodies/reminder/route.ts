import { NextResponse } from "next/server";
import { sendGoodieReminders } from "@/lib/reminders";

export async function GET() {
  const count = await sendGoodieReminders();

  if (count === 0) {
    return NextResponse.json({ message: "No goodies starting in one hour" });
  }

  return NextResponse.json({
    message: "Goodie reminders sent",
    goodies: count,
  });
}
