// Enix Prime Flow — Drizzle schema
// All 44 entities from the original Base44 model.
// Identifiers use UUIDs (server-generated). Timestamps default to now().

import { sql } from "drizzle-orm";
import {
  pgTable, uuid, varchar, text, integer, numeric, boolean, jsonb,
  timestamp, pgEnum, primaryKey, index, uniqueIndex,
} from "drizzle-orm/pg-core";

/* ============================================================
 * Enums
 * ========================================================= */
export const userRoleEnum = pgEnum("user_role", ["admin", "manager", "estimator", "office", "crew", "client"]);
export const leadStatusEnum = pgEnum("lead_status", ["new", "contacted", "qualified", "estimating", "won", "lost"]);
export const jobStatusEnum = pgEnum("job_status", [
  "approved", "material_ordered", "scheduled", "in_production", "in_progress",
  "punch_list", "completed", "warrantied", "cancelled",
]);
export const invoiceStatusEnum = pgEnum("invoice_status", ["draft", "sent", "viewed", "partial", "paid", "overdue", "void"]);
export const estimateStatusEnum = pgEnum("estimate_status", ["draft", "sent", "viewed", "accepted", "declined", "expired"]);
export const documentStatusEnum = pgEnum("document_status", ["draft", "sent", "signed", "completed", "void"]);
export const paymentMethodEnum = pgEnum("payment_method", ["check", "card", "ach", "cash", "financing", "insurance"]);
export const propertyTypeEnum = pgEnum("property_type", ["residential", "commercial"]);

/* ============================================================
 * Core tables
 * ========================================================= */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password_hash: text("password_hash"),
  full_name: varchar("full_name", { length: 200 }).notNull(),
  role: userRoleEnum("role").notNull().default("client"),
  phone: varchar("phone", { length: 20 }),
  active: boolean("active").notNull().default(true),
  last_login_at: timestamp("last_login_at", { withTimezone: true }),
  client_job_number: varchar("client_job_number", { length: 50 }),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  emailIdx: uniqueIndex("users_email_idx").on(t.email),
  roleIdx: index("users_role_idx").on(t.role),
}));

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  refresh_token_hash: text("refresh_token_hash").notNull(),
  user_agent: text("user_agent"),
  ip: varchar("ip", { length: 64 }),
  expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
  revoked_at: timestamp("revoked_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userIdx: index("sessions_user_idx").on(t.user_id),
  tokenIdx: uniqueIndex("sessions_token_idx").on(t.refresh_token_hash),
}));

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  property_address: text("property_address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zip: varchar("zip", { length: 20 }),
  property_type: propertyTypeEnum("property_type").notNull().default("residential"),
  notes: text("notes"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  emailIdx: index("customers_email_idx").on(t.email),
  phoneIdx: index("customers_phone_idx").on(t.phone),
}));

export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  first_name: varchar("first_name", { length: 100 }),
  last_name: varchar("last_name", { length: 100 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  service: varchar("service", { length: 100 }),
  property_type: propertyTypeEnum("property_type").notNull().default("residential"),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zip: varchar("zip", { length: 20 }),
  message: text("message"),
  source: varchar("source", { length: 100 }).default("website"),
  status: leadStatusEnum("status").notNull().default("new"),
  priority: varchar("priority", { length: 20 }).default("normal"),
  tcpa_consent: boolean("tcpa_consent").notNull().default(false),
  consent_timestamp: timestamp("consent_timestamp", { withTimezone: true }),
  ip_address: varchar("ip_address", { length: 64 }),
  user_agent: text("user_agent"),
  notes: text("notes"),
  assigned_to: uuid("assigned_to").references(() => users.id, { onDelete: "set null" }),
  notified_at: timestamp("notified_at", { withTimezone: true }),
  converted_at: timestamp("converted_at", { withTimezone: true }),
  customer_id: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  statusIdx: index("leads_status_idx").on(t.status),
  createdIdx: index("leads_created_idx").on(t.created_at),
  emailIdx: index("leads_email_idx").on(t.email),
}));

