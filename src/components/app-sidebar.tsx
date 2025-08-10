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
import { Shield } from "lucide-react";

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
                className="group relative overflow-hidden border border-purple-500/30 bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-500 hover:to-purple-400 shadow-md shadow-purple-500/25 hover:shadow-lg hover:shadow-purple-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60 transition-all duration-300 hover:text-white focus-visible:text-white [&_*]:text-white"
              >
                <Link
                  href="/admin/dashboard"
                  aria-label={t("admin_panel", { default: "Admin Panel" })}
                  className="flex w-full items-center gap-2"
                >
                  {/* Hintergrund Glow */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(circle_at_80%_20%,rgba(147,51,234,0.35),transparent_60%)]"
                  />
                  {/* Subtiles Grid Overlay (leicht) */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-10 group-hover:opacity-20 transition-opacity duration-300 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:32px_32px]"
                  />
                  <Shield className="relative z-10 size-4 drop-shadow-sm group-hover:text-white" />
                  <span className="relative z-10 truncate text-sm font-medium tracking-wide group-hover:text-white">
                    {t("admin_panel", { default: "Admin" })}
                  </span>
                  {/* Accent Light */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-6 -top-6 size-12 rounded-full bg-purple-400/30 blur-xl opacity-0 group-hover:opacity-60 transition duration-500"
                  />
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
