import helmet from "helmet";

/**
 * Strict security header middleware.
 *
 * Why we build this on top of helmet rather than using the helmet
 * defaults: helmet's defaults are good but we want to be *explicit*
 * about every header for audit purposes, and we add a few extras
 * (Permissions-Policy, COOP) that helmet doesn't enable by default.
 *
 * CSP is intentionally left to the static frontend (`frontend/serve.ts`),
 * which is the document origin. The API never serves HTML.
 */
export function securityHeaders() {
  return [
    helmet({
      // We don't serve HTML from the API, so a strict CSP is unnecessary
      // and would interfere with downstream proxies. Frontend sets CSP.
      contentSecurityPolicy: false,
      // API never frames anything.
      frameguard: { action: "deny" },
      // Cross-origin isolation: API responses are consumed by JS,
      // not embedded as resources elsewhere.
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
      crossOriginOpenerPolicy: { policy: "same-origin" },
      // 1 year HSTS, preload + subdomains. Required for HTTPS-only.
      hsts: {
        maxAge: 31_536_000,
        includeSubDomains: true,
        preload: true,
      },
      // No referrer leak to third parties; full referrer on same origin.
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      // Browsers should not sniff MIME types.
      noSniff: true,
      // Prevent Adobe Flash / PDF cross-domain policy abuse (legacy).
      permittedCrossDomainPolicies: { permittedPolicies: "none" },
      // DNS prefetch off for API responses.
      dnsPrefetchControl: { allow: false },
      // X-XSS-Protection is deprecated; helmet disables by default.
      xssFilter: false,
      // Remove X-Powered-By (also done at app level).
      hidePoweredBy: true,
    }),
    // Permissions-Policy: lock down browser features helmet doesn't.
    (_req: unknown, res: { setHeader(k: string, v: string): void }, next: () => void) => {
      res.setHeader(
        "Permissions-Policy",
        [
          "camera=()",
          "microphone=()",
          "geolocation=()",
          "interest-cohort=()",
          "payment=()",
          "usb=()",
          "magnetometer=()",
          "accelerometer=()",
          "gyroscope=()",
        ].join(", "),
      );
      next();
    },
  ];
}