export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  job_number: varchar("job_number", { length: 50 }).notNull().unique(),
  customer_id: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "restrict" }),
  customer_name: varchar("customer_name", { length: 200 }).notNull(),
  customer_email: varchar("customer_email", { length: 255 }),
  customer_phone: varchar("customer_phone", { length: 20 }),
  property_address: text("property_address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zip: varchar("zip", { length: 20 }),
  property_type: propertyTypeEnum("property_type").notNull().default("residential"),
  status: jobStatusEnum("status").notNull().default("approved"),
  scope_of_work: text("scope_of_work"),
  contract_value: numeric("contract_value", { precision: 14, scale: 2 }),
  scheduled_start: timestamp("scheduled_start", { withTimezone: true }),
  completion_date: timestamp("completion_date", { withTimezone: true }),
  warranty_years: integer("warranty_years"),
  project_manager_id: uuid("project_manager_id").references(() => users.id, { onDelete: "set null" }),
  crew_id: uuid("crew_id"),
  lead_id: uuid("lead_id").references(() => leads.id, { onDelete: "set null" }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  numberIdx: uniqueIndex("jobs_number_idx").on(t.job_number),
  customerIdx: index("jobs_customer_idx").on(t.customer_id),
  statusIdx: index("jobs_status_idx").on(t.status),
  customerEmailIdx: index("jobs_customer_email_idx").on(t.customer_email),
}));

export const estimates = pgTable("estimates", {
  id: uuid("id").primaryKey().defaultRandom(),
  estimate_number: varchar("estimate_number", { length: 50 }).notNull().unique(),
  job_id: uuid("job_id").references(() => jobs.id, { onDelete: "set null" }),
  lead_id: uuid("lead_id").references(() => leads.id, { onDelete: "set null" }),
  customer_id: uuid("customer_id").references(() => customers.id, { onDelete: "restrict" }),
  status: estimateStatusEnum("status").notNull().default("draft"),
  subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull().default("0"),
  tax: numeric("tax", { precision: 14, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 14, scale: 2 }).notNull().default("0"),
  valid_until: timestamp("valid_until", { withTimezone: true }),
  sent_at: timestamp("sent_at", { withTimezone: true }),
  viewed_at: timestamp("viewed_at", { withTimezone: true }),
  accepted_at: timestamp("accepted_at", { withTimezone: true }),
  measurements: jsonb("measurements").$type<Record<string, unknown>>().default({}),
  line_items: jsonb("line_items").$type<unknown[]>().default(sql`'[]'::jsonb`),
  created_by: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  jobIdx: index("estimates_job_idx").on(t.job_id),
  customerIdx: index("estimates_customer_idx").on(t.customer_id),
  statusIdx: index("estimates_status_idx").on(t.status),
}));

export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoice_number: varchar("invoice_number", { length: 50 }).notNull().unique(),
  job_id: uuid("job_id").notNull().references(() => jobs.id, { onDelete: "restrict" }),
  customer_id: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "restrict" }),
  status: invoiceStatusEnum("status").notNull().default("draft"),
  subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull().default("0"),
  tax: numeric("tax", { precision: 14, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 14, scale: 2 }).notNull().default("0"),
  amount_paid: numeric("amount_paid", { precision: 14, scale: 2 }).notNull().default("0"),
  due_date: timestamp("due_date", { withTimezone: true }),
  sent_at: timestamp("sent_at", { withTimezone: true }),
  paid_at: timestamp("paid_at", { withTimezone: true }),
  line_items: jsonb("line_items").$type<unknown[]>().default(sql`'[]'::jsonb`),
  payment_terms: text("payment_terms"),
  message: text("message"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  jobIdx: index("invoices_job_idx").on(t.job_id),
  statusIdx: index("invoices_status_idx").on(t.status),
}));

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoice_id: uuid("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  method: paymentMethodEnum("method").notNull(),
  reference: varchar("reference", { length: 200 }),
  received_at: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  recorded_by: uuid("recorded_by").references(() => users.id, { onDelete: "set null" }),
  notes: text("notes"),
}, (t) => ({
  invoiceIdx: index("payments_invoice_idx").on(t.invoice_id),
}));

