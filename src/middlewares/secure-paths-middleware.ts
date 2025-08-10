import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const locale = request.nextUrl.pathname.match(/^\/(en|de)/)?.[1] || "en";

    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  // Additional admin protection: if route under /:locale/admin ensure user has isAdmin
  if (request.nextUrl.pathname.match(/^\/(en|de)\/admin/)) {
    try {
      // Reuse server auth to fetch session (need headers to include cookie)
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user?.isAdmin) {
        const locale =
          request.nextUrl.pathname.match(/^\/(en|de)/)?.[1] || "en";
        return NextResponse.redirect(new URL(`/${locale}/home`, request.url));
      }
    } catch {
      const locale = request.nextUrl.pathname.match(/^\/(en|de)/)?.[1] || "en";
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:locale(en|de)/(home)/:path*", "/:locale(en|de)/(admin)/:path*"],
};
