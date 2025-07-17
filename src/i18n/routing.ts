import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // Eine Liste aller Locales, die unterstützt werden
  locales: ["de", "en"],

  // Die Standard-Locale, wenn keine in der URL angegeben ist
  defaultLocale: "de",
});

// Leichte Wrapper um Next.js' Navigation APIs
// die automatisch die aktuelle Locale berücksichtigen
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
