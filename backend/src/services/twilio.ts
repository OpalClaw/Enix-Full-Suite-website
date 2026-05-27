// =============================================================================
// Twilio integration service
// =============================================================================
// SMS + voice via Twilio. Credentials read from app_settings (with env fallback)
// so the office can rotate them without a redeploy. Webhook signatures are
// validated against the configured auth token.
// =============================================================================

import crypto from "node:crypto";
import twilio, { Twilio } from "twilio";
import { logger } from "../utils/logger.js";
import { getTwilioConfig } from "./settings.js";
import { BadRequest, ServiceUnavailable } from "../utils/errors.js";

interface SendSmsArgs {
  to: string;
  body: string;
  statusCallback?: string;
}

interface InitiateCallArgs {
  to: string;
  twimlUrl?: string;
  statusCallback?: string;
}

async function getClient(): Promise<{ client: Twilio; from: string; statusCallback?: string }> {
  const cfg = await getTwilioConfig();
  if (!cfg.account_sid || !cfg.auth_token || !cfg.from_number) {
    throw ServiceUnavailable("Twilio is not configured. Add credentials in Settings → Integrations.");
  }
  return {
    client: twilio(cfg.account_sid, cfg.auth_token),
    from: cfg.from_number,
    statusCallback: cfg.status_callback_url,
  };
}

export async function sendSms(args: SendSmsArgs): Promise<{ sid: string; status: string }> {
  const { client, from, statusCallback } = await getClient();
  if (!args.to || !args.body) throw BadRequest("`to` and `body` are required");
  const msg = await client.messages.create({
    to: args.to,
    from,
    body: args.body,
    statusCallback: args.statusCallback ?? statusCallback,
  });
  logger.info({ sid: msg.sid, status: msg.status, to: args.to }, "twilio sms sent");
  return { sid: msg.sid, status: msg.status };
}

export async function initiateCall(args: InitiateCallArgs): Promise<{ sid: string; status: string }> {
  const { client, from, statusCallback } = await getClient();
  if (!args.to) throw BadRequest("`to` is required");
  // If no TwiML URL is provided we use Twilio's echo TwiML — the agent must
  // configure a real call flow URL in Settings or pass `twimlUrl` per call.
  const url =
    args.twimlUrl ??
    "http://demo.twilio.com/docs/voice.xml"; // safe default: plays a brief test message
  const call = await client.calls.create({
    to: args.to,
    from,
    url,
    statusCallback: args.statusCallback ?? statusCallback,
  });
  logger.info({ sid: call.sid, status: call.status, to: args.to }, "twilio call initiated");
  return { sid: call.sid, status: call.status };
}

/**
 * Validate a Twilio webhook signature.
 * Twilio signs the full URL + sorted form params with HMAC-SHA1.
 */
export async function validateWebhookSignature(
  signatureHeader: string | undefined,
  url: string,
  params: Record<string, string>,
): Promise<boolean> {
  if (!signatureHeader) return false;
  const cfg = await getTwilioConfig();
  if (!cfg.auth_token) return false;

  const sorted = Object.keys(params).sort();
  let data = url;
  for (const k of sorted) data += k + params[k];

  const hmac = crypto.createHmac("sha1", cfg.auth_token).update(Buffer.from(data, "utf-8")).digest("base64");
  // constant-time compare
  const a = Buffer.from(hmac);
  const b = Buffer.from(signatureHeader);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function ping(): Promise<{ ok: boolean; error?: string }> {
  try {
    const { client } = await getClient();
    await client.api.v2010.accounts.list({ limit: 1 });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
