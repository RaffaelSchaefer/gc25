"use client";

import { useState } from "react";
import { SettingsSidebar } from "@/components/settings-sidebar";
import { GeneralSettings } from "@/components/settings/general";
import { AppearanceSettings } from "@/components/settings/appearance";
import { AccountSettings } from "@/components/settings/account";

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("general");

  const renderActiveSection = () => {
    switch (activeSection) {
      case "general":
        return <GeneralSettings />;
      case "appearance":
        return <AppearanceSettings />;
      case "account":
        return <AccountSettings />;
      default:
        return <GeneralSettings />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto">
        <div className="mb-8 relative overflow-hidden rounded-xl border-0 ring-1 ring-indigo-500/15 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent p-6">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-indigo-500/70 bg-clip-text text-transparent">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account settings and preferences.
          </p>
          <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-indigo-500/10 blur-2xl" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
          <SettingsSidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />
          <div className="space-y-6">{renderActiveSection()}</div>
        </div>
      </div>
    </div>
  );
}
