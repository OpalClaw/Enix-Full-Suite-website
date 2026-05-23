import { z } from "zod";

// ---- Auth ----
export const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(200),
});

export const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(200),
  full_name: z.string().min(2).max(200),
  phone: z.string().max(20).optional(),
});

export const clientLoginSchema = z.object({
  job_number: z.string().min(3).max(50),
  email: z.string().email().max(255),
});

// ---- Leads ----
export const createLeadSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().max(100).optional().default(""),
  email: z.string().email().max(255),
  phone: z.string().min(7).max(20),
  service: z.string().max(100).optional(),
  property_type: z.enum(["residential", "commercial"]).optional().default("residential"),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  zip: z.string().max(20).optional(),
  message: z.string().max(2000).optional(),
  tcpa_consent: z.boolean().refine(v => v === true, { message: "TCPA consent required" }),
  source: z.string().max(100).optional().default("website"),
  // Honeypot — must be empty
  website: z.string().max(0).optional(),
});

export const updateLeadSchema = z.object({
  status: z.enum(["new", "contacted", "qualified", "estimating", "won", "lost"]).optional(),
  priority: z.string().max(20).optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  notes: z.string().max(5000).optional(),
});

// ---- Jobs ----
export const createJobSchema = z.object({
  customer_id: z.string().uuid(),
  customer_name: z.string().min(1).max(200),
  customer_email: z.string().email().max(255).optional(),
  customer_phone: z.string().max(20).optional(),
  property_address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  zip: z.string().max(20).optional(),
  property_type: z.enum(["residential", "commercial"]).optional(),
  scope_of_work: z.string().max(5000).optional(),
  contract_value: z.number().nonnegative().optional(),
  scheduled_start: z.string().datetime().optional(),
  completion_date: z.string().datetime().optional(),
  warranty_years: z.number().int().min(0).max(100).optional(),
  lead_id: z.string().uuid().optional(),
});

export const updateJobSchema = createJobSchema.partial().extend({
  status: z.enum([
    "approved", "material_ordered", "scheduled", "in_production", "in_progress",
    "punch_list", "completed", "warrantied", "cancelled",
  ]).optional(),
});

// ---- Customers ----
export const customerSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(20).optional(),
  property_address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  zip: z.string().max(20).optional(),
  property_type: z.enum(["residential", "commercial"]).optional(),
  notes: z.string().max(5000).optional(),
});

// ---- Estimates / Invoices ----
const lineItemSchema = z.object({
  description: z.string().max(500),
  quantity: z.number(),
  unit: z.string().max(50).optional(),
  unit_price: z.number(),
});

export const createEstimateSchema = z.object({
  job_id: z.string().uuid().optional(),
  lead_id: z.string().uuid().optional(),
  customer_id: z.string().uuid().optional(),
  line_items: z.array(lineItemSchema).default([]),
  measurements: z.record(z.unknown()).optional(),
  valid_until: z.string().datetime().optional(),
});

export const createInvoiceSchema = z.object({
  job_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  line_items: z.array(lineItemSchema).default([]),
  due_date: z.string().datetime().optional(),
  payment_terms: z.string().max(500).optional(),
  message: z.string().max(2000).optional(),
});

// ---- Pagination ----
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.string().max(50).optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});
