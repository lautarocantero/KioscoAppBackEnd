import { describe, it, expect } from 'vitest';
import { clusterProducts } from '../cluster';
import type { Clusterable } from '@typings/receipt';

describe('clusterProducts', () => {
  it('agrupa filas con el mismo rubro y nombre base exacto', () => {
    const rows: Clusterable[] = [
      { index: 0, base: 'coca cola', rubro: 'BEBIDAS' },
      { index: 1, base: 'coca cola', rubro: 'BEBIDAS' },
      { index: 2, base: 'sprite', rubro: 'BEBIDAS' },
    ];

    const clusters = clusterProducts(rows);

    const coca = clusters.find((c) => c.base === 'coca cola');
    expect(coca?.memberIndexes.sort()).toEqual([0, 1]);
    expect(clusters.find((c) => c.base === 'sprite')?.memberIndexes).toEqual([2]);
  });

  it('no fusiona el mismo nombre base entre rubros distintos', () => {
    const rows: Clusterable[] = [
      { index: 0, base: 'coca cola', rubro: 'BEBIDAS' },
      { index: 1, base: 'coca cola', rubro: 'KIOSCO' },
    ];

    const clusters = clusterProducts(rows);

    expect(clusters).toHaveLength(2);
    expect(clusters.map((c) => c.memberIndexes)).toEqual([[0], [1]]);
  });

  it('fusiona singletons del mismo rubro cuando un nombre es substring del otro', () => {
    const rows: Clusterable[] = [
      { index: 0, base: 'agua mineral', rubro: 'BEBIDAS' },
      { index: 1, base: 'agua', rubro: 'BEBIDAS' },
    ];

    const clusters = clusterProducts(rows);

    expect(clusters).toHaveLength(1);
    expect(clusters[0].memberIndexes.sort()).toEqual([0, 1]);
  });

  it('no fusiona nombres sin similitud suficiente', () => {
    const rows: Clusterable[] = [
      { index: 0, base: 'coca cola', rubro: 'BEBIDAS' },
      { index: 1, base: 'jugo de naranja', rubro: 'BEBIDAS' },
    ];

    const clusters = clusterProducts(rows);

    expect(clusters).toHaveLength(2);
  });

  it('da a cada fila su propio cluster cuando el nombre base queda vacío', () => {
    // Rubros distintos: evita que el fallback "(sin nombre #N)" comparta
    // rubro y quede sujeto a la fusión por similitud de la segunda pasada.
    const rows: Clusterable[] = [
      { index: 0, base: '', rubro: 'VARIOS' },
      { index: 1, base: '', rubro: 'KIOSCO' },
    ];

    const clusters = clusterProducts(rows);

    expect(clusters).toHaveLength(2);
    expect(clusters.every((c) => c.memberIndexes.length === 1)).toBe(true);
    expect(clusters.map((c) => c.base).sort()).toEqual(['(sin nombre #0)', '(sin nombre #1)']);
  });
});
