import { z } from "zod";

// ---- Auth ----
export const loginSchema = z.object({
  email: z.string().email().max(255).toLowerCase(),
  password: z.string().min(8).max(200),
});

export const registerSchema = z.object({
  email: z.string().email().max(255).toLowerCase(),
  password: z.string().min(8).max(200),
  full_name: z.string().min(2).max(200),
  phone: z.string().max(20).optional(),
});

export const clientLoginSchema = z.object({
  job_number: z.string().min(3).max(50),
  email: z.string().email().max(255).toLowerCase(),
});

// ---- Leads ----
export const createLeadSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().max(100).optional().default(""),
  email: z.string().email().max(255).toLowerCase(),
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

// ============================================================================
// Tasks
// ============================================================================
export const taskStatusEnum = z.enum([
  "not_started",
  "in_progress",
  "completed",
  "overdue",
  "cancelled",
]);
export const taskPriorityEnum = z.enum(["low", "medium", "high", "urgent"]);
export const taskTypeEnum = z.enum([
  "follow_up",
  "inspection",
  "estimate",
  "production",
  "payment",
  "other",
]);

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  job_id: z.string().uuid().optional().nullable(),
  lead_id: z.string().uuid().optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
  assignee_id: z.string().uuid().optional().nullable(),
  status: taskStatusEnum.optional().default("not_started"),
  priority: taskPriorityEnum.optional().default("medium"),
  task_type: taskTypeEnum.optional(),
  due_date: z.string().datetime({ offset: true }).or(z.string().min(8)).optional().nullable(),
  notes: z.string().max(5000).optional(),
});
export const updateTaskSchema = createTaskSchema.partial().extend({
  completed_date: z.string().datetime({ offset: true }).or(z.string().min(8)).optional().nullable(),
});

// ============================================================================
// Appointments
// ============================================================================
export const createAppointmentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  appointment_type: z.enum([
    "inspection",
    "estimate",
    "follow_up",
    "production",
    "final_inspection",
    "meeting",
    "other",
  ]),
  scheduled_at: z.string().datetime({ offset: true }).or(z.string().min(8)),
  duration_minutes: z.number().int().min(1).max(1440).optional().default(60),
  job_id: z.string().uuid().optional().nullable(),
  lead_id: z.string().uuid().optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
  assignee_id: z.string().uuid().optional().nullable(),
  assigned_crew: z.string().uuid().optional().nullable(),
  customer_name: z.string().max(200).optional(),
  customer_phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  notes: z.string().max(5000).optional(),
  status: z.enum(["scheduled", "completed", "cancelled", "rescheduled"]).optional(),
});
export const updateAppointmentSchema = createAppointmentSchema.partial();

// ============================================================================
// Messages
// ============================================================================
export const createMessageSchema = z.object({
  job_id: z.string().uuid().optional().nullable(),
  lead_id: z.string().uuid().optional().nullable(),
  recipient_email: z.string().email().max(255).optional(),
  recipient_phone: z.string().max(20).optional(),
  recipient_user_id: z.string().uuid().optional().nullable(),
  subject: z.string().max(200).optional(),
  body: z.string().min(1).max(10000),
  channel: z.enum(["in_app", "sms", "email"]).optional().default("in_app"),
  is_internal: z.boolean().optional().default(false),
});

export const sendSmsSchema = z.object({
  to: z.string().min(7).max(20),
  body: z.string().min(1).max(1600),
  job_id: z.string().uuid().optional().nullable(),
  lead_id: z.string().uuid().optional().nullable(),
});

export const initiateCallSchema = z.object({
  to: z.string().min(7).max(20),
  job_id: z.string().uuid().optional().nullable(),
  twiml_url: z.string().url().optional(),
});

// ============================================================================
// Warranties
// ============================================================================
export const createWarrantySchema = z.object({
  job_id: z.string().uuid().optional(),
  customer_name: z.string().max(200).optional(),
  customer_email: z.string().email().max(255).optional(),
  property_address: z.string().max(500).optional(),
  warranty_type: z.enum([
    "manufacturer",
    "workmanship",
    "extended",
    "roofing",
    "siding",
    "windows",
    "doors",
    "gutters",
  ]),
  manufacturer: z.string().max(200).optional(),
  coverage_years: z.number().int().min(1).max(100),
  start_date: z.string().datetime({ offset: true }).or(z.string().min(8)),
  end_date: z.string().datetime({ offset: true }).or(z.string().min(8)),
  coverage_details: z.string().max(10000).optional(),
  document_url: z.string().url().max(1000).optional(),
  active: z.boolean().optional().default(true),
  claims: z.array(z.record(z.unknown())).optional(),
  notes: z.string().max(5000).optional(),
});
export const updateWarrantySchema = createWarrantySchema.partial();

