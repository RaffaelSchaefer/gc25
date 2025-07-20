"use client";

import { Button } from "@/components/ui/button";
import { Settings, Palette, User } from "lucide-react";

interface SettingsSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const settingsNavigation = [
  {
    id: "general",
    label: "General",
    icon: Settings,
  },
  {
    id: "appearance",
    label: "Appearance",
    icon: Palette,
  },
  {
    id: "account",
    label: "Account",
    icon: User,
  },
];

export function SettingsSidebar({
  activeSection,
  onSectionChange,
}: SettingsSidebarProps) {
  return (
    <nav className="space-y-2">
      {settingsNavigation.map((item) => {
        const Icon = item.icon;
        return (
          <Button
            key={item.id}
            variant={activeSection === item.id ? "secondary" : "ghost"}
            className="w-full justify-start gap-2"
            onClick={() => onSectionChange(item.id)}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Button>
        );
      })}
    </nav>
  );
}
