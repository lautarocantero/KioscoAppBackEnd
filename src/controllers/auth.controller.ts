import { AuthModel } from "../models/authModel";
import { Request, Response } from 'express';


export async function home(_req: Request, res: Response) {
    res.send('estas en auth!!!');
}

export async function register(req: Request,res: Response) {
    const { username, password } = req.body;

    try{
        const id = await AuthModel.create({username, password})
        res.send({id})
    } catch(error: unknown){
        if (error instanceof Error) {
            res.status(400).send(error.message);
            return;
        }
        throw new Error('Oops something went wrong')
    }
 

}