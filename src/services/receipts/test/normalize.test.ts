import { describe, it, expect } from 'vitest';
import { cleanString, classifyCode, normalizeDate, toNumber } from '../normalize';

describe('cleanString', () => {
  it('devuelve "" para null/undefined', () => {
    expect(cleanString(null)).toBe('');
    expect(cleanString(undefined)).toBe('');
  });

  it('convierte a string, saca el apóstrofe inicial de Excel y trimea', () => {
    expect(cleanString("'00123  ")).toBe('00123');
    expect(cleanString(42)).toBe('42');
  });
});

describe('classifyCode', () => {
  it('detecta un código de barras EAN de 13 dígitos', () => {
    expect(classifyCode('7791234567890')).toEqual({ sku: '7791234567890', barcode: '7791234567890' });
  });

  it('detecta EAN de 8 y 12 dígitos', () => {
    expect(classifyCode('12345678').barcode).toBe('12345678');
    expect(classifyCode('123456789012').barcode).toBe('123456789012');
  });

  it('no trata como barcode un código alfanumérico', () => {
    expect(classifyCode('ABC123')).toEqual({ sku: 'ABC123', barcode: '' });
  });

  it('no trata como barcode un número de longitud no estándar', () => {
    expect(classifyCode('123').barcode).toBe('');
  });
});

describe('normalizeDate', () => {
  it('acepta un objeto Date', () => {
    const d = new Date('2026-01-15T00:00:00.000Z');
    expect(normalizeDate(d)).toBe(d.toISOString());
  });

  it('parsea fechas en formato dd/mm/yyyy', () => {
    expect(normalizeDate('15/01/2026')).toBe(new Date('2026-01-15T00:00:00.000Z').toISOString());
  });

  it('devuelve "" para vacío o placeholder de fecha vacía', () => {
    expect(normalizeDate('')).toBe('');
    expect(normalizeDate(' / / ')).toBe('');
  });

  it('devuelve "" para un valor no parseable como fecha', () => {
    expect(normalizeDate('no es una fecha')).toBe('');
  });
});

describe('toNumber', () => {
  it('convierte strings numéricos', () => {
    expect(toNumber('42')).toBe(42);
  });

  it('usa el fallback (0 por default) para valores no numéricos', () => {
    expect(toNumber('abc')).toBe(0);
    expect(toNumber(undefined, -1)).toBe(-1);
  });

  it('rechaza Infinity/NaN devolviendo el fallback', () => {
    expect(toNumber(Infinity)).toBe(0);
  });
});
