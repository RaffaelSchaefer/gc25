import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const locale = request.nextUrl.pathname.match(/^\/(en|de)/)?.[1] || "en";

    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:locale(en|de)/(home)/:path*"],
};
