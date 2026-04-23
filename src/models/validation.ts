
/*──────────────────────────────
🛡️ Validation
──────────────────────────────
📜 Propósito:
Centralizar todas las validaciones de datos usadas en los modelos y controladores.
Garantiza consistencia, seguridad y mensajes de error claros en todo el proyecto.

🧩 Dependencias:
- ProductVariant (tipado de variantes de producto)

📂 Funciones principales:
- stringValidation → valida cadenas genéricas
- password → valida contraseñas
- email → valida correos electrónicos
- refreshToken → valida tokens de refresco
- sku → valida códigos SKU
- number → valida números mayores a 0
- date → valida fechas
- image → valida URL de imagen
- imageArray → valida arrays de imágenes
- barcode → valida códigos de barras EAN-13
- isVariantArray → valida arrays de variantes de producto

🛡️ Seguridad:
- Todas las funciones lanzan errores descriptivos si la validación falla.
- Nunca se permite un valor vacío, nulo o con formato incorrecto.
- Se controla longitud mínima/máxima en strings sensibles (ej: password, sku).
- Se asegura que las URLs sean válidas y apunten a imágenes.

🌀 Flujo estándar:
[Input] → [Validation.*] → [Error o valor validado] → [Modelo/Controlador]
──────────────────────────────*/

import { ProductTicket } from "@typings/product";
import { ProductVariant } from "@typings/productVariant";

const isString = (string: unknown): boolean => typeof string === 'string';
const isNumber = (number: unknown): boolean => typeof number === 'number';
const isDate = (value: unknown): boolean => {
  if (value instanceof Date) return !isNaN(value.getTime());
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }
  return false;
};
const isImageUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    const imagePattern = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
    return imagePattern.test(url.pathname);
  } catch {
    return false;
  }
};
const isShortString = (string: string, length: number = 3): boolean => string.length < length;
const isLongString = (string: string): boolean => string.length > 30;
const isSKU = (value: string): boolean => /^[A-Z0-9_-]+$/i.test(value);
const isZero = (value: number): boolean => value === 0;
const isBarcode = (value: string): boolean => /^\d{13}$/.test(value);
const isTicket = (value: ProductTicket): boolean => {
  if (typeof value !== "object" || value === null) return false;
  const v = value as ProductTicket;
  return (
    typeof v._id === "string" &&
    typeof v.name === "string" &&
    typeof v.description === "string" &&
    typeof v.image_url === "string" &&
    typeof v.brand === "string" &&
    typeof v.product_id === "string" &&
    typeof v.sku === "string" &&
    typeof v.model_type === "string" &&
    typeof v.model_size === "string" &&
    typeof v.price === "number" &&
    typeof v.expiration_date === "string" &&
    typeof v.stock_required === "number"
  );
};

export class Validation {

  /*══════════ 🎮 stringValidation ══════════╗
  ║ 📥 Entrada: word, title, length (default 3) ║
  ║ ⚙️ Proceso: valida string y longitud mínima ║
  ║ 📤 Salida: string validado                  ║
  ║ 🛠️ Errores: no provisto, no string, corto   ║
  ╚═══════════════════════════════════════════╝*/
  static stringValidation(word: unknown, title: string, length: number = 3): string {
    if (!word) throw new Error(`No ${title} provided`);
    if (!isString(word)) throw new Error(`${title} must be a string`);
    if (isShortString(word as string, length)) throw new Error(`${title} must be at least ${length} characters long`);
    return word as string;
  }

  /*══════════ 🎮 password ══════════╗
  ║ 📥 Entrada: password             ║
  ║ ⚙️ Proceso: valida string >= 3   ║
  ║ 📤 Salida: string validado       ║
  ║ 🛠️ Errores: no provisto, corto   ║
  ╚═════════════════════════════════╝*/
  static password(password: unknown): string {
    if (!password) throw new Error(`No password provided`);
    if (!isString(password)) throw new Error('password must be a string');
    if (isShortString(password as string)) throw new Error('password must be at least 3 characters long');
    return password as string;
  }

