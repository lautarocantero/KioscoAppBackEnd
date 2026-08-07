export function cleanString(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).replace(/^'/, "").trim();
}

// CODIGO trae a veces un EAN real (7790...) y a veces un código interno secuencial
// (0000000001). Si son solo dígitos y tienen pinta de EAN (8, 12 o 13 dígitos), lo
// tratamos como barcode real; si no, es un sku interno.
export function classifyCode(rawCodigo: string): { sku: string; barcode: string } {
  const code = cleanString(rawCodigo);
  const digitsOnly = /^\d+$/.test(code);
  const looksLikeEAN = digitsOnly && [8, 12, 13].includes(code.length);
  return {
    sku: code,
    barcode: looksLikeEAN ? code : "",
  };
}

// CREADO/MODIFICADO llegan mezclados: "18/04/2022", datetime de Excel, o "  /  /    " vacío.
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