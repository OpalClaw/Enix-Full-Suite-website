import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { promises as fs } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";

const TMP_FILE = path.join(tmpdir(), `enix-leads-test-${randomUUID()}.json`);

beforeEach(() => {
  process.env.LEADS_FILE = TMP_FILE;
});

afterEach(async () => {
  try {
    await fs.unlink(TMP_FILE);
  } catch {
    /* ignore */
  }
});

function makeLead(name: string) {
  return {
    id: randomUUID(),
    received_at: new Date().toISOString(),
    notified: false,
    notified_at: null,
    name,
    email: `${name}@x.com`,
    phone: "8655551234",
    service: "",
    property_type: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    message: "",
    source: "test",
    tcpaConsent: true,
    photo_count: 0,
    ip: "127.0.0.1",
    user_agent: "test",
    referer: "",
  };
}

describe("leads store concurrent-write safety", () => {
  test("100 concurrent appends produce 100 records (no race / no corruption)", async () => {
    // Re-import after env var is set so module-level constants pick it up.
    const mod = await import(`../src/store?reload=${Date.now()}`);
    const { appendLead, readLeads } = mod;

    const tasks: Promise<unknown>[] = [];
    for (let i = 0; i < 100; i++) {
      tasks.push(appendLead(makeLead(`lead-${i}`)));
    }
    await Promise.all(tasks);

    const final = await readLeads();
    expect(final.length).toBe(100);

    // File must still be valid JSON (no partial writes / interleaved bytes).
    const raw = await fs.readFile(TMP_FILE, "utf8");
    expect(() => JSON.parse(raw)).not.toThrow();

    // All IDs unique
    const ids = new Set(final.map((l: { id: string }) => l.id));
    expect(ids.size).toBe(100);
  });

  test("read on missing file returns empty array", async () => {
    await fs.unlink(TMP_FILE).catch(() => undefined);
    const { readLeads } = await import(`../src/store?reload=${Date.now()}`);
    expect(await readLeads()).toEqual([]);
  });
});
