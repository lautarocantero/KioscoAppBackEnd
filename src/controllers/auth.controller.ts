import { AuthModel } from "../models/authModel";
import { Request, Response } from 'express';
import { ACCESS_SECRET, REFRESH_SECRET } from "../config";
import jwt from 'jsonwebtoken';
import { handleControllerError } from "../utils/handleControllerError";
import {
  AuthCheckAuthRequest,
  AuthGoogleRequest,
  AuthLoginRequest,
  AuthLogoutRequest,
  AuthRefreshRequest,
  AuthRegisterRequest,
  DeleteAuthRequest,
  EditAuthRequest,
  SessionUser,
} from "@typings/auth";
import axios from "axios";
// Import relativo (no @typings): acá se usa como VALOR, y el alias solo
// resuelve en tiempo de compilación (ver el mismo patrón en authModel.ts).
import { AuthRoleEnum } from "../typings/auth/enums";
import { SellerStatus } from "../typings/seller/sellerEnums";
import { SellerModel } from "../models/sellerModel";
// import { EmailService } from "../services/emailService";


/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🕹️ Controlador de endpoints relacionados con autenticación 🕹️                                                             ║
╠═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║ 📤 Métodos soportados                                                                                                     ║
║                                                                                                                           ║
║ Tipo   | Link              | Función      | Descripción                          | Params                    | Return    | Auth Req | Status ║
║--------|-------------------|--------------|--------------------------------------|---------------------------|-----------|----------|--------║
║ POST   | /register         | register     | Registro (crea Auth + Seller)        | body: {email,pwd,name..} | JSON {id} | No       | 200,400,500 ║
║ POST   | /login            | login        | Inicio de sesión                     | body: {email,pwd}        | SessionUser| No      | 200,401,500 ║
║ POST   | /google           | googleLogin  | Inicio de sesión / registro vía Google| body: {accessToken}     | SessionUser| No      | 200,401,500 ║
║ POST   | /logout           | logout       | Cierre de sesión                     | cookies: refresh_token   | JSON msg  | Sí       | 200,401,500 ║
║ POST   | /check-auth       | checkAuth    | Validación de sesión activa          | cookies: refresh_token   | SessionUser| Sí      | 200,401,500 ║
║ POST   | /refresh          | refresh      | Renueva access_token                 | cookies: refresh_token   | JSON msg  | Sí       | 200,401,500 ║
║ PUT    | /edit-auth        | editAuth     | Edita email/password/role            | body: {_id,...}          | JSON msg  | Sí       | 200,400,404,500 ║
║ DELETE | /delete-auth      | deleteAuth   | Elimina identidad (cascada a Seller) | body: {_id}              | JSON msg  | Sí       | 200,404,500 ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

//─────────────────────────────────────────────────────────── 📥 GET 📥 ────────────────────────────────────────────────────────────────//

export async function home(_req: Request, res: Response): Promise<void> {
    res
    .status(200)
    .send(`
      Estas en auth<br>
      Endpoints =><br>
      ----Post: /register<br>
      ----Post: /login<br>
      ----Post: /google<br>
      ----Post: /logout<br>
      ----Post: /check-auth<br>
      ----Post: /refresh<br>
      ----Delete: /delete-auth<br>
      ----Put: /edit-auth<br>
  `);
}

//─────────────────────────────────────────────────────────── 📤 POST 📤 ────────────────────────────────────────────────────────────────//

/*═══════════════════════════════════════════════════════════════════════════╗
║ 🎮 register 🎮 → Crea la identidad (Auth) y el perfil (Seller) en un solo   ║
║    paso, ligados por el mismo _id                                          ║
╚═══════════════════════════════════════════════════════════════════════════╝*/

