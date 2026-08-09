export function cleanString(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).replace(/^'/, "").trim();
}

export function classifyCode(rawCodigo: string): { sku: string; barcode: string } {
  const code = cleanString(rawCodigo);
  const digitsOnly = /^\d+$/.test(code);
  const looksLikeEAN = digitsOnly && [8, 12, 13].includes(code.length);
  return {
    sku: code,
    barcode: looksLikeEAN ? code : "",
  };
}

export function normalizeDate(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  const s = cleanString(v);
  if (!s || /^\/\s*\/\s*$/.test(s.replace(/\s/g, ""))) return "";
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) {
    const [, dd, mm, yyyy] = m;
    return new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`).toISOString();
  }
  const parsed = new Date(s);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
}

export function toNumber(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}