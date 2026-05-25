import { describe, expect, test } from "bun:test";
import { toCSV, _internal } from "../src/csv";

const { escapeCell } = _internal;

describe("CSV injection escapes (OWASP)", () => {
  test("=CMD payload is prefixed with single quote", () => {
    expect(escapeCell("=CMD|'/C calc'!A0")).toBe(`'=CMD|'/C calc'!A0`);
  });

  test("leading + is escaped", () => {
    expect(escapeCell("+1234")).toBe("'+1234");
  });

  test("leading - is escaped", () => {
    expect(escapeCell("-SUM(A1:A2)")).toBe(`'-SUM(A1:A2)`);
  });

  test("leading @ is escaped (used by SUM in Numbers)", () => {
    expect(escapeCell("@SUM(1+1)*cmd|' /C calc'!A0")).toBe(`'@SUM(1+1)*cmd|' /C calc'!A0`);
  });

  test("leading TAB and CR are escaped", () => {
    expect(escapeCell("\t=DANGER")).toBe("'\t=DANGER");
    expect(escapeCell("\r=DANGER")).toBe(`"'\r=DANGER"`); // CR triggers RFC-4180 quote-wrap
  });

  test("benign values pass through", () => {
    expect(escapeCell("John Smith")).toBe("John Smith");
    expect(escapeCell("john@example.com")).toBe("john@example.com");
    // email starting with letter is fine — only =+-@\t\r leads trigger
  });

  test("RFC 4180 quoting for commas/newlines/quotes", () => {
    expect(escapeCell('Hello, "world"\nbye')).toBe(`"Hello, ""world""\nbye"`);
  });

  test("non-string values JSON-encoded", () => {
    expect(escapeCell({ a: 1, b: "x" })).toBe(`"{""a"":1,""b"":""x""}"`);
  });
});

describe("toCSV full export", () => {
  test("empty rows -> empty string", () => {
    expect(toCSV([])).toBe("");
  });

  test("renders headers + rows with CRLF", () => {
    const out = toCSV([
      { id: "1", name: "Alice", note: "ok" },
      { id: "2", name: "Bob", note: "ok" },
    ]);
    expect(out).toContain("id,name,note");
    expect(out.split("\r\n")).toHaveLength(3);
  });

  test("missing keys serialize as empty", () => {
    const out = toCSV([{ id: "1", name: "Alice" }, { id: "2" }]);
    expect(out).toContain("2,");
  });

  test("formula-attack name on export is neutralised", () => {
    const out = toCSV([{ id: "1", name: "=2+2" }]);
    expect(out).toContain("'=2+2");
    expect(out).not.toMatch(/,=2\+2/);
  });
});
