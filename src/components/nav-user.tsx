"use client";

import { createAvatar } from "@dicebear/core";
import { adventurer } from "@dicebear/collection";
import { BadgeCheck, ChevronsUpDown, LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Badge } from "@/components/ui/badge";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export function NavUser() {
  const { data: session } = authClient.useSession();
  const { isMobile } = useSidebar();
  const router = useRouter();
  const t = useTranslations("nav-user");

  if (!session?.user) return null;

  const avatar = createAvatar(adventurer, {
    seed: session.user.name ?? "default",
  }).toDataUri();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isAdmin = (session.user as unknown as any)?.isAdmin === true;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage
                  src={session.user.image ?? avatar}
                  alt={session.user.name ?? "user"}
                />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium flex items-center gap-1">
                  <span>{session.user.name}</span>
                  {isAdmin && (
                    <Badge className="h-4 px-1 text-[10px] leading-none bg-gradient-to-r from-purple-600 to-purple-500 text-white border border-purple-400/40 shadow-sm tracking-wide">
                      Admin
                    </Badge>
                  )}
                </span>
                <span className="truncate text-xs">{session.user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={session.user.image ?? avatar}
                    alt={session.user.name ?? "user"}
                  />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium flex items-center gap-1">
                    <span>{session.user.name}</span>
                    {isAdmin && (
                      <Badge className="h-4 px-1 text-[10px] leading-none bg-gradient-to-r from-purple-600 to-purple-500 text-white border border-purple-400/40 shadow-sm tracking-wide">
                        Admin
                      </Badge>
                    )}
                  </span>
                  <span className="truncate text-xs">{session.user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push("/home/settings")}>
                <BadgeCheck />
                {t("settings")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      router.push("/login"); // redirect to login page
                    },
                  },
                })
              }
            >
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
