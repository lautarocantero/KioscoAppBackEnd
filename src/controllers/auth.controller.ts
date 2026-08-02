import { AuthModel } from "../models/authModel";
import { Request, Response } from 'express';
import { ACCESS_SECRET, REFRESH_SECRET } from "../config";
import jwt from 'jsonwebtoken';
// import { AuthCheckAuthRequest, AuthLoginRequest, AuthLogoutRequest, AuthPublic, AuthPublicSchema, AuthRegisterRequest, DeleteAuthRequest, EditAuthRequest } from "../typings/auth/authTypes";
// import { AuthCheckAuthRequest, AuthLoginRequest, AuthLogoutRequest, AuthPublic, AuthPublicSchema, AuthRegisterRequest, DeleteAuthRequest, EditAuthRequest } from "../typings/auth/index";
import { handleControllerError } from "../utils/handleControllerError";
import { AuthCheckAuthRequest, AuthLoginRequest, AuthLogoutRequest, AuthPublic, AuthPublicSchema, AuthRegisterRequest, DeleteAuthRequest, EditAuthRequest } from "@typings/auth";


/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🕹️ Controlador de endpoints relacionados con autenticación 🕹️                                                             ║
╠═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║ 📤 Métodos soportados                                                                                                     ║
║                                                                                                                           ║
║ Tipo   | Link              | Función         | Descripción                  | Params                  | Return   | Auth Req | Status ║
║--------|-------------------|-----------------|------------------------------|-------------------------|----------|----------|--------║
║ POST   | /register         | register         | Registro de usuarios         | body: {name,email,pwd}  | JSON {id}| No       | 201,400,500 ║
║ POST   | /login            | login            | Inicio de sesión             | body: {email,pwd}       | JWT token| No       | 200,401,500 ║
║ POST   | /logout           | logout           | Cierre de sesión             | headers: {Authorization}| JSON msg | Sí       | 200,401,500 ║
║ POST   | /checkAuth        | checkAuth       | Validación de sesión activa  | headers: {Authorization}| JSON bool| Sí       | 200,401,500 ║
║ PUT    | /edit-user        | editAuth        | Edición de usuario           | body: {id,fields...}    | JSON msg | Sí       | 200,400,404,500 ║
║ DELETE | /delete-user      | deleteAuth      | Eliminación de usuario       | body: {id}              | JSON msg | Sí       | 200,404,500 ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

//─────────────────────────────────────────────────────────── 📥 GET 📥 ────────────────────────────────────────────────────────────────//


/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 Función home 🎮 → Devuelve listado de endpoints disponibles                                                             ║
║ 📥 Entrada: -                                                                                                             ║
║ ⚙️ Proceso: Renderiza texto con rutas                                                                                     ║
║ 📤 Salida: HTML con endpoints                                                                                              ║
║ 🛠️ Errores: Delegados a handleControllerError                                                                             ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/


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
//─────────────────────────────────────────────────────────── 📥 GET 📥 ────────────────────────────────────────────────────────────────//
//─────────────────────────────────────────────────────────── 📤 POST 📤 ────────────────────────────────────────────────────────────────//

/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 Función register 🎮 → Crea usuario nuevo                                                                               ║
║ 📥 Entrada: { username, email, profilePhoto, password, repeatPassword }                                                   ║
║ 📤 Salida: JSON { id, message }                                                                                           ║
║ 🛠️ Errores: Delegados a handleControllerError                                                                             ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

export async function register(req: AuthRegisterRequest, res: Response): Promise<void>  {
    const { username, email, profilePhoto, password, repeatPassword } = req.body;

    try{
        const _id: string = await AuthModel.create({username, email, profilePhoto, password , repeatPassword});
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

/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 Función login 🎮 → Autentica usuario                                                                                   ║
║ 📥 Entrada: { email, password }                                                                                           ║
║ 📤 Salida: JSON { user, message }, cookies con access_token y refresh_token                                               ║
║ 🛠️ Errores: Delegados a handleControllerError                                                                             ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

export async function login ( req: AuthLoginRequest, res: Response ) : Promise <void>  {
    const { email, password } = req.body;

    try{
        const user: AuthPublic = await AuthModel.login({email, password});

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
            sameSite:  process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 1000 * 60 * 5,
          })
          .cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 1000 * 60 * 60 * 24 * 7,
          })
          .status(200)
          .json({ 
            user, 
            message: "User Logged successfully",
          });
    } catch(error: unknown){
        handleControllerError(res, error);
    }
}

/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 Función logout 🎮 → Cierra sesión                                                                                      ║
║ 📥 Entrada: refresh_token (cookies)                                                                                       ║
║ 📤 Salida: JSON { message }, cookies limpiadas                                                                            ║
║ 🛠️ Errores: Delegados a handleControllerError                                                                             ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

export async function logout(req: AuthLogoutRequest, res: Response): Promise<void> {
  const refreshToken = req?.cookies?.refresh_token;

  if (!refreshToken) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

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
      .json({ message: 'Logged out successfully' });
  } catch (error: unknown) {
      handleControllerError(res, error);
}
}

/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 Función checkAuth 🎮 → Valida sesión                                                                                   ║
║ 📥 Entrada: refresh_token (cookies)                                                                                       ║
║ 📤 Salida: JSON { user }                                                                                                  ║
║ 🛠️ Errores: Delegados a handleControllerError                                                                             ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

export async function checkAuth(req: AuthCheckAuthRequest, res: Response): Promise<void> {                                            
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
    }

    try {
      const accessPayload = jwt.verify(refreshToken, REFRESH_SECRET) as { id: string };
      const user: AuthPublicSchema = await AuthModel.checkAuth({ _id: accessPayload.id });

      if (!user) throw new Error('No se encuentra ese usuario');

      res.status(200).json(user);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}
//─────────────────────────────────────────────────────────── 📤 POST 📤 ────────────────────────────────────────────────────────────────//
//─────────────────────────────────────────────────────────── 🗑️ DELETE 🗑️ ────────────────────────────────────────────────────────────────//

/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 Función deleteAuth 🎮 → Elimina credenciales                                                                           ║
║ 📥 Entrada: { _id }                                                                                                       ║
║ 📤 Salida: JSON { _id, message }                                                                                          ║
║ 🛠️ Errores: Delegados a handleControllerError                                                                             ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

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
//─────────────────────────────────────────────────────────── 🗑️ DELETE 🗑️ ────────────────────────────────────────────────────────────────//
//─────────────────────────────────────────────────────────── 🛠️ PUT 🛠️ ────────────────────────────────────────────────────────────────//

/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 Función editAuth 🎮 → Edita credenciales                                                                               ║
║ 📥 Entrada: { _id, username, email, password, profilePhoto }                                                              ║
║ 📤 Salida: JSON { _id, message }                                                                                          ║
║ 🛠️ Errores: Delegados a handleControllerError                                                                             ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

export async function editAuth (req: EditAuthRequest, res: Response): Promise <void> {
  const { _id, username, email, password, profilePhoto, role } = req.body;
  
  try{
    await AuthModel.editAuth({ _id, username, email, password, profilePhoto, role });
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

//─────────────────────────────────────────────────────────── 🛠️ PUT 🛠️ ────────────────────────────────────────────────────────────────//
