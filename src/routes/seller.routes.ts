import express from 'express';
import {
  editSeller,
  getSellerByEmail,
  getSellerById,
  getSellerByName,
  getSellers,
  home
} from '../controllers/seller.controller';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireKioscoContext } from '../middlewares/kioscoMiddleware';

const router = express.Router();

/*──────────────────────────────
🧑‍💼 SellerRouter
──────────────────────────────
📜 Propósito:
Define las rutas relacionadas con vendedores del kiosco activo (header x-kiosco-id)
y las conecta con sus controladores.

📂 Endpoints:
- GET    /                   → home (lista de endpoints)
- GET    /get-sellers        → vendedores del kiosco activo (perfil + email + rol)
- GET    /get-seller-by-id   → obtener vendedor por ID
- GET    /get-seller-by-name → obtener vendedores por nombre
- GET    /get-seller-by-email→ obtener vendedor por email
- PUT    /edit-seller        → editar vendedor existente

Agregar/quitar vendedores del kiosco: ver /kiosco/join y /kiosco/:kiosco_id/member/:user_id.
──────────────────────────────*/

router.use(authMiddleware, requireKioscoContext);

router.get('/', home);
router.get('/get-sellers', getSellers);
router.get('/get-seller-by-id', getSellerById);
router.get('/get-seller-by-name', getSellerByName);
router.get('/get-seller-by-email', getSellerByEmail);

router.put('/edit-seller', editSeller);

export default router;
