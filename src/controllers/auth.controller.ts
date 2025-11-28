import { AuthModel } from "../models/authModel";
import { Request, Response } from 'express';
import { ACCESS_SECRET, REFRESH_SECRET } from "../config";
import jwt from 'jsonwebtoken';
import { Auth, AuthCheckAuthRequest, AuthLoginRequest, AuthLogoutRequest, AuthRegisterRequest, DeleteAuthRequest, EditAuthRequest } from "../typings/auth/authTypes";
import { handleControllerError } from "../utils/handleControllerError";

/*══════════════════════════════════════════════════════════════════════╗
║ 📥 GET 📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥📥                     ║
╚══════════════════════════════════════════════════════════════════════╝*/

export async function home(_req: Request, res: Response): Promise<void> {
    res
    .status(200)
    .send(`
      Estas en auth<br>
      Endpoints =><br>
      ----Post: /register<br>
      ----Post: /login<br>
      ----Post: /logout<br>
      ----Post: /checkAuth<br>
      ----Delete: /delete-auth<br>
      ----Edit: /edit-auth<br>
  `);
}

/*══════════════════════════════════════════════════════════════════════╗
║ 📤 POST 📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤📤                     ║
╚══════════════════════════════════════════════════════════════════════╝*/
// 🆗
export async function register(req: AuthRegisterRequest, res: Response): Promise<void>  {
    const { username, email, password, repeatPassword } = req.body;

    try{
        const _id = await AuthModel.create({username, email,  password , repeatPassword});
        res
          .status(200)
          .json({
            id:_id,
            message: "User Registered successfully",
          });
    } catch(error: unknown){
        handleControllerError(res, error);
      }
}
// 🆗
export async function login ( req: AuthLoginRequest, res: Response ) : Promise <void>  {
    const { email, password } = req.body;

    try{
        const user = await AuthModel.login({email, password});

        const token = jwt.sign(
          { id: user._id, email: user.email },
          ACCESS_SECRET,
          { expiresIn: '5m' }
        );

        const refreshToken = jwt.sign(
          { id: user._id, email: user.email },
          REFRESH_SECRET,
          { expiresIn: '7d' }
        );

        await AuthModel.saveRefreshToken({ _id: user._id, token: refreshToken });

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
          .status(200)
          .json({ 
            user, 
            token, 
            refreshToken,
            message: "User Logged successfully",
          });
    } catch(error: unknown){
        handleControllerError(res, error);
    }
}
// 🆗
export async function logout(req: AuthLogoutRequest, res: Response): Promise<void> {
  const refreshToken = req?.cookies?.refresh_token;

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET) as { id?: string };
    if (!payload?.id) {
      res
        .status(401)
        .json({message: 'Invalid token payload'});
      return;
    }

    await AuthModel.deleteRefreshToken({_id: payload.id});

    res
      .clearCookie('access_token')
      .clearCookie('refresh_token')
      .status(200)
      .json({ message: 'Logout successful' });
  } catch (error: unknown) {
      handleControllerError(res, error);
}
}
// 🆗
export async function checkAuth(req: AuthCheckAuthRequest, res: Response): Promise<void> {                                            
    const refreshToken = req.cookies?.refresh_token;
    
    try{

      const accessPayload = jwt.verify(refreshToken, REFRESH_SECRET) as { id: string; };
      const user: Auth = await AuthModel.checkAuth({ _id: accessPayload.id});
      
      if(!user) throw new Error('No se encuentra ese usuario');
      
      res
        .status(200)
        .json(user);
    } catch(error: unknown) {
        handleControllerError(res, error);
    }
}

/*══════════════════════════════════════════════════════════════════════╗
║ 🗑️ DELETE 🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️🗑️                    ║
╚══════════════════════════════════════════════════════════════════════╝*/
// 🆗
export async function deleteAuth(req: DeleteAuthRequest, res: Response): Promise <void> {
  const { _id } = req.body;

  try{
    await AuthModel.deleteAuth({ _id });
    res
      .status(200)
      .json({
        _id,
        message: 'Auth deleted successfully',
      });
  } catch(error: unknown) {
      handleControllerError(res, error);
  }
}

/*══════════════════════════════════════════════════════════════════════╗
║ 🛠️ PUT 🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️🛠️                    ║
╚══════════════════════════════════════════════════════════════════════╝*/
// 🆗
export async function editAuth (req: EditAuthRequest, res: Response): Promise <void> {
  const { _id, username, email, password } = req.body;
  
  try{
    await AuthModel.editAuth({ _id, username, email, password });
    res
      .status(200)
      .json({
        _id,
        message: 'Auth has been edited successfully',
      });
  } catch(error: unknown) {
    handleControllerError(res, error);
  }
    
}























 
 
 
 
 
 

 
 
 
 
 
 

 
 
 
 
 
 
 
 
 

