import type { Response } from "express";

export interface CookieOpts {
  secure?: boolean;
  domain?: string;
  sameSite?: "strict" | "lax" | "none";
}

function opts(): CookieOpts {
  return {
    secure: (process.env.COOKIE_SECURE ?? "true") === "true",
    domain: process.env.COOKIE_DOMAIN || undefined,
    sameSite: (process.env.COOKIE_SAMESITE as CookieOpts["sameSite"]) || "lax",
  };
}

export function setAuthCookies(res: Response, access: string, refresh: string) {
  const o = opts();
  res.cookie("enix_access", access, {
    httpOnly: true,
    secure: o.secure,
    domain: o.domain,
    sameSite: o.sameSite,
    path: "/",
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("enix_refresh", refresh, {
    httpOnly: true,
    secure: o.secure,
    domain: o.domain,
    sameSite: o.sameSite,
    path: "/api/auth/refresh",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res: Response) {
  const o = opts();
  res.clearCookie("enix_access", { domain: o.domain, path: "/" });
  res.clearCookie("enix_refresh", { domain: o.domain, path: "/api/auth/refresh" });
}
