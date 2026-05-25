// =============================================================================
// Zod schemas for lead intake
// =============================================================================
// .strict() rejects unknown fields — defense against prototype pollution
// (__proto__, constructor, toString) and schema-drift attacks.
// All strings are trimmed and length-capped.

import { z } from "zod";

const trimmed = (max: number) =>
  z
    .string()
    .trim()
    // Strip ASCII control chars; they have no business in a lead form.
    .transform((s) => s.replace(/[\u0000-\u001f\u007f]/g, " "))
    .pipe(z.string().max(max));

const optionalTrimmed = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" ? v : v == null ? "" : String(v)),
    trimmed(max).optional().default(""),
  );

const phoneSchema = trimmed(40).refine(
  (p) => p === "" || (p.match(/\d/g) ?? []).length >= 7,
  { message: "phone must contain at least 7 digits" },
);

const emailSchema = trimmed(180).refine(
  // Conservative — RFC 5322 is too permissive for a lead form.
  (e) => e === "" || /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]{2,}$/.test(e),
  { message: "invalid email" },
);

export const leadIntakeSchema = z
  .object({
    name: trimmed(120),
    email: emailSchema,
    phone: phoneSchema,
    service: optionalTrimmed(80),
    property_type: optionalTrimmed(40),
    address: optionalTrimmed(200),
    city: optionalTrimmed(100),
    state: optionalTrimmed(50),
    zip: optionalTrimmed(20),
    message: optionalTrimmed(2000),
    source: optionalTrimmed(80),
    tcpaConsent: z.boolean(),
    // Honeypot field — anti-bot. Must be empty.
    website: z.string().max(200).optional().default(""),
    photo_urls: z.array(z.string().url().max(2048)).max(20).optional().default([]),
  })
  .strict()
  .refine(
    (v) => v.name !== "" || v.email !== "" || v.phone !== "",
    { message: "at least one of name, email, phone is required", path: ["name"] },
  )
  .refine((v) => v.tcpaConsent === true, {
    message: "tcpa_consent_required",
    path: ["tcpaConsent"],
  });

export type LeadIntake = z.infer<typeof leadIntakeSchema>;
