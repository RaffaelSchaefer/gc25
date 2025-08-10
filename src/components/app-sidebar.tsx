"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Image from "next/image";
import { Link } from "@/i18n/routing";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const t = useTranslations("sidebar");

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]! border-0 ring-1 ring-indigo-500/20 bg-gradient-to-b from-indigo-500/5 via-background to-background/95"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/home">
                <div className="relative text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg border-0 ring-1 ring-indigo-500/30 bg-gradient-to-br from-indigo-500/15 to-transparent">
                  <Image
                    src="/logo.png"
                    alt={t("company_name")}
                    width={64}
                    height={64}
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-3 -top-3 h-8 w-8 rounded-full bg-indigo-500/20 blur-xl"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {t("company_name")}
                  </span>
                  <span className="truncate text-xs">{t("product_name")}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/home/planner">
                <span className="truncate text-sm">{t("planner")}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/home/goodie-tracker">
                <span className="truncate text-sm">{t("goodie_tracker")}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent></SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
