import { buildCrud } from "./_crud.js";
import { schema } from "../db/index.js";
import {
  createInsuranceClaimSchema,
  updateInsuranceClaimSchema,
} from "../validators/schemas.js";

export default buildCrud({
  table: schema.insurance_claims,
  pkColumn: schema.insurance_claims.id,
  createSchema: createInsuranceClaimSchema,
  updateSchema: updateInsuranceClaimSchema,
  orderByColumn: schema.insurance_claims.created_at,
  touchUpdatedAt: false,
  readRoles: ["admin", "manager", "estimator", "office", "office_staff", "sales_rep", "project_manager"],
  writeRoles: ["admin", "manager", "estimator", "office", "office_staff", "sales_rep", "project_manager"],
});
