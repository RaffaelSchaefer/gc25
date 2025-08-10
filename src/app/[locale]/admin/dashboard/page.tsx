import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Suspense } from "react";
// Charts
import {
  UsageAreaChart,
  ExtendedTimelineChart,
  SimpleBarChart,
} from "./usage-charts";

export const dynamic = "force-dynamic"; // opt out of caching

async function getStats() {
  const now = new Date();
  const from30 = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
  const from7 = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);

  const [
    users,
    admins,
    sessions,
    events,
    goodies,
    comments,
    participantsCount,
    userSeriesRaw,
    eventSeriesRaw,
    commentSeriesRaw,
    participantsSeriesRaw,
    goodiesSeriesRaw,
    eventsByCategoryRaw,
    goodiesByType,
    newUsers7,
    newUsers30,
    newEvents7,
    newEvents30,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isAdmin: true } }),
    prisma.session.count({ where: { expiresAt: { gt: new Date() } } }),
    prisma.event.count(),
    prisma.goodie.count(),
    prisma.comment.count(),
    prisma.eventParticipant.count(),
    prisma.user.findMany({
      where: { createdAt: { gte: from30 } },
      select: { createdAt: true },
    }),
    prisma.event.findMany({
      where: { createdAt: { gte: from30 } },
      select: { createdAt: true },
    }),
    prisma.comment.findMany({
      where: { createdAt: { gte: from30 } },
      select: { createdAt: true },
    }),
    prisma.eventParticipant.findMany({
      where: { createdAt: { gte: from30 } },
      select: { createdAt: true },
    }),
    prisma.goodie.findMany({
      where: { createdAt: { gte: from30 } },
      select: { createdAt: true },
    }),
    prisma.event.groupBy({ by: ["category"], _count: { _all: true } }),
    prisma.goodie.groupBy({ by: ["type"], _count: { _all: true } }),
    prisma.user.count({ where: { createdAt: { gte: from7 } } }),
    prisma.user.count({ where: { createdAt: { gte: from30 } } }),
    prisma.event.count({ where: { createdAt: { gte: from7 } } }),
    prisma.event.count({ where: { createdAt: { gte: from30 } } }),
  ]);

  const dayKey = (d: Date) => d.toISOString().slice(0, 10);
  const days30: Record<
    string,
    {
      users: number;
      events: number;
      comments: number;
      participants: number;
      goodies: number;
    }
  > = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(from30.getTime() + i * 24 * 60 * 60 * 1000);
    days30[dayKey(d)] = {
      users: 0,
      events: 0,
      comments: 0,
      participants: 0,
      goodies: 0,
    };
  }
  function addRows(
    rows: { createdAt: Date }[],
    field: keyof (typeof days30)[string],
  ) {
    rows.forEach((r) => {
      const k = dayKey(r.createdAt);
      if (days30[k]) (days30[k][field] as number) += 1;
    });
  }
  addRows(userSeriesRaw, "users");
  addRows(eventSeriesRaw, "events");
  addRows(commentSeriesRaw, "comments");
  addRows(participantsSeriesRaw, "participants");
  addRows(goodiesSeriesRaw, "goodies");

  const timeline = Object.entries(days30).map(([date, v]) => ({
    date,
    newUsers: v.users,
    newEvents: v.events,
  }));
  const extendedTimeline = Object.entries(days30).map(([date, v]) => ({
    date,
    newComments: v.comments,
    newParticipants: v.participants,
    newGoodies: v.goodies,
  }));

  const avgParticipantsPerEvent =
    events === 0 ? 0 : participantsCount / Math.max(events, 1);

  return {
    users,
    admins,
    sessions,
    events,
    goodies,
    comments,
    timeline,
    extendedTimeline,
    participantsCount,
    avgParticipantsPerEvent,
    goodiesByType: goodiesByType.map((r) => ({
      type: r.type,
      count: r._count._all,
    })),
    eventsByCategory: eventsByCategoryRaw.map((r) => ({
      category: r.category,
      count: r._count._all,
    })),
    growth: {
      users7: newUsers7,
      users30: newUsers30,
      events7: newEvents7,
      events30: newEvents30,
    },
  };
}