/* ============================================================
 * Documents / SmartDocs
 * ========================================================= */
export const smart_documents = pgTable("smart_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  job_id: uuid("job_id").references(() => jobs.id, { onDelete: "set null" }),
  template_id: uuid("template_id"),
  title: varchar("title", { length: 200 }).notNull(),
  document_type: varchar("document_type", { length: 50 }).notNull(),
  content: jsonb("content").$type<Record<string, unknown>>().notNull().default({}),
  status: documentStatusEnum("status").notNull().default("draft"),
  recipients: jsonb("recipients").$type<Array<Record<string, unknown>>>().notNull().default(sql`'[]'::jsonb`),
  sent_at: timestamp("sent_at", { withTimezone: true }),
  completed_at: timestamp("completed_at", { withTimezone: true }),
  created_by: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  jobIdx: index("smart_documents_job_idx").on(t.job_id),
  statusIdx: index("smart_documents_status_idx").on(t.status),
}));

export const document_templates = pgTable("document_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  document_type: varchar("document_type", { length: 50 }).notNull(),
  content: jsonb("content").$type<Record<string, unknown>>().notNull().default({}),
  active: boolean("active").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const signature_events = pgTable("signature_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  document_id: uuid("document_id").notNull().references(() => smart_documents.id, { onDelete: "cascade" }),
  signer_email: varchar("signer_email", { length: 255 }).notNull(),
  signer_name: varchar("signer_name", { length: 200 }),
  event_type: varchar("event_type", { length: 50 }).notNull(),
  signature_data: text("signature_data"),
  ip_address: varchar("ip_address", { length: 64 }),
  device_info: text("device_info"),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  documentIdx: index("signature_events_document_idx").on(t.document_id),
}));

export const document_audit_log = pgTable("document_audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  document_id: uuid("document_id").notNull().references(() => smart_documents.id, { onDelete: "cascade" }),
  action: varchar("action", { length: 50 }).notNull(),
  actor_email: varchar("actor_email", { length: 255 }),
  actor_id: uuid("actor_id"),
  details: jsonb("details").$type<Record<string, unknown>>().default({}),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  documentIdx: index("document_audit_document_idx").on(t.document_id),
}));

export const document_workflow = pgTable("document_workflow", {
  id: uuid("id").primaryKey().defaultRandom(),
  document_type: varchar("document_type", { length: 50 }).notNull(),
  trigger: varchar("trigger", { length: 100 }).notNull(),
  steps: jsonb("steps").$type<unknown[]>().notNull().default(sql`'[]'::jsonb`),
  active: boolean("active").notNull().default(true),
});

