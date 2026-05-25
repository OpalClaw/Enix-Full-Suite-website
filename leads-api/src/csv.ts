// =============================================================================
// Safe CSV serialization
// =============================================================================
// Spreadsheet apps (Excel, Numbers, Sheets, LibreOffice) interpret cells that
// begin with =, +, -, @, TAB, or CR as formulas. A lead with name `=CMD|'/C
// calc'!A0` would execute on open. The OWASP-recommended defense is to prefix
// any such field with a single quote ' which renders the cell as literal text.
//
// We additionally:
//   • Escape embedded double-quotes by doubling them.
//   • Wrap fields containing , " \n or \r in double quotes.
//   • Serialize non-string values via JSON.stringify so an object never
//     collapses to "[object Object]".
//
// Reference: https://owasp.org/www-community/attacks/CSV_Injection
// =============================================================================

const FORMULA_PREFIX = /^[=+\-@\t\r]/;

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s: string;
  if (typeof value === "object") {
    s = JSON.stringify(value);
  } else {
    s = String(value);
  }
  // Neutralise formula injection.
  if (FORMULA_PREFIX.test(s)) {
    s = `'${s}`;
  }
  // Quote-wrap if necessary.
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    s = `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Render an array of row objects as RFC 4180 CSV with CSV-injection escapes. */
export function toCSV(rows: ReadonlyArray<Record<string, unknown>>): string {
  if (rows.length === 0) return "";
  // Union of keys, in first-seen order.
  const headers: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    for (const k of Object.keys(row)) {
      if (!seen.has(k)) {
        seen.add(k);
        headers.push(k);
      }
    }
  }
  const lines: string[] = [headers.map(escapeCell).join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCell(row[h])).join(","));
  }
  // Use CRLF per RFC 4180.
  return lines.join("\r\n");
}

// Exported for tests.
export const _internal = { escapeCell };
