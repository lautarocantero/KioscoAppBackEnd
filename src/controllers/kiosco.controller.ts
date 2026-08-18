import { Request, Response } from 'express';
import { handleControllerError } from '../utils/handleControllerError';
import { KioscoModel } from '../models/kioscoModel';
import { FRONTEND_URL } from '../config';
import {
  CreateKioscoRequest,
  EditKioscoRequest,
  InviteInfoRequest,
  JoinKioscoRequest,
  Kiosco,
  KioscoWithStats,
  InviteInfo,
  SelectKioscoRequest,
} from '@typings/kiosco';

/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🕹️ Controlador de endpoints relacionados con kioscos 🕹️                                                                    ║
╠═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║ Tipo   | Link                            | Función        | Auth Req                                | Status          ║
║--------|---------------------------------|----------------|-----------------------------------------|-----------------║
║ POST   | /create                         | createKiosco   | authMiddleware                          | 200,400,500     ║
║ GET    | /my-kioscos                     | getMyKioscos   | authMiddleware                          | 200,500         ║
║ POST   | /join                           | joinKiosco     | authMiddleware                          | 200,400,404,500 ║
║ GET    | /:kiosco_id/invite-info         | getInviteInfo  | authMiddleware, requireKioscoRole(admin)| 200,403,404,500 ║
║ PUT    | /:kiosco_id                     | editKiosco     | authMiddleware, requireKioscoRole(admin)| 200,400,404,500 ║
║ POST   | /:kiosco_id/select              | selectKiosco   | authMiddleware, requireKioscoContext    | 200,403,500     ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

export async function createKiosco(req: CreateKioscoRequest, res: Response): Promise<void> {
    const { name, address } = req.body;

    try {
        const kiosco: Kiosco = await KioscoModel.create({ name, address, owner_id: req.user!.id });
        res.status(200).json({ kiosco, message: 'The kiosco has been created correctly' });
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

export async function getMyKioscos(req: Request, res: Response): Promise<void> {
    try {
        const kioscos: KioscoWithStats[] = await KioscoModel.getMyKioscos({ user_id: req.user!.id });
        res.status(200).json(kioscos);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

export async function joinKiosco(req: JoinKioscoRequest, res: Response): Promise<void> {
    const { invite_code } = req.body;

    try {
        const kiosco: Kiosco = await KioscoModel.join({ invite_code, user_id: req.user!.id });
        res.status(200).json({ kiosco, message: 'You have joined the kiosco successfully' });
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

export async function getInviteInfo(req: InviteInfoRequest, res: Response): Promise<void> {
    const { kiosco_id } = req.params;

    try {
        const inviteInfo: InviteInfo = await KioscoModel.getInviteInfo({ kiosco_id }, FRONTEND_URL);
        res.status(200).json(inviteInfo);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

export async function editKiosco(req: EditKioscoRequest, res: Response): Promise<void> {
    const { kiosco_id } = req.params;
    const { name, address, currency } = req.body;

    try {
        await KioscoModel.edit({ kiosco_id, name, address, currency });
        res.status(200).json({ message: 'The kiosco has been edited successfully' });
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

export async function selectKiosco(req: SelectKioscoRequest, res: Response): Promise<void> {
    const { kiosco_id } = req.params;

    try {
        await KioscoModel.select({ kiosco_id, user_id: req.user!.id });
        res.status(200).json({ message: 'Kiosco selected' });
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

export async function removeKioscoMember(req: Request, res: Response): Promise<void> {
    const { kiosco_id, user_id } = req.params;

    try {
        await KioscoModel.removeMember(kiosco_id, user_id);
        res.status(200).json({ message: 'Member removed from the kiosco' });
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

export async function updateKioscoMemberRole(req: Request, res: Response): Promise<void> {
    const { kiosco_id, user_id } = req.params;
    const { role } = req.body;

    try {
        await KioscoModel.updateMemberRole(kiosco_id, user_id, role);
        res.status(200).json({ message: 'Member role updated' });
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}