export const contracts = pgTable("contracts", {
  id: uuid("id").primaryKey().defaultRandom(),
  job_id: uuid("job_id").references(() => jobs.id, { onDelete: "cascade" }),
  document_id: uuid("document_id").references(() => smart_documents.id, { onDelete: "set null" }),
  contract_value: numeric("contract_value", { precision: 14, scale: 2 }),
  signed_at: timestamp("signed_at", { withTimezone: true }),
  start_date: timestamp("start_date", { withTimezone: true }),
  end_date: timestamp("end_date", { withTimezone: true }),
  terms: text("terms"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const proposals = pgTable("proposals", {
  id: uuid("id").primaryKey().defaultRandom(),
  job_id: uuid("job_id").references(() => jobs.id, { onDelete: "cascade" }),
  estimate_id: uuid("estimate_id").references(() => estimates.id, { onDelete: "set null" }),
  document_id: uuid("document_id").references(() => smart_documents.id, { onDelete: "set null" }),
  status: documentStatusEnum("status").notNull().default("draft"),
  sent_at: timestamp("sent_at", { withTimezone: true }),
  accepted_at: timestamp("accepted_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ============================================================
 * Operational / Detail tables
 * ========================================================= */
export const change_orders = pgTable("change_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  job_id: uuid("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull().default("0"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  approved_at: timestamp("approved_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  job_id: uuid("job_id").references(() => jobs.id, { onDelete: "cascade" }),
  assignee_id: uuid("assignee_id").references(() => users.id, { onDelete: "set null" }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).notNull().default("open"),
  priority: varchar("priority", { length: 20 }).default("normal"),
  due_date: timestamp("due_date", { withTimezone: true }),
  completed_at: timestamp("completed_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const appointments = pgTable("appointments", {
  id: uuid("id").primaryKey().defaultRandom(),
  job_id: uuid("job_id").references(() => jobs.id, { onDelete: "set null" }),
  lead_id: uuid("lead_id").references(() => leads.id, { onDelete: "set null" }),
  appointment_type: varchar("appointment_type", { length: 50 }).notNull(),
  scheduled_at: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  duration_minutes: integer("duration_minutes").default(60),
  assignee_id: uuid("assignee_id").references(() => users.id, { onDelete: "set null" }),
  notes: text("notes"),
  status: varchar("status", { length: 50 }).notNull().default("scheduled"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  job_id: uuid("job_id").references(() => jobs.id, { onDelete: "set null" }),
  recipient_email: varchar("recipient_email", { length: 255 }),
  sender_id: uuid("sender_id").references(() => users.id, { onDelete: "set null" }),
  subject: varchar("subject", { length: 200 }),
  body: text("body").notNull(),
  read_at: timestamp("read_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const activity_log = pgTable("activity_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actor_id: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  entity_type: varchar("entity_type", { length: 50 }).notNull(),
  entity_id: uuid("entity_id").notNull(),
  action: varchar("action", { length: 50 }).notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  entityIdx: index("activity_log_entity_idx").on(t.entity_type, t.entity_id),
}));

export const inspections = pgTable("inspections", {
  id: uuid("id").primaryKey().defaultRandom(),
  job_id: uuid("job_id").references(() => jobs.id, { onDelete: "cascade" }),
  inspector_id: uuid("inspector_id").references(() => users.id, { onDelete: "set null" }),
  inspection_type: varchar("inspection_type", { length: 50 }).notNull(),
  scheduled_at: timestamp("scheduled_at", { withTimezone: true }),
  findings: jsonb("findings").$type<Record<string, unknown>>().default({}),
  status: varchar("status", { length: 50 }).default("scheduled"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insurance_claims = pgTable("insurance_claims", {
  id: uuid("id").primaryKey().defaultRandom(),
  job_id: uuid("job_id").references(() => jobs.id, { onDelete: "cascade" }),
  carrier: varchar("carrier", { length: 200 }),
  policy_number: varchar("policy_number", { length: 100 }),
  claim_number: varchar("claim_number", { length: 100 }),
  adjuster_name: varchar("adjuster_name", { length: 200 }),
  adjuster_phone: varchar("adjuster_phone", { length: 20 }),
  acv: numeric("acv", { precision: 14, scale: 2 }),
  rcv: numeric("rcv", { precision: 14, scale: 2 }),
  deductible: numeric("deductible", { precision: 14, scale: 2 }),
  date_of_loss: timestamp("date_of_loss", { withTimezone: true }),
  status: varchar("status", { length: 50 }).default("open"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const crews = pgTable("crews", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  lead_id: uuid("lead_id").references(() => users.id, { onDelete: "set null" }),
  members: jsonb("members").$type<unknown[]>().default(sql`'[]'::jsonb`),
  active: boolean("active").notNull().default(true),
});

export const warranties = pgTable("warranties", {
  id: uuid("id").primaryKey().defaultRandom(),
  job_id: uuid("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  warranty_type: varchar("warranty_type", { length: 100 }).notNull(),
  coverage_years: integer("coverage_years").notNull(),
  start_date: timestamp("start_date", { withTimezone: true }).notNull(),
  end_date: timestamp("end_date", { withTimezone: true }).notNull(),
  coverage_details: text("coverage_details"),
  status: varchar("status", { length: 50 }).default("active"),
});

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  customer_name: varchar("customer_name", { length: 200 }).notNull(),
  rating: integer("rating").notNull(),
  review_text: text("review_text").notNull(),
  service: varchar("service", { length: 100 }),
  location: varchar("location", { length: 200 }),
  source: varchar("source", { length: 50 }),
  external_url: text("external_url"),
  approved: boolean("approved").notNull().default(false),
  featured: boolean("featured").notNull().default(false),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ============================================================
 * Estimating / Roofing details
 * ========================================================= */
export const estimate_line_items = pgTable("estimate_line_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  estimate_id: uuid("estimate_id").notNull().references(() => estimates.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull().default("1"),
  unit: varchar("unit", { length: 50 }),
  unit_price: numeric("unit_price", { precision: 14, scale: 4 }).notNull().default("0"),
  line_total: numeric("line_total", { precision: 14, scale: 2 }).notNull().default("0"),
  sort_order: integer("sort_order").default(0),
});

export const estimate_revisions = pgTable("estimate_revisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  estimate_id: uuid("estimate_id").notNull().references(() => estimates.id, { onDelete: "cascade" }),
  revision_number: integer("revision_number").notNull(),
  snapshot: jsonb("snapshot").$type<Record<string, unknown>>().notNull(),
  created_by: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const estimate_photos = pgTable("estimate_photos", {
  id: uuid("id").primaryKey().defaultRandom(),
  estimate_id: uuid("estimate_id").notNull().references(() => estimates.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  caption: text("caption"),
  uploaded_at: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const estimate_documents = pgTable("estimate_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  estimate_id: uuid("estimate_id").notNull().references(() => estimates.id, { onDelete: "cascade" }),
  document_id: uuid("document_id").references(() => smart_documents.id, { onDelete: "set null" }),
  type: varchar("type", { length: 50 }),
});

export const estimate_templates = pgTable("estimate_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  template_data: jsonb("template_data").$type<Record<string, unknown>>().notNull().default({}),
  active: boolean("active").notNull().default(true),
});

export const commercial_estimates = pgTable("commercial_estimates", {
  id: uuid("id").primaryKey().defaultRandom(),
  estimate_id: uuid("estimate_id").references(() => estimates.id, { onDelete: "cascade" }),
  roof_system_type: varchar("roof_system_type", { length: 100 }),
  building_data: jsonb("building_data").$type<Record<string, unknown>>().default({}),
  pricing_data: jsonb("pricing_data").$type<Record<string, unknown>>().default({}),
});

export const commercial_roof_systems = pgTable("commercial_roof_systems", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  base_price_per_sqft: numeric("base_price_per_sqft", { precision: 10, scale: 4 }),
  features: jsonb("features").$type<unknown[]>().default(sql`'[]'::jsonb`),
});

export const product_selections = pgTable("product_selections", {
  id: uuid("id").primaryKey().defaultRandom(),
  estimate_id: uuid("estimate_id").notNull().references(() => estimates.id, { onDelete: "cascade" }),
  category: varchar("category", { length: 50 }).notNull(),
  product_name: varchar("product_name", { length: 200 }).notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
});

export const roof_facets = pgTable("roof_facets", {
  id: uuid("id").primaryKey().defaultRandom(),
  estimate_id: uuid("estimate_id").references(() => estimates.id, { onDelete: "cascade" }),
  facet_name: varchar("facet_name", { length: 100 }),
  area_sqft: numeric("area_sqft", { precision: 14, scale: 2 }),
  pitch: varchar("pitch", { length: 20 }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
});

export const roof_pitch_breakdown = pgTable("roof_pitch_breakdown", {
  id: uuid("id").primaryKey().defaultRandom(),
  estimate_id: uuid("estimate_id").references(() => estimates.id, { onDelete: "cascade" }),
  pitch: varchar("pitch", { length: 20 }).notNull(),
  area_sqft: numeric("area_sqft", { precision: 14, scale: 2 }).notNull(),
});

export const measurement_data = pgTable("measurement_data", {
  id: uuid("id").primaryKey().defaultRandom(),
  estimate_id: uuid("estimate_id").references(() => estimates.id, { onDelete: "cascade" }),
  total_roof_squares: numeric("total_roof_squares", { precision: 10, scale: 2 }),
  ridge_length_lf: numeric("ridge_length_lf", { precision: 10, scale: 2 }),
  hip_length_lf: numeric("hip_length_lf", { precision: 10, scale: 2 }),
  valley_length_lf: numeric("valley_length_lf", { precision: 10, scale: 2 }),
  eave_length_lf: numeric("eave_length_lf", { precision: 10, scale: 2 }),
  rake_length_lf: numeric("rake_length_lf", { precision: 10, scale: 2 }),
  flashing_length_lf: numeric("flashing_length_lf", { precision: 10, scale: 2 }),
  step_flashing_lf: numeric("step_flashing_lf", { precision: 10, scale: 2 }),
  raw_data: jsonb("raw_data").$type<Record<string, unknown>>().default({}),
});

export const eagleview_reports = pgTable("eagleview_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  estimate_id: uuid("estimate_id").references(() => estimates.id, { onDelete: "set null" }),
  report_id: varchar("report_id", { length: 100 }),
  status: varchar("status", { length: 50 }),
  report_data: jsonb("report_data").$type<Record<string, unknown>>().default({}),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const eagleview_images = pgTable("eagleview_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  report_id: uuid("report_id").references(() => eagleview_reports.id, { onDelete: "cascade" }),
  image_type: varchar("image_type", { length: 50 }),
  url: text("url").notNull(),
});

export const materials = pgTable("materials", {
  id: uuid("id").primaryKey().defaultRandom(),
  job_id: uuid("job_id").references(() => jobs.id, { onDelete: "cascade" }),
  catalog_id: uuid("catalog_id"),
  name: varchar("name", { length: 200 }).notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }),
  unit: varchar("unit", { length: 50 }),
  unit_cost: numeric("unit_cost", { precision: 14, scale: 4 }),
  ordered_at: timestamp("ordered_at", { withTimezone: true }),
  delivered_at: timestamp("delivered_at", { withTimezone: true }),
});

export const material_catalog = pgTable("material_catalog", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  category: varchar("category", { length: 50 }),
  manufacturer: varchar("manufacturer", { length: 100 }),
  sku: varchar("sku", { length: 100 }),
  unit: varchar("unit", { length: 50 }),
  unit_cost: numeric("unit_cost", { precision: 14, scale: 4 }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
});

export const labor_rates = pgTable("labor_rates", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: varchar("category", { length: 50 }).notNull(),
  rate_per_hour: numeric("rate_per_hour", { precision: 10, scale: 2 }),
  rate_per_square: numeric("rate_per_square", { precision: 10, scale: 2 }),
  active: boolean("active").notNull().default(true),
});

export const waste_factors = pgTable("waste_factors", {
  id: uuid("id").primaryKey().defaultRandom(),
  material_category: varchar("material_category", { length: 50 }).notNull(),
  factor_percent: numeric("factor_percent", { precision: 5, scale: 2 }).notNull(),
});

export const roof_calculator_settings = pgTable("roof_calculator_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: jsonb("value").$type<unknown>().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const roof_estimate_settings = pgTable("roof_estimate_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: jsonb("value").$type<unknown>().notNull(),
});

/* ============================================================
 * Type exports
 * ========================================================= */
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type Estimate = typeof estimates.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type SmartDocument = typeof smart_documents.$inferSelect;
