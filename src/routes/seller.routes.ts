import express from 'express';
import { 
  createSeller, 
  deleteSeller, 
  editSeller, 
  getSellerByEmail, 
  getSellerById, 
  getSellerByName, 
  getSellerByRol, 
  getSellers, 
  home 
} from '../controllers/seller.controller';

const router = express.Router();

/*──────────────────────────────
🧑‍💼 SellerRouter
──────────────────────────────
📜 Propósito:
Define las rutas relacionadas con vendedores y las conecta con sus controladores.

📂 Endpoints:
- GET    /                   → home (lista de endpoints)
- GET    /get-sellers        → obtener todos los vendedores
- GET    /get-seller-by-id   → obtener vendedor por ID
- GET    /get-seller-by-name → obtener vendedores por nombre
- GET    /get-seller-by-email→ obtener vendedor por email
- GET    /get-seller-by-rol  → obtener vendedores por rol
- POST   /create-seller      → crear nuevo vendedor
- DELETE /delete-seller      → eliminar vendedor
- PUT    /edit-seller        → editar vendedor existente
──────────────────────────────*/

router.get('/', home);
router.get('/get-sellers', getSellers);
router.get('/get-seller-by-id', getSellerById);
router.get('/get-seller-by-name', getSellerByName);
router.get('/get-seller-by-email', getSellerByEmail);
router.get('/get-seller-by-rol', getSellerByRol);

router.post('/create-seller', createSeller);
router.delete('/delete-seller', deleteSeller);
router.put('/edit-seller', editSeller);

export default router;
