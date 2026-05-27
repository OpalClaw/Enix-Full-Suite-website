// =============================================================================
// SMTP email transport
// =============================================================================
// Used by employee + client invites and notification flows. Credentials read
// from app_settings (env fallback). If unconfigured the service throws a
// descriptive ServiceUnavailable so callers can fail clearly.
// =============================================================================

import nodemailer, { Transporter } from "nodemailer";
import { getSmtpConfig } from "./settings.js";
import { ServiceUnavailable } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

let cached: { transporter: Transporter; fromAddress: string; fromName: string } | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 60_000;

async function getTransport(): Promise<{
  transporter: Transporter;
  fromAddress: string;
  fromName: string;
}> {
  if (cached && Date.now() - cacheTime < CACHE_TTL_MS) return cached;
  const cfg = await getSmtpConfig();
  if (!cfg.host || !cfg.user || !cfg.password || !cfg.from_address) {
    throw ServiceUnavailable("SMTP is not configured. Add credentials in Settings → Email.");
  }
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.password },
  });
  cached = { transporter, fromAddress: cfg.from_address, fromName: cfg.from_name };
  cacheTime = Date.now();
  return cached;
}

export interface SendEmailArgs {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  cc?: string[];
}

export async function sendEmail(args: SendEmailArgs): Promise<{ messageId: string }> {
  const { transporter, fromAddress, fromName } = await getTransport();
  const info = await transporter.sendMail({
    from: `"${fromName}" <${fromAddress}>`,
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
    replyTo: args.replyTo,
    cc: args.cc,
  });
  logger.info({ messageId: info.messageId, to: args.to }, "email sent");
  return { messageId: info.messageId };
}

export async function ping(): Promise<{ ok: boolean; error?: string }> {
  try {
    const { transporter } = await getTransport();
    await transporter.verify();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
