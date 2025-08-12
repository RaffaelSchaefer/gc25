"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

export function TrackPlannerPageView() {
  useEffect(() => {
    posthog.capture("pageview_planner", { page: "Planer" });
  }, []);
  return null;
}
