
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

class Validation {
    static username (username : unknown): void {
        if(!username) throw new Error(`No user provided`);
        if(!isString(username)) throw new Error(`username must be a string ${username}`);
        if(isShortString(username as string) ) throw new Error('username must be at least 3 characters long');
    }

    static password (password : unknown): void {
        if(!password) throw new Error(`No password provided`);
        if(!isString(password)) throw new Error('password must be a string');
        if(isShortString(password as string) ) throw new Error('password must be at least 3 characters long');
    }

    static email (email : unknown): void {
        if(!email) throw new Error(`No email provided`);
        if(!isString(email)) throw new Error('email must be a string');
        if(isShortString(email as string) ) throw new Error('email must be at least 3 characters long');
    }

    static refreshToken (token: unknown): void {
        if(!token) throw new Error(`No refresh Token provided`);
        if(!isString(token)) throw new Error('token must be a string');
        if(isShortString(token as string) ) throw new Error('token miss match');
    }

    static stringValidation (string: unknown, title: string, lenght: number = 3): void {
        if(!string) throw new Error(`No ${title} provided`);
        if(!isString(string)) throw new Error(`${title} must be a string`);
        if(isShortString(string as string, lenght) ) throw new Error(`${title} must be at least ${lenght} characters long`);
    }

    static sku (sku: unknown): void {
        if(!sku) throw new Error('No sku Provided');
        if(!isString(sku)) throw new Error('sku must be a string');
        if(isShortString(sku as string) ) throw new Error('sku must be at least 3 characters long');
        if(isLongString(sku as string) ) throw new Error('sku must be shorter than 30 characters long');
        if(!isSKU(sku as string)) throw new Error('sku miss match');
    }

    static number (number: unknown, title: string ): void {
        if(!number) throw new Error('No number provided');
        if(!isNumber(number)) throw new Error(`${title} is not a number`);
        if(isZero(number as number)) throw new Error(`${title} must be grather than 0`);
    }

    static date (date: unknown, title: string ): void {
        if(!date) throw new Error('No date provided');
        if(!isDate(date)) throw new Error(`${title} is not a date`);
    }

    static image (image: unknown): void {
        if(!image) throw new Error('No image provided');
        if(!isString(image)) throw new Error('image Url is not a string');
        if(isShortString(image as string) ) throw new Error('image must be at least 3 characters long');
        if(!isImageUrl(image as string)) throw new Error('ImageUrl does not provide a valid url');
    }
    
    static imageArray(images: unknown): void {
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
    }

    static barcode (barcode: unknown): void {
        if(!barcode) throw new Error ('No barcode provided');
        if(!isString(barcode)) throw new Error ('Barcode is not a string');
        if(!isBarcode(barcode as string) ) throw new Error('barcode is not an EAN (13 characters long)');
    }

}

export default Validation;

