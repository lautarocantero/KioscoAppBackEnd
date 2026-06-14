import express from 'express';
import {
    home,
    getProductVariants,
    getProductVariantById,
    getProductVariantByProductId,
    getProductVariantByStock,
    getProductVariantByPrice,
    getProductVariantByStatus,
    getProductVariantByNetContent,
    createProductVariant,
    editProductVariant,
    deleteProductVariant,
} from '../controllers/productVariant.controller';

/*──────────────────────────────
🎭 ProductVariantRouter
──────────────────────────────
📜 Propósito:
Rutas de variantes de producto. Sin multer — imagen removida del modelo.

📂 Endpoints:
── GET ────────────────────────────────────────────────────────────────
- GET    /                                           → home
- GET    /get-product-variants                       → todas
- GET    /get-product-variant-by-id/:id              → por ID
- GET    /get-product-variant-by-product-id/:pid     → por producto ← usado en el listado de presentaciones
- GET    /get-product-variant-by-stock               → body: { stock_current }
- GET    /get-product-variant-by-price               → body: { price }
- GET    /get-product-variant-by-status              → body: { status }
- GET    /get-product-variant-by-net-content         → body: { net_content }

── POST / PUT / DELETE ────────────────────────────────────────────────
- POST   /create-product-variant                     → body: { ...campos }
- PUT    /edit-product-variant                       → body: { _id, ...campos }
- DELETE /delete-product-variant                     → body: { _id }

🗑️ Endpoints eliminados vs versión anterior:
- /get-product-variant-by-brand        (brand removido del modelo)
- /get-product-variant-by-size         (model_size removido → usar net_content)
- /get-product-variant-by-presentation (model_type removido → usar status/net_content)
──────────────────────────────*/

const router = express.Router();

// ── GET ───────────────────────────────────────────────────────────────────────
router.get('/',                                    home);
router.get('/get-product-variants',                getProductVariants);
router.get('/get-product-variant-by-id/:product_variant_id', getProductVariantById);
router.get('/get-product-variant-by-product-id/:product_id', getProductVariantByProductId);
router.get('/get-product-variant-by-stock',        getProductVariantByStock);
router.get('/get-product-variant-by-price',        getProductVariantByPrice);
router.get('/get-product-variant-by-status',       getProductVariantByStatus);
router.get('/get-product-variant-by-net-content',  getProductVariantByNetContent);

// ── POST / PUT / DELETE ───────────────────────────────────────────────────────
router.post('/create-product-variant',   createProductVariant);
router.put('/edit-product-variant/:variant_id', editProductVariant);
router.delete('/delete-product-variant', deleteProductVariant);

export default router;