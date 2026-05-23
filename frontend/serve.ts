import { file } from "bun";
import { join, extname, normalize } from "node:path";
import { existsSync, statSync } from "node:fs";

const PORT = Number(process.env.PORT || 3000);
const DIST = join(import.meta.dir, "dist");
const INDEX = join(DIST, "index.html");

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

// Base security headers applied to every response. HSTS is only emitted when we know
// the upstream is HTTPS — set FORCE_HSTS=1 once the permanent domain is on HTTPS.
const FORCE_HSTS = process.env.FORCE_HSTS === "1";

const BASE_SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Cross-Origin-Opener-Policy": "same-origin",
};

// CSP — written for the current Vite build + Zo Space lead API endpoint.
const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' https: data: blob:",
  "connect-src 'self' https://opalsage.zo.space https://*.zo.computer https://api.zo.computer",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self' https://opalsage.zo.space",
].join("; ");

function securityHeaders(): Record<string, string> {
  const h = { ...BASE_SECURITY_HEADERS, "Content-Security-Policy": CSP_DIRECTIVES };
  if (FORCE_HSTS) h["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
  return h;
}

function safeJoin(root: string, rel: string): string | null {
  const decoded = decodeURIComponent(rel);
  const resolved = normalize(join(root, decoded));
  if (!resolved.startsWith(root)) return null;
  return resolved;
}

function isStatic(path: string): boolean {
  if (!extname(path)) return false;
  if (!existsSync(path)) return false;
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

const server = Bun.serve({
  port: PORT,
  fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/healthz") {
      return new Response("ok", {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8", ...securityHeaders() },
      });
    }

    const candidate = safeJoin(DIST, url.pathname === "/" ? "/index.html" : url.pathname);
    if (candidate && isStatic(candidate)) {
      const ext = extname(candidate).toLowerCase();
      const type = MIME[ext] || "application/octet-stream";
      const cacheable = ext !== ".html";
      return new Response(file(candidate), {
        headers: {
          "Content-Type": type,
          "Cache-Control": cacheable
            ? "public, max-age=31536000, immutable"
            : "no-cache",
          ...securityHeaders(),
        },
      });
    }

    // If the URL looks like an asset (has an extension) and the file doesn't
    // exist, return a real 404 instead of falling through to the SPA shell.
    if (extname(url.pathname)) {
      return new Response("Not Found", {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8", ...securityHeaders() },
      });
    }

    // SPA fallback — serve index.html for unknown extension-less paths
    return new Response(file(INDEX), {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
        ...securityHeaders(),
      },
    });
  },
});

console.log(`enix-site listening on :${server.port}`);
