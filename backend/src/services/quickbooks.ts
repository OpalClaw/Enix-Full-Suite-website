// =============================================================================
// QuickBooks Online integration
// =============================================================================
// OAuth2 refresh-token flow + Invoice REST. Credentials read from app_settings
// (env fallback). Powers the Invoices section once the QBO API key arrives.
// =============================================================================

import { getQuickbooksConfig } from "./settings.js";
import { ServiceUnavailable } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

let cachedToken: { accessToken: string; expiresAt: number; refreshToken: string } | null = null;

const TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

function apiBase(env: "sandbox" | "production"): string {
  return env === "production"
    ? "https://quickbooks.api.intuit.com"
    : "https://sandbox-quickbooks.api.intuit.com";
}

async function getAccessToken(): Promise<{ token: string; realmId: string; env: "sandbox" | "production" }> {
  const cfg = await getQuickbooksConfig();
  if (!cfg.client_id || !cfg.client_secret || !cfg.realm_id || !cfg.refresh_token) {
    throw ServiceUnavailable("QuickBooks is not configured. Add credentials in Settings → Integrations.");
  }
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return { token: cachedToken.accessToken, realmId: cfg.realm_id, env: cfg.environment };
  }
  const basic = Buffer.from(`${cfg.client_id}:${cfg.client_secret}`).toString("base64");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: cfg.refresh_token,
    }).toString(),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`QuickBooks token refresh failed (${res.status}): ${txt}`);
  }
  const json = (await res.json()) as { access_token: string; expires_in: number; refresh_token: string };
  cachedToken = {
    accessToken: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
    refreshToken: json.refresh_token,
  };
  // Note: refresh tokens rotate roughly every 100 days. The new token must be
  // persisted back into app_settings out of band — left intentionally to the
  // operator via the Settings panel to avoid silent overwrites.
  return { token: json.access_token, realmId: cfg.realm_id, env: cfg.environment };
}

export interface CreateInvoiceArgs {
  customer_ref_id: string;
  customer_name?: string;
  line_items: Array<{
    description: string;
    amount: number;
    item_ref_id?: string;
  }>;
  due_date?: string; // YYYY-MM-DD
  invoice_number?: string;
  customer_memo?: string;
}

export async function createInvoice(args: CreateInvoiceArgs): Promise<{ id: string; doc_number: string }> {
  const { token, realmId, env } = await getAccessToken();
  const url = `${apiBase(env)}/v3/company/${realmId}/invoice?minorversion=70`;
  const body = {
    CustomerRef: { value: args.customer_ref_id, name: args.customer_name },
    DocNumber: args.invoice_number,
    DueDate: args.due_date,
    CustomerMemo: args.customer_memo ? { value: args.customer_memo } : undefined,
    Line: args.line_items.map((li, i) => ({
      Id: String(i + 1),
      LineNum: i + 1,
      Description: li.description,
      Amount: li.amount,
      DetailType: "SalesItemLineDetail",
      SalesItemLineDetail: {
        ItemRef: li.item_ref_id ? { value: li.item_ref_id } : undefined,
      },
    })),
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`QuickBooks createInvoice failed (${res.status}): ${txt}`);
  }
  const json = (await res.json()) as { Invoice: { Id: string; DocNumber: string } };
  logger.info({ qbo_id: json.Invoice.Id }, "quickbooks invoice created");
  return { id: json.Invoice.Id, doc_number: json.Invoice.DocNumber };
}

export async function ping(): Promise<{ ok: boolean; error?: string }> {
  try {
    await getAccessToken();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
