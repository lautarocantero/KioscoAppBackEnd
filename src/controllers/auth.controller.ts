import { AuthModel } from "../models/authModel";
import { Request, Response } from 'express';
import { AuthPublic } from "../typings/auth/authTypes";
import { ACCESS_SECRET, REFRESH_SECRET } from "../config";
import jwt from 'jsonwebtoken';
import Validation from "../models/validation";


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


export async function login ( req: Request, res: Response ) : Promise <void>  {
    const { username, password } = req.body;

    Validation.username(username);
    Validation.password(password);
    
    try{
        const user: AuthPublic = await AuthModel.login({username, password});

        const token = jwt.sign(
          { id: user._id, username: user.username },
          ACCESS_SECRET,
          { expiresIn: '5m' }
        );

        const refreshToken = jwt.sign(
          { id: user._id, username: user.username },
          REFRESH_SECRET,
          { expiresIn: '7d' }
        );

        await AuthModel.saveRefreshToken({ userId: user._id, token: refreshToken });

        res
            .cookie('access_token', token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict',
              maxAge: 1000 * 60 * 5,
            })
            .cookie('refresh_token', refreshToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict',
              maxAge: 1000 * 60 * 60 * 24 * 7,
            })
            .send({ user, token, refreshToken });
            

        res.send({user});
    } catch(error: unknown){
        if(error instanceof Error){
            res
                .status(401)
                .send(error.message);
        }
    }
}

export async function logout(req: Request, res: Response): Promise<void> {
  const refreshToken = req?.cookies?.refresh_token;

  try {
    Validation.refreshToken(refreshToken);

    const payload = jwt.verify(refreshToken, REFRESH_SECRET) as { id?: string };
    if (!payload?.id) {
      res.status(401).send('Invalid token payload');
      return;
    }

    await AuthModel.deleteRefreshToken(payload.id);

    res
      .clearCookie('access_token')
      .clearCookie('refresh_token')
      .status(200)
      .json({ message: 'Logout successful' });
  } catch (error) {
    if (error instanceof Error) {
      res.status(401).send(error.message);
    }
  }
}

 
 
 
 
 
 

 
 
 
 
 
 

 
 
 
 
 
 
 
 
 

