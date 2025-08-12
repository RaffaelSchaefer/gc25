"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

export function TrackGoodieTrackerPageView() {
  useEffect(() => {
    posthog.capture("pageview_goodie_tracker", { page: "Goodie Tracker" });
  }, []);
  return null;
}
