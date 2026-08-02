import { Resend } from 'resend';
import { RESEND_API_KEY, EMAIL_FROM, FRONTEND_URL } from '../config';

/*──────────────────────────────
📧 EmailService
──────────────────────────────
📜 Propósito:
Único lugar del backend que sabe cómo armar y enviar mails transaccionales
vía Resend. Ni AuthModel ni los controllers deben conocer el proveedor de
mail ni el markup de los templates: todo eso vive acá.

Si mañana cambia el proveedor (ej. se pasa de Resend a otro), o cambia el
diseño de los mails, solo se toca este archivo.
──────────────────────────────*/

const resend = new Resend(RESEND_API_KEY);

export class EmailService {

  //──────────────────────────────────────────── 📤 SEND 📤 ───────────────────────────────────────────//

  /*══════════ 🎮 sendVerificationEmail ══════════╗
  ║ 📥 Entrada: {to, username, token}              ║
  ║ ⚙️ Proceso: arma el link de verificación a       ║
  ║            partir del token y lo envía vía       ║
  ║            Resend usando el template HTML de      ║
  ║            confirmación de cuenta                 ║
  ║ 📤 Salida: void                                   ║
  ╚═══════════════════════════════════════════════════╝*/

  static async sendVerificationEmail(data: { to: string; username: string; token: string }): Promise<void> {
    const { to, username, token } = data;

    const verificationUrl = `${FRONTEND_URL}/verify-email?token=${token}`;

    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: 'Confirmá tu cuenta en Stocko',
      html: EmailService.buildVerificationEmailHtml({ username, verificationUrl }),
    });

    if (error) throw new Error(`Failed to send verification email: ${error.message}`);
  }

  /*══════════ 🎮 sendPasswordResetEmail ══════════╗
  ║ 📥 Entrada: {to, username, token}                ║
  ║ ⚙️ Proceso: arma el link de reset a partir del     ║
  ║            token y lo envía vía Resend usando       ║
  ║            el template HTML de restablecimiento     ║
  ║            de contraseña                             ║
  ║ 📤 Salida: void                                       ║
  ╚═════════════════════════════════════════════════════╝*/

  static async sendPasswordResetEmail(data: { to: string; username: string; token: string }): Promise<void> {
    const { to, username, token } = data;

    const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: 'Restablecer tu contraseña en Stocko',
      html: EmailService.buildPasswordResetEmailHtml({ username, resetUrl }),
    });

    if (error) throw new Error(`Failed to send password reset email: ${error.message}`);
  }

  //──────────────────────────────────────────── 📤 SEND 📤 ───────────────────────────────────────────//
  //──────────────────────────────────────────── 🔧 HELPERS 🔧 ───────────────────────────────────────────//

  /*══════════ 🎮 buildVerificationEmailHtml ══════════╗
  ║ 📥 Entrada: {username, verificationUrl}              ║
  ║ ⚙️ Proceso: arma el markup HTML del mail de           ║
  ║            confirmación de cuenta                     ║
  ║ 📤 Salida: string (HTML)                               ║
  ╚═══════════════════════════════════════════════════════╝*/

  private static buildVerificationEmailHtml(data: { username: string; verificationUrl: string }): string {
    const { username, verificationUrl } = data;

    return `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>¡Hola, ${username}!</h2>
        <p>Gracias por registrarte en Stocko. Confirmá tu email para activar tu cuenta:</p>
        <a href="${verificationUrl}" 
           style="display:inline-block; padding:12px 24px; background:#1976d2; color:#fff; text-decoration:none; border-radius:6px;">
           Confirmar mi email
        </a>
        <p style="margin-top:24px; font-size:12px; color:#666;">
          Si no creaste esta cuenta, podés ignorar este mensaje. El link expira en 24 horas.
        </p>
      </div>
    `;
  }

  /*══════════ 🎮 buildPasswordResetEmailHtml ══════════╗
  ║ 📥 Entrada: {username, resetUrl}                      ║
  ║ ⚙️ Proceso: arma el markup HTML del mail de            ║
  ║            restablecimiento de contraseña               ║
  ║ 📤 Salida: string (HTML)                                 ║
  ╚═══════════════════════════════════════════════════════════╝*/

  private static buildPasswordResetEmailHtml(data: { username: string; resetUrl: string }): string {
    const { username, resetUrl } = data;

    return `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Hola, ${username}</h2>
        <p>Recibimos una solicitud para restablecer tu contraseña. Si fuiste vos, hacé clic acá:</p>
        <a href="${resetUrl}" 
           style="display:inline-block; padding:12px 24px; background:#1976d2; color:#fff; text-decoration:none; border-radius:6px;">
           Restablecer contraseña
        </a>
        <p style="margin-top:24px; font-size:12px; color:#666;">
          Si no pediste esto, ignorá este mensaje: tu contraseña actual sigue siendo válida. El link expira en 1 hora.
        </p>
      </div>
    `;
  }

  //──────────────────────────────────────────── 🔧 HELPERS 🔧 ───────────────────────────────────────────//
}