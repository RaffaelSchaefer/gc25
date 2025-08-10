import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Baut eine interne API URL für server-internen Fetch.
 * Ziel: Kein TLS-Handschlag gegen einen Port, der nur Plain-HTTP spricht ("wrong version number").
 * Reihenfolge:
 * 1. Falls INTERNAL_API_ORIGIN gesetzt (z.B. http://app:3000) -> daran resolven.
 * 2. Sonst auf Basis der eingehenden URL, aber wenn sie https ist, und wir nicht explizit HTTPS erzwingen,
 *    wird auf http downgraded (TLS terminierte Proxy wie Coolify / Traefik / Caddy).
 * 3. Ports können via INTERNAL_FETCH_PORT oder INTERNAL_HTTP_PORT übersteuert werden.
 * 4. Fallback Host: request.headers.get("host") oder 127.0.0.1
 */
function buildInternalApiUrl(req: NextRequest, pathname: string) {
  const explicitOrigin = process.env.INTERNAL_API_ORIGIN;
  if (explicitOrigin) {
    return new URL(pathname, explicitOrigin);
  }

  // Basis: eingehende URL klonen (enthält Host)
  const u = req.nextUrl.clone();
  u.pathname = pathname;
  u.search = "";

  const forceHttps = process.env.INTERNAL_FORCE_HTTPS === "1";
  const overrideProto = process.env.INTERNAL_FETCH_PROTOCOL; // explizit > Force
  const overridePort =
    process.env.INTERNAL_FETCH_PORT ||
    process.env.INTERNAL_HTTP_PORT ||
    process.env.PORT;

  if (overrideProto) {
    u.protocol = /:$/i.test(overrideProto) ? overrideProto : `${overrideProto}:`;
  } else {
    // Wenn eingehend https aber wir sehr wahrscheinlich im Container ohne internem TLS sind => http
    if (u.protocol === "https:" && !forceHttps) {
      u.protocol = "http:";
    }
  }

  if (overridePort) {
    u.port = overridePort;
  } else if (!u.port) {
    // Falls kein Port, Standard abhängig vom Protokoll hinzufügen damit URL eindeutig ist
    if (u.protocol === "http:") u.port = "3000"; // typischer Next.js default
  }

  // Sicherheitsnetz: Wenn Host fehlt (Edge Fälle) -> 127.0.0.1
  if (!u.host) {
    const hostHeader = req.headers.get("host")?.trim();
    const fallbackHost = hostHeader || `127.0.0.1:${u.port || "3000"}`;
    u.host = fallbackHost;
  }

  return u; // absolute URL
}

function debugLog(label: string, data: unknown) {
  if (process.env.DEBUG_SECURE_MW === "1") {
    console.log(`[admin-secure-mw] ${label}:`, data);
  }
}

const getLocale = (p: string) =>
  (p.match(/^\/(en|de)(?:\/|$)/)?.[1] ?? "en") as "en" | "de";

async function hasSessionFast(req: NextRequest) {
  return (
    Boolean(getSessionCookie(req)) ||
    req.cookies.get("better-auth.session_token")
  );
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const locale = getLocale(pathname);
  const nextParam = encodeURIComponent(pathname + search);

  // Erst Session prüfen
  if (!(await hasSessionFast(request))) {
    return NextResponse.redirect(
      new URL(`/${locale}/login?next=${nextParam}`, request.url),
    );
  }

  // Admin-Check via interne API (Node runtime)
  const adminUrl = buildInternalApiUrl(request, "/api/auth/is-admin");
  debugLog("adminCheck.url", {
    href: adminUrl.href,
    protocol: adminUrl.protocol,
    host: adminUrl.host,
    pathname: adminUrl.pathname,
    port: adminUrl.port,
  });

  // Zusatz: kurze Heuristik, um Misskonfigurationen zu erkennen
  if (process.env.DEBUG_SECURE_MW === "1") {
    if (adminUrl.protocol === "https:" && /^(localhost|127\.0\.0\.1)(:|$)/.test(adminUrl.host)) {
      console.warn(
        "[admin-secure-mw] Warnung: https gegen localhost – vermutlich unnötig und kann SSL Fehler erzeugen."
      );
    }
  }

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
    debugLog("adminCheck.fetch.error", meta);
    return NextResponse.redirect(new URL(`/${locale}/home`, request.url));
  }

  if (res.status === 401) {
    return NextResponse.redirect(
      new URL(`/${locale}/login?next=${nextParam}`, request.url),
    );
  }
  if (!res.ok) {
    return NextResponse.redirect(new URL(`/${locale}/home`, request.url));
  }

  const { isAdmin } = await res.json();
  if (!isAdmin) {
    return NextResponse.redirect(new URL(`/${locale}/home`, request.url));
  }

  return NextResponse.next();
}
