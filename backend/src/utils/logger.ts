import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  // Redact common sensitive fields anywhere in the payload tree
  redact: {
    paths: [
      "password", "*.password",
      "password_hash", "*.password_hash",
      "authorization", "*.authorization",
      "cookie", "*.cookie",
      "set-cookie", "*.set-cookie",
      "token", "*.token",
      "refresh_token", "*.refresh_token",
    ],
    censor: "[REDACTED]",
  },
  base: { service: "enix-api" },
});