  /*══════════ 🎮 email ══════════╗
║ 📥 Entrada: email (unknown)   ║
║ ⚙️ Proceso: valida que sea string y >= 3 caracteres ║
║ 📤 Salida: string validado    ║
║ 🛠️ Errores: no provisto, no string, demasiado corto ║
╚══════════════════════════════╝*/
static email(email: unknown): string {
  if (!email) throw new Error(`No email provided`);
  if (!isString(email)) throw new Error('email must be a string');
  if (isShortString(email as string)) throw new Error('email must be at least 3 characters long');
  return email as string;
}

/*══════════ 🎮 refreshToken ══════════╗
║ 📥 Entrada: token (unknown)          ║
║ ⚙️ Proceso: valida que sea string y no vacío ║
║ 📤 Salida: string validado           ║
║ 🛠️ Errores: no provisto, no string, mismatch ║
╚═════════════════════════════════════╝*/
static refreshToken(token: unknown): string {
  if (!token) throw new Error(`No refresh Token provided`);
  if (!isString(token)) throw new Error('token must be a string');
  if (isShortString(token as string)) throw new Error('token miss match');
  return token as string;
}

/*══════════ 🎮 sku ══════════╗
║ 📥 Entrada: sku (unknown)   ║
║ ⚙️ Proceso: valida formato SKU, longitud mínima y máxima ║
║ 📤 Salida: string validado  ║
║ 🛠️ Errores: no provisto, no string, demasiado corto/largo, formato inválido ║
╚════════════════════════════╝*/
static sku(sku: unknown): string {
  if (!sku) throw new Error('No sku Provided');
  if (!isString(sku)) throw new Error('sku must be a string');
  if (isShortString(sku as string)) throw new Error('sku must be at least 3 characters long');
  if (isLongString(sku as string)) throw new Error('sku must be shorter than 30 characters long');
  if (!isSKU(sku as string)) throw new Error('sku miss match');
  return sku as string;
}

/*══════════ 🎮 number ══════════╗
║ 📥 Entrada: digit (unknown), title ║
║ ⚙️ Proceso: valida que sea número > 0 si isZeroValid es false ║
║ 📤 Salida: number validado          ║
║ 🛠️ Errores: no provisto, no número, igual a 0 ║
╚════════════════════════════════════╝*/
static number(digit: unknown, title: string, isZeroValid?: boolean): number {
  if (!digit && !isZeroValid) throw new Error(`No number provided for ${title}`);
  if (!isNumber(digit) && !isZeroValid) throw new Error(`${title} is not a number`);
  if (isZero(digit as number) && !isZeroValid) throw new Error(`${title} must be greater than 0`);
  return digit as number;
}

/*══════════ 🎮 date ══════════╗
║ 📥 Entrada: date (unknown), title ║
║ ⚙️ Proceso: valida que sea fecha válida ║
║ 📤 Salida: string (fecha)          ║
║ 🛠️ Errores: no provisto, no fecha ║
╚═══════════════════════════════════╝*/
static date(date: unknown, title: string): string {
  if (!date) throw new Error('No date provided');
  if (!isDate(date)) throw new Error(`${title} is not a date`);
  return date as string;
}


/*══════════ 🎮 image ══════════╗
║ 📥 Entrada: photo (unknown)   ║
║ ⚙️ Proceso: valida que sea URL de imagen válida ║
║ 📤 Salida: string (URL)       ║
║ 🛠️ Errores: no provisto, no string, demasiado corto, URL inválida ║
╚══════════════════════════════╝*/
static image(photo: unknown): string {
  if (!photo) throw new Error('No image provided');
  if (!isString(photo)) throw new Error('image Url is not a string');
  if (isShortString(photo as string)) throw new Error('image must be at least 3 characters long');
  if (!isImageUrl(photo as string)) throw new Error('ImageUrl does not provide a valid url');
  return photo as string;
}

/*══════════ 🎮 imageArray ══════════╗
║ 📥 Entrada: images (unknown)       ║
║ ⚙️ Proceso: valida array de URLs de imágenes ║
║ 📤 Salida: string[] validado       ║
║ 🛠️ Errores: no provisto, no array, elementos inválidos ║
╚═══════════════════════════════════╝*/
static imageArray(images: unknown): string[] {
  if (!images) throw new Error("No images provided");
  if (!Array.isArray(images)) throw new Error("images must be an array");
  images.forEach((image, index) => {
    if (!isImageUrl(image as string)) throw new Error(`Image at index ${index} is not a valid image URL`);
    if (isShortString(image as string)) throw new Error(`Image at index ${index} must be at least 3 characters long`);
  });
  return images as string[];
}

/*══════════ 🎮 barcode ══════════╗
║ 📥 Entrada: barcode (unknown)   ║
║ ⚙️ Proceso: valida formato EAN-13 ║
║ 📤 Salida: string validado      ║
║ 🛠️ Errores: no provisto, no string, formato inválido ║
╚════════════════════════════════╝*/
static barcode(barcode: unknown): string {
  if (!barcode) throw new Error('No barcode provided');
  if (!isString(barcode)) throw new Error('Barcode is not a string');
  if (!isBarcode(barcode as string)) throw new Error('barcode is not an EAN (13 characters long)');
  return barcode as string;
}

/*══════════ 🎮 isVariantArray ══════════╗
║ 📥 Entrada: variants (unknown)        ║
║ ⚙️ Proceso: valida array de objetos ProductVariant ║
║ 📤 Salida: ProductVariant[] validado  ║
║ 🛠️ Errores: no provisto, no array, elementos inválidos ║
╚══════════════════════════════════════╝*/
static isVariantArray(variants: unknown): ProductVariant[] {
  if (!variants) throw new Error("No variants provided");
  if (!Array.isArray(variants)) throw new Error("variants must be an array");
  {/*─────────────────── 🔎 No son variantes en realidad, se envia una version que no muestra datos sensibles 🔎 ───────────────────*/}
  variants.forEach((variant, index) => {
    if (!isTicket(variant)) throw new Error(`Variant Product at index ${index} is not a variant product`);
  });
  return variants as ProductVariant[];
}


}
