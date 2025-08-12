import { listGoodies } from "@/app/(server)/goodies.actions";
import GoodieTrackerClient from "./GoodieTrackerClient";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { TrackGoodieTrackerPageView } from "./TrackGoodieTrackerPageView";
export const revalidate = 30; // ISR for now

export default async function GoodieTrackerPage() {
  const goodies = await listGoodies();
  const session = await auth.api.getSession({ headers: await headers() });
  const currentUserId = session?.user?.id ?? null;
  return (
    <>
      <TrackGoodieTrackerPageView />
      <GoodieTrackerClient
        initialGoodies={goodies}
        currentUserId={currentUserId}
      />
    </>
  );
}
