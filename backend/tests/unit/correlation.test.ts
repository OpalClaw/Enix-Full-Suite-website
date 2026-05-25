import { describe, expect, it, vi } from "vitest";
import { correlationId } from "../../src/middleware/correlation.js";

function mockReq(headers: Record<string, string> = {}) {
  return {
    header(name: string) {
      return headers[name.toLowerCase()];
    },
  } as unknown as import("express").Request;
}

function mockRes() {
  const headers: Record<string, string> = {};
  return {
    setHeader: vi.fn((k: string, v: string) => {
      headers[k.toLowerCase()] = v;
    }),
    _headers: headers,
  } as unknown as import("express").Response & { _headers: Record<string, string> };
}

describe("correlationId middleware", () => {
  it("generates a UUID when no incoming x-request-id", () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();
    correlationId(req, res, next);
    expect(req.correlationId).toMatch(/^[0-9a-f-]{36}$/);
    expect(next).toHaveBeenCalledOnce();
  });

  it("echoes a safe incoming x-request-id", () => {
    const req = mockReq({ "x-request-id": "req-abc-123" });
    const res = mockRes();
    correlationId(req, res, () => undefined);
    expect(req.correlationId).toBe("req-abc-123");
  });

  it("ignores hostile x-request-id (CRLF injection, > 128 chars)", () => {
    const req = mockReq({ "x-request-id": "evil\r\nSet-Cookie: ohno" });
    const res = mockRes();
    correlationId(req, res, () => undefined);
    expect(req.correlationId).not.toContain("\r");
    expect(req.correlationId).not.toContain("\n");
    expect(req.correlationId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("rejects > 128-char incoming ids", () => {
    const req = mockReq({ "x-request-id": "x".repeat(200) });
    const res = mockRes();
    correlationId(req, res, () => undefined);
    expect(req.correlationId?.length).toBeLessThanOrEqual(36);
  });
});
