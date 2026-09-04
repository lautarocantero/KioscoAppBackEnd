import { describe, it, expect } from 'vitest';
import { extractSize, extractModelType, baseName } from '../extract';
import { ModelType, ModelUnit } from '../../../typings/presentation/presentationEnum';

describe('extractSize', () => {
  it('extrae tamaño y unidad en gramos', () => {
    expect(extractSize('Yerba Mate 500g')).toMatchObject({ model_size: 500, model_unit: ModelUnit.Grams });
  });

  it('extrae tamaño y unidad en litros/mililitros', () => {
    expect(extractSize('Coca Cola 1.5L')).toMatchObject({ model_size: 1.5, model_unit: ModelUnit.Liters });
    expect(extractSize('Agua 500ml')).toMatchObject({ model_size: 500, model_unit: ModelUnit.Milliliters });
  });

  it('acepta coma como separador decimal', () => {
    expect(extractSize('Aceite 1,5L')).toMatchObject({ model_size: 1.5, model_unit: ModelUnit.Liters });
  });

  it('devuelve objeto vacío si no encuentra tamaño/unidad', () => {
    expect(extractSize('Producto sin tamaño')).toEqual({});
  });

  it('devuelve objeto vacío si la unidad no está en el mapa de alias', () => {
    expect(extractSize('Producto 5xyz')).toEqual({});
  });
});

describe('extractModelType', () => {
  it('detecta "botella"', () => {
    expect(extractModelType('Agua Botella 500ml')).toBe(ModelType.Bottle);
  });

  it('detecta "lata"', () => {
    expect(extractModelType('Cerveza Lata 473ml')).toBe(ModelType.Can);
  });

  it('devuelve undefined si no matchea ningún tipo conocido', () => {
    expect(extractModelType('Producto genérico')).toBeUndefined();
  });
});

describe('baseName', () => {
  it('saca el tamaño/unidad y el tipo de envase del nombre', () => {
    expect(baseName('Coca Cola Botella 1.5L')).toBe('coca cola');
  });

  it('normaliza a minúsculas y colapsa espacios', () => {
    expect(baseName('  Agua   Mineral  500ml  ')).toBe('agua mineral');
  });

  it('saca palabras de variante como "retornable"/"descartable"', () => {
    expect(baseName('Cerveza Retornable 1L')).toBe('cerveza');
  });
});
