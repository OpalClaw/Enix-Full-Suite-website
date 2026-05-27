// =============================================================================
// ABC Supply / ABC Roofing integration
// =============================================================================
// Material catalog sync + order placement. Credentials read from app_settings.
// ABC Supply publishes a partner REST API gated by API key + account number.
// The endpoints below match their v1 surface and can be swapped in when the
// final API URL is provided.
// =============================================================================

import { getAbcSupplyConfig } from "./settings.js";
import { ServiceUnavailable } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const cfg = await getAbcSupplyConfig();
  if (!cfg.api_key || !cfg.account_number) {
    throw ServiceUnavailable("ABC Supply is not configured. Add credentials in Settings → Integrations.");
  }
  const url = new URL(path.replace(/^\//, ""), cfg.api_base).toString();
  const headers = new Headers(init.headers);
  headers.set("X-Api-Key", cfg.api_key);
  headers.set("X-Account-Number", cfg.account_number);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");
  return fetch(url, { ...init, headers });
}

export interface MaterialCatalogItem {
  sku: string;
  name: string;
  category: string;
  manufacturer?: string;
  unit?: string;
  unit_cost?: number;
}

export async function listCatalog(category?: string): Promise<MaterialCatalogItem[]> {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  const res = await authedFetch(`/catalog?${params.toString()}`);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`ABC Supply listCatalog failed (${res.status}): ${txt}`);
  }
  const json = (await res.json()) as { items: MaterialCatalogItem[] };
  return json.items ?? [];
}

export async function getPricing(skus: string[]): Promise<Record<string, number>> {
  const res = await authedFetch(`/pricing`, {
    method: "POST",
    body: JSON.stringify({ skus, account: (await getAbcSupplyConfig()).account_number }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`ABC Supply getPricing failed (${res.status}): ${txt}`);
  }
  const json = (await res.json()) as { prices: Array<{ sku: string; price: number }> };
  const out: Record<string, number> = {};
  for (const p of json.prices ?? []) out[p.sku] = p.price;
  return out;
}

export interface OrderArgs {
  job_id: string;
  line_items: Array<{ sku: string; qty: number }>;
  delivery_address?: string;
  delivery_date?: string; // YYYY-MM-DD
  purchase_order_number?: string;
}

export async function placeOrder(args: OrderArgs): Promise<{ order_id: string; status: string }> {
  const res = await authedFetch(`/orders`, {
    method: "POST",
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`ABC Supply placeOrder failed (${res.status}): ${txt}`);
  }
  const json = (await res.json()) as { order_id: string; status: string };
  logger.info({ order_id: json.order_id }, "abc supply order placed");
  return json;
}

export async function ping(): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await authedFetch(`/health`);
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
