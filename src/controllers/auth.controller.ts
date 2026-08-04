import { AuthModel } from "../models/authModel";
import { Request, Response } from 'express';
import { ACCESS_SECRET, REFRESH_SECRET } from "../config";
import jwt from 'jsonwebtoken';
// import { AuthCheckAuthRequest, AuthLoginRequest, AuthLogoutRequest, AuthPublic, AuthPublicSchema, AuthRegisterRequest, DeleteAuthRequest, EditAuthRequest } from "../typings/auth/authTypes";
// import { AuthCheckAuthRequest, AuthLoginRequest, AuthLogoutRequest, AuthPublic, AuthPublicSchema, AuthRegisterRequest, DeleteAuthRequest, EditAuthRequest } from "../typings/auth/index";
import { handleControllerError } from "../utils/handleControllerError";
import { AuthCheckAuthRequest, AuthGoogleRequest, AuthLoginRequest, AuthLogoutRequest, AuthPublic, AuthPublicSchema, AuthRefreshRequest, AuthRegisterRequest, DeleteAuthRequest, EditAuthRequest } from "@typings/auth";
import axios from "axios";
import { EmailService } from "../services/emailService";


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
        const { _id } = await AuthModel.create({ username, email, profilePhoto, password, repeatPassword });

        // TODO(email-verification): reactivar cuando se pague Resend.
        // try {
        //     await EmailService.sendVerificationEmail({ to: email, username, token: verificationToken });
        // } catch (emailError) {
        //     console.error('Failed to send verification email:', emailError);
        // }

        res
          .status(200)
          .json({
            id: _id,
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
    const { email, password, rememberMe } = req.body;

    try{
        const user: AuthPublic = await AuthModel.login({email, password, rememberMe});

        const token = jwt.sign(
          { id: user._id, email: user.email },
          ACCESS_SECRET,
          { expiresIn: '5m' }
        );

        const refreshExpiresIn = rememberMe ? '30d' : '1d';

        const refreshToken = jwt.sign(
          { id: user._id, email: user.email },
          REFRESH_SECRET,
          { expiresIn: refreshExpiresIn }
        );

        await AuthModel.saveRefreshToken({ _id: user._id, token: refreshToken });

        const refreshCookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
            // Si rememberMe es false, no seteamos maxAge → cookie de sesión,
            // se borra sola al cerrar el navegador.
            ...(rememberMe && { maxAge: 1000 * 60 * 60 * 24 * 30 }),
        };

        res
          .cookie('access_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 1000 * 60 * 5,
          })
          .cookie('refresh_token', refreshToken, refreshCookieOptions)
          .status(200)
          .json({ 
            user, 
            message: "User Logged successfully",
          });
    } catch(error: unknown){
        handleControllerError(res, error);
    }
}

/*═══════════════════════════════════════════════════════════════════════════╗
║ 🎮 Función googleLogin 🎮 → Autentica o registra usuario vía Google        ║
║ 📥 Entrada: { accessToken }                                                ║
║ 📤 Salida: JSON { user, message }, cookies con access_token y refresh_token║
║ 🛠️ Errores: Delegados a handleControllerError                             ║
╚═══════════════════════════════════════════════════════════════════════════╝*/

export async function googleLogin(req: AuthGoogleRequest, res: Response): Promise<void> {
    const { accessToken } = req.body;

    try {
        const { data: googleUser } = await axios.get(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        const user: AuthPublic = await AuthModel.loginOrCreateWithGoogle({
            email: googleUser.email,
            username: googleUser.name,
            profilePhoto: googleUser.picture,
        });

        const token = jwt.sign(
            { id: user._id, email: user.email },
            ACCESS_SECRET,
            { expiresIn: '5m' }
        );

        const refreshToken = jwt.sign(
            { id: user._id, email: user.email },
            REFRESH_SECRET,
            { expiresIn: '30d' }
        );

        await AuthModel.saveRefreshToken({ _id: user._id, token: refreshToken });

        res
          .cookie('access_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 1000 * 60 * 5,
          })
          .cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 1000 * 60 * 60 * 24 * 30,
          })
          .status(200)
          .json({ user, message: "User logged in with Google successfully" });
    } catch (error: unknown) {
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

/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 Función refresh 🎮 → Emite un nuevo access_token a partir del refresh_token                                            ║
║ 📥 Entrada: refresh_token (cookies)                                                                                       ║
║ 📤 Salida: JSON { message }, cookie access_token renovada                                                                 ║
║ 🛠️ Errores: Delegados a handleControllerError                                                                             ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

export async function refresh(req: AuthRefreshRequest, res: Response): Promise<void> {
  const refreshToken = req.cookies?.refresh_token;

  if (!refreshToken) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET) as { id: string; email: string };

    const user: AuthPublicSchema = await AuthModel.checkAuth({ _id: payload.id });
    if (!user) throw new Error('No se encuentra ese usuario');

    const newAccessToken = jwt.sign(
      { id: payload.id, email: payload.email },
      ACCESS_SECRET,
      { expiresIn: '5m' }
    );

    res
      .cookie('access_token', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 1000 * 60 * 5,
      })
      .status(200)
      .json({ message: 'Token refreshed' });
  } catch (error: unknown) {
    handleControllerError(res, error);
  }
}

export async function requestPasswordReset(req: Request, res: Response): Promise<void> {
    const { email } = req.body;

    try {
        const result = await AuthModel.requestPasswordReset({ email });

        // 🚧 BYPASS TEMPORAL (sin Resend pago): comentamos el envío real de
        // mail y devolvemos el token directo en la respuesta para que el
        // frontend pueda navegar a /reset-password sin depender del email.
        //
        // ⚠️ SEGURIDAD: esto rompe a propósito la protección de "no revelar
        // si el email existe" (antes el mensaje era idéntico exista o no el
        // email; ahora `token` viene presente solo si existe). NO DEJAR
        // este bypass en producción.
        //
        // Para reactivar cuando se pague Resend:
        // 1. Descomentar el bloque de EmailService de abajo.
        // 2. Sacar `token` del response.status(200).json(...).
        // 3. Restaurar el mensaje genérico sin datos condicionales.
        //
        // if (result) {
        //     try {
        //         await EmailService.sendPasswordResetEmail({ to: email, username: result.username, token: result.resetToken });
        //     } catch (emailError) {
        //         console.error('Failed to send password reset email:', emailError);
        //     }
        // }

        res.status(200).json({
            message: 'If that email exists, a reset link has been sent',
            token: result ? result.resetToken : null,
        });
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
    const { token, newPassword, repeatNewPassword } = req.body;

    try {
        await AuthModel.resetPassword({ token, newPassword, repeatNewPassword });
        res.status(200).json({ message: 'Password reset successfully' });
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

// TODO(email-verification): reactivar cuando se pague Resend.
// export async function verifyEmail(req: Request, res: Response): Promise<void> {
//     const { token } = req.body;
//     try {
//         await AuthModel.verifyEmail({ token });
//         res.status(200).json({ message: 'Email verified successfully' });
//     } catch (error: unknown) {
//         handleControllerError(res, error);
//     }
// }

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
