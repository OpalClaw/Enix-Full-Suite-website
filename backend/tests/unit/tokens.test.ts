// =============================================================================
// JWT token integrity tests — algorithm confusion, alg=none, type mixing
// =============================================================================
import { beforeAll, describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";

const ACCESS_SECRET = "test-access-secret-32-chars-long-x" + "1".repeat(32);
const REFRESH_SECRET = "test-refresh-secret-32-chars-long" + "2".repeat(32);

beforeAll(() => {
  process.env.JWT_ACCESS_SECRET = ACCESS_SECRET;
  process.env.JWT_REFRESH_SECRET = REFRESH_SECRET;
  process.env.JWT_ACCESS_TTL = "15m";
  process.env.JWT_REFRESH_TTL = "30d";
});

describe("JWT — algorithm confusion & alg=none rejection", () => {
  it("verifyAccess accepts only HS256-signed tokens", async () => {
    const { signAccess, verifyAccess } = await import("../../src/auth/tokens.js");
    const tok = signAccess({ sub: "u1", email: "u@x.com", role: "admin" });
    const claims = verifyAccess(tok);
    expect(claims.sub).toBe("u1");
    expect(claims.type).toBe("access");
  });

  it("rejects a JWT with alg=none", async () => {
    const { verifyAccess } = await import("../../src/auth/tokens.js");
    // Hand-craft an alg=none token. jwt.sign({alg:"none"}) returns base64 with no sig.
    // We force this by writing the header + payload + empty signature ourselves.
    const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({ sub: "attacker", email: "a@a.com", role: "admin", type: "access" }),
    ).toString("base64url");
    const fakeToken = `${header}.${payload}.`;
    expect(() => verifyAccess(fakeToken)).toThrow();
  });

  it("rejects a token signed with the REFRESH secret presented as ACCESS", async () => {
    const { verifyAccess } = await import("../../src/auth/tokens.js");
    const tok = jwt.sign({ sub: "u1", email: "u@x.com", role: "admin", type: "access" }, REFRESH_SECRET, {
      algorithm: "HS256",
    });
    expect(() => verifyAccess(tok)).toThrow();
  });

  it("rejects an access token presented to verifyRefresh (type confusion)", async () => {
    const { signAccess, verifyRefresh } = await import("../../src/auth/tokens.js");
    const accessTok = signAccess({ sub: "u1", email: "u@x.com", role: "admin" });
    expect(() => verifyRefresh(accessTok)).toThrow();
  });

  it("rejects an HS256 token verified against an RS256-required handler", async () => {
    const { verifyAccess } = await import("../../src/auth/tokens.js");
    // Simulate an algorithm-confusion attempt by signing with the public RSA key
    // bytes as if they were an HMAC secret. We can't easily mint RS256 in this
    // test, but we cover the path: any algorithm not in the whitelist throws.
    const tok = jwt.sign({ sub: "x", type: "access" }, ACCESS_SECRET, { algorithm: "HS384" });
    expect(() => verifyAccess(tok)).toThrow(/invalid algorithm/i);
  });

  it("rejects an expired token", async () => {
    const { verifyAccess } = await import("../../src/auth/tokens.js");
    const expired = jwt.sign(
      { sub: "u1", email: "u@x.com", role: "admin", type: "access" },
      ACCESS_SECRET,
      { algorithm: "HS256", expiresIn: -1 },
    );
    expect(() => verifyAccess(expired)).toThrow();
  });
});

describe("JWT — boot validation", () => {
  it("refuses if ACCESS and REFRESH secrets are equal", async () => {
    const prevAccess = process.env.JWT_ACCESS_SECRET;
    const prevRefresh = process.env.JWT_REFRESH_SECRET;
    process.env.JWT_ACCESS_SECRET = "same-secret-for-both";
    process.env.JWT_REFRESH_SECRET = "same-secret-for-both";
    // Re-import after env mutation so the module-level check runs again.
    await expect(import(`../../src/auth/tokens.js?nocache=${Date.now()}`)).rejects.toThrow();
    process.env.JWT_ACCESS_SECRET = prevAccess;
    process.env.JWT_REFRESH_SECRET = prevRefresh;
  });
});
