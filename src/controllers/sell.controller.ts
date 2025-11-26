import { Request, Response } from "express";

/*══════════════════════════════════════════════════════════════════════╗
║ 📥 GET 📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export async function home(_req: Request, res: Response): Promise<void> {
    res
    .status(200)
    .json({message:`
      Estas en sell<br>
      Endpoints =><br>
      ----Post: /create-sell<br>
      ----Post: /login<br>
      ----Post: /logout<br>
      ----Post: /checkAuth<br>
  `});
}

/*══════════════════════════════════════════════════════════════════════╗
║ 📤 POST 📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export async function createSell (_req: Request, res: Response): Promise<void> {
    try{
        console.log('');
    } catch(error: unknown){
        if(!(error instanceof Error)) {
            res
                .status(500)
                .json({ message: 'An unexpected error ocurred, try again'});
            return;
        }
        res 
            .status(400)
            .json({ message: error.message});
    }
}