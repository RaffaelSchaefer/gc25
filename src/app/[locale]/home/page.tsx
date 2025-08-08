import DashboardOverview from "@/components/dashboard/overview";
import { listPublishedEvents } from "../../(server)/events.actions";

export default async function HomePage() {
  const days = await listPublishedEvents();
  return (
    <>
      <DashboardOverview days={days} />
    </>
  );
}
