import DashboardOverview from "@/components/dashboard/overview";
import { listPublishedEvents } from "../../(server)/events.actions";
import { listGoodies } from "../../(server)/goodies.actions";

export default async function HomePage() {
  const [days, goodies] = await Promise.all([
    listPublishedEvents(),
    listGoodies().catch(() => []), // Fallback, falls Goodies-Abfrage fehlschlägt
  ]);
  return <DashboardOverview days={days} goodies={goodies} />;
}