function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border bg-card text-card-foreground p-4 flex flex-col gap-1 shadow-sm">
      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <span className="text-2xl font-semibold tabular-nums leading-none mt-1">
        {value}
      </span>
      {hint && (
        <span className="text-[10px] text-muted-foreground mt-0.5">{hint}</span>
      )}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const hdrs = await headers();
  const session = await auth.api.getSession({ headers: hdrs });
  const stats = await getStats();

  const adminPct = ((stats.admins / Math.max(stats.users, 1)) * 100).toFixed(1);
  const avgParts = stats.avgParticipantsPerEvent.toFixed(1);
  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto flex flex-col gap-10 max-w-7xl">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Analytics Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Hello {session?.user?.name}, aggregated platform activity &
            engagement.
          </p>
        </header>

        {/* KPI Strip */}
        <section
          aria-label="Key Performance Indicators"
          className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7"
        >
          <KpiCard
            label="Users"
            value={stats.users}
            hint={`+${stats.growth.users7} /7d  +${stats.growth.users30} /30d`}
          />
          <KpiCard
            label="Admins"
            value={stats.admins}
            hint={`${adminPct}% of users`}
          />
          <KpiCard label="Active Sessions" value={stats.sessions} />
          <KpiCard
            label="Events"
            value={stats.events}
            hint={`+${stats.growth.events7} /7d  +${stats.growth.events30} /30d`}
          />
          <KpiCard label="Goodies" value={stats.goodies} />
          <KpiCard label="Comments" value={stats.comments} />
          <KpiCard
            label="Participants"
            value={stats.participantsCount}
            hint={`${avgParts} avg / event`}
          />
        </section>

        {/* Charts Row 1 */}
        <section
          className="grid gap-6 lg:grid-cols-5"
          aria-label="Growth & Distribution Charts"
        >
          <div className="rounded-xl border bg-card p-4 flex flex-col gap-3 lg:col-span-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">User Growth (30d)</h2>
              <span className="text-[10px] text-muted-foreground">
                Daily new registrations
              </span>
            </div>
            <Suspense
              fallback={
                <div className="h-56 animate-pulse rounded-md bg-muted" />
              }
            >
              <UsageAreaChart
                data={stats.timeline.map((d) => ({
                  date: d.date,
                  newUsers: d.newUsers,
                }))}
              />
            </Suspense>
          </div>
          <div className="rounded-xl border bg-card p-4 flex flex-col gap-3 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">Goodies by Type</h2>
              <span className="text-[10px] text-muted-foreground">
                Total count
              </span>
            </div>
            <Suspense
              fallback={
                <div className="h-56 animate-pulse rounded-md bg-muted" />
              }
            >
              <SimpleBarChart
                data={stats.goodiesByType}
                xKey="type"
                bars={[{ dataKey: "count", name: "Goodies", color: "#EC4899" }]}
              />
            </Suspense>
          </div>
        </section>

        {/* Charts Row 2 */}
        <section
          className="grid gap-6 lg:grid-cols-5"
          aria-label="Engagement Timeline & Event Types"
        >
          <div className="rounded-xl border bg-card p-4 flex flex-col gap-3 lg:col-span-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">
                Events / Comments / Participants / Goodies (30d)
              </h2>
              <span className="text-[10px] text-muted-foreground">
                Daily creation / activity
              </span>
            </div>
            <Suspense
              fallback={
                <div className="h-56 animate-pulse rounded-md bg-muted" />
              }
            >
              <ExtendedTimelineChart
                data={stats.extendedTimeline.map((d) => ({
                  ...d,
                  newEvents:
                    stats.timeline.find((t) => t.date === d.date)?.newEvents ||
                    0,
                }))}
              />
            </Suspense>
          </div>
          <div className="rounded-xl border bg-card p-4 flex flex-col gap-3 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">Events by Category</h2>
              <span className="text-[10px] text-muted-foreground">
                Inventory
              </span>
            </div>
            <Suspense
              fallback={
                <div className="h-56 animate-pulse rounded-md bg-muted" />
              }
            >
              <SimpleBarChart
                data={stats.eventsByCategory}
                xKey="category"
                bars={[{ dataKey: "count", name: "Events", color: "#F59E0B" }]}
              />
            </Suspense>
          </div>
        </section>
      </div>
    </div>
  );
}
