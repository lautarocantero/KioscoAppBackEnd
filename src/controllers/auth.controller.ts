import { AuthModel } from "../models/authModel";
import { Request, Response } from 'express';
import { AuthPublic } from "../typings/auth/authTypes";


export async function home(_req: Request, res: Response) {
    res.send('estas en auth!!!');
}

export async function register(req: Request,res: Response): Promise<void>  {
    const { username, password } = req.body;

    try{
        const id = await AuthModel.create({username, password});
        res.send({id});
    } catch(error: unknown){
        if (error instanceof Error) {
            res
                .status(400)
                .send(error.message);
            return;
        }
    }
}


export async function login(req: Request, res: Response): Promise<void>  {
    const { username, password } = req.body;

    try{
        const user: AuthPublic = await AuthModel.login({username, password});
        res.send({user});
    } catch(error: unknown){
        if(error instanceof Error){
            res
                .status(401)
                .send(error.message);
        }
    }
}

// export async function logout(req: Request, res:Requ): Promise<void> {

// }