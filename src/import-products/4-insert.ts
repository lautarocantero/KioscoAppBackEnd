import "dotenv/config"; // sin esto, process.env.MONGODB_URI llega undefined y cae en el fallback local
import fs from "node:fs";
import mongoose from "mongoose";
import { ProductMongo } from "../schemas/productSchema";
import { PresentationMongo } from "../schemas/presentationSchema";

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017/kiosco";;

if (!MONGODB_URI) {
  console.error("MONGODB_URI no está definida. Revisá que exista un .env en la raíz del proyecto con esa variable.");
  process.exit(1);
}

const PRODUCTS_FILE = "./out-products.json";
const PRESENTATIONS_FILE = "./out-presentations.json";
const CHUNK_SIZE = 500;

interface RawProduct {
  _id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  image_url: string;
  brand: string;
  presentations: string[]; // viene en el JSON, pero se descarta antes de insertar (no existe en ProductMongoSchema)
}

interface RawPresentation {
  _id: string;
  product_id: string;
  sku: string;
  barcode: string;
  name: string;
  description: string;
  brand: string;
  model_type: string;
  model_size: number;
  model_unit: string;
  category: string[];
  sale_type: string;
  image_url: string;
  price: number;
  stock: number;
  min_stock: number;
  status: string;
  created_at: string;
  updated_at: string;
  is_perishable: boolean;
  expiration_date: string;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function bulkInsert<T extends { _id: string }>(
  model: mongoose.Model<any>,
  docs: T[],
  label: string,
) {
  const inserted: string[] = [];
  const skippedDuplicates: string[] = [];
  const failed: { _id: string; error: string }[] = [];

  // 1) chequeo de _id existentes en bulk, no uno por uno
  const ids = docs.map((d) => d._id);
  const existing = await model.find({ _id: { $in: ids } }, { _id: 1 }).lean();
  const existingIds = new Set(existing.map((e: any) => e._id));

  const toInsert = docs.filter((d) => {
    if (existingIds.has(d._id)) {
      skippedDuplicates.push(d._id);
      return false;
    }
    return true;
  });

  // 2) insertMany en chunks, ordered:false para que un doc inválido no tumbe el lote entero.
  //    insertMany SÍ corre las validaciones del schema (a diferencia de findOneAndUpdate),
  //    así que acá van a saltar los required condicionales y los enum de
  //    PresentationMongoSchema (model_type/model_unit/category/sale_type/status).
  //    Si el review-report.json tenía filas con needs_review, es más probable que
  //    terminen acá como "failed" por un enum inválido o un campo faltante.
  for (const batch of chunk(toInsert, CHUNK_SIZE)) {
    try {
      await model.insertMany(batch, { ordered: false });
      inserted.push(...batch.map((b) => b._id));
    } catch (err: any) {
      // con ordered:false, los docs válidos del batch igual se insertan;
      // los errores (de validación o de escritura) se juntan en writeErrors
      const writeErrors = err.writeErrors ?? [];
      for (const we of writeErrors) {
        const failedDoc = batch[we.index];
        failed.push({ _id: failedDoc?._id ?? "desconocido", error: we.errmsg ?? String(we) });
      }
      const failedIds = new Set(failed.map((f) => f._id));
      inserted.push(...batch.map((b) => b._id).filter((id) => !failedIds.has(id)));
    }
  }

  console.log(`\n[${label}] insertados: ${inserted.length} | duplicados omitidos: ${skippedDuplicates.length} | fallidos: ${failed.length}`);
  return { inserted, skippedDuplicates, failed };
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  // log de confirmación sin exponer usuario/contraseña de la connection string
  const safeHost = MONGODB_URI.replace(/\/\/.*@/, "//***:***@");
  console.log(`Conectado a Mongo -> ${safeHost}`);

  const rawProducts: RawProduct[] = JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf-8"));
  const rawPresentations: RawPresentation[] = JSON.parse(fs.readFileSync(PRESENTATIONS_FILE, "utf-8"));

  // se descarta "presentations": no existe en ProductMongoSchema, la relación
  // vive del lado de la presentación vía "product_id"
  const productDocs = rawProducts.map(({ presentations, ...rest }) => rest);

  const productResult = await bulkInsert(ProductMongo, productDocs, "products");

  // si un producto falló al insertar, sus presentaciones quedarían huérfanas -> se filtran
  const failedProductIds = new Set(productResult.failed.map((f) => f._id));
  const presentationDocs = rawPresentations.filter((p) => !failedProductIds.has(p.product_id));

  const presentationResult = await bulkInsert(PresentationMongo, presentationDocs, "presentations");

  fs.writeFileSync(
    "./out-insert-report.json",
    JSON.stringify({ products: productResult, presentations: presentationResult }, null, 2),
    "utf-8",
  );

  await mongoose.disconnect();
  console.log("\nReporte -> ./out-insert-report.json");
}

main().catch((err) => {
  console.error("Error fatal durante la importación:", err);
  process.exit(1);
});