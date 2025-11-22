import { Request, Response } from "express";


export async function home (_req: Request,res: Response) {
    res.status(200).send('Estas en sells');
}

export async function createSell (req: Request, res: Response) {
    try{

    } catch(error: unknown){
        if (error instanceof Error) {
            res
                .status(400)
                .send(error.message);
            return;
        } 
    }
}