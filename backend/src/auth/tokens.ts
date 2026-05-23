import jwt, { type SignOptions } from "jsonwebtoken";
import crypto from "node:crypto";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_TTL = process.env.JWT_ACCESS_TTL || "15m";
const REFRESH_TTL = process.env.JWT_REFRESH_TTL || "30d";

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are required");
}
if (ACCESS_SECRET === REFRESH_SECRET) {
  throw new Error("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different");
}

export interface AccessClaims {
  sub: string;       // user id
  email: string;
  role: string;
  type: "access";
}

export interface RefreshClaims {
  sub: string;
  jti: string;       // session id
  type: "refresh";
}

export function signAccess(claims: Omit<AccessClaims, "type">): string {
  return jwt.sign({ ...claims, type: "access" }, ACCESS_SECRET as string, {
    expiresIn: ACCESS_TTL,
    algorithm: "HS256",
  } as SignOptions);
}

export function signRefresh(claims: Omit<RefreshClaims, "type">): string {
  return jwt.sign({ ...claims, type: "refresh" }, REFRESH_SECRET as string, {
    expiresIn: REFRESH_TTL,
    algorithm: "HS256",
  } as SignOptions);
}

export function verifyAccess(token: string): AccessClaims {
  const decoded = jwt.verify(token, ACCESS_SECRET as string, { algorithms: ["HS256"] }) as AccessClaims;
  if (decoded.type !== "access") throw new Error("invalid token type");
  return decoded;
}

export function verifyRefresh(token: string): RefreshClaims {
  const decoded = jwt.verify(token, REFRESH_SECRET as string, { algorithms: ["HS256"] }) as RefreshClaims;
  if (decoded.type !== "refresh") throw new Error("invalid token type");
  return decoded;
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateSessionId(): string {
  return crypto.randomUUID();
}
