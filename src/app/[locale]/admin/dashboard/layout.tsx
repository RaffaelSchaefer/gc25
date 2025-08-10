import { SidebarInset } from "@/components/ui/sidebar";
import Link from "next/link";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { getLocale } from "next-intl/server";

export const dynamic = "force-dynamic";

const navItems: { label: string; href: string; segment: string }[] = [
  { label: "Overview", href: "./", segment: "" },
  { label: "Users", href: "./users", segment: "users" },
];

export default async function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const locale = await getLocale();
  const base = `/${locale}/admin/dashboard`;
  // We cannot know pathname on server for active state per segment without extra params; keep simple styling and let client refine later.

  return (
    <div className="flex h-screen min-h-screen">
      <aside className="h-screen w-48 shrink-0 border-r bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40 overflow-y-auto">
        <div className="p-4 border-b">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            Admin
          </h2>
        </div>
        <nav className="p-2 space-y-1">
          {navItems.map((n) => (
            <Link
              key={n.href}
              href={`${base}${n.segment ? "/" + n.segment : ""}`}
              className={cn(
                "block rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted hover:text-foreground",
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </aside>
      <SidebarInset className="flex-1 overflow-auto p-0">
        {children}
      </SidebarInset>
    </div>
  );
}