export async function register(req: AuthRegisterRequest, res: Response): Promise<void> {
    const { email, password, repeatPassword, name, profilePhoto } = req.body;

    try {
        const { _id } = await AuthModel.create({ email, password, repeatPassword, name, profilePhoto });

        // TODO(email-verification): reactivar cuando se pague Resend.
        // try {
        //     await EmailService.sendVerificationEmail({ to: email, username: name, token: verificationToken });
        // } catch (emailError) {
        //     console.error('Failed to send verification email:', emailError);
        // }

        res
          .status(200)
          .json({
            id: _id,
            message: "User Registered successfully",
          });
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

/*═══════════════════════════════════════════════════════════════════════════╗
║ 🎮 login 🎮 → Autentica y devuelve la sesión combinada (Auth + Seller)      ║
╚═══════════════════════════════════════════════════════════════════════════╝*/

function setSessionCookies(res: Response, user: SessionUser, rememberMe?: boolean): { accessToken: string; refreshToken: string } {
    const accessToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      ACCESS_SECRET,
      { expiresIn: '5m' }
    );

    const refreshExpiresIn = rememberMe ? '30d' : '1d';

    const refreshToken = jwt.sign(
      { id: user._id, email: user.email },
      REFRESH_SECRET,
      { expiresIn: refreshExpiresIn }
    );

    const refreshCookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
        ...(rememberMe && { maxAge: 1000 * 60 * 60 * 24 * 30 }),
    };

    res
      .cookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 1000 * 60 * 5,
      })
      .cookie('refresh_token', refreshToken, refreshCookieOptions);

    return { accessToken, refreshToken };
}

