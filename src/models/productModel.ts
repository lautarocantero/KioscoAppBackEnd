import { ProductSchema } from "../schemas/productSchema";
import { ProductVariant } from "@typings/productVariant";
import { CreateProductPayload, DeleteProductPayload, EditProductPayload, Product, ProductModelType } from "@typings/product";
import { Validation } from "./validation";

/*──────────────────────────────
📦 ProductModel
──────────────────────────────
📜 Propósito: Gestión completa de productos (creación, consulta, edición, eliminación)
🧩 Dependencias: ProductSchema, Validation, ProductVariant, productTypes
📂 Endpoints: GET, POST, DELETE, PUT
🛡️ Seguridad:
   - Validaciones estrictas en todos los campos
   - Control de duplicados (name único)
   - Manejo seguro de imágenes y variantes
──────────────────────────────*/

/*──────────────────────────────
📚 Tipos usados en Product
──────────────────────────────
- Product: entidad principal de producto
- ProductVariant: variantes del producto
- ProductModelType: instancia del modelo en BD
- CreateProductPayload: payload para crear producto
- DeleteProductPayload: payload para eliminar producto
- EditProductPayload: payload para editar producto
──────────────────────────────*/

/*──────────────────────────────
🛡️ Seguridad
──────────────────────────────
🔒 Validar todos los campos antes de guardar
🗑️ Evitar duplicados (name único)
🖼️ Validar URLs de imágenes y galerías
⚠️ Manejar errores con mensajes claros
──────────────────────────────*/

/*──────────────────────────────
🌀 Flujo
──────────────────────────────
[getProducts] → devuelve hasta 100 productos
[getProductByField] → busca productos por campo validado
[create] → valida campos, controla duplicados, guarda producto
[delete] → elimina producto por _id
[edit] → actualiza datos validados de producto
──────────────────────────────*/


export class ProductModel {

  //──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//

  /*══════════ 🎮 getProducts ══════════╗
  ║ 📥 Entrada: ninguna                  ║
  ║ ⚙️ Proceso: obtiene hasta 100 productos de ProductSchema ║
  ║ 📤 Salida: Product[]                 ║
  ║ 🛠️ Errores: ninguno explícito        ║
  ╚═════════════════════════════════════╝*/

  static async getProducts(): Promise<Product[]> {

    let count = 0;
    const results: Product[] = [];
    
    ProductSchema.find((item: Product) => {
      if (count < 100) {
        results.push(item);
        count++;
        return true;
      }
      return false;
    });

    return results as Product[];
  }

  /*══════════ 🎮 getProductByField ══════════╗
  ║ 📥 Entrada: field, value, type ('string'|'number') ║
  ║ ⚙️ Proceso: valida tipo y busca productos por campo ║
  ║ 📤 Salida: Product[]                               ║
  ║ 🛠️ Errores: tipo no soportado, validaciones fallidas ║
  ╚════════════════════════════════════════════════════╝*/

  static async getProductByField<T extends keyof Product>(
      field: T,
      value: Product[T],
      type: 'string' | 'number',
  ): Promise<Product[]> {

      if (type !== 'string' && type !== 'number') throw new Error(`Unsupported field type for ${String(field)}`);
      
      if (type === 'string') Validation.stringValidation(value, field as string);
  
      if (type === 'number') Validation.number(value, field as string);
  

      const results: Product[] = [];
      ProductSchema.find((item: Product) => {
          if (item?.[field] === value) {
              results.push(item);
              return true;
          }
          return false;
      });

      return results as Product[];
  }

    //──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//
    //──────────────────────────────────────────── 📤 POST 📤 ───────────────────────────────────────────//

