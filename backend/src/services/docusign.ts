// =============================================================================
// DocuSign integration service
// =============================================================================
// JWT-grant authentication against DocuSign, envelope creation, status check,
// and Connect (webhook) HMAC verification.
//
// Credentials are read from app_settings (or env fallback). The integration
// stays inert until `enabled` is true and the required fields are set —
// callers get a typed ServiceUnavailable error explaining what's missing.
// =============================================================================

import crypto from "node:crypto";
// docusign-esign is CommonJS; we rely on default + dynamic property access
// rather than fighting the .d.ts limitations.
// eslint-disable-next-line @typescript-eslint/no-var-requires
import docusign from "docusign-esign";
import { logger } from "../utils/logger.js";
import { getDocusignConfig } from "./settings.js";
import { BadRequest, ServiceUnavailable } from "../utils/errors.js";

let cachedToken: { accessToken: string; expiresAt: number } | null = null;
const SCOPES = ["signature", "impersonation"];

async function getAccessToken(): Promise<{ accessToken: string; accountId: string; basePath: string }> {
  const cfg = await getDocusignConfig();
  if (!cfg.integration_key || !cfg.user_id || !cfg.account_id || !cfg.private_key) {
    throw ServiceUnavailable(
      "DocuSign is not configured. Provide integration_key, user_id, account_id and private_key in Settings.",
    );
  }

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return { accessToken: cachedToken.accessToken, accountId: cfg.account_id, basePath: cfg.base_path };
  }

  const apiClient = new docusign.ApiClient();
  // The OAuth host is derived from the base path
  apiClient.setOAuthBasePath(
    cfg.base_path.includes("demo") ? "account-d.docusign.com" : "account.docusign.com",
  );

  const rsaKey = Buffer.from(cfg.private_key, "utf-8");
  const result = await apiClient.requestJWTUserToken(
    cfg.integration_key,
    cfg.user_id,
    SCOPES,
    rsaKey,
    3600,
  );
  const accessToken: string = result.body.access_token;
  const expiresIn: number = result.body.expires_in;
  cachedToken = { accessToken, expiresAt: Date.now() + expiresIn * 1000 };
  return { accessToken, accountId: cfg.account_id, basePath: cfg.base_path };
}

async function buildApiClient(): Promise<{
  client: any;
  envelopesApi: any;
  accountId: string;
}> {
  const { accessToken, accountId, basePath } = await getAccessToken();
  const client = new docusign.ApiClient();
  client.setBasePath(basePath);
  client.addDefaultHeader("Authorization", `Bearer ${accessToken}`);
  return { client, envelopesApi: new docusign.EnvelopesApi(client), accountId };
}

export interface SendEnvelopeArgs {
  documentBase64: string; // base64 PDF
  documentName: string;
  emailSubject: string;
  emailMessage?: string;
  signers: Array<{ email: string; name: string; clientUserId?: string; recipientId?: string }>;
  ccs?: Array<{ email: string; name: string }>;
  webhookUrl?: string;
}

export async function sendEnvelope(
  args: SendEnvelopeArgs,
): Promise<{ envelopeId: string; status: string }> {
  if (!args.documentBase64) throw BadRequest("documentBase64 required");
  if (!args.signers?.length) throw BadRequest("at least one signer required");

  const { envelopesApi, accountId } = await buildApiClient();

  const envelopeDefinition: any = {
    emailSubject: args.emailSubject,
    emailBlurb: args.emailMessage,
    status: "sent",
    documents: [
      {
        documentBase64: args.documentBase64,
        name: args.documentName,
        fileExtension: "pdf",
        documentId: "1",
      },
    ],
    recipients: {
      signers: args.signers.map((s, i) => ({
        email: s.email,
        name: s.name,
        recipientId: s.recipientId ?? String(i + 1),
        routingOrder: String(i + 1),
        clientUserId: s.clientUserId,
        tabs: {
          signHereTabs: [
            {
              anchorString: i === 0 ? "/SIG_CLIENT/" : "/SIG_BUSINESS/",
              anchorYOffset: "-5",
              anchorUnits: "pixels",
              anchorXOffset: "0",
            },
          ],
          dateSignedTabs: [
            {
              anchorString: i === 0 ? "/DATE_CLIENT/" : "/DATE_BUSINESS/",
              anchorYOffset: "-5",
              anchorUnits: "pixels",
              anchorXOffset: "0",
            },
          ],
        },
      })),
      carbonCopies: args.ccs?.map((c, i) => ({
        email: c.email,
        name: c.name,
        recipientId: String(args.signers.length + i + 1),
        routingOrder: String(args.signers.length + i + 1),
      })),
    },
    eventNotification: args.webhookUrl
      ? {
          url: args.webhookUrl,
          requireAcknowledgment: "true",
          includeDocuments: "false",
          includeCertificateOfCompletion: "true",
          envelopeEvents: [
            { envelopeEventStatusCode: "sent" },
            { envelopeEventStatusCode: "delivered" },
            { envelopeEventStatusCode: "completed" },
            { envelopeEventStatusCode: "declined" },
            { envelopeEventStatusCode: "voided" },
          ],
        }
      : undefined,
  };

  const result = await envelopesApi.createEnvelope(accountId, { envelopeDefinition });
  logger.info({ envelopeId: result.envelopeId, status: result.status }, "docusign envelope sent");
  return { envelopeId: result.envelopeId ?? "", status: result.status ?? "sent" };
}

export async function getEnvelopeStatus(envelopeId: string): Promise<{
  envelopeId: string;
  status: string;
  statusChangedDateTime?: string;
  completedDateTime?: string;
}> {
  const { envelopesApi, accountId } = await buildApiClient();
  const env = await envelopesApi.getEnvelope(accountId, envelopeId, {});
  return {
    envelopeId: env.envelopeId ?? envelopeId,
    status: env.status ?? "unknown",
    statusChangedDateTime: env.statusChangedDateTime,
    completedDateTime: env.completedDateTime,
  };
}

/** HMAC verification of DocuSign Connect webhook payload. */
export async function verifyWebhookHmac(
  signature: string | undefined,
  rawBody: Buffer,
): Promise<boolean> {
  if (!signature) return false;
  const cfg = await getDocusignConfig();
  if (!cfg.webhook_secret) return false;
  const expected = crypto.createHmac("sha256", cfg.webhook_secret).update(rawBody).digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function ping(): Promise<{ ok: boolean; error?: string }> {
  try {
    await getAccessToken();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
