/*──────────────────────────────
🔔 NotificationRouter
──────────────────────────────
📜 Propósito:
Define las rutas relacionadas con notificaciones y las conecta con sus controladores.

📂 Endpoints:
- GET    /notification/get-notifications        → todas, con status resuelto por usuario
- PATCH  /notification/mark-as-read              → marca una como leída para el usuario actual
- PATCH  /notification/mark-all-as-read          → marca todas como leídas para el usuario actual
- DELETE /notification/delete-notification       → elimina una notificación
- DELETE /notification/delete-all-notifications  → elimina todas las notificaciones
──────────────────────────────*/

import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import {
  deleteAllNotifications,
  deleteNotification,
  getNotifications,
  markAllAsRead,
  markAsRead,
} from '../controllers/notification.controller';

const router = express.Router();

//──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//
router.get('/get-notifications', authMiddleware, getNotifications);

//──────────────────────────────────────────── 🛠️ PATCH 🛠️ ───────────────────────────────────────────//
router.patch('/mark-as-read', authMiddleware, markAsRead);
router.patch('/mark-all-as-read', authMiddleware, markAllAsRead);

//──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//
router.delete('/delete-notification', authMiddleware, deleteNotification);
router.delete('/delete-all-notifications', authMiddleware, deleteAllNotifications);

export default router;
