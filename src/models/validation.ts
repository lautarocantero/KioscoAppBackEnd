import { ProductVariant } from "../typings/product-variant/productVariantTypes";

const isString = (string: unknown): boolean => {
    if(typeof string !== 'string') return false;
    return true;
};

const isNumber = (number: unknown): boolean => {
    if(typeof number !== 'number') return false;
    return true;
};

const isDate = (value: unknown): boolean => {
  if (value instanceof Date) {
    return !isNaN(value.getTime());
  }

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  return false;
};

const isImageUrl = (value: string): boolean => {

  try {
    const url = new URL(value);

    // Protocol válido
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return false;
    }

    // iamges extensions
    const imagePattern = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
    return imagePattern.test(url.pathname);
  } catch {
    return false;
  }
};

const isShortString = (string: string, lenght: number = 3): boolean => {
    if(string.length < lenght) return true;
    return false;
};

const isLongString = (string: string): boolean => {
    if(string.length > 30) return true;
    return false;
};

const isSKU = (value: string): boolean => {
  const skuPattern = /^[A-Z0-9_-]+$/i;
  if (!skuPattern.test(value)) return false;
  return true;
};

const isZero = (value: number): boolean => {
    if(value === 0) return true;
    return false;
};

const isBarcode = (value: string): boolean => {
  // Debe ser solo dígitos y tener exactamente 13 caracteres
  const barcodePattern = /^\d{13}$/;
  return barcodePattern.test(value);
};

const isVariant = (value: ProductVariant): boolean => {
  if (typeof value !== "object" || value === null) return false;

  const v = value as Partial<ProductVariant>;
  return (
    typeof v._id === "string" &&
    typeof v.name === "string" &&
    typeof v.description === "string" &&
    typeof v.created_at === "string" &&
    typeof v.updated_at === "string" &&
    typeof v.image_url === "string" &&
    typeof v.gallery_urls === "string" &&
    typeof v.brand === "string" &&
    typeof v.product_id === "string" &&
    typeof v.sku === "string" &&
    typeof v.model_type === "string" &&
    typeof v.model_size === "string" &&
    typeof v.min_stock === "number" &&
    typeof v.stock === "number" &&
    typeof v.price === "number" &&
    typeof v.expiration_date === "string"
  ); 
};

export class Validation {

  static stringValidation (word: unknown, title: string, lenght: number = 3): string {
    if(!word) throw new Error(`No ${title} provided`);
    if(!isString(word)) throw new Error(`${title} must be a string`);
    if(isShortString(word as string, lenght) ) throw new Error(`${title} must be at least ${lenght} characters long`);
    return word as string;
  }

    static password (password : unknown): string {
      if(!password) throw new Error(`No password provided`);
      if(!isString(password)) throw new Error('password must be a string');
      if(isShortString(password as string) ) throw new Error('password must be at least 3 characters long');
      return password as string;
    }

    static email (email : unknown): string {
      if(!email) throw new Error(`No email provided`);
      if(!isString(email)) throw new Error('email must be a string');
      if(isShortString(email as string) ) throw new Error('email must be at least 3 characters long');
      return email as string;
    }

    static refreshToken (token: unknown): string {
      if(!token) throw new Error(`No refresh Token provided`);
      if(!isString(token)) throw new Error('token must be a string');
      if(isShortString(token as string) ) throw new Error('token miss match');
      return token as string;
    }

    static sku (sku: unknown): string {
      if(!sku) throw new Error('No sku Provided');
      if(!isString(sku)) throw new Error('sku must be a string');
      if(isShortString(sku as string) ) throw new Error('sku must be at least 3 characters long');
      if(isLongString(sku as string) ) throw new Error('sku must be shorter than 30 characters long');
      if(!isSKU(sku as string)) throw new Error('sku miss match');
      return sku as string;
    }

    static number (digit: unknown, title: string ): number {
      if(!digit) throw new Error('No number provided');
      if(!isNumber(digit)) throw new Error(`${title} is not a number`);
      if(isZero(digit as number)) throw new Error(`${title} must be grather than 0`);
      return digit as number;
    }

    static date (date: unknown, title: string ): string {
      if(!date) throw new Error('No date provided');
      if(!isDate(date)) throw new Error(`${title} is not a date`);
      return date as string;
    }

    static image (photo: unknown): string {
      if(!photo) throw new Error('No image provided');
      if(!isString(photo)) throw new Error('image Url is not a string');
      if(isShortString(photo as string) ) throw new Error('image must be at least 3 characters long');
      if(!isImageUrl(photo as string)) throw new Error('ImageUrl does not provide a valid url');
      return photo as string;
    }
    
    static imageArray(images: unknown): string[] {
      if (!images) throw new Error("No images provided");
      if (!Array.isArray(images)) throw new Error("images must be an array");

      images.forEach((image, index) => {
        if (!isImageUrl(image)) {
          throw new Error(`Image at index ${index} is not a string`);
        }
        if (isShortString(image as string)) {
          throw new Error(`Image at index ${index} must be at least 3 characters long`);
        }
        if (!isImageUrl(image as string)) {
          throw new Error(`Image at index ${index} is not a valid image URL`);
        }
      });
      return images as string[];
    }

    static barcode (barcode: unknown): string {
      if(!barcode) throw new Error ('No barcode provided');
      if(!isString(barcode)) throw new Error ('Barcode is not a string');
      if(!isBarcode(barcode as string) ) throw new Error('barcode is not an EAN (13 characters long)');
      return barcode as string;
    }

    static isVariantArray(variants: unknown): ProductVariant[] {
      if (!variants) throw new Error("No variants provided");
      if (!Array.isArray(variants)) throw new Error("variants must be an array");

      variants.forEach((variant, index) => {
        if (!isVariant(variant)) {
          throw new Error(`Variant Product at index ${index} is not a variant product`);
        }
      });
      return variants as ProductVariant[];
    } 
}
