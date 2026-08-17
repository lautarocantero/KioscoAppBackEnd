import { Request, Response } from "express";
import { NotificationModel } from "../models/notificationModel";
import { handleControllerError } from "../utils/handleControllerError";
import { DeleteNotificationRequestType, MarkAsReadRequestType, MarkAsUnreadRequestType, NotificationDTO } from "@typings/notification";

/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🕹️ Controlador de endpoints relacionados con notificaciones 🕹️                                                            ║
╠═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║ Tipo   | Link                          | Función               | Descripción                          | Auth Req | Status       ║
║--------|-------------------------------|------------------------|---------------------------------------|----------|--------------║
║ GET    | /get-notifications            | getNotifications       | Todas, con status por usuario         | Sí       | 200,401,500  ║
║ PATCH  | /mark-as-read                 | markAsRead             | Marca una como leída para el usuario  | Sí       | 200,400,401,500 ║
║ PATCH  | /mark-all-as-read             | markAllAsRead          | Marca todas como leídas               | Sí       | 200,401,500  ║
║ DELETE | /delete-notification          | deleteNotification     | Elimina una notificación              | Sí       | 200,400,401,500 ║
║ DELETE | /delete-all-notifications     | deleteAllNotifications | Elimina todas las notificaciones      | Sí       | 200,401,500  ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

//──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//

export async function getNotifications(req: Request, res: Response): Promise<void> {
    if (!req.user) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
    }

    try {
        const notifications: NotificationDTO[] = await NotificationModel.getAll(req.user.id);
        res.status(200).json(notifications);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

//──────────────────────────────────────────── 🛠️ PATCH 🛠️ ───────────────────────────────────────────//

export async function markAsRead(req: MarkAsReadRequestType, res: Response): Promise<void> {
    if (!req.user) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
    }

    const { _id } = req.body;

    try {
        await NotificationModel.markAsRead(_id, req.user.id);
        res.status(200).json({ message: 'Notification marked as read' });
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

export async function markAsUnread(req: MarkAsUnreadRequestType, res: Response): Promise<void> {
    if (!req.user) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
    }

    const { _id } = req.body;

    try {
        await NotificationModel.markAsUnread(_id, req.user.id);
        res.status(200).json({ message: 'Notification marked as unread' });
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

export async function markAllAsRead(req: Request, res: Response): Promise<void> {
    if (!req.user) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
    }

    try {
        await NotificationModel.markAllAsRead(req.user.id);
        res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

//──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//

export async function deleteNotification(req: DeleteNotificationRequestType, res: Response): Promise<void> {
    const { _id } = req.body;

    try {
        await NotificationModel.deleteOne(_id);
        res.status(200).json({ message: 'Notification has been deleted successfully' });
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

export async function deleteAllNotifications(_req: Request, res: Response): Promise<void> {
    try {
        await NotificationModel.deleteAll();
        res.status(200).json({ message: 'All notifications have been deleted successfully' });
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}
