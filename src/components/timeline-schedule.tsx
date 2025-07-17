"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  Calendar,
  MapPin,
  Users,
  Utensils,
  Tent,
  Car,
  Gamepad2,
} from "lucide-react";

const scheduleData = [
  {
    day: 1,
    date: "Aug 19",
    title: "Arrival & Camp Setup",
    activities: [
      { time: "10:00", activity: "Meeting at Camp Site", icon: Users },
      { time: "11:00", activity: "Building tents & setup", icon: Tent },
      { time: "19:00", activity: "Dinner out together", icon: Utensils },
    ],
  },
  {
    day: 2,
    date: "Aug 20",
    title: "Gamescom Day 1",
    activities: [
      { time: "09:00", activity: "First day at Gamescom", icon: Gamepad2 },
      { time: "12:00", activity: "Lunch at convention", icon: Utensils },
      { time: "19:00", activity: "Dinner out", icon: Utensils },
    ],
  },
  {
    day: 3,
    date: "Aug 21",
    title: "Gamescom Day 2",
    activities: [
      { time: "09:00", activity: "Gamescom exploration", icon: Gamepad2 },
      { time: "12:00", activity: "Lunch at convention", icon: Utensils },
      { time: "19:00", activity: "Dinner out", icon: Utensils },
    ],
  },
  {
    day: 4,
    date: "Aug 22",
    title: "Gamescom Day 3",
    activities: [
      { time: "09:00", activity: "Final Gamescom day", icon: Gamepad2 },
      { time: "12:00", activity: "Lunch at convention", icon: Utensils },
      { time: "19:00", activity: "Dinner out", icon: Utensils },
    ],
  },
  {
    day: 5,
    date: "Aug 23",
    title: "Cologne Activity Day",
    activities: [
      {
        time: "10:00",
        activity: "Activity day hosted by Vio & Charly",
        icon: MapPin,
      },
      { time: "12:00", activity: "Lunch in Cologne", icon: Utensils },
      { time: "19:00", activity: "Dinner out", icon: Utensils },
    ],
  },
  {
    day: 6,
    date: "Aug 24",
    title: "Departure",
    activities: [
      { time: "09:00", activity: "Remove tents & pack up", icon: Tent },
      { time: "11:00", activity: "Driving home", icon: Car },
    ],
  },
];

export default function TimelineSchedule() {
  const [activeDay, setActiveDay] = useState(1);
  const [scrollProgress, setScrollProgress] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const elementTop = rect.top;
        const elementHeight = rect.height;

        // Calculate scroll progress within the timeline section
        const progress = Math.max(
          0,
          Math.min(
            1,
            (windowHeight - elementTop) / (windowHeight + elementHeight),
          ),
        );
        setScrollProgress(progress);

        // Update active day based on scroll progress
        const dayIndex = Math.floor(progress * scheduleData.length);
        setActiveDay(Math.min(scheduleData.length, Math.max(1, dayIndex + 1)));
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial call

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      id="schedule-section"
      ref={timelineRef}
      className="min-h-screen bg-gray-900 py-20"
    >
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
              6-Day Schedule
            </h2>
            <p className="text-xl text-gray-300">
              Your complete Gamescom 2024 adventure timeline
            </p>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Progress line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-700">
              <div
                className="w-full bg-gradient-to-b from-purple-500 to-purple-400 transition-all duration-300 ease-out"
                style={{ height: `${scrollProgress * 100}%` }}
              />
            </div>

            {/* Timeline items */}
            <div className="space-y-12">
              {scheduleData.map((dayData, index) => (
                <div
                  key={dayData.day}
                  className={`relative pl-20 transition-all duration-500 ${
                    activeDay >= dayData.day
                      ? "opacity-100 transform translate-x-0"
                      : "opacity-50 transform translate-x-4"
                  }`}
                >
                  {/* Day indicator */}
                  <div
                    className={`absolute left-6 w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                      activeDay >= dayData.day
                        ? "bg-purple-500 border-purple-400 shadow-lg shadow-purple-500/50"
                        : "bg-gray-700 border-gray-600"
                    }`}
                  />

                  {/* Day content */}
                  <div
                    className={`bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border transition-all duration-300 ${
                      activeDay === dayData.day
                        ? "border-purple-500/40 shadow-lg shadow-purple-500/10"
                        : "border-gray-700/50"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-purple-400 font-bold text-lg">
                            Day {dayData.day}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-300">{dayData.date}</span>
                        </div>
                        <h3 className="text-2xl font-bold text-white">
                          {dayData.title}
                        </h3>
                      </div>
                    </div>

                    {/* Activities */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {dayData.activities.map((activity, activityIndex) => (
                        <div
                          key={activityIndex}
                          className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors"
                        >
                          <div className="flex-shrink-0 w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                            <activity.icon className="w-4 h-4 text-purple-400" />
                          </div>
                          <div>
                            <div className="text-purple-300 text-sm font-medium">
                              {activity.time}
                            </div>
                            <div className="text-gray-200 text-sm">
                              {activity.activity}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom note */}
          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 backdrop-blur-sm">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-sm">
                Schedule may be subject to minor changes
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
