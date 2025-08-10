import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, key, action } = body;

    // Validierung der erforderlichen Parameter
    if (!email || !key || !action) {
      return NextResponse.json(
        { error: "Email, key, and action are required" },
        { status: 400 },
      );
    }

    // Validierung des Action-Parameters
    if (!["promote", "demote"].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "promote" or "demote"' },
        { status: 400 },
      );
    }

    // Überprüfung des Admin-Schlüssels
    const adminKey = process.env.ADMIN_MANAGEMENT_KEY;
    if (!adminKey || key !== adminKey) {
      return NextResponse.json({ error: "Invalid admin key" }, { status: 401 });
    }

    // Finde den User
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, isAdmin: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Bestimme die neue Admin-Status basierend auf der Aktion
    const newAdminStatus = action === "promote";

    // Prüfe ob bereits im gewünschten Status
    if (user.isAdmin === newAdminStatus) {
      const statusText = newAdminStatus
        ? "already an admin"
        : "already not an admin";
      return NextResponse.json(
        {
          message: `User is ${statusText}`,
          user,
          action: "no_change",
        },
        { status: 200 },
      );
    }

    // Aktualisiere den User
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { isAdmin: newAdminStatus },
      select: { id: true, name: true, email: true, isAdmin: true },
    });

    const actionText = newAdminStatus
      ? "promoted to admin"
      : "demoted from admin";

    return NextResponse.json({
      message: `User ${actionText} successfully`,
      user: updatedUser,
      action: action,
    });
  } catch (error) {
    console.error("Error managing user admin status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
