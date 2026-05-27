import { buildCrud } from "./_crud.js";
import { schema } from "../db/index.js";
import { createCrewSchema, updateCrewSchema } from "../validators/schemas.js";

export default buildCrud({
  table: schema.crews,
  pkColumn: schema.crews.id,
  createSchema: createCrewSchema,
  updateSchema: updateCrewSchema,
  orderByColumn: schema.crews.name,
  defaultOrder: "asc",
  touchUpdatedAt: false,
  readRoles: ["admin", "manager", "estimator", "office", "office_staff", "project_manager", "production_manager", "crew_lead", "crew"],
  writeRoles: ["admin", "manager", "production_manager"],
});
