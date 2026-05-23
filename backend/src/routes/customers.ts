import { buildCrud } from "./_crud.js";
import { schema } from "../db/index.js";
import { customerSchema } from "../validators/schemas.js";

export default buildCrud({
  table: schema.customers,
  pkColumn: schema.customers.id,
  createSchema: customerSchema,
  updateSchema: customerSchema.partial(),
  orderByColumn: schema.customers.created_at,
});
