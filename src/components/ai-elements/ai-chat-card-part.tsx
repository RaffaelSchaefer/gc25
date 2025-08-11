import dynamic from "next/dynamic";
import { Suspense } from "react";

// Dynamisch laden, um Probleme mit SSR zu vermeiden
const EventCard = dynamic(() => import("@/components/event-card").then(m => m.EventCard), { ssr: false });
const GoodieCard = dynamic(() => import("@/components/goodie-card").then(m => m.GoodieCard), { ssr: false });

export function AIChatCardPart({ part }: { part: any }) {
  if (part.type === "tool-getEventInformation" && part.state === "output-available" && part.output) {
    return (
      <div className="my-4">
        <Suspense fallback={<div>Event wird geladen…</div>}>
          <EventCard event={part.output} />
        </Suspense>
      </div>
    );
  }
  if (part.type === "tool-getGoodieInformation" && part.state === "output-available" && part.output) {
    return (
      <div className="my-4">
        <Suspense fallback={<div>Goodie wird geladen…</div>}>
          <GoodieCard goodie={part.output} />
        </Suspense>
      </div>
    );
  }
  return null;
}
