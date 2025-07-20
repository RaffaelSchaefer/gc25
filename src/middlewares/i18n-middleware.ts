import createMiddleware from "next-intl/middleware";

export default createMiddleware({ locales: ["de", "en"], defaultLocale: "de" });

export const config = {
  matcher: ["/", `/:locale(en|de)/:path*`],
};
