import { PresentationCategory } from "../typings/presentation/presentationEnum";

// Mapeo RUBRO (excel) -> PresentationCategory. Basado en los 23 rubros reales
// encontrados en productos_010826.xls. Si aparece un RUBRO nuevo que no está acá,
// cae en Miscellaneous y se marca en el reporte para que lo revises.
export const CATEGORY_MAP: Record<string, PresentationCategory> = {
  ALMACEN: PresentationCategory.Grocery,
  KIOSCO: PresentationCategory.Snacks,
  PERFUMERÍA: PresentationCategory.Cosmetics,
  LIBRERÍA: PresentationCategory.StationeryAndKiosk,
  "MEDICAMENTOS VTA LIBRE": PresentationCategory.Pharmacy,
  LIMPIEZA: PresentationCategory.HouseholdCleaning,
  "BEBIDAS TOTAL": PresentationCategory.NonAlcoholicBeverages,
  CIGARRILLOS: PresentationCategory.TobaccoAndCigarettes,
  HELADERÍA: PresentationCategory.Frozen,
  LÁCTEOS: PresentationCategory.Dairy,
  HIGIENE: PresentationCategory.PersonalHygiene,
  FIAMBRES: PresentationCategory.DeliAndCheese,
  PANADERÍA: PresentationCategory.Bakery,
  MAQUILLAJE: PresentationCategory.Cosmetics,

  BIJOU: PresentationCategory.Bijouterie,
  JUGUETES: PresentationCategory.Toys,
  BAZAAR: PresentationCategory.Bazaar,
  "CARGA VIRTUAL": PresentationCategory.VirtualTopUp,
  "MERCERÌA": PresentationCategory.Haberdashery,
  ACCESORIOS: PresentationCategory.Accessories,
  INSUMOS: PresentationCategory.Supplies,

  VARIOS: PresentationCategory.Miscellaneous,
  "RUBRO UNICO": PresentationCategory.Miscellaneous,
};

export function mapCategory(rubro: string): { category: PresentationCategory; wasFallback: boolean } {
  const key = rubro.trim().toUpperCase();
  const mapped = CATEGORY_MAP[key];
  if (mapped) return { category: mapped, wasFallback: false };
  return { category: PresentationCategory.Miscellaneous, wasFallback: true };
}