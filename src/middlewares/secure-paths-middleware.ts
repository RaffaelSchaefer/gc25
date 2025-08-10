import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Helper zum robusten Bauen interner API-URLs ohne versehentlich einen falschen (z.B. DB) Port zu treffen.
// Falls Upstream / Proxy falsche Port-Infos durchreicht (führt zu ERR_SSL_WRONG_VERSION_NUMBER),
// können INTERNAL_FETCH_PROTOCOL / INTERNAL_FETCH_PORT genutzt werden um zu erzwingen, was wirklich läuft.
function buildInternalApiUrl(req: NextRequest, pathname: string) {
  const u = req.nextUrl.clone();
  u.pathname = pathname;
  u.search = "";
  // Optional overrides (compile-time ersetzt); nur setzen wenn definiert.
  if (process.env.INTERNAL_FETCH_PROTOCOL) {
    u.protocol = process.env.INTERNAL_FETCH_PROTOCOL;
  }
  if (process.env.INTERNAL_FETCH_PORT) {
    u.port = process.env.INTERNAL_FETCH_PORT;
  }
  return u; // absolute URL
}

function debugLog(label: string, data: unknown) {
  if (process.env.DEBUG_SECURE_MW === "1") {
    console.log(`[secure-mw] ${label}:`, data);
  }
}

const getLocale = (p: string) =>
  (p.match(/^\/(en|de)(?:\/|$)/)?.[1] ?? "en") as "en" | "de";
const needsAdmin = (p: string) => /^\/(en|de)\/admin(?:\/|$)/.test(p);

async function hasSessionFast(req: NextRequest) {
  // Opaque check: reicht fürs Gate/Redirect
  return (
    Boolean(getSessionCookie(req)) ||
    req.cookies.get("better-auth.session_token")
  );
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const locale = getLocale(pathname);
  const nextParam = encodeURIComponent(pathname + search);

  if (!(await hasSessionFast(request))) {
    return NextResponse.redirect(
      new URL(`/${locale}/login?next=${nextParam}`, request.url),
    );
  }

  if (needsAdmin(pathname)) {
    // Admin-Check via interne API (Node runtime)
    const adminUrl = buildInternalApiUrl(request, "/api/auth/is-admin");
    debugLog("adminCheck.url", {
      href: adminUrl.href,
      protocol: adminUrl.protocol,
      host: adminUrl.host,
      pathname: adminUrl.pathname,
      port: adminUrl.port,
    });

    let res: Response | null = null;
    try {
      res = await fetch(adminUrl, {
        headers: { cookie: request.headers.get("cookie") ?? "" },
        cache: "no-store",
      });
    } catch (err: unknown) {
      let meta: Record<string, unknown> = {};
      if (err && typeof err === "object") {
        if (err instanceof Error) {
          meta.message = err.message;
          meta.name = err.name;
          interface MaybeNodeError {
            code?: string | number;
            cause?: unknown;
          }
            const ne = err as Error & MaybeNodeError;
            if (ne.code !== undefined) meta.code = ne.code;
            if (ne.cause !== undefined) meta.cause = ne.cause;
        } else {
          meta = { ...(err as Record<string, unknown>) };
        }
      }
      // Spezifisches Logging für SSL / falsche Port-Probleme
      debugLog("adminCheck.fetch.error", meta);
      // Hard-Fallback: Behandle wie nicht-admin (kein Hard-Error für User-Flow)
      return NextResponse.redirect(new URL(`/${locale}/home`, request.url));
    }

    if (res.status === 401) {
      return NextResponse.redirect(
        new URL(`/${locale}/login?next=${nextParam}`, request.url),
      );
    }
    if (!res.ok) {
      // Fallback: behandel wie nicht admin
      return NextResponse.redirect(new URL(`/${locale}/home`, request.url));
    }

    const { isAdmin } = await res.json();
    if (!isAdmin) {
      return NextResponse.redirect(new URL(`/${locale}/home`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:locale(en|de)/(home)/:path*", "/:locale(en|de)/(admin)/:path*"],
};
