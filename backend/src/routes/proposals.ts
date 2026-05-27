import { buildCrud } from "./_crud.js";
import { schema } from "../db/index.js";
import { createProposalSchema, updateProposalSchema } from "../validators/schemas.js";

export default buildCrud({
  table: schema.proposals,
  pkColumn: schema.proposals.id,
  createSchema: createProposalSchema,
  updateSchema: updateProposalSchema,
  orderByColumn: schema.proposals.created_at,
  touchUpdatedAt: false,
  readRoles: ["admin", "manager", "estimator", "office", "office_staff", "sales_rep", "project_manager", "production_manager"],
  writeRoles: ["admin", "manager", "estimator", "office", "office_staff", "sales_rep", "project_manager"],
});
