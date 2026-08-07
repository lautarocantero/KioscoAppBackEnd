import fs from "node:fs";
import crypto from "node:crypto";

const INPUT_FILE = process.argv[2] ?? "./review-report.json";

interface ReportPresentation {
  name: string;
  sku: string;
  barcode: string | null;
  price: number;
  stock: number;
  min_stock: number;
  model_size: number | null;
  model_unit: string | null;
  model_type: string;
  created_at: string;
  updated_at: string;
  needs_review: string[];
}

interface ReportCluster {
  suggested_product_name: string;
  rubro: string;
  category: string;
  presentation_count: number;
  presentations: ReportPresentation[];
}

const clusters: ReportCluster[] = JSON.parse(fs.readFileSync(INPUT_FILE, "utf-8"));

const products: Record<string, unknown>[] = [];
const presentations: Record<string, unknown>[] = [];
const pendingReview: { product: string; presentation: string; reasons: string[] }[] = [];

for (const cluster of clusters) {
  const productId = crypto.randomUUID();
  const dates = cluster.presentations.flatMap((p) => [p.created_at, p.updated_at]).filter(Boolean).sort();
  const created_at = dates[0] ?? new Date().toISOString();
  const updated_at = dates[dates.length - 1] ?? created_at;

  // generamos los ids de las presentaciones primero para poder referenciarlos en el producto
  const presentationIds = cluster.presentations.map(() => crypto.randomUUID());

  products.push({
    _id: productId,
    name: cluster.suggested_product_name,
    description: cluster.suggested_product_name, // mismo texto que name, por ahora
    created_at,
    updated_at,
    image_url: "",
    brand: "",
    presentations: presentationIds,
  });

  cluster.presentations.forEach((p, i) => {
    const status = p.stock > 0 ? "available" : "out_of_stock";

    presentations.push({
      _id: presentationIds[i],
      product_id: productId,
      sku: p.sku,
      barcode: p.barcode ?? "",
      name: p.name,
      description: "",
      brand: "",
      model_type: p.model_type || "other",
      model_size: p.model_size ?? 1,
      model_unit: p.model_unit ?? "units",
      category: [cluster.category],
      sale_type: "unit",
      image_url: "",
      price: p.price,
      stock: p.stock,
      min_stock: p.min_stock,
      status,
      created_at: p.created_at || created_at,
      updated_at: p.updated_at || updated_at,
      is_perishable: false,
      expiration_date: "",
    });

    if (p.needs_review.length > 0) {
      pendingReview.push({ product: cluster.suggested_product_name, presentation: p.name, reasons: p.needs_review });
    }
  });
}

fs.writeFileSync("./out-products.json", JSON.stringify(products, null, 2), "utf-8");
fs.writeFileSync("./out-presentations.json", JSON.stringify(presentations, null, 2), "utf-8");
fs.writeFileSync("./out-pending-review.json", JSON.stringify(pendingReview, null, 2), "utf-8");

console.log(`
Productos generados:       ${products.length}
Presentaciones generadas:  ${presentations.length}
Con placeholders a revisar: ${pendingReview.length}

-> out-products.json
-> out-presentations.json
-> out-pending-review.json  (lista de qué campos quedaron con placeholder)
`);