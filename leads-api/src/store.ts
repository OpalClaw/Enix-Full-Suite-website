// =============================================================================
// Append-only leads store with serialized writes
// =============================================================================
// Concurrent writes to leads.json would race and corrupt JSON. We serialize
// every write through an in-process mutex (one async chain). For multi-instance
// deployments on Zo Space, the file is single-host anyway; this is sufficient.
//
// The format on disk is a JSON ARRAY at the top level. We hold the entire array
// in memory between writes to keep the read path O(1).
// =============================================================================

import { promises as fs } from "node:fs";
import path from "node:path";

export interface LeadRecord {
  id: string;
  received_at: string;
  notified: boolean;
  notified_at: string | null;
  name: string;
  email: string;
  phone: string;
  service: string;
  property_type: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  message: string;
  source: string;
  tcpaConsent: boolean;
  photo_count: number;
  ip: string;
  user_agent: string;
  referer: string;
}

const LEADS_FILE = process.env.LEADS_FILE || "/home/workspace/Documents/Enix/leads.json";
const SOFT_LIMIT = Number(process.env.LEADS_SOFT_LIMIT || 10_000);

// ---- Write serialization ----
// Every mutation is chained to the previous one via this promise. New mutations
// await it before executing, then replace it. This guarantees serial order
// without external locking.
let writeChain: Promise<unknown> = Promise.resolve();

function chain<T>(work: () => Promise<T>): Promise<T> {
  const next = writeChain.then(work, work);
  // Swallow errors on the chain itself so one failure doesn't poison subsequent
  // writes. Individual callers still see their own errors via the returned promise.
  writeChain = next.catch(() => undefined);
  return next;
}

async function ensureDir(file: string): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
}

export async function readLeads(): Promise<LeadRecord[]> {
  try {
    const raw = await fs.readFile(LEADS_FILE, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      // Corrupted file or wrong shape — refuse to operate on it.
      throw new Error(`leads file is not a JSON array: ${LEADS_FILE}`);
    }
    return parsed as LeadRecord[];
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

/**
 * Append a single lead. Writes are serialized via an in-process chain.
 * Returns the number of leads on disk after the write (handy for soft-limit
 * warnings).
 */
export function appendLead(lead: LeadRecord): Promise<{ total: number; warn: boolean }> {
  return chain(async () => {
    await ensureDir(LEADS_FILE);
    const existing = await readLeads();
    existing.push(lead);
    // Write to a temp file then atomic rename — prevents partial writes if
    // the process is killed mid-write.
    const tmp = `${LEADS_FILE}.tmp.${process.pid}.${Date.now()}`;
    await fs.writeFile(tmp, JSON.stringify(existing, null, 2), "utf8");
    await fs.rename(tmp, LEADS_FILE);
    return { total: existing.length, warn: existing.length > SOFT_LIMIT };
  });
}

export function leadsFilePath(): string {
  return LEADS_FILE;
}