export async function login(req: AuthLoginRequest, res: Response): Promise<void> {
    const { email, password, rememberMe } = req.body;

    try {
        const user: SessionUser = await AuthModel.login({ email, password, rememberMe });

        const { refreshToken } = setSessionCookies(res, user, rememberMe);
        await AuthModel.saveRefreshToken({ _id: user._id, token: refreshToken });

        res
          .status(200)
          .json({
            user,
            message: "User Logged successfully",
          });
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

/*═══════════════════════════════════════════════════════════════════════════╗
║ 🎮 googleLogin 🎮 → Autentica o registra (Auth + Seller) vía Google         ║
╚═══════════════════════════════════════════════════════════════════════════╝*/

export async function googleLogin(req: AuthGoogleRequest, res: Response): Promise<void> {
    const { accessToken } = req.body;

    try {
        const { data: googleUser } = await axios.get(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        const user: SessionUser = await AuthModel.loginOrCreateWithGoogle({
            email: googleUser.email,
            name: googleUser.name,
            profilePhoto: googleUser.picture,
        });

        const { refreshToken } = setSessionCookies(res, user, true);
        await AuthModel.saveRefreshToken({ _id: user._id, token: refreshToken });

        res.status(200).json({ user, message: "User logged in with Google successfully" });
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

/*═══════════════════════════════════════════════════════════════════════════╗
║ 🎮 logout 🎮 → Cierra sesión                                               ║
╚═══════════════════════════════════════════════════════════════════════════╝*/

export async function logout(req: AuthLogoutRequest, res: Response): Promise<void> {
  const refreshToken = req?.cookies?.refresh_token;

  if (!refreshToken) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET) as { id?: string };
    if (!payload?.id) {
      res.status(401).json({ message: 'Invalid token payload' });
      return;
    }

    await AuthModel.deleteRefreshToken({ _id: payload.id });

    // Best-effort: si el Seller ya no existe o falla, el logout igual debe
    // completarse (limpiar cookies es lo importante acá).
    await SellerModel.edit({ _id: payload.id, user_status: SellerStatus.offline }).catch(() => {});

    res
      .clearCookie('access_token')
      .clearCookie('refresh_token')
      .status(200)
      .json({ message: 'Logged out successfully' });
  } catch (error: unknown) {
      handleControllerError(res, error);
  }
}

/*═══════════════════════════════════════════════════════════════════════════╗
║ 🎮 checkAuth 🎮 → Valida sesión y devuelve Auth + Seller combinados         ║
╚═══════════════════════════════════════════════════════════════════════════╝*/

export async function checkAuth(req: AuthCheckAuthRequest, res: Response): Promise<void> {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
    }

    try {
      const payload = jwt.verify(refreshToken, REFRESH_SECRET) as { id: string };
      const user: SessionUser = await AuthModel.checkAuth({ _id: payload.id });

      res.status(200).json(user);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

/*═══════════════════════════════════════════════════════════════════════════╗
║ 🎮 refresh 🎮 → Emite un nuevo access_token a partir del refresh_token      ║
╚═══════════════════════════════════════════════════════════════════════════╝*/

export async function refresh(req: AuthRefreshRequest, res: Response): Promise<void> {
  const refreshToken = req.cookies?.refresh_token;

  if (!refreshToken) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET) as { id: string; email: string };

    // Ya no solo confirma que existe: usamos el resultado para traer el role vigente
    const user: SessionUser = await AuthModel.checkAuth({ _id: payload.id });

    const newAccessToken = jwt.sign(
      { id: payload.id, email: payload.email, role: user.role },
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

        // 🚧 BYPASS TEMPORAL (sin Resend pago): devolvemos el token directo en la
        // respuesta para que el frontend pueda navegar a /reset-password sin
        // depender del email.
        //
        // ⚠️ SEGURIDAD: esto rompe a propósito la protección de "no revelar si
        // el email existe" (el `token` viene presente solo si existe). NO
        // DEJAR este bypass en producción.
        //
        // Para reactivar cuando se pague Resend:
        // 1. Descomentar el bloque de EmailService de abajo (resolviendo el
        //    `name` contra Seller por _id, ya que ya no vive en Auth).
        // 2. Sacar `token` del response.status(200).json(...).
        // 3. Restaurar el mensaje genérico sin datos condicionales.
        //
        // if (result) {
        //     const seller = await SellerModel.getSellerByField('_id', result._id, 'string');
        //     await EmailService.sendPasswordResetEmail({ to: email, username: seller.name, token: result.resetToken });
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
// export async function verifyEmail(req: VerifyEmailRequest, res: Response): Promise<void> {
//     const { token } = req.body;
//     try {
//         await AuthModel.verifyEmail({ token });
//         res.status(200).json({ message: 'Email verified successfully' });
//     } catch (error: unknown) {
//         handleControllerError(res, error);
//     }
// }

//─────────────────────────────────────────────────────────── 🗑️ DELETE 🗑️ ────────────────────────────────────────────────────────────────//

/*═══════════════════════════════════════════════════════════════════════════╗
║ 🎮 deleteAuth 🎮 → Elimina la identidad; el modelo hace cascada a Seller    ║
╚═══════════════════════════════════════════════════════════════════════════╝*/

export async function deleteAuth(req: DeleteAuthRequest, res: Response): Promise<void> {
  const { _id } = req.body;

  try {
    await AuthModel.deleteAuth({ _id });
    res
      .status(200)
      .json({
        _id,
        message: 'Auth deleted successfully',
      });
  } catch (error: unknown) {
      handleControllerError(res, error);
  }
}

//─────────────────────────────────────────────────────────── 🛠️ PUT 🛠️ ────────────────────────────────────────────────────────────────//

/*═══════════════════════════════════════════════════════════════════════════╗
║ 🎮 editAuth 🎮 → Edita SOLO email/password/role. name/foto van por Seller  ║
╚═══════════════════════════════════════════════════════════════════════════╝*/

export async function editAuth(req: EditAuthRequest, res: Response): Promise<void> {
  const { _id, email, password, role } = req.body;

  // Cambiar el role es una acción administrativa: solo un admin puede
  // tocarlo. email/password sigue editable por el propio usuario.
  if (role !== undefined && req.user?.role !== AuthRoleEnum.Admin) {
    res.status(403).json({ message: 'Solo un administrador puede editar el rol de un usuario' });
    return;
  }

  try {
    await AuthModel.editAuth({ _id, email, password, role });
    res
      .status(200)
      .json({
        _id,
        message: 'Auth has been edited successfully',
      });
  } catch (error: unknown) {
    handleControllerError(res, error);
  }
}