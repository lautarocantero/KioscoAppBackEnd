import express from 'express';
import { 
  getProductVariantByProductId, 
  getProductVariants, 
  home, 
  deleteProductVariant, 
  editProductVariant, 
  createProductVariant, 
  getProductVariantById, 
  getProductVariantByBrand, 
  getProductVariantByStock, 
  getProductVariantByPrice, 
  getProductVariantBySize, 
  getProductVariantByPresentation 
} from '../controllers/productVariant.controller';

const router = express.Router();

/*──────────────────────────────
🎭 ProductVariantRouter
──────────────────────────────
📜 Propósito:
Define las rutas relacionadas con variantes de producto y las conecta con sus controladores.

📂 Endpoints:
- GET    /                                → home (lista de endpoints)
- GET    /get-product-variants            → obtener todas las variantes
- GET    /get-product-variant-by-id       → obtener variante por ID
- GET    /get-product-variant-by-product-id/:product_id → obtener variantes por producto
- GET    /get-product-variant-by-brand    → obtener variantes por marca
- GET    /get-product-variant-by-stock    → obtener variantes por stock
- GET    /get-product-variant-by-price    → obtener variantes por precio
- GET    /get-product-variant-by-size     → obtener variantes por tamaño
- GET    /get-product-variant-by-presentation → obtener variantes por presentación
- POST   /create-product-variant          → crear nueva variante
- DELETE /delete-product-variant          → eliminar variante
- PUT    /edit-product-variant            → editar variante existente
──────────────────────────────*/

router.get('/', home);
router.get('/get-product-variants', getProductVariants);
router.get('/get-product-variant-by-id', getProductVariantById);
router.get('/get-product-variant-by-product-id/:product_id', getProductVariantByProductId);
router.get('/get-product-variant-by-brand', getProductVariantByBrand);
router.get('/get-product-variant-by-stock', getProductVariantByStock);
router.get('/get-product-variant-by-price', getProductVariantByPrice);
router.get('/get-product-variant-by-size', getProductVariantBySize);
router.get('/get-product-variant-by-presentation', getProductVariantByPresentation);

router.post('/create-product-variant', createProductVariant);
router.delete('/delete-product-variant', deleteProductVariant);
router.put('/edit-product-variant', editProductVariant);

export default router;
