
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

/**
 * @openapi
 * /sell/get-sells:
 *   get:
 *     summary: Obtener ventas con paginación
 *     description: Devuelve un bloque de ventas según los parámetros `limit` y `offset`.
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Número máximo de ventas a devolver
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Número de registros a saltar antes de empezar a devolver resultados
 *     responses:
 *       200:
 *         description: Listado de ventas con metadata de paginación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Sell'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *                     count:
 *                       type: integer
 */


/**
 * @openapi
 * /sell/get-sell-by-id/{_id}:
 *   get:
 *     summary: Obtener venta por ID
 *     description: Busca una venta específica validando el campo `_id`.
 *     parameters:
 *       - in: path
 *         name: _id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Venta encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sell'
 *       404:
 *         description: Venta no encontrada
 */

/**
 * @openapi
 * /sell/get-sells-by-seller:
 *   get:
 *     summary: Obtener ventas por vendedor
 *     description: Filtra ventas por el campo `seller_name`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               seller_name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ventas encontradas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Sell'
 *       404:
 *         description: No se encontraron ventas para ese vendedor
 */

/**
 * @openapi
 * /sell/get-sells-by-date:
 *   get:
 *     summary: Obtener ventas por fecha
 *     description: Filtra ventas por el campo `purchase_date`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               purchase_date:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ventas encontradas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Sell'
 *       404:
 *         description: No se encontraron ventas para esa fecha
 */

/**
 * @openapi
 * /sell/get-sells-by-product:
 *   get:
 *     summary: Obtener ventas por producto
 *     description: Busca ventas que incluyan un producto específico dentro del array `products`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GetSellsByProductPayload'
 *     responses:
 *       200:
 *         description: Ventas encontradas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Sell'
 *       404:
 *         description: No se encontraron ventas para ese producto
 */

/**
 * @openapi
 * /sell/create-sell:
 *   post:
 *     summary: Crear nueva venta
 *     description: Valida todos los campos, genera un `_id` único y guarda la venta.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSellPayload'
 *     responses:
 *       200:
 *         description: Venta creada exitosamente
 *       400:
 *         description: Error de validación
 */

/**
 * @openapi
 * /sell/delete-sell/{_id}:
 *   delete:
 *     summary: Eliminar venta por ID
 *     description: Valida el `_id` y elimina la venta si existe.
 *     parameters:
 *       - in: path
 *         name: _id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Venta eliminada exitosamente
 *       404:
 *         description: Venta no encontrada
 */

/**
 * @openapi
 * /sell/edit-sell:
 *   put:
 *     summary: Editar venta existente
 *     description: Valida campos y actualiza una venta existente.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EditSellPayload'
 *     responses:
 *       200:
 *         description: Venta editada exitosamente
 *       404:
 *         description: Venta no encontrada
 */

//──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//
router.get('/', home);
router.get('/get-sells', getSells);
router.get('/get-sell-by-id/:_id', getSellById);
router.get('/get-sells-by-seller', getSellsBySeller);
router.get('/get-sells-by-date', getSellsByDate);
router.get('/get-sells-by-product', getSellsByProduct);

//──────────────────────────────────────────── 📤 POST 📤 ───────────────────────────────────────────//
router.post('/create-sell', createSell);

//──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//
router.delete('/delete-sell/:_id', deleteSell);

//──────────────────────────────────────────── 🛠️ PUT 🛠️ ───────────────────────────────────────────//
router.put('/edit-sell', editSell);

export default router;
