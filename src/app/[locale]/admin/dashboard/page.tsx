import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Suspense } from "react";
// Import client charts directly (they are marked with "use client" in their file)
import { UsageAreaChart, DistributionPie } from "./usage-charts";

export const dynamic = "force-dynamic"; // opt out of caching


async function getStats() {
  const now = new Date();
  const from30 = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);

  const [users, admins, sessions, events, goodies, comments, userSeries, eventSeries] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isAdmin: true } }),
    prisma.session.count({ where: { expiresAt: { gt: new Date() } } }),
    prisma.event.count(),
    prisma.goodie.count(),
    prisma.comment.count(),
    prisma.user.groupBy({ by: ["createdAt"], where: { createdAt: { gte: from30 } }, _count: { _all: true } }),
    prisma.event.groupBy({ by: ["createdAt"], where: { createdAt: { gte: from30 } }, _count: { _all: true } }),
  ]);

  const dayKey = (d: Date) => d.toISOString().slice(0, 10);
  const days: Record<string, { users: number; events: number }> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(from30.getTime() + i * 24 * 60 * 60 * 1000);
    days[dayKey(d)] = { users: 0, events: 0 };
  }
  type CountRow = { createdAt: Date; _count: { _all: number } };
  (userSeries as CountRow[]).forEach(u => { const k = dayKey(u.createdAt); if (days[k]) days[k].users += u._count._all; });
  (eventSeries as CountRow[]).forEach(e => { const k = dayKey(e.createdAt); if (days[k]) days[k].events += e._count._all; });
  const timeline = Object.entries(days).map(([date, v]) => ({ date, newUsers: v.users, newEvents: v.events }));

  return { users, admins, sessions, events, goodies, comments, timeline };
}

function KpiCard({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-xl border bg-card text-card-foreground p-4 flex flex-col gap-1 shadow-sm">
      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="text-2xl font-semibold tabular-nums leading-none mt-1">{value}</span>
      {hint && <span className="text-[10px] text-muted-foreground mt-0.5">{hint}</span>}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const hdrs = await headers();
  const session = await auth.api.getSession({ headers: hdrs });
  const stats = await getStats();

  return (
    <div className="flex flex-col gap-8 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Analytics Dashboard</h1>
        <p className="text-sm text-muted-foreground">Hello {session?.user?.name}, here is the current platform activity.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Users" value={stats.users} />
        <KpiCard label="Admins" value={stats.admins} hint={`${((stats.admins / Math.max(stats.users,1)) * 100).toFixed(1)}% of users`} />
        <KpiCard label="Active Sessions" value={stats.sessions} />
        <KpiCard label="Events" value={stats.events} />
        <KpiCard label="Goodies" value={stats.goodies} />
        <KpiCard label="Comments" value={stats.comments} />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="col-span-2 rounded-xl border bg-card p-4">
          <h2 className="text-sm font-medium mb-2">30 Day Activity</h2>
          <Suspense fallback={<div className="h-48 animate-pulse rounded-md bg-muted" />}> 
            <UsageAreaChart data={stats.timeline} />
          </Suspense>
        </div>
        <div className="rounded-xl border bg-card p-4 flex flex-col">
          <h2 className="text-sm font-medium mb-2">Entity Distribution</h2>
            <Suspense fallback={<div className="h-48 animate-pulse rounded-md bg-muted" />}> 
              <DistributionPie data={[
                { name: 'Events', value: stats.events },
                { name: 'Goodies', value: stats.goodies },
                { name: 'Comments', value: stats.comments },
              ]} />
            </Suspense>
          <p className="text-xs text-muted-foreground mt-3">Shows relative share of content objects.</p>
        </div>
      </div>
    </div>
  );
}
