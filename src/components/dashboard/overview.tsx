import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Calendar,
  Users,
  Music2,
  Settings,
  BarChart3,
  ListChecks,
  MapPin,
} from "lucide-react";
import type { DayBucket } from "@/app/(server)/events.actions";

type Props = {
  days: DayBucket[];
};

function formatDateTime(iso: string) {
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const time = d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return `${date} · ${time}`;
  } catch {
    return iso;
  }
}

export default function DashboardOverview({ days }: Props) {
  const allEvents = days.flatMap((d) => d.events);
  const totalEvents = allEvents.length;
  const joinedEvents = allEvents.filter((e) => e.userJoined).length;

  const now = Date.now();
  const upcoming = allEvents
    .map((e) => ({ e, ts: new Date(e.startDate).getTime() }))
    .filter(({ ts }) => !Number.isNaN(ts) && ts >= now)
    .sort((a, b) => a.ts - b.ts)[0]?.e;

  return (
    <section className="relative -mt-24 z-10">
      <div className="container mx-auto px-4">
        {/* Intro */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-500 via-emerald-400 to-orange-400 bg-clip-text text-transparent">
            Dein Dashboard
          </h2>
          <p className="text-muted-foreground mt-2">
            Schneller Überblick, praktische Links und aktuelle Events.
          </p>
        </div>

        {/* Masonry container */}
        <div className="columns-1 md:columns-2 xl:columns-3 gap-6 mb-12">
          {/* Eventplaner */}
          <div className="break-inside-avoid mb-6">
            <Card className="group relative overflow-hidden border-0 ring-1 ring-indigo-500/20 bg-gradient-to-br from-indigo-500/5 via-background/60 to-background/50 backdrop-blur-xl">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-12 -top-12 size-56 rounded-full bg-[radial-gradient(circle,rgba(79,70,229,0.25)_0%,transparent_60%)]"
              />
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-indigo-700 dark:text-indigo-300">
                    Nächstes Event
                  </CardTitle>
                  <CardDescription className="text-indigo-600 dark:text-indigo-200">
                    Alle Details auf einen Blick
                  </CardDescription>
                </div>
                <div className="rounded-lg bg-indigo-500/15 p-2 border border-indigo-500/30">
                  <Calendar className="w-6 h-6 text-indigo-300" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcoming ? (
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-2">
                      <div className="text-indigo-700 dark:text-indigo-300 text-lg font-semibold">
                        {upcoming.title}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-2">
                          <Calendar className="w-4 h-4" />{" "}
                          {formatDateTime(upcoming.startDate)}
                        </span>
                        {upcoming.location && (
                          <span className="inline-flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> {upcoming.location}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-2">
                          <Users className="w-4 h-4" /> {upcoming.attendees}{" "}
                          Teilnehmer
                        </span>
                      </div>
                    </div>
                    <Link href="/home/planner">
                      <Button className="px-5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 ring-1 ring-indigo-400/40">
                        Zum Planer
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-muted-foreground">
                    Noch keine kommenden Events – lege direkt eins im Planer an.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Spotify */}
          <div className="break-inside-avoid mb-6">
            <Card className="group relative overflow-hidden border-0 ring-1 ring-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-background/60 to-background/50 backdrop-blur-xl transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-12 -top-12 size-56 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.25)_0%,transparent_60%)]"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -right-6 -top-6 opacity-10 text-emerald-400/80"
              >
                <Music2 className="h-40 w-40 blur-2xl transform transition-transform duration-300 group-hover:scale-105 group-hover:rotate-1" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-emerald-700 dark:text-emerald-300">
                    Spotify Playlist
                  </CardTitle>
                  <CardDescription className="text-emerald-600 dark:text-emerald-200">
                    Gemeinsame Group-Playlist öffnen
                  </CardDescription>
                </div>
                <div className="rounded-lg bg-emerald-500/15 p-2 border border-emerald-500/30">
                  <Music2 className="w-6 h-6 text-emerald-300" />
                </div>
              </CardHeader>
              <CardContent>
                <a
                  href="https://open.spotify.com/playlist/1cfSC5on08cgvCTnC1Xls0?si=44ab73e2a5054ecc"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <Button
                    size="lg"
                    className="px-5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 ring-1 ring-emerald-400/40"
                  >
                    Playlist öffnen
                  </Button>
                </a>
              </CardContent>
            </Card>
          </div>

          {/* KPIs */}
          <div className="break-inside-avoid mb-6">
            <Card className="relative overflow-hidden border-0 ring-1 ring-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-background/0 to-transparent">
              <CardContent className="flex items-center gap-4 py-6">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/15 ring-1 ring-indigo-500/30 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                    {totalEvents}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Veröffentlichte Events
                  </div>
                </div>
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-indigo-500/20 blur-3xl"
                />
              </CardContent>
            </Card>
          </div>

          <div className="break-inside-avoid mb-6">
            <Card className="relative overflow-hidden border-0 ring-1 ring-sky-500/30 bg-gradient-to-br from-sky-500/10 via-background/0 to-transparent">
              <CardContent className="flex items-center gap-4 py-6">
                <div className="w-10 h-10 rounded-lg bg-sky-500/15 ring-1 ring-sky-500/30 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-sky-300" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-sky-700 dark:text-sky-300">
                    {joinedEvents}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Meine Teilnahmen
                  </div>
                </div>
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-sky-500/20 blur-3xl"
                />
              </CardContent>
            </Card>
          </div>

          {/* Useful links / tools */}
          <div className="break-inside-avoid mb-6">
            <Card className="relative overflow-hidden border-0 ring-1 ring-orange-500/20 bg-gradient-to-br from-orange-500/5 via-background/60 to-background/50">
              <CardHeader>
                <CardTitle className="text-lg text-orange-700 dark:text-orange-300">
                  Nützliche Links
                </CardTitle>
                <CardDescription className="text-orange-600 dark:text-orange-200">
                  Schnell zu häufig genutzten Bereichen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link
                  href="/home/planner"
                  className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-orange-500/10"
                >
                  <span className="inline-flex items-center gap-2 text-sm">
                    <ListChecks className="w-4 h-4 text-orange-300" />{" "}
                    Eventplaner
                  </span>
                  <span className="text-xs text-orange-300">Öffnen →</span>
                </Link>
                <a
                  href="https://open.spotify.com/playlist/1cfSC5on08cgvCTnC1Xls0?si=44ab73e2a5054ecc"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-orange-500/10"
                >
                  <span className="inline-flex items-center gap-2 text-sm">
                    <Music2 className="w-4 h-4 text-orange-300" /> Spotify
                    Playlist
                  </span>
                  <span className="text-xs text-orange-300">Öffnen →</span>
                </a>
                <Link
                  href="/home/settings"
                  className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-orange-500/10"
                >
                  <span className="inline-flex items-center gap-2 text-sm">
                    <Settings className="w-4 h-4 text-orange-300" />{" "}
                    Einstellungen
                  </span>
                  <span className="text-xs text-orange-300">Öffnen →</span>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
