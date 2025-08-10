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
import { authClient } from "@/lib/auth-client";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const t = useTranslations("sidebar");
  const { data: session } = authClient.useSession();
  // Temporary: better-auth types don't yet include custom prisma field `isAdmin`.
  // We cast to any here; the field exists in the database and is exposed via API.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isAdmin = (session?.user as unknown as any)?.isAdmin === true;

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
        {isAdmin && (
          <SidebarMenu className="mb-2 space-y-1">
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="bg-purple-50 hover:bg-purple-100 dark:bg-purple-950 dark:hover:bg-purple-900"
              >
                <Link href="/admin/dashboard">
                  <span className="truncate text-sm">
                    {t("admin_panel", { default: "Admin" })}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
