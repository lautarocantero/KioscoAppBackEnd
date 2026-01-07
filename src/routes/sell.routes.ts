import express from 'express';
import { 
  createSell, 
  deleteSell, 
  editSell, 
  getSellById, 
  getSells, 
  getSellsByDate, 
  getSellsByProduct, 
  getSellsBySeller, 
  home 
} from '../controllers/sell.controller';

const router = express.Router();

/*──────────────────────────────
💰 SellRouter
──────────────────────────────
📜 Propósito:
Define las rutas relacionadas con ventas y las conecta con sus controladores.

📂 Endpoints:
- GET    /sell/                   → home (lista de endpoints)
- GET    /sell/get-sells          → obtener todas las ventas
- GET    /sell/get-sell-by-id     → obtener venta por ID
- GET    /sell/get-sells-by-seller→ obtener ventas por vendedor
- GET    /sell/get-sells-by-date  → obtener ventas por fecha
- GET    /sell/get-sells-by-product → obtener ventas por producto
- POST   /sell/create-sell        → crear nueva venta
- DELETE /sell/delete-sell        → eliminar venta
- PUT    /sell/edit-sell          → editar venta existente
──────────────────────────────*/

router.get('/', home);
router.get('/get-sells', getSells);
router.get('/get-sell-by-id/:ticket_id', getSellById);
router.get('/get-sells-by-seller', getSellsBySeller);
router.get('/get-sells-by-date', getSellsByDate);
router.get('/get-sells-by-product', getSellsByProduct);

router.post('/create-sell', createSell);
router.delete('/delete-sell/:ticket_id', deleteSell);
router.put('/edit-sell', editSell);

export default router;