  /*══════════ 🎮 create ══════════╗
  ║ 📥 Entrada: CreateProductPayload {name,description,created_at,updated_at,image_url,gallery_urls,brand,variants} ║
  ║ ⚙️ Proceso: valida campos, controla duplicados, genera _id y guarda producto                                    ║
  ║ 📤 Salida: string _id generado                                                                                  ║
  ║ 🛠️ Errores: producto existente, validaciones fallidas                                                           ║
  ╚════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

  static async create (data: CreateProductPayload): Promise <string> {

      const {
        name, description, created_at, updated_at,
        image_url, gallery_urls, brand, variants
      } = data;

      const nameResult: string = Validation.stringValidation(name, 'name');
      const descriptionResult: string = Validation.stringValidation(description, 'description');
      const createdAtResult: string = Validation.date(created_at, 'created_at');
      const updatedAtResult: string = Validation.date(updated_at, 'updated_at');
      // const imageUrlResult: string = Validation.image(image_url);
      const galleryUrlsResult: string[] = Validation.imageArray(gallery_urls);
      const brandResult: string = Validation.stringValidation(brand, 'brand');
      const variantsResult: ProductVariant[] = Validation.isVariantArray(variants);

      const product: Product = ProductSchema.findOne({ name : nameResult});

      if(product) throw new Error('product already exists');

      const _id = crypto.randomUUID();

      ProductSchema.create({
          _id: _id,
          name: nameResult,
          description: descriptionResult,
          created_at: createdAtResult,
          updated_at: updatedAtResult,
          image_url: image_url as string, // se saco la validacion por ahora, agregarl aluego
          gallery_urls: galleryUrlsResult,
          brand: brandResult,
          variants: variantsResult,
      }).save();

      return _id as string;
  }

    //──────────────────────────────────────────── 📤 POST 📤 ───────────────────────────────────────────//
    //──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//

  /*══════════ 🎮 delete ══════════╗
  ║ 📥 Entrada: DeleteProductPayload {_id} ║
  ║ ⚙️ Proceso: valida id y elimina producto ║
  ║ 📤 Salida: void                          ║
  ║ 🛠️ Errores: producto no encontrado       ║
  ╚═════════════════════════════════════════╝*/

    static async delete ( data: DeleteProductPayload ) : Promise<void> {

        const { _id } = data;

        const _idResult: string = Validation.stringValidation(_id, '_id');

        const ProductObject: ProductModelType = ProductSchema.findOne({ _id: _idResult });

        if(!ProductObject) throw new Error('There is not any product with that id');

        ProductObject.remove();
    }

//──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//
//──────────────────────────────────────────── 🛠️ PUT 🛠️ ───────────────────────────────────────────//

  /*══════════ 🎮 edit ══════════╗
  ║ 📥 Entrada: EditProductPayload {_id,name,description,created_at,updated_at,image_url,gallery_urls,brand,variants} ║
  ║ ⚙️ Proceso: valida campos y actualiza producto                                                                    ║
  ║ 📤 Salida: void                                                                                                   ║
  ║ 🛠️ Errores: producto no encontrado, validaciones fallidas                                                         ║
  ╚═════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

    static async edit ( data: EditProductPayload ) : Promise<void> {
      const { 
        _id,name,description,created_at,
        updated_at,image_url,gallery_urls,
        brand,variants 
        } = data;

      const _idResult: string = Validation.stringValidation(_id,'_id');
      const nameResult: string  = Validation.stringValidation(name,'name');
      const descriptionResult: string  = Validation.stringValidation(description,'description');
      const createdAtResult: string  = Validation.date(created_at,'createdAt');
      const updatedAtResult: string  = Validation.date(updated_at,'updatedAt');
      const imageUrlResult: string  = Validation.image(image_url);
      const galleryUrlsResult: string[]  = Validation.imageArray(gallery_urls);
      const brandResult: string  = Validation.stringValidation(brand,'brand');
      const variantsResult: ProductVariant[] = Validation.isVariantArray(variants);

      const ProductObject: ProductModelType = ProductSchema.findOne({ _id: _idResult });

      if(!ProductObject) throw new Error('There is not any product with that id');

        ProductObject.name = nameResult;
        ProductObject.description = descriptionResult;
        ProductObject.created_at = createdAtResult;
        ProductObject.updated_at = updatedAtResult;
        ProductObject.image_url = imageUrlResult;
        ProductObject.gallery_urls = galleryUrlsResult;
        ProductObject.brand = brandResult;
        ProductObject.variants = variantsResult;

        ProductObject.save();
    }

      //──────────────────────────────────────────── 🛠️ PUT 🛠️ ───────────────────────────────────────────//
}