// ============================================================================
// Inspections
// ============================================================================
export const createInspectionSchema = z.object({
  job_id: z.string().uuid().optional().nullable(),
  lead_id: z.string().uuid().optional().nullable(),
  inspector_id: z.string().uuid().optional().nullable(),
  inspector_name: z.string().max(200).optional(),
  inspection_type: z.enum([
    "roofing",
    "siding",
    "windows",
    "doors",
    "gutters",
    "exterior",
    "general",
  ]).default("roofing"),
  service_type: z.string().max(50).optional(),
  property_type: z.enum(["residential", "commercial"]).default("residential"),
  customer_name: z.string().max(200).optional(),
  property_address: z.string().max(500).optional(),
  inspection_date: z.string().datetime({ offset: true }).or(z.string().min(8)).optional(),
  scheduled_at: z.string().datetime({ offset: true }).or(z.string().min(8)).optional(),
  roof_type: z.string().max(100).optional(),
  shingle_type: z.string().max(100).optional(),
  roof_age: z.string().max(50).optional(),
  squares: z.number().nonnegative().optional(),
  pitch: z.string().max(20).optional(),
  layers: z.number().int().min(0).max(10).optional(),
  damage_notes: z.string().max(5000).optional(),
  leak_notes: z.string().max(5000).optional(),
  ventilation_notes: z.string().max(5000).optional(),
  flashing_notes: z.string().max(5000).optional(),
  storm_damage_checklist: z.array(z.string().max(200)).optional(),
  checklist: z.record(z.unknown()).optional(),
  insurance_claim_notes: z.string().max(5000).optional(),
  recommended_scope: z.string().max(10000).optional(),
  photo_urls: z.array(z.string().url().max(1000)).optional(),
  status: z.enum(["scheduled", "in_progress", "completed", "pending_review", "cancelled"]).optional(),
});
export const updateInspectionSchema = createInspectionSchema.partial();

// ============================================================================
// Contracts
// ============================================================================
export const createContractSchema = z.object({
  job_id: z.string().uuid().optional().nullable(),
  estimate_id: z.string().uuid().optional().nullable(),
  customer_id: z.string().uuid().optional().nullable(),
  customer_name: z.string().max(200).optional(),
  customer_email: z.string().email().max(255).optional(),
  customer_phone: z.string().max(20).optional(),
  property_address: z.string().max(500).optional(),
  template_id: z.string().uuid().optional().nullable(),
  document_id: z.string().uuid().optional().nullable(),
  title: z.string().max(200).optional(),
  contract_price: z.number().nonnegative().optional(),
  contract_value: z.number().nonnegative().optional(),
  status: z.enum(["draft", "pending_signature", "signed", "active", "completed", "void"]).optional(),
  start_date: z.string().datetime({ offset: true }).or(z.string().min(8)).optional(),
  end_date: z.string().datetime({ offset: true }).or(z.string().min(8)).optional(),
  terms: z.string().max(50000).optional(),
  body_content: z.record(z.unknown()).optional(),
  line_items: z.array(z.record(z.unknown())).optional(),
});
export const updateContractSchema = createContractSchema.partial();

export const sendContractSchema = z.object({
  signer_email: z.string().email().max(255),
  signer_name: z.string().max(200),
  cc_business_email: z.string().email().max(255).optional(),
  cc_business_name: z.string().max(200).optional(),
  subject: z.string().max(200).optional(),
  message: z.string().max(5000).optional(),
});

// ============================================================================
// Proposals
// ============================================================================
export const createProposalSchema = z.object({
  job_id: z.string().uuid().optional().nullable(),
  estimate_id: z.string().uuid().optional().nullable(),
  document_id: z.string().uuid().optional().nullable(),
  status: z.enum(["draft", "sent", "signed", "completed", "void"]).optional(),
});
export const updateProposalSchema = createProposalSchema.partial();

// ============================================================================
// Crews
// ============================================================================
export const createCrewSchema = z.object({
  name: z.string().min(1).max(200),
  lead_id: z.string().uuid().optional().nullable(),
  members: z.array(z.record(z.unknown())).optional(),
  active: z.boolean().optional().default(true),
});
export const updateCrewSchema = createCrewSchema.partial();

