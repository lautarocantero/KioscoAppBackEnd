import express from 'express';
import { getProductVariantByProductId, getProductVariants, home, deleteProductVariant, editProductVariant, createProductVariant, getProductVariantById, getProductVariantByBrand, getProductVariantByStock, getProductVariantByPrice, getProductVariantBySize, getProductVariantByPresentation } from '../controllers/productVariant.controller';

const router = express.Router();

/*══════════════════════════════════════════════════════════════════════╗
║ 📥 GET 📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

router.get('/', home);

router.get('/get-product-variants', getProductVariants);

router.get('/get-product-variant-by-id', getProductVariantById);

router.get('/get-product-variant-by-product-id/:product_id', getProductVariantByProductId);

router.get('/get-product-variant-by-brand', getProductVariantByBrand);

router.get('/get-product-variant-by-stock', getProductVariantByStock);

router.get('/get-product-variant-by-price', getProductVariantByPrice);

router.get('/get-product-variant-by-size', getProductVariantBySize);

router.get('/get-product-variant-by-presentation', getProductVariantByPresentation);

/*══════════════════════════════════════════════════════════════════════╗
║ 📤 POST 📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

router.post('/create-product-variant', createProductVariant);

/*══════════════════════════════════════════════════════════════════════╗
║ 🗑️ DELETE 🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️                    ║
╚══════════════════════════════════════════════════════════════════════╝*/

router.delete('/delete-product-variant', deleteProductVariant);

/*══════════════════════════════════════════════════════════════════════╗
║ 🛠️ PUT 🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️                    ║
╚══════════════════════════════════════════════════════════════════════╝*/

router.put('/edit-product-variant', editProductVariant);

export default router;