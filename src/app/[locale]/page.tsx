import DayTripHero from "@/components/day-trip-hero";
import TimelineSchedule from "@/components/timeline-schedule";
import { listPublishedEvents } from "../(server)/events.actions";

export default async function Page() {
  const days = await listPublishedEvents();
  return (
    <>
      <DayTripHero />
      <TimelineSchedule days={days} />
    </>
  );
}
