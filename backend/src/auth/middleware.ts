import type { Request, Response, NextFunction } from "express";
import { verifyAccess, AccessClaims } from "./tokens.js";
import { Unauthorized, Forbidden } from "../utils/errors.js";

declare module "express-serve-static-core" {
  interface Request {
    user?: AccessClaims;
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  let token: string | undefined;
  if (auth?.startsWith("Bearer ")) {
    token = auth.slice(7);
  } else if (req.cookies?.enix_access) {
    token = req.cookies.enix_access;
  }
  if (!token) return next(Unauthorized("Missing access token"));
  try {
    req.user = verifyAccess(token);
    next();
  } catch {
    next(Unauthorized("Invalid or expired access token"));
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(Unauthorized());
    if (!roles.includes(req.user.role)) return next(Forbidden("Role not permitted"));
    next();
  };
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  let token: string | undefined;
  if (auth?.startsWith("Bearer ")) token = auth.slice(7);
  else if (req.cookies?.enix_access) token = req.cookies.enix_access;
  if (!token) return next();
  try {
    req.user = verifyAccess(token);
  } catch { /* ignore — treat as anon */ }
  next();
}
