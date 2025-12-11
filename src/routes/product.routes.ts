import express from 'express';
import { 
  createProduct, 
  deleteProduct, 
  editProduct, 
  getProductByBrand, 
  getProductById, 
  getProductByName, 
  getProducts, 
  home 
} from '../controllers/product.controller';

const router = express.Router();

/*──────────────────────────────
📦 ProductRouter
──────────────────────────────
📜 Propósito:
Define las rutas relacionadas con productos y las conecta con sus controladores.

📂 Endpoints:
- GET    /                   → home (lista de endpoints)
- GET    /get-products       → obtener todos los productos
- GET    /get-product-by-id  → obtener producto por ID
- GET    /get-product-by-name→ obtener productos por nombre
- GET    /get-product-by-brand→ obtener productos por marca
- POST   /create-product     → crear producto nuevo
- DELETE /delete-product     → eliminar producto
- PUT    /edit-product       → editar producto existente
──────────────────────────────*/

router.get('/', home);
router.get('/get-products', getProducts);
router.get('/get-product-by-id', getProductById);
router.get('/get-product-by-name', getProductByName);
router.get('/get-product-by-brand', getProductByBrand);
router.post('/create-product', createProduct);
router.delete('/delete-product', deleteProduct);
router.put('/edit-product', editProduct);

export default router;
