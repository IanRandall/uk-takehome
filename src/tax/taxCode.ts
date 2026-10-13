export type TaxCode =
  | { type: "allowance"; allowance: number }
  | { type: "k"; addition: number }
  | { type: "flat"; rate: number }
  | { type: "none" };

export type TaxCodeResult =
  | { ok: true; code: TaxCode }
  | { ok: false; error: string };

export const SCOTTISH_TAX_CODE_ERROR =
  "Scottish tax codes use different income tax bands, which this calculator does not cover.";

const INVALID_TAX_CODE_ERROR = "Enter a tax code such as 1257L, BR, or K100.";

export function parseTaxCode(raw: string): TaxCodeResult {
  const compact = raw.trim().toUpperCase().replace(/\s+/g, "");
  if (!compact) return { ok: false, error: "Enter a tax code." };
  if (compact.startsWith("S")) return { ok: false, error: SCOTTISH_TAX_CODE_ERROR };

  let body = compact.startsWith("C") ? compact.slice(1) : compact;
  body = body.replace(/(?:W1|M1|X)$/, "");

  if (body === "NT") return { ok: true, code: { type: "none" } };
  if (body === "BR") return { ok: true, code: { type: "flat", rate: 0.2 } };
  if (body === "D0") return { ok: true, code: { type: "flat", rate: 0.4 } };
  if (body === "D1") return { ok: true, code: { type: "flat", rate: 0.45 } };

  const kCode = /^K(\d{1,6})$/.exec(body);
  if (kCode) {
    return { ok: true, code: { type: "k", addition: Number(kCode[1]) * 10 } };
  }

  const standard = /^(\d{1,6})([LMNT])$/.exec(body);
  if (standard) {
    return {
      ok: true,
      code: { type: "allowance", allowance: Number(standard[1]) * 10 },
    };
  }

  return { ok: false, error: INVALID_TAX_CODE_ERROR };
}

export function grantsPersonalAllowance(code: TaxCode): boolean {
  return code.type === "allowance" && code.allowance > 0;
}
