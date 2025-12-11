
/*──────────────────────────────
📘 handleControllerError
──────────────────────────────
📜 Propósito:
Centralizar el manejo de errores en controladores.  
Responde con un mensaje JSON y el código HTTP apropiado.

🧩 Comportamiento:
- Si el error NO es instancia de `Error`:
  • Devuelve 500 → "An unexpected error ocurred, try again"
- Si el error SÍ es instancia de `Error`:
  • Devuelve 400 → con el mensaje del error

🛡️ Seguridad:
- Nunca exponer trazas internas ni datos sensibles.
- Mensajes genéricos para errores inesperados.
──────────────────────────────*/


import { Response } from 'express';

export function handleControllerError(res: Response, error: unknown): void {
    if (!(error instanceof Error)) {
        res
            .status(500)
            .json({ message: 'An unexpected error ocurred, try again' });
        return;
    }

    res
        .status(400)
        .json({ message: error.message });
}
