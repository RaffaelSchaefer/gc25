import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Matcher für alle Pfade außer Next.js interne und statische Dateien
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
