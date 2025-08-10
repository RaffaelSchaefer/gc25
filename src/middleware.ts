import { NextRequest } from "next/server";
import i18nMiddleware from "./middlewares/i18n-middleware";
import { middleware as securePathsMiddleware } from "./middlewares/secure-paths-middleware";

/**
 * @author Raffael Elias Schäfer
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const i18nResponse = i18nMiddleware(request);

  if (i18nResponse && i18nResponse.status === 307) {
    return i18nResponse;
  }

  if (pathname.match(/^\/(en|de)\/(home|admin)/)) {
    const secureResponse = await securePathsMiddleware(request);
    return secureResponse;
  }

  return i18nResponse;
}

export const config = {
  matcher: ["/", "/:locale(en|de)/:path*"],
};
