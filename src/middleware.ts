import { NextRequest } from "next/server";
import i18nMiddleware from "./middlewares/i18n-middleware";
import { middleware as homeSecureMiddleware } from "./middlewares/secure-paths-middleware";
import { middleware as adminSecureMiddleware } from "./middlewares/admin-secure-middleware";

/**
 * @author Raffael Elias Schäfer
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const i18nResponse = i18nMiddleware(request);

  if (i18nResponse && i18nResponse.status === 307) {
    return i18nResponse;
  }

  if (pathname.match(/^\/(en|de)\/home/)) {
    return await homeSecureMiddleware(request);
  }
  if (pathname.match(/^\/(en|de)\/admin/)) {
    return await adminSecureMiddleware(request);
  }

  return i18nResponse;
}

export const config = {
  matcher: ["/", "/:locale(en|de)/:path*"],
};
