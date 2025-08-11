"use client";

import Image from "next/image";
import type { GoodieDto } from "@/app/(server)/goodies.actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Gift, Utensils, CupSoda } from "lucide-react";

interface Props {
  goodie: GoodieDto;
  goodieImage?: string | null;
}

export function GoodieCard({ goodie, goodieImage }: Props) {
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

  const Icon =
    goodie.type === "GIFT"
      ? Gift
      : goodie.type === "FOOD"
        ? Utensils
        : CupSoda;
  const isPast = goodie.date ? new Date(goodie.date) < new Date() : false;
  const tone = typeTokens[goodie.type];
  const collected = goodie.collected;
  const cardRing = collected ? "ring-emerald-500/50" : tone.ring;
  const gradFrom = collected ? "from-emerald-500/15" : tone.gradFrom;
  const iconColor = collected ? "text-emerald-600" : tone.icon;
  const cardShadow = collected
    ? "shadow-emerald-500/15 hover:shadow-emerald-500/30"
    : tone.shadow;
  const typeBadgeClass = collected
    ? "bg-emerald-600/85 text-white border border-emerald-500/60"
    : goodie.type === "GIFT"
      ? "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30"
      : goodie.type === "FOOD"
        ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
        : "bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30";

  return (
    <div className={"break-inside-avoid mb-6"}>
      <Card
        className={`group relative transition-all duration-200 border-0 ring-1 ${cardRing} overflow-hidden shadow ${cardShadow} backdrop-blur-lg bg-gradient-to-br ${gradFrom} via-background/60 to-background/50 pt-0 pb-2 ${isPast ? "opacity-60" : ""}`}
      >
        <CardHeader className="pb-2 pt-5 px-5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <CardTitle
                className={`text-base md:text-lg font-bold leading-snug break-words pr-2 ${collected ? "text-emerald-700 dark:text-emerald-300" : iconColor}`}
                title={goodie.name}
              >
                {goodie.name}
              </CardTitle>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 mt-3 items-center">
            <Badge variant="outline" className={typeBadgeClass}>
              {goodie.type.toLowerCase()}
            </Badge>
            {goodie.date && (
              <Badge variant="outline">
                {new Date(goodie.date).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Badge>
            )}
            {collected && <Badge className="bg-emerald-600/80">Collected</Badge>}
          </div>
        </CardHeader>
        {goodieImage && (
          <div className="relative mx-5 mb-4 mt-1 rounded-lg overflow-hidden aspect-video border border-foreground/5 bg-foreground/5">
            <Image
              src={goodieImage}
              alt={goodie.name}
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
            {goodie.location}
          </p>
          <p className="text-muted-foreground whitespace-pre-line leading-relaxed break-words">
            {goodie.instructions}
          </p>
          {goodie.registrationUrl && (
            <a
              href={goodie.registrationUrl}
              target="_blank"
              className={`text-xs underline ${collected ? "text-emerald-600" : iconColor}`}
              rel="noreferrer"
            >
              Registration Link
            </a>
          )}
        </CardContent>
        <CardFooter className="pt-0 pb-2 mt-auto">
          <div className="flex w-full items-center justify-between gap-3 flex-wrap">
            {goodie.createdBy && (
              <div className="flex items-center gap-1 leading-none order-1">
                <Avatar className="size-6 ring ring-border/40">
                  {goodie.createdBy.image && (
                    <AvatarImage
                      src={goodie.createdBy.image}
                      alt={goodie.createdBy.name}
                    />
                  )}
                  <AvatarFallback className="text-[9px] font-medium">
                    {goodie.createdBy.name
                      .split(/\s+/)
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span
                  className="text-[11px] text-muted-foreground"
                  title={goodie.createdBy.name}
                >
                  Created by {goodie.createdBy.name}
                </span>
              </div>
            )}
          </div>
        </CardFooter>
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
}
