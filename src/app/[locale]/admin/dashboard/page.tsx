import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const hdrs = await headers();
  const session = await auth.api.getSession({ headers: hdrs });
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <p>
        Welcome, {session?.user?.name}. Use this area to manage the application.
      </p>
    </div>
  );
}
