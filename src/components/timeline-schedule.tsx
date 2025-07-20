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

const iconMap = {
  Users,
  Tent,
  Utensils,
  Gamepad2,
  MapPin,
  Car,
};

export default function TimelineSchedule() {
  const t = useTranslations("schedule");
  const scheduleData = t.raw("days");
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

        const progress = Math.max(
          0,
          Math.min(
            1,
            (windowHeight - elementTop) / (windowHeight + elementHeight),
          ),
        );
        setScrollProgress(progress);

        const dayIndex = Math.floor(progress * scheduleData.length);
        setActiveDay(Math.min(scheduleData.length, Math.max(1, dayIndex + 1)));
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [scheduleData.length]);

  return (
    <div
      id="schedule-section"
      ref={timelineRef}
      className="min-h-screen bg-gray-900 py-20"
    >
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
              {t("title")}
            </h2>
            <p className="text-xl text-gray-300">{t("subtitle")}</p>
          </div>

          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-700">
              <div
                className="w-full bg-gradient-to-b from-purple-500 to-purple-400 transition-all duration-300 ease-out"
                style={{ height: `${scrollProgress * 100}%` }}
              />
            </div>

            <div className="space-y-12">
              {scheduleData.map(
                (dayData: {
                  day: number;
                  date: string;
                  title: string;
                  activities: {
                    time: string;
                    activity: string;
                    icon: string;
                  }[];
                }) => {
                  return (
                    <div
                      key={dayData.day}
                      className={`relative pl-20 transition-all duration-500 ${
                        activeDay >= dayData.day
                          ? "opacity-100 transform translate-x-0"
                          : "opacity-50 transform translate-x-4"
                      }`}
                    >
                      <div
                        className={`absolute left-6 w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                          activeDay >= dayData.day
                            ? "bg-purple-500 border-purple-400 shadow-lg shadow-purple-500/50"
                            : "bg-gray-700 border-gray-600"
                        }`}
                      />

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
                              <span className="text-gray-300">
                                {dayData.date}
                              </span>
                            </div>
                            <h3 className="text-2xl font-bold text-white">
                              {dayData.title}
                            </h3>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {dayData.activities.map(
                            (
                              activity: {
                                time: string;
                                activity: string;
                                icon: string;
                              },
                              activityIndex: number,
                            ) => {
                              const ActivityIcon =
                                iconMap[activity.icon as keyof typeof iconMap];
                              return (
                                <div
                                  key={activityIndex}
                                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors"
                                >
                                  <div className="flex-shrink-0 w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                    {ActivityIcon && (
                                      <ActivityIcon className="w-4 h-4 text-purple-400" />
                                    )}
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
                              );
                            },
                          )}
                        </div>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </div>

          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 backdrop-blur-sm">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-sm">{t("notice")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
