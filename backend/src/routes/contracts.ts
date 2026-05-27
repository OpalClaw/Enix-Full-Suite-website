import { Router } from "express";
import express from "express";
import { desc, eq, sql } from "drizzle-orm";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { db, schema } from "../db/index.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import {
  paginationSchema,
  createContractSchema,
  updateContractSchema,
  sendContractSchema,
} from "../validators/schemas.js";
import { NotFound, BadRequest } from "../utils/errors.js";
import * as docusignService from "../services/docusign.js";
import { logger } from "../utils/logger.js";

const router = Router();

const READ = ["admin", "manager", "estimator", "office", "office_staff", "sales_rep", "project_manager", "production_manager"];
const WRITE = ["admin", "manager", "estimator", "office", "office_staff", "sales_rep", "project_manager"];

function generateContractNumber(): string {
  const y = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 90000) + 10000;
  return `C-${y}-${rand}`;
}

router.get("/", requireAuth, requireRole(...READ), async (req, res, next) => {
  try {
    const { limit, offset } = paginationSchema.parse(req.query);
    const [items, [{ count }]] = await Promise.all([
      db.select().from(schema.contracts).orderBy(desc(schema.contracts.created_at)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(schema.contracts),
    ]);
    res.json({ items, total: count, limit, offset });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", requireAuth, requireRole(...READ), async (req, res, next) => {
  try {
    const [item] = await db.select().from(schema.contracts).where(eq(schema.contracts.id, String(req.params.id))).limit(1);
    if (!item) throw NotFound();
    res.json(item);
  } catch (e) {
    next(e);
  }
});

router.post("/", requireAuth, requireRole(...WRITE), async (req, res, next) => {
  try {
    const data = createContractSchema.parse(req.body);
    let contract_number = generateContractNumber();
    for (let i = 0; i < 5; i++) {
      const [existing] = await db
        .select({ id: schema.contracts.id })
        .from(schema.contracts)
        .where(eq(schema.contracts.contract_number, contract_number))
        .limit(1);
      if (!existing) break;
      contract_number = generateContractNumber();
    }
    const insertValues: any = { ...data, contract_number, created_by: req.user!.sub };
    if (data.start_date) insertValues.start_date = new Date(data.start_date);
    if (data.end_date) insertValues.end_date = new Date(data.end_date);
    const [item] = await db.insert(schema.contracts).values(insertValues).returning();
    res.status(201).json(item);
  } catch (e) {
    next(e);
  }
});

router.patch("/:id", requireAuth, requireRole(...WRITE), async (req, res, next) => {
  try {
    const data = updateContractSchema.parse(req.body);
    const update: any = { ...data, updated_at: new Date() };
    if (data.start_date) update.start_date = new Date(data.start_date);
    if (data.end_date) update.end_date = new Date(data.end_date);
    const [item] = await db
      .update(schema.contracts)
      .set(update)
      .where(eq(schema.contracts.id, String(req.params.id)))
      .returning();
    if (!item) throw NotFound();
    res.json(item);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const result = await db.delete(schema.contracts).where(eq(schema.contracts.id, String(req.params.id))).returning();
    if (!result.length) throw NotFound();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// ---------------------------------------------------------------------------
// DocuSign — send for signature
// ---------------------------------------------------------------------------
async function renderContractPdf(contract: any): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page = pdf.addPage([612, 792]); // letter

  let y = 740;
  page.drawText("ENIX EXTERIORS — CONTRACT", { x: 50, y, size: 18, font: fontBold, color: rgb(0.06, 0.16, 0.26) });
  y -= 30;
  page.drawText(`Contract #: ${contract.contract_number ?? ""}`, { x: 50, y, size: 11, font });
  y -= 16;
  page.drawText(`Customer: ${contract.customer_name ?? ""}`, { x: 50, y, size: 11, font });
  y -= 16;
  if (contract.property_address) {
    page.drawText(`Property: ${contract.property_address}`, { x: 50, y, size: 11, font });
    y -= 16;
  }
  page.drawText(`Contract price: $${Number(contract.contract_price ?? contract.contract_value ?? 0).toLocaleString()}`, {
    x: 50,
    y,
    size: 11,
    font,
  });
  y -= 30;

  const terms = (contract.terms as string | null) ?? "";
  if (terms) {
    page.drawText("Terms:", { x: 50, y, size: 12, font: fontBold });
    y -= 18;
    const lines = wrap(terms, 90);
    for (const line of lines) {
      if (y < 200) break;
      page.drawText(line, { x: 50, y, size: 10, font });
      y -= 14;
    }
  }

  // Anchor strings for DocuSign signHere tabs
  y = 160;
  page.drawText("Customer signature:", { x: 50, y, size: 10, font: fontBold });
  page.drawText("/SIG_CLIENT/", { x: 200, y, size: 10, font, color: rgb(1, 1, 1) });
  page.drawText("Date: /DATE_CLIENT/", { x: 400, y, size: 10, font, color: rgb(1, 1, 1) });
  y -= 60;
  page.drawText("Enix Exteriors representative:", { x: 50, y, size: 10, font: fontBold });
  page.drawText("/SIG_BUSINESS/", { x: 230, y, size: 10, font, color: rgb(1, 1, 1) });
  page.drawText("Date: /DATE_BUSINESS/", { x: 400, y, size: 10, font, color: rgb(1, 1, 1) });

  return pdf.save();
}

function wrap(text: string, perLine: number): string[] {
  const out: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(" ")) {
      if ((line + " " + word).trim().length > perLine) {
        out.push(line);
        line = word;
      } else line = (line + " " + word).trim();
    }
    if (line) out.push(line);
  }
  return out;
}

router.post("/:id/send-for-signature", requireAuth, requireRole(...WRITE), async (req, res, next) => {
  try {
    const data = sendContractSchema.parse(req.body);
    const [contract] = await db.select().from(schema.contracts).where(eq(schema.contracts.id, String(req.params.id))).limit(1);
    if (!contract) throw NotFound();
    if (!data.signer_email) throw BadRequest("signer_email required");

    const pdfBytes = await renderContractPdf(contract);
    const documentBase64 = Buffer.from(pdfBytes).toString("base64");

    const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol;
    const host = req.get("host");
    const webhookUrl = `${proto}://${host}/api/contracts/docusign-webhook`;

    const signers = [
      { email: data.signer_email, name: data.signer_name, recipientId: "1" },
    ];
    if (data.cc_business_email && data.cc_business_name) {
      signers.push({ email: data.cc_business_email, name: data.cc_business_name, recipientId: "2" });
    }

    const env = await docusignService.sendEnvelope({
      documentBase64,
      documentName: `Contract-${contract.contract_number}.pdf`,
      emailSubject: data.subject ?? `Contract ${contract.contract_number} — Enix Exteriors`,
      emailMessage: data.message,
      signers,
      webhookUrl,
    });

    const [updated] = await db
      .update(schema.contracts)
      .set({
        docusign_envelope_id: env.envelopeId,
        docusign_status: env.status,
        docusign_last_event_at: new Date(),
        status: "pending_signature",
        updated_at: new Date(),
      })
      .where(eq(schema.contracts.id, contract.id))
      .returning();

    res.json(updated);
  } catch (e) {
    next(e);
  }
});

router.get("/:id/docusign-status", requireAuth, requireRole(...READ), async (req, res, next) => {
  try {
    const [contract] = await db.select().from(schema.contracts).where(eq(schema.contracts.id, String(req.params.id))).limit(1);
    if (!contract) throw NotFound();
    if (!contract.docusign_envelope_id) throw BadRequest("Contract has not been sent for signature");
    const status = await docusignService.getEnvelopeStatus(contract.docusign_envelope_id);
    res.json(status);
  } catch (e) {
    next(e);
  }
});

// DocuSign Connect webhook — public endpoint, signature-verified.
// Express raw body required for HMAC verification.
router.post(
  "/docusign-webhook",
  express.raw({ type: "*/*", limit: "5mb" }),
  async (req, res, next) => {
    try {
      const signature = req.header("x-docusign-signature-1");
      const raw = req.body as Buffer;
      const ok = await docusignService.verifyWebhookHmac(signature, raw);
      if (!ok) throw BadRequest("Invalid DocuSign signature");

      const payload = JSON.parse(raw.toString("utf8")) as {
        event?: string;
        data?: { envelopeId?: string; envelopeSummary?: { status?: string } };
      };
      const envelopeId = payload?.data?.envelopeId;
      const status = payload?.data?.envelopeSummary?.status ?? payload?.event ?? "unknown";
      if (envelopeId) {
        const update: any = { docusign_status: status, docusign_last_event_at: new Date() };
        if (status === "completed") {
          update.signed = true;
          update.signed_at = new Date();
          update.status = "signed";
        }
        await db
          .update(schema.contracts)
          .set(update)
          .where(eq(schema.contracts.docusign_envelope_id, envelopeId));
        logger.info({ envelopeId, status }, "docusign webhook applied");
      }
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  },
);

export default router;
