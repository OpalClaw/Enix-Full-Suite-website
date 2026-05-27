// =============================================================================
// App settings service
// =============================================================================
// Single source of truth for integration credentials + company config.
// Reads from `app_settings` table; falls back to environment variables for
// bootstrap (so a Postgres-only deploy still works before the admin populates
// Settings). Sensitive fields are masked on read for non-admin requesters.
// =============================================================================

import { eq } from "drizzle-orm";
import { db, schema } from "../db/index.js";

export type SettingValue = Record<string, unknown>;

const SECRET_FIELDS = new Set([
  "auth_token",
  "access_token",
  "refresh_token",
  "client_secret",
  "private_key",
  "password",
  "webhook_secret",
  "api_key",
  "secret",
]);

export async function getSetting(key: string): Promise<SettingValue | null> {
  const [row] = await db
    .select()
    .from(schema.app_settings)
    .where(eq(schema.app_settings.key, key))
    .limit(1);
  return (row?.value as SettingValue) ?? null;
}

export async function getSettingOrEnv<T>(
  key: string,
  envFallback: Partial<T> = {} as Partial<T>,
): Promise<T> {
  const dbValue = (await getSetting(key)) ?? {};
  return { ...envFallback, ...(dbValue as object) } as T;
}

export async function listSettings(includeSecrets: boolean): Promise<
  Array<{ key: string; value: SettingValue; is_secret: boolean; description: string | null; updated_at: Date }>
> {
  const rows = await db.select().from(schema.app_settings);
  return rows.map((row) => ({
    key: row.key,
    value: includeSecrets ? (row.value as SettingValue) : maskValue(row.value as SettingValue),
    is_secret: row.is_secret,
    description: row.description,
    updated_at: row.updated_at,
  }));
}

export async function upsertSetting(
  key: string,
  value: SettingValue,
  updatedBy: string | null,
): Promise<{ key: string; value: SettingValue; updated_at: Date }> {
  const existing = await getSetting(key);
  // Merge so secret fields are preserved when omitted from the patch
  const merged = existing ? { ...existing, ...value } : value;

  const [row] = await db
    .insert(schema.app_settings)
    .values({
      key,
      value: merged,
      updated_by: updatedBy,
      updated_at: new Date(),
    })
    .onConflictDoUpdate({
      target: schema.app_settings.key,
      set: { value: merged, updated_by: updatedBy, updated_at: new Date() },
    })
    .returning();
  return { key: row.key, value: row.value as SettingValue, updated_at: row.updated_at };
}

export function maskValue(value: SettingValue): SettingValue {
  const out: SettingValue = {};
  for (const [k, v] of Object.entries(value ?? {})) {
    if (SECRET_FIELDS.has(k) && typeof v === "string" && v.length > 0) {
      out[k] = `••••${v.slice(-4)}`;
    } else if (v && typeof v === "object" && !Array.isArray(v)) {
      out[k] = maskValue(v as SettingValue);
    } else {
      out[k] = v;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Typed accessors per-integration
// ---------------------------------------------------------------------------
export interface TwilioConfig {
  account_sid: string;
  auth_token: string;
  from_number: string;
  status_callback_url?: string;
  enabled?: boolean;
}

export async function getTwilioConfig(): Promise<TwilioConfig> {
  return getSettingOrEnv<TwilioConfig>("integration.twilio", {
    account_sid: process.env.TWILIO_ACCOUNT_SID ?? "",
    auth_token: process.env.TWILIO_AUTH_TOKEN ?? "",
    from_number: process.env.TWILIO_FROM_NUMBER ?? "",
    status_callback_url: process.env.TWILIO_STATUS_CALLBACK_URL,
    enabled: !!process.env.TWILIO_ACCOUNT_SID,
  });
}

export interface DocusignConfig {
  integration_key: string;
  user_id: string;
  account_id: string;
  base_path: string;
  private_key: string;
  webhook_secret?: string;
  enabled?: boolean;
}

export async function getDocusignConfig(): Promise<DocusignConfig> {
  return getSettingOrEnv<DocusignConfig>("integration.docusign", {
    integration_key: process.env.DOCUSIGN_INTEGRATION_KEY ?? "",
    user_id: process.env.DOCUSIGN_USER_ID ?? "",
    account_id: process.env.DOCUSIGN_ACCOUNT_ID ?? "",
    base_path: process.env.DOCUSIGN_BASE_PATH ?? "https://demo.docusign.net/restapi",
    private_key: process.env.DOCUSIGN_PRIVATE_KEY ?? "",
    webhook_secret: process.env.DOCUSIGN_WEBHOOK_SECRET,
    enabled: !!process.env.DOCUSIGN_INTEGRATION_KEY,
  });
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from_address: string;
  from_name: string;
  enabled?: boolean;
}

export async function getSmtpConfig(): Promise<SmtpConfig> {
  return getSettingOrEnv<SmtpConfig>("integration.smtp", {
    host: process.env.SMTP_HOST ?? "",
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER ?? "",
    password: process.env.SMTP_PASSWORD ?? "",
    from_address: process.env.SMTP_FROM_ADDRESS ?? "",
    from_name: process.env.SMTP_FROM_NAME ?? "Enix Exteriors",
    enabled: !!process.env.SMTP_HOST,
  });
}

export interface EagleViewConfig {
  client_id: string;
  client_secret: string;
  api_base: string;
  enabled?: boolean;
}
export async function getEagleViewConfig(): Promise<EagleViewConfig> {
  return getSettingOrEnv<EagleViewConfig>("integration.eagleview", {
    client_id: process.env.EAGLEVIEW_CLIENT_ID ?? "",
    client_secret: process.env.EAGLEVIEW_CLIENT_SECRET ?? "",
    api_base: process.env.EAGLEVIEW_API_BASE ?? "https://webservices.eagleview.com/",
    enabled: !!process.env.EAGLEVIEW_CLIENT_ID,
  });
}

export interface QuickbooksConfig {
  client_id: string;
  client_secret: string;
  realm_id: string;
  refresh_token: string;
  environment: "sandbox" | "production";
  enabled?: boolean;
}
export async function getQuickbooksConfig(): Promise<QuickbooksConfig> {
  return getSettingOrEnv<QuickbooksConfig>("integration.quickbooks", {
    client_id: process.env.QUICKBOOKS_CLIENT_ID ?? "",
    client_secret: process.env.QUICKBOOKS_CLIENT_SECRET ?? "",
    realm_id: process.env.QUICKBOOKS_REALM_ID ?? "",
    refresh_token: process.env.QUICKBOOKS_REFRESH_TOKEN ?? "",
    environment: (process.env.QUICKBOOKS_ENV as "sandbox" | "production") ?? "sandbox",
    enabled: !!process.env.QUICKBOOKS_CLIENT_ID,
  });
}

export interface AbcSupplyConfig {
  api_key: string;
  account_number: string;
  api_base: string;
  enabled?: boolean;
}
export async function getAbcSupplyConfig(): Promise<AbcSupplyConfig> {
  return getSettingOrEnv<AbcSupplyConfig>("integration.abc_supply", {
    api_key: process.env.ABC_SUPPLY_API_KEY ?? "",
    account_number: process.env.ABC_SUPPLY_ACCOUNT_NUMBER ?? "",
    api_base: process.env.ABC_SUPPLY_API_BASE ?? "https://api.abcsupply.com/v1/",
    enabled: !!process.env.ABC_SUPPLY_API_KEY,
  });
}
