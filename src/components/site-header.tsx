"use client";

import { SidebarIcon } from "lucide-react";

import { InteractiveBreadcrumb } from "@/components/interactive-breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/components/ui/sidebar";

export function SiteHeader() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="top-0 z-50 flex w-full items-center sticky border-b-0 ring-1 ring-indigo-500/20 bg-gradient-to-b from-indigo-500/5 to-background/90 backdrop-blur-md">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4 space-between">
        <Button
          className="h-8 w-8"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
        >
          <SidebarIcon />
        </Button>
        <Separator orientation="vertical" className="mr-2 h-4" />
        <InteractiveBreadcrumb className="hidden sm:block" />
      </div>
    </header>
  );
}
