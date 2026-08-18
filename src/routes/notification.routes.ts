/*──────────────────────────────
🔔 NotificationRouter
──────────────────────────────
📜 Propósito:
Define las rutas relacionadas con notificaciones y las conecta con sus controladores.

📂 Endpoints:
- GET    /notification/get-notifications        → todas, con status resuelto por usuario
- PATCH  /notification/mark-as-read              → marca una como leída para el usuario actual
- PATCH  /notification/mark-as-unread            → marca una como no leída para el usuario actual
- PATCH  /notification/mark-all-as-read          → marca todas como leídas para el usuario actual
- DELETE /notification/delete-notification       → elimina una notificación
- DELETE /notification/delete-all-notifications  → elimina todas las notificaciones
──────────────────────────────*/

import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireKioscoContext } from '../middlewares/kioscoMiddleware';
import {
  deleteAllNotifications,
  deleteNotification,
  getNotifications,
  markAllAsRead,
  markAsRead,
  markAsUnread,
} from '../controllers/notification.controller';

const router = express.Router();

router.use(authMiddleware, requireKioscoContext);

//──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//
router.get('/get-notifications', getNotifications);

//──────────────────────────────────────────── 🛠️ PATCH 🛠️ ───────────────────────────────────────────//
router.patch('/mark-as-read', markAsRead);
router.patch('/mark-as-unread', markAsUnread);
router.patch('/mark-all-as-read', markAllAsRead);

//──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//
router.delete('/delete-notification', deleteNotification);
router.delete('/delete-all-notifications', deleteAllNotifications);

export default router;
