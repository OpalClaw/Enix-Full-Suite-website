// SHIM: re-exports the new API client under the old name so
// existing imports (`import { base44 } from '@/api/base44Client'`) keep working
// without touching every consumer. Migration path:
//   Phase 1: this shim points at the Express/Postgres API. ← we are here
//   Phase 2: migrate consumers to `import client from '@/api/client'` directly.
//   Phase 3: delete this file.
import client from "./client.js";

export const base44 = client;
export default client;
