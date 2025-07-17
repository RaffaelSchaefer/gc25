"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, Users, Star } from "lucide-react";

export default function Component() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const t = useTranslations("dayTrip");

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const scrollToSchedule = () => {
    const scheduleElement = document.getElementById("schedule-section");
    if (scheduleElement) {
      scheduleElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-900 overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(147, 51, 234, 0.3) 0%, transparent 50%)`,
            transition: "background-image 0.3s ease",
          }}
        />
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(rgba(147,51,234,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(147,51,234,0.1)_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse" />

      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Event badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 backdrop-blur-sm mb-8">
            <Star className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300 text-sm font-medium">
              Gamescom 2024 Experience
            </span>
          </div>

          {/* Main heading with holographic effect */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
            <span>{t("title")}</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            {t("description")}
          </p>

          {/* Event details grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <div className="group p-4 rounded-xl bg-gray-800/50 border border-purple-500/20 backdrop-blur-sm hover:bg-purple-500/10 hover:border-purple-500/40 transition-all duration-300">
              <Calendar className="w-6 h-6 text-purple-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-gray-400 text-sm">Dates</p>
              <p className="text-white font-semibold">Aug 19-24</p>
            </div>

            <div className="group p-4 rounded-xl bg-gray-800/50 border border-purple-500/20 backdrop-blur-sm hover:bg-purple-500/10 hover:border-purple-500/40 transition-all duration-300">
              <Clock className="w-6 h-6 text-purple-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-gray-400 text-sm">Duration</p>
              <p className="text-white font-semibold">6 Days</p>
            </div>

            <div className="group p-4 rounded-xl bg-gray-800/50 border border-purple-500/20 backdrop-blur-sm hover:bg-purple-500/10 hover:border-purple-500/40 transition-all duration-300">
              <MapPin className="w-6 h-6 text-purple-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-gray-400 text-sm">Location</p>
              <p className="text-white font-semibold">Cologne, DE</p>
            </div>

            <div className="group p-4 rounded-xl bg-gray-800/50 border border-purple-500/20 backdrop-blur-sm hover:bg-purple-500/10 hover:border-purple-500/40 transition-all duration-300">
              <Users className="w-6 h-6 text-purple-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-gray-400 text-sm">Cost</p>
              <p className="text-white font-semibold">Own Expenses</p>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-semibold rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
            >
              <span className="relative z-10">Login to Join</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-purple-300 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={scrollToSchedule}
              className="px-8 py-4 border-purple-500/50 text-purple-300 hover:bg-purple-500/10 hover:border-purple-400 rounded-xl transition-all duration-300 backdrop-blur-sm bg-transparent"
            >
              View Schedule
            </Button>
          </div>

          {/* Price and availability */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Pay for your own expenses</span>
            </div>
            <div className="w-px h-4 bg-gray-600 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400">Registration open</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-900 to-transparent" />
    </div>
  );
}
