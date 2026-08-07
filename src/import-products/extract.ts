import { ModelType, ModelUnit } from "../typings/presentation/presentationEnum";

export interface ExtractedSize {
  model_size?: number;
  model_unit?: ModelUnit;
  matchedText?: string;
}

const UNIT_ALIASES: Record<string, ModelUnit> = {
  gs: ModelUnit.Grams,
  gr: ModelUnit.Grams,
  grs: ModelUnit.Grams,
  g: ModelUnit.Grams,
  kg: ModelUnit.Kilograms,
  kgs: ModelUnit.Kilograms,
  cc: ModelUnit.Milliliters,
  ml: ModelUnit.Milliliters,
  l: ModelUnit.Liters,
  lt: ModelUnit.Liters,
  lts: ModelUnit.Liters,
  oz: ModelUnit.Ounces,
  lb: ModelUnit.Pounds,
  cm: ModelUnit.Centimeters,
  m: ModelUnit.Meters,
  u: ModelUnit.Units,
  un: ModelUnit.Units,
  units: ModelUnit.Units,
  hojas: ModelUnit.Sheets,
};

const SIZE_UNIT_REGEX =
  /(?:x\s*)?(\d+(?:[.,]\d+)?)\s*(gs|grs|gr|g|kgs|kg|cc|ml|lts|lt|l|oz|lb|cm|m|hojas|u|un|units)\b\.?/i;

export function extractSize(rawName: string): ExtractedSize {
  const match = rawName.match(SIZE_UNIT_REGEX);
  if (!match) return {};
  const [matchedText, numRaw, unitRaw] = match;
  const num = Number(numRaw.replace(",", "."));
  const unit = UNIT_ALIASES[unitRaw.toLowerCase()];
  if (Number.isNaN(num) || !unit) return {};
  return { model_size: num, model_unit: unit, matchedText };
}

const MODEL_TYPE_KEYWORDS: [RegExp, ModelType][] = [
  [/\blata\b/i, ModelType.Can],
  [/\bbotell/i, ModelType.Bottle],
  [/\btetra/i, ModelType.TetraPack],
  [/\bbolsa/i, ModelType.Bag],
  [/\bcaja\b/i, ModelType.Box],
  [/\bfrasco/i, ModelType.Jar],
  [/\bsachet/i, ModelType.Sachet],
  [/\bblister/i, ModelType.Blister],
  [/\bpack\b/i, ModelType.Pack],
  [/\brollo/i, ModelType.Roll],
  [/\baerosol/i, ModelType.Aerosol],
  [/\btapa\s*blanda/i, ModelType.SoftCover],
  [/\btapa\s*dura/i, ModelType.HardCover],
];

export function extractModelType(rawName: string): ModelType | undefined {
  for (const [regex, type] of MODEL_TYPE_KEYWORDS) {
    if (regex.test(rawName)) return type;
  }
  return undefined;
}

export function baseName(rawName: string): string {
  let cleaned = rawName;
  const sizeMatch = extractSize(rawName);
  if (sizeMatch.matchedText) cleaned = cleaned.replace(sizeMatch.matchedText, " ");

  cleaned = cleaned
    .replace(/\b(lata|botell\w*|tetra\s*pack|bolsa|caja|frasco|sachet|blister|pack|rollo|aerosol)\b/gi, " ")
    .replace(/\bretornable|descartable|fantasía|fantasia\b/gi, " ")
    .replace(/[.,]/g, " ")
    .replace(/\s+\d+\s*$/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  return cleaned;
}