// =============================================================================
// CORS allowlist
// =============================================================================
// No wildcard. Origins must be explicitly listed in ALLOWED_ORIGINS.
// Falls back to the production Enix domains if the env var is unset, to be
// safe in production even if config is missing.

const FALLBACK = ["https://enixexteriors.com", "https://www.enixexteriors.com"];

function loadAllowed(): Set<string> {
  const raw = process.env.ALLOWED_ORIGINS || FALLBACK.join(",");
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

let allowed = loadAllowed();
// Re-load on every request in dev; cache in production. Cheap either way.
function getAllowed(): Set<string> {
  if (process.env.NODE_ENV !== "production") allowed = loadAllowed();
  return allowed;
}

export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  return getAllowed().has(origin);
}

export function corsHeadersFor(origin: string | undefined): Record<string, string> {
  const ok = isAllowedOrigin(origin);
  return {
    "Access-Control-Allow-Origin": ok && origin ? origin : "null",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}
