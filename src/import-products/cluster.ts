export interface Clusterable {
  index: number;
  base: string;
  rubro: string;
}

export interface Cluster {
  base: string;
  memberIndexes: number[];
}

function tokenSet(s: string): Set<string> {
  return new Set(s.split(" ").filter(Boolean));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return inter / union;
}

// 1) agrupa por nombre base exacto (rápido, preciso)
// 2) intenta fusionar singletons contra clusters existentes del mismo RUBRO
//    si hay alta similitud de tokens (>= threshold) o uno es substring del otro.
// Todo esto es HEURÍSTICO: el resultado va a un reporte para revisión humana,
// no se inserta directo en Mongo.
export function clusterProducts(rows: Clusterable[], threshold = 0.5): Cluster[] {
  const exactGroups = new Map<string, number[]>();
  for (const row of rows) {
    const key = `${row.rubro}::${row.base}`;
    if (!exactGroups.has(key)) exactGroups.set(key, []);
    exactGroups.get(key)!.push(row.index);
  }

  const clusters: Cluster[] = [];
  const byIndex = new Map(rows.map((r) => [r.index, r]));

  for (const [key, indexes] of exactGroups) {
    const base = key.split("::")[1];
    if (base.length === 0) {
      // nombre base vacío tras limpieza (raro) -> cada fila su propio cluster
      for (const i of indexes) clusters.push({ base: byIndex.get(i)!.base || `(sin nombre #${i})`, memberIndexes: [i] });
      continue;
    }
    clusters.push({ base, memberIndexes: [...indexes] });
  }

  // segunda pasada: fusionar clusters pequeños/singleton contra otros del mismo rubro
  clusters.sort((a, b) => b.memberIndexes.length - a.memberIndexes.length);
  const merged: Cluster[] = [];
  const consumed = new Set<number>();

  for (let i = 0; i < clusters.length; i++) {
    if (consumed.has(i)) continue;
    const current = clusters[i];
    const currentRubro = byIndex.get(current.memberIndexes[0])!.rubro;
    const currentTokens = tokenSet(current.base);

    for (let j = i + 1; j < clusters.length; j++) {
      if (consumed.has(j)) continue;
      const other = clusters[j];
      const otherRubro = byIndex.get(other.memberIndexes[0])!.rubro;
      if (currentRubro !== otherRubro) continue;

      const otherTokens = tokenSet(other.base);
      const sim = jaccard(currentTokens, otherTokens);
      const substring =
        current.base.includes(other.base) || other.base.includes(current.base);

      if (sim >= threshold || (substring && other.base.length >= 3)) {
        current.memberIndexes.push(...other.memberIndexes);
        consumed.add(j);
      }
    }
    merged.push(current);
  }

  return merged;
}