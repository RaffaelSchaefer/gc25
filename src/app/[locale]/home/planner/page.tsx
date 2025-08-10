import { Suspense } from "react";
import { listPublishedEvents } from "../../../(server)/events.actions";
import { EventPlannerClient } from "./EventPlannerClient";
import { EventPlannerSkeleton } from "./EventPlannerSkeleton";
import { Toaster } from "sonner";

export default async function PlannerPage() {

  // Events aus der Datenbank laden
  const events = await listPublishedEvents();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={<EventPlannerSkeleton />}>
          <EventPlannerClient initialEvents={events} />
        </Suspense>
      </div>
      <Toaster />
    </div>
  );
}