// ============================================================================
// Users (admin management)
// ============================================================================
export const ROLE_VALUES = [
  "admin",
  "manager",
  "estimator",
  "office",
  "office_staff",
  "crew",
  "crew_lead",
  "client",
  "sales_rep",
  "project_lead",
  "project_manager",
  "production_manager",
  "subcontractor",
] as const;

export const updateUserSchema = z.object({
  full_name: z.string().min(2).max(200).optional(),
  role: z.enum(ROLE_VALUES).optional(),
  phone: z.string().max(20).optional(),
  title: z.string().max(100).optional(),
  company: z.string().max(200).optional(),
  assigned_territory: z.string().max(200).optional(),
  crew_id: z.string().uuid().nullable().optional(),
  active: z.boolean().optional(),
});

export const inviteEmployeeSchema = z.object({
  email: z.string().email().max(255).toLowerCase(),
  role: z.enum(ROLE_VALUES),
  full_name: z.string().max(200).optional(),
  phone: z.string().max(20).optional(),
  title: z.string().max(100).optional(),
  company: z.string().max(200).optional(),
  assigned_territory: z.string().max(200).optional(),
  crew_id: z.string().uuid().nullable().optional(),
  // Optional pre-shared password; if absent a one-time link will be emailed.
  password: z.string().min(8).max(200).optional(),
});

export const inviteClientSchema = z.object({
  email: z.string().email().max(255).toLowerCase(),
  job_id: z.string().uuid().optional(),
  full_name: z.string().max(200).optional(),
});

// ============================================================================
// Materials
// ============================================================================
export const createMaterialSchema = z.object({
  job_id: z.string().uuid().optional().nullable(),
  catalog_id: z.string().uuid().optional().nullable(),
  name: z.string().min(1).max(200),
  quantity: z.number().nonnegative().optional(),
  unit: z.string().max(50).optional(),
  unit_cost: z.number().nonnegative().optional(),
  ordered_at: z.string().datetime({ offset: true }).optional(),
  delivered_at: z.string().datetime({ offset: true }).optional(),
});
export const updateMaterialSchema = createMaterialSchema.partial();

// ============================================================================
// Insurance Claims
// ============================================================================
export const createInsuranceClaimSchema = z.object({
  job_id: z.string().uuid().optional().nullable(),
  carrier: z.string().max(200).optional(),
  policy_number: z.string().max(100).optional(),
  claim_number: z.string().max(100).optional(),
  adjuster_name: z.string().max(200).optional(),
  adjuster_phone: z.string().max(20).optional(),
  acv: z.number().nonnegative().optional(),
  rcv: z.number().nonnegative().optional(),
  deductible: z.number().nonnegative().optional(),
  date_of_loss: z.string().datetime({ offset: true }).or(z.string().min(8)).optional(),
  status: z.string().max(50).optional(),
});
export const updateInsuranceClaimSchema = createInsuranceClaimSchema.partial();

// ============================================================================
// Reviews
// ============================================================================
export const createReviewSchema = z.object({
  customer_name: z.string().min(1).max(200),
  rating: z.number().int().min(1).max(5),
  review_text: z.string().min(1).max(5000),
  service: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
  source: z.string().max(50).optional(),
  external_url: z.string().url().max(1000).optional(),
  approved: z.boolean().optional(),
  featured: z.boolean().optional(),
});
export const updateReviewSchema = createReviewSchema.partial();

// ============================================================================
// Payments
// ============================================================================
export const createPaymentSchema = z.object({
  invoice_id: z.string().uuid(),
  amount: z.number().positive(),
  method: z.enum(["check", "card", "ach", "cash", "financing", "insurance"]),
  reference: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  received_at: z.string().datetime({ offset: true }).optional(),
});
export const updatePaymentSchema = createPaymentSchema.partial();

// ============================================================================
// Activity Log
// ============================================================================
export const createActivitySchema = z.object({
  entity_type: z.string().min(1).max(50),
  entity_id: z.string().uuid(),
  action: z.string().min(1).max(50),
  metadata: z.record(z.unknown()).optional(),
});

// ============================================================================
// Settings
// ============================================================================
export const updateSettingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.record(z.unknown()),
});

export const bulkUpdateSettingsSchema = z.object({
  settings: z.array(
    z.object({
      key: z.string().min(1).max(100),
      value: z.record(z.unknown()),
    }),
  ),
});
