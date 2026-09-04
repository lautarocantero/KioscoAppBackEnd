import { describe, it, expect } from 'vitest';
import { mapCategory } from '../categoryMap';
import { PresentationCategory } from '../../../typings/presentation/presentationEnum';

describe('mapCategory', () => {
  it('mapea un rubro conocido a su categoría', () => {
    expect(mapCategory('ALMACEN')).toEqual({ category: PresentationCategory.Grocery, wasFallback: false });
  });

  it('es insensible a mayúsculas/minúsculas y espacios', () => {
    expect(mapCategory('  almacen  ')).toEqual({ category: PresentationCategory.Grocery, wasFallback: false });
  });

  it('cae en Miscellaneous con wasFallback=true para un rubro desconocido', () => {
    expect(mapCategory('RUBRO INVENTADO')).toEqual({ category: PresentationCategory.Miscellaneous, wasFallback: true });
  });
});
