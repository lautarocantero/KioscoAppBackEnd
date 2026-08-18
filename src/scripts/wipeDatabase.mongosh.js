/*──────────────────────────────
🧹 wipeDatabase.mongosh.js
──────────────────────────────
📜 Propósito:
Vacía (deleteMany, NO drop) todas las colecciones de la app para arrancar
de cero, en vez de correr migrateToKiosco.ts. Pensado para correrse a mano
contra la base REAL — no se ejecuta automáticamente desde ningún lado.

⚠️ IRREVERSIBLE. Antes de correrlo:
  1. Confirmá que no hay usuarios/ventas reales que te importe conservar.
  2. Considerá un backup: `mongodump --uri="<tu MONGODB_URI>"`.

🖥️ Uso:
  mongosh "<tu MONGODB_URI>" --file src/scripts/wipeDatabase.mongosh.js

  (o pegá el contenido directo en una sesión interactiva de mongosh)
──────────────────────────────*/

const collections = [
  "auth",
  "sellers",
  "products",
  "presentations",
  "providers",
  "sells",
  "notifications",
  // Del feature multi-kiosco — probablemente ya vacías si nunca corriste
  // migrateToKiosco.ts contra esta base, pero se incluyen por las dudas.
  "kioscos",
  "kiosco_memberships",
];

for (const name of collections) {
  const result = db.getCollection(name).deleteMany({});
  print(`🗑️  ${name}: ${result.deletedCount} documento(s) borrados`);
}

print("✅ Listo. Todas las colecciones quedaron vacías (no se tocaron índices ni la config del cluster).");
