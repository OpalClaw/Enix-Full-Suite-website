import { describe, expect, test } from "bun:test";
import { leadIntakeSchema } from "../src/schema";

describe("leadIntakeSchema (strict)", () => {
  test("happy path", () => {
    const out = leadIntakeSchema.parse({
      name: "Jane Roof",
      email: "jane@example.com",
      phone: "8655551234",
      tcpaConsent: true,
    });
    expect(out.name).toBe("Jane Roof");
  });

  test("rejects unknown fields (prototype pollution defense)", () => {
    expect(() =>
      leadIntakeSchema.parse({
        name: "X",
        email: "x@y.com",
        phone: "5555555555",
        tcpaConsent: true,
        __proto__: { polluted: true },
      }),
    ).toThrow();
    expect(() =>
      leadIntakeSchema.parse({
        name: "X",
        email: "x@y.com",
        phone: "5555555555",
        tcpaConsent: true,
        constructor: { polluted: true },
      }),
    ).toThrow();
    expect(() =>
      leadIntakeSchema.parse({
        name: "X",
        email: "x@y.com",
        phone: "5555555555",
        tcpaConsent: true,
        admin: true,
      }),
    ).toThrow();
  });

  test("rejects missing tcpa consent", () => {
    expect(() =>
      leadIntakeSchema.parse({
        name: "X",
        email: "x@y.com",
        phone: "5555555555",
        tcpaConsent: false,
      }),
    ).toThrow(/tcpa_consent_required/);
  });

  test("rejects invalid email shape", () => {
    expect(() =>
      leadIntakeSchema.parse({
        name: "X",
        email: "test@",
        phone: "5555555555",
        tcpaConsent: true,
      }),
    ).toThrow();
  });

  test("rejects phone with < 7 digits", () => {
    expect(() =>
      leadIntakeSchema.parse({
        name: "X",
        email: "x@y.com",
        phone: "1234",
        tcpaConsent: true,
      }),
    ).toThrow();
  });

  test("requires at least one of name/email/phone", () => {
    expect(() =>
      leadIntakeSchema.parse({
        name: "",
        email: "",
        phone: "",
        tcpaConsent: true,
      }),
    ).toThrow();
  });

  test("strips control characters from inputs", () => {
    const out = leadIntakeSchema.parse({
      name: "Jane\u0000Roof\u001f",
      email: "jane@example.com",
      phone: "8655551234",
      tcpaConsent: true,
    });
    expect(out.name).not.toContain("\u0000");
    expect(out.name).not.toContain("\u001f");
  });

  test("XSS payload stored verbatim (not executed) — escaping happens on render", () => {
    const out = leadIntakeSchema.parse({
      name: "<script>alert(1)</script>",
      email: "j@example.com",
      phone: "8655551234",
      tcpaConsent: true,
    });
    expect(out.name).toBe("<script>alert(1)</script>");
    // The point: schema accepts it as a string. Frontend / CSV layer escape it.
  });
});
