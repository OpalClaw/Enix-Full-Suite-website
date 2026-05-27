import { Router } from "express";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { updateSettingSchema } from "../validators/schemas.js";
import {
  listSettings,
  getSetting,
  upsertSetting,
} from "../services/settings.js";
import * as twilio from "../services/twilio.js";
import * as docusign from "../services/docusign.js";
import * as email from "../services/email.js";
import * as eagleview from "../services/eagleview.js";
import * as quickbooks from "../services/quickbooks.js";
import * as abcSupply from "../services/abcSupply.js";
import { NotFound } from "../utils/errors.js";

const router = Router();

router.get("/", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    // Only admins see the unmasked secrets
    const includeSecrets = req.user!.role === "admin";
    const items = await listSettings(includeSecrets);
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

router.get("/:key", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const value = await getSetting(String(req.params.key));
    if (value === null) throw NotFound();
    res.json({ key: req.params.key, value });
  } catch (e) {
    next(e);
  }
});

router.put("/:key", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const data = updateSettingSchema.parse({
      key: String(req.params.key),
      value: req.body,
    });
    const result = await upsertSetting(data.key, data.value, req.user!.sub);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// ---- Connection status -----------------------------------------------------
router.get("/status/integrations", requireAuth, requireRole("admin", "manager"), async (_req, res, next) => {
  try {
    const [tw, ds, em, ev, qb, abc] = await Promise.all([
      twilio.ping(),
      docusign.ping(),
      email.ping(),
      eagleview.ping(),
      quickbooks.ping(),
      abcSupply.ping(),
    ]);
    res.json({
      twilio: tw,
      docusign: ds,
      smtp: em,
      eagleview: ev,
      quickbooks: qb,
      abc_supply: abc,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
