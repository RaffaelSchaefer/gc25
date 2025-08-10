"use client";

import { useState, useTransition, useEffect } from "react";
import Image from "next/image";
import type { GoodieDto } from "@/app/(server)/goodies.actions";
import {
  voteGoodie,
  clearVote,
  toggleCollected,
  createGoodie,
  deleteGoodie,
  updateGoodie,
} from "@/app/(server)/goodies.actions";
import { GoodieCreateModal } from "./GoodieCreateModal";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  ArrowBigUp,
  ArrowBigDown,
  CheckCircle2,
  Gift,
  Utensils,
  CupSoda,
  Plus,
  Trash2,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  initialGoodies: GoodieDto[];
  currentUserId: string | null;
}

type Draft = {
  name: string;
  location: string;
  instructions: string;
  type: "GIFT" | "FOOD" | "DRINK";
  date?: string;
  registrationUrl?: string;
  image?: ArrayBuffer | null;
};

export default function GoodieTrackerClient({
  initialGoodies,
  currentUserId,
}: Props) {
  const t = useTranslations("goodies");
  const [goodies, setGoodies] = useState<GoodieDto[]>(initialGoodies);
  const [showCollected, setShowCollected] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<GoodieDto | null>(null);
  const [viewMode] = useState<"grid" | "list">("grid");
  const [goodieImages, setGoodieImages] = useState<Record<string, string>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Lazy attempt to fetch images for goodies (only once per id)
  useEffect(() => {
    goodies.forEach((g) => {
      if (goodieImages[g.id]) return; // already loaded
      // Fire and forget fetch; if 404 ignore
      fetch(`/api/goodies/${g.id}/image`)
        .then((r) => (r.ok ? r.blob() : null))
        .then((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          setGoodieImages((prev) => ({ ...prev, [g.id]: url }));
        })
        .catch(() => {
          /* ignore */
        });
    });
    // Cleanup object URLs on unmount
    return () => {
      Object.values(goodieImages).forEach((u) => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goodies]);

  const onVote = (id: string, value: 1 | -1) => {
    startTransition(async () => {
      try {
        const g = goodies.find((g) => g.id === id);
        const newValue = g?.userVote === value ? 0 : value;
        if (newValue === 0) await clearVote(id);
        else await voteGoodie(id, value);
        setGoodies((prev) =>
          prev.map((gd) =>
            gd.id === id
              ? {
                  ...gd,
                  userVote: newValue,
                  totalScore: gd.totalScore + (newValue - (g?.userVote || 0)),
                }
              : gd,
          ),
        );
      } catch {
        toast.error(t("errors.vote"));
      }
    });
  };

  const onToggleCollected = (id: string) => {
    startTransition(async () => {
      try {
        const g = goodies.find((g) => g.id === id);
        const next = !g?.collected;
        await toggleCollected(id, next);
        setGoodies((prev) =>
          prev.map((gd) => (gd.id === id ? { ...gd, collected: next } : gd)),
        );
      } catch {
        toast.error(t("errors.collect"));
      }
    });
  };

  const onDelete = (id: string, name: string) => {
    if (!confirm(t("confirm.delete_message", { name }))) return;
    setDeletingId(id);
    startTransition(async () => {
      try {
        await deleteGoodie(id);
        setGoodies((prev) => prev.filter((g) => g.id !== id));
        toast.success(t("deleted"));
      } catch {
        toast.error(t("errors.delete"));
      } finally {
        setDeletingId((cur) => (cur === id ? null : cur));
      }
    });
  };

  const filtered = goodies.filter((g) => showCollected || !g.collected);

  // Relevanz-Berechnung (spiegelt Server-Heuristik) für konsistente Sortierung nach Ranking
  const PERSONAL_WEIGHT = 3;
  const TOTAL_WEIGHT = 1;
  const TIME_DECAY_HOURS = 8; // nach dieser Zeit halbiert sich Einfluss
  const computeRelevance = (g: GoodieDto) => {
    const now = Date.now();
    const reference = g.date
      ? new Date(g.date).getTime()
      : new Date(g.createdAt).getTime();
    const hoursDiff = (reference - now) / 36e5; // Zukunft positiv
    const timeScore = Math.exp(-Math.abs(hoursDiff) / TIME_DECAY_HOURS);
    return (
      g.userVote * PERSONAL_WEIGHT + g.totalScore * TOTAL_WEIGHT + timeScore
    );
  };
  const ranked = [...filtered].sort((a, b) => {
    const ra = computeRelevance(a);
    const rb = computeRelevance(b);
    if (rb !== ra) return rb - ra;
    // Tie-Breaker: höhere totalScore, dann neuer erstellt
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Farb-Tokens (kein Grün im Normalzustand)
  const typeTokens: Record<
    GoodieDto["type"],
    {
      ring: string;
      gradFrom: string;
      icon: string;
      shadow: string;
      idleArrow: string;
    }
  > = {
    GIFT: {
      ring: "ring-indigo-500/30",
      gradFrom: "from-indigo-500/10",
      icon: "text-indigo-600",
      shadow: "shadow-indigo-500/10 hover:shadow-indigo-500/30",
      idleArrow: "text-indigo-500/40 dark:text-indigo-300/40",
    },
    FOOD: {
      ring: "ring-amber-500/30",
      gradFrom: "from-amber-500/10",
      icon: "text-amber-600",
      shadow: "shadow-amber-500/10 hover:shadow-amber-500/30",
      idleArrow: "text-amber-500/40 dark:text-amber-300/40",
    },
    DRINK: {
      ring: "ring-sky-500/30",
      gradFrom: "from-sky-500/10",
      icon: "text-sky-600",
      shadow: "shadow-sky-500/10 hover:shadow-sky-500/30",
      idleArrow: "text-sky-500/40 dark:text-sky-300/40",
    },
  };

  // Realtime updates via socket.io similar to events
  useEffect(() => {
    let off: (() => void) | null = null;
    (async () => {
      try {
        const { getClientSocket } = await import("@/lib/io-client");
        const socket = getClientSocket();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handler = (msg: any) => {
          if (!msg || typeof msg !== "object") return;
          if (msg.type === "goodie_created") {
            const g = msg.goodie;
            setGoodies((prev) => {
              if (prev.some((p) => p.id === g.id)) return prev; // avoid dupes
              return [
                {
                  id: g.id,
                  name: g.name,
                  location: g.location,
                  instructions: g.instructions,
                  type: g.type,
                  date: g.date,
                  registrationUrl: g.registrationUrl,
                  createdById: "", // unknown; could extend payload
                  createdAt: g.createdAt,
                  updatedAt: g.createdAt,
                  totalScore: g.totalScore,
                  userVote: 0,
                  collected: false,
                },
                ...prev,
              ];
            });
          } else if (msg.type === "goodie_updated") {
            setGoodies((prev) =>
              prev.map((g) =>
                g.id === msg.goodie.id
                  ? { ...g, totalScore: msg.goodie.totalScore }
                  : g,
              ),
            );
          } else if (msg.type === "goodie_collected") {
            // we only track personal collected; ignore aggregate count for now
          } else if (msg.type === "goodie_deleted") {
            setGoodies((prev) => prev.filter((g) => g.id !== msg.id));
          }
        };
        socket.on("goodies:update", handler);
        off = () => socket.off("goodies:update", handler);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      if (off) off();
    };
  }, []);

  const onCreate = async (data: Draft) => {
    setCreating(true);
    try {
      const created = await createGoodie(data);
      toast.success(t("created"));
      setGoodies((prev) => [
        {
          id: created.id,
          name: data.name,
          location: data.location,
          instructions: data.instructions,
          type: data.type,
          date: data.date || null,
          registrationUrl: data.registrationUrl || null,
          createdById: currentUserId || "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          totalScore: 0,
          userVote: 0,
          collected: false,
        },
        ...prev,
      ]);
    } catch {
      toast.error(t("errors.create"));
    } finally {
      setCreating(false);
    }
  };

  const onUpdate = async (id: string, data: Draft) => {
    setCreating(true);
    try {
      const updated = await updateGoodie(id, data);
      toast.success(t("updating"));
      setGoodies((prev) =>
        prev.map((g) =>
          g.id === id
            ? {
                ...g,
                name: updated.name,
                location: updated.location,
                instructions: updated.instructions,
                type: updated.type,
                date: updated.date?.toString() || null,
                registrationUrl: updated.registrationUrl ?? null,
                updatedAt: updated.updatedAt.toString(),
              }
            : g,
        ),
      );
    } catch {
      toast.error(t("errors.update") || "Update failed");
    } finally {
      setCreating(false);
    }
  };

  const handleSubmit = async (
    draft: Draft,
    opts: { mode: "create" | "edit"; id?: string },
  ) => {
    if (opts.mode === "create") await onCreate(draft);
    else if (opts.mode === "edit" && opts.id) await onUpdate(opts.id, draft);
    setEditing(null);
  };

  return (
    <div className="space-y-10">
      {/* Header / KPIs */}
      <header role="banner" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                {t("title")}
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                {t("subtitle")}
              </p>
            </div>
            {/* Action / Filter Bar: stack on narrow screens to avoid clipping */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 md:justify-end w-full max-w-full">
              <div className="flex h-9 items-center gap-2 rounded-md border bg-background px-3 sm:w-auto w-full justify-between sm:justify-start">
                <Label
                  htmlFor="show-collected"
                  className="text-sm font-medium whitespace-nowrap"
                >
                  {t("filters.show_collected")}
                </Label>
                <Switch
                  id="show-collected"
                  checked={showCollected}
                  onCheckedChange={setShowCollected}
                />
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null);
                  setIsModalOpen(true);
                }}
                className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-indigo-500 text-white ring-1 ring-indigo-400/40 hover:from-indigo-500 hover:to-indigo-600 shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" /> {t("add_new")}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Goodies List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={
            viewMode === "grid"
              ? "columns-1 md:columns-2 lg:columns-3 gap-x-6"
              : "space-y-6"
          }
        >
          {ranked.map((g) => {
            const Icon =
              g.type === "GIFT" ? Gift : g.type === "FOOD" ? Utensils : CupSoda;
            const isPast = g.date ? new Date(g.date) < new Date() : false;
            const tone = typeTokens[g.type];
            const collected = g.collected;
            const cardRing = collected ? "ring-emerald-500/50" : tone.ring;
            const gradFrom = collected ? "from-emerald-500/15" : tone.gradFrom;
            const iconColor = collected ? "text-emerald-600" : tone.icon;
            const voteActiveColor = collected ? "text-emerald-600" : iconColor;
            const idleArrow = collected
              ? "text-emerald-600/40"
              : tone.idleArrow;
            const cardShadow = collected
              ? "shadow-emerald-500/15 hover:shadow-emerald-500/30"
              : tone.shadow;
            const typeBadgeClass = collected
              ? "bg-emerald-600/85 text-white border border-emerald-500/60"
              : g.type === "GIFT"
                ? "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30"
                : g.type === "FOOD"
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                  : "bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30";
            return (
              <div
                key={g.id}
                className={viewMode === "grid" ? "break-inside-avoid mb-6" : ""}
              >
                <Card
                  className={`group relative transition-all duration-200 border-0 ring-1 ${cardRing} overflow-hidden shadow ${cardShadow} backdrop-blur-lg bg-gradient-to-br ${gradFrom} via-background/60 to-background/50 pt-0 pb-2 ${isPast ? "opacity-60" : ""}`}
                >
                  <CardHeader className="pb-2 pt-5 px-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        {/** Titel ohne führendes Icon; Farbe weiterhin typabhängig */}
                        <CardTitle
                          className={`text-base md:text-lg font-bold leading-snug break-words pr-2 ${collected ? "text-emerald-700 dark:text-emerald-300" : iconColor}`}
                          title={g.name}
                        >
                          {g.name}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        {currentUserId && g.createdById === currentUserId && (
                          <button
                            type="button"
                            aria-label={t("modal.edit_title", { name: g.name })}
                            onClick={() => {
                              setEditing(g);
                              setIsModalOpen(true);
                            }}
                            className={`p-1 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-indigo-500 ${collected ? "text-emerald-600" : iconColor} hover:bg-white/5 dark:hover:bg-white/10`}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        <div className="flex items-center gap-1">
                          <button
                            aria-label="upvote"
                            aria-pressed={g.userVote === 1}
                            onClick={() => onVote(g.id, 1)}
                            className={`p-1 rounded transition-colors hover:bg-white/5 dark:hover:bg-white/10 ${g.userVote === 1 ? voteActiveColor + " drop-shadow" : idleArrow}`}
                          >
                            <ArrowBigUp className="w-5 h-5" />
                          </button>
                          <div
                            className={`text-sm w-8 text-center font-semibold tabular-nums ${collected ? "text-emerald-700 dark:text-emerald-300" : iconColor}`}
                            aria-label={t("score", { score: g.totalScore })}
                          >
                            {g.totalScore}
                          </div>
                          <button
                            aria-label="downvote"
                            aria-pressed={g.userVote === -1}
                            onClick={() => onVote(g.id, -1)}
                            className={`p-1 rounded transition-colors hover:bg-white/5 dark:hover:bg-white/10 ${g.userVote === -1 ? voteActiveColor + " drop-shadow" : idleArrow}`}
                          >
                            <ArrowBigDown className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-3 items-center">
                      <Badge variant="outline" className={typeBadgeClass}>
                        {t(`types.${g.type.toLowerCase()}`)}
                      </Badge>
                      {g.date && (
                        <Badge variant="outline">
                          {new Date(g.date).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Badge>
                      )}
                      {collected && (
                        <Badge className="bg-emerald-600/80">
                          {t("collected")}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  {goodieImages[g.id] && (
                    <div className="relative mx-5 mb-4 mt-1 rounded-lg overflow-hidden aspect-video border border-foreground/5 bg-foreground/5">
                      <Image
                        src={goodieImages[g.id]}
                        alt={g.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                        priority={false}
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-black/10" />
                      {collected && (
                        <div className="absolute inset-0 ring-1 ring-inset ring-emerald-500/40" />
                      )}
                    </div>
                  )}
                  <CardContent className="space-y-3 text-sm px-5 pb-4 flex flex-col flex-1">
                    <p
                      className={`font-medium leading-snug break-words ${collected ? "text-emerald-700 dark:text-emerald-300" : iconColor.replace("text-", "text-")}`}
                    >
                      {g.location}
                    </p>
                    <p className="text-muted-foreground whitespace-pre-line leading-relaxed break-words">
                      {g.instructions}
                    </p>
                    {g.registrationUrl && (
                      <a
                        href={g.registrationUrl}
                        target="_blank"
                        className={`text-xs underline ${collected ? "text-emerald-600" : iconColor}`}
                        rel="noreferrer"
                      >
                        {t("register_link")}
                      </a>
                    )}
                  </CardContent>
                  <CardFooter className="pt-0 pb-2 mt-auto">
                    <div className="flex w-full items-stretch gap-2">
                      <Button
                        size="sm"
                        aria-pressed={collected}
                        onClick={() => onToggleCollected(g.id)}
                        className={`flex-1 justify-center transition-colors border flex items-center ${
                          collected
                            ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600 shadow shadow-emerald-600/30 focus-visible:ring focus-visible:ring-emerald-500/50"
                            : "border-emerald-300 hover:border-emerald-400 text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 dark:bg-emerald-500/20 hover:bg-emerald-500/25 focus-visible:ring focus-visible:ring-emerald-400/50"
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />{" "}
                        {collected ? t("uncheck") : t("check")}
                      </Button>
                      {currentUserId && g.createdById === currentUserId && (
                        <Button
                          size="sm"
                          aria-label={t("confirm.delete_title")}
                          disabled={deletingId === g.id}
                          onClick={() => onDelete(g.id, g.name)}
                          className={`h-8 px-3 justify-center flex items-center border transition-colors bg-red-600/90 hover:bg-red-600 text-white border-red-600 shadow shadow-red-600/30 focus-visible:ring focus-visible:ring-red-500/50 disabled:opacity-60`}
                        >
                          {deletingId === g.id ? (
                            <span className="animate-spin w-4 h-4">⌛</span>
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                  {/* Hintergrund-Grafiken: weiche Farbfläche + großes, leichtes Icon wie TimelineView */}
                  <div
                    aria-hidden
                    className={`pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full ${collected ? "bg-emerald-500/20" : tone.gradFrom.replace("from-", "bg-")} blur-3xl`}
                  />
                  <Icon
                    aria-hidden
                    className={`pointer-events-none absolute -right-6 -bottom-6 w-48 h-48 rotate-12 opacity-10 blur-[1px] ${collected ? "text-emerald-600" : iconColor}`}
                  />
                </Card>
              </div>
            );
          })}
        </div>
      </div>
      <GoodieCreateModal
        open={isModalOpen}
        onOpenChange={(o) => {
          if (!o) setEditing(null);
          setIsModalOpen(o);
        }}
        onSubmit={handleSubmit}
        pending={creating || isPending}
        initialGoodie={
          editing
            ? {
                id: editing.id,
                name: editing.name,
                location: editing.location,
                instructions: editing.instructions,
                type: editing.type,
                date: editing.date || undefined,
                registrationUrl: editing.registrationUrl || undefined,
                image: undefined,
              }
            : undefined
        }
      />
    </div>
  );
}
