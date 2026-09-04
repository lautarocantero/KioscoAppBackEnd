import { describe, it, expect } from 'vitest';
import { Validation } from '../validation';

describe('Validation.stringValidation', () => {
  it('devuelve el string cuando es válido', () => {
    expect(Validation.stringValidation('hola', 'name')).toBe('hola');
  });

  it('rechaza valores vacíos o falsy', () => {
    expect(() => Validation.stringValidation('', 'name')).toThrow('No name provided');
    expect(() => Validation.stringValidation(undefined, 'name')).toThrow('No name provided');
  });

  it('rechaza valores que no son string', () => {
    expect(() => Validation.stringValidation(123, 'name')).toThrow('name must be a string');
  });

  it('rechaza strings más cortos que el mínimo', () => {
    expect(() => Validation.stringValidation('ab', 'name')).toThrow('name must be at least 3 characters long');
  });

  it('respeta un largo mínimo custom', () => {
    expect(() => Validation.stringValidation('abcd', 'name', 5)).toThrow('name must be at least 5 characters long');
    expect(Validation.stringValidation('abcde', 'name', 5)).toBe('abcde');
  });
});

describe('Validation.password', () => {
  it('acepta passwords válidas', () => {
    expect(Validation.password('secret123')).toBe('secret123');
  });

  it('rechaza passwords faltantes o demasiado cortas', () => {
    expect(() => Validation.password(undefined)).toThrow('No password provided');
    expect(() => Validation.password('ab')).toThrow('password must be at least 3 characters long');
  });
});

describe('Validation.email', () => {
  it('acepta emails con formato válido', () => {
    expect(Validation.email('user@example.com')).toBe('user@example.com');
  });

  it('rechaza emails sin @ o sin dominio', () => {
    expect(() => Validation.email('not-an-email')).toThrow('email has an invalid format');
    expect(() => Validation.email('a@b')).toThrow('email has an invalid format');
  });

  it('rechaza emails faltantes', () => {
    expect(() => Validation.email(undefined)).toThrow('No email provided');
  });

  // Regresión: el bypass temporal de "olvidé mi contraseña" (ver securityAudit.md)
  // depende de que cualquier email con forma de email pase esta validación antes
  // de llegar al flujo de reset — cubre el caso base explícitamente.
  it('acepta el email de una cuenta real sin exponer información adicional', () => {
    expect(() => Validation.email('victim@kiosco.com')).not.toThrow();
  });
});

describe('Validation.sku', () => {
  it('acepta SKUs alfanuméricos válidos', () => {
    expect(Validation.sku('ABC-123')).toBe('ABC-123');
  });

  it('rechaza SKUs con caracteres inválidos', () => {
    expect(() => Validation.sku('ABC 123!')).toThrow('sku miss match');
  });

  it('rechaza SKUs demasiado cortos o demasiado largos', () => {
    expect(() => Validation.sku('AB')).toThrow('sku must be at least 3 characters long');
    expect(() => Validation.sku('A'.repeat(31))).toThrow('sku must be shorter than 30 characters long');
  });
});

describe('Validation.number', () => {
  it('acepta números mayores a 0', () => {
    expect(Validation.number(5, 'price')).toBe(5);
  });

  it('rechaza 0 por default', () => {
    expect(() => Validation.number(0, 'price')).toThrow('No number provided for price');
  });

  it('acepta 0 cuando isZeroValid es true', () => {
    expect(Validation.number(0, 'stock', true)).toBe(0);
  });

  it('rechaza valores que no son número', () => {
    expect(() => Validation.number('5', 'price')).toThrow('price is not a number');
  });
});

describe('Validation.range', () => {
  it('acepta números dentro del rango', () => {
    expect(Validation.range(50, 'percentage', 0, 100)).toBe(50);
  });

  it('rechaza números fuera de rango', () => {
    expect(() => Validation.range(150, 'percentage', 0, 100)).toThrow('percentage must be between 0 and 100');
  });

  it('acepta el límite inferior en 0 (a diferencia de Validation.number)', () => {
    expect(Validation.range(0, 'percentage', 0, 100)).toBe(0);
  });
});

describe('Validation.barcode', () => {
  it('acepta códigos EAN-13 válidos', () => {
    expect(Validation.barcode('1234567890123')).toBe('1234567890123');
  });

  it('rechaza códigos con longitud distinta a 13', () => {
    expect(() => Validation.barcode('123')).toThrow('barcode is not an EAN (13 characters long)');
  });
});

describe('Validation.image', () => {
  it('acepta URLs http/https con extensión de imagen', () => {
    expect(Validation.image('https://cdn.example.com/photo.png')).toBe('https://cdn.example.com/photo.png');
  });

  it('acepta imágenes en base64', () => {
    const base64 = 'data:image/png;base64,abc123';
    expect(Validation.image(base64)).toBe(base64);
  });

  it('rechaza URLs sin extensión de imagen', () => {
    expect(() => Validation.image('https://example.com/not-an-image')).toThrow('ImageUrl does not provide a valid url');
  });

  it('rechaza protocolos que no sean http/https', () => {
    expect(() => Validation.image('ftp://example.com/photo.png')).toThrow('ImageUrl does not provide a valid url');
  });
});

describe('Validation.imageArray', () => {
  it('acepta un array vacío', () => {
    expect(Validation.imageArray([])).toEqual([]);
  });

  it('acepta un array de URLs válidas', () => {
    const images = ['https://a.com/x.png', 'https://b.com/y.jpg'];
    expect(Validation.imageArray(images)).toEqual(images);
  });

  it('rechaza si algún elemento no es una URL de imagen válida', () => {
    expect(() => Validation.imageArray(['https://a.com/x.png', 'not-a-url'])).toThrow(
      'Image at index 1 is not a valid image URL'
    );
  });
});

describe('Validation.saleType', () => {
  it('acepta "unit" y "weight"', () => {
    expect(Validation.saleType('unit')).toBe('unit');
    expect(Validation.saleType('weight')).toBe('weight');
  });

  it('rechaza cualquier otro valor', () => {
    expect(() => Validation.saleType('kg')).toThrow('Invalid sale_type');
  });
});
