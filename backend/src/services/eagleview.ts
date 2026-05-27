// =============================================================================
// EagleView API client
// =============================================================================
// Thin wrapper over the EagleView REST surface used to place + retrieve roof
// measurement reports. Real credentials arrive from the client; the structure
// here matches EagleView's OAuth2 client-credentials flow + Report endpoints
// so the only work needed when keys land is plugging them into Settings.
// =============================================================================

import { getEagleViewConfig } from "./settings.js";
import { ServiceUnavailable } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<{ token: string; apiBase: string }> {
  const cfg = await getEagleViewConfig();
  if (!cfg.client_id || !cfg.client_secret) {
    throw ServiceUnavailable("EagleView is not configured. Add credentials in Settings → Integrations.");
  }
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return { token: cachedToken.accessToken, apiBase: cfg.api_base };
  }
  const tokenUrl = new URL("/Token", cfg.api_base).toString();
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: cfg.client_id,
    client_secret: cfg.client_secret,
  });
  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`EagleView token request failed (${res.status}): ${txt}`);
  }
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    accessToken: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return { token: json.access_token, apiBase: cfg.api_base };
}

export interface PlaceOrderArgs {
  address: string;
  city: string;
  state: string;
  zip: string;
  product_id: number; // e.g. 122 = Premium Roof Report
  reference_id?: string;
  delivery_email?: string;
}

export async function placeOrder(args: PlaceOrderArgs): Promise<{ report_id: string; status: string }> {
  const { token, apiBase } = await getAccessToken();
  const res = await fetch(new URL("/v3/Order/PlaceOrder", apiBase).toString(), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      Address: args.address,
      City: args.city,
      State: args.state,
      PostalCode: args.zip,
      ProductPrimary: args.product_id,
      ReferenceId: args.reference_id,
      DeliveryEmail: args.delivery_email,
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`EagleView placeOrder failed (${res.status}): ${txt}`);
  }
  const json = (await res.json()) as { ReportId: string; Status: string };
  logger.info({ reportId: json.ReportId }, "eagleview order placed");
  return { report_id: json.ReportId, status: json.Status };
}

export async function getReport(reportId: string): Promise<Record<string, unknown>> {
  const { token, apiBase } = await getAccessToken();
  const res = await fetch(new URL(`/v3/Report/${reportId}`, apiBase).toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`EagleView getReport failed (${res.status}): ${txt}`);
  }
  return (await res.json()) as Record<string, unknown>;
}

export async function ping(): Promise<{ ok: boolean; error?: string }> {
  try {
    await getAccessToken();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
