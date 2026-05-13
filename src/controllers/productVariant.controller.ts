import { Request, Response } from "express";
import { ProductVariantModel } from "../models/productVariantModel";
import { CreateProductVariantRequest, DeleteProductVariantRequest, EditProductVariantRequest, GetProductVariantByBrandRequest, GetProductVariantByIdRequest, GetProductVariantByPresentationRequest, GetProductVariantByPriceRequest, GetProductVariantByProductIdRequest, GetProductVariantBySizeRequest, GetProductVariantByStockRequest, ProductVariant } from "@typings/productVariant";
import { handleControllerError } from "../utils/handleControllerError";

/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🕹️ Controlador de endpoints relacionados con variantes de productos 🕹️                                                    ║
╠═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║ 📤 Métodos soportados                                                                                                     ║
║                                                                                                                           ║
║ Tipo   | Link                          | Función                  | Descripción                        | Params             | Return        | Auth Req | Status       ║
║--------|-------------------------------|--------------------------|------------------------------------|--------------------|---------------|----------|--------------║
║ GET    | /get-variants                 | getProductVariants              | Obtener todas las variantes        | -                  | JSON [Variant]| No       | 200,500      ║
║ GET    | /get-variant-by-id            | getProductVariantById           | Obtener variante por ID            | body: { _id }      | JSON [Variant] [0] | No       | 200,404,500  ║
║ GET    | /get-variants-by-product-id   | getProductVariantByProductId   | Variantes por ID de producto       | body: { productId }| JSON [Variant]| No       | 200,404,500  ║
║ GET    | /get-variants-by-brand        | getProductVariantByBrand       | Variantes por marca                | body: { brand }    | JSON [Variant]| No       | 200,404,500  ║
║ GET    | /get-variants-by-stock        | getProductVariantByStock       | Variantes filtradas por stock      | body: { stock }    | JSON [Variant]| No       | 200,404,500  ║
║ GET    | /get-variants-by-price        | getProductVariantByPrice       | Variantes filtradas por precio     | body: { price }    | JSON [Variant]| No       | 200,404,500  ║
║ GET    | /get-variants-by-size         | getProductVariantBySize        | Variantes filtradas por tamaño     | body: { size }     | JSON [Variant]| No       | 200,404,500  ║
║ GET    | /get-variants-by-presentation | getProductVariantByPresentation| Variantes filtradas por presentación| body: { presentation }| JSON [Variant]| No   | 200,404,500  ║
║ POST   | /create-variant               | createProductVariant            | Crear nueva variante               | body: {...}        | JSON {id,msg} | Sí       | 201,400,500  ║
║ PUT    | /edit-variant                 | editProductVariant              | Editar variante existente          | body: {id,fields}  | JSON {id,msg} | Sí       | 200,400,404,500 ║
║ DELETE | /delete-variant               | deleteProductVariant            | Eliminar variante                  | body: { _id }      | JSON {id,msg} | Sí       | 200,404,500  ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

//──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//

/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 home → Devuelve listado de endpoints disponibles                                                                       ║
║ 📥 Entrada: -                                                                                                             ║
║ 📤 Salida: HTML con endpoints                                                                                              ║
║ 🛠️ Errores: No aplica                                                                                                     ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

export async function home(_req: Request, res: Response): Promise<void> {
    res
    .status(200)
    .send(`
      Estas en product variant<br>
      Endpoints =><br>
      ----Get:      /get-product-variants<br>
      ----Get:      /get-product-variant-by-id<br>
      ----Get:      /get-product-variant-by-product-id<br>
      ----Get:      /get-product-variant-by-brand<br>
      ----Get:      /get-product-variant-by-stock<br>
      ----Get:      /get-product-variant-by-price<br>
      ----Get:      /get-product-variant-by-size<br>
      ----Get:      /get-product-variant-by-presentation<br>
      ----Post:     /create-product-variant<br>
      ----Delete:   /delete-product-variant<br>
      ----Put:      /edit-product-variant<br>
  `);
}

/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 getProductVariants → Obtiene todas las variantes                                                                       ║
║ 📥 Entrada: -                                                                                                             ║
║ 📤 Salida: JSON [ProductVariant]                                                                                          ║
║ 🛠️ Errores: handleControllerError                                                                                          ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

export async function getProductVariants (_req: Request, res: Response ): Promise<void>  {

    try{
        const productVariantsObject: ProductVariant[] = await ProductVariantModel.getAllProductVariants();
        res
            .status(200)
            .json(productVariantsObject);
    } 
    catch(error: unknown) {
        handleControllerError(res, error);
    }
}


/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 getProductVariantById → Busca variante por ID                                                                          ║
║ 📥 Entrada: { _id }                                                                                                       ║
║ 📤 Salida: JSON ProductVariant                                                                                            ║
║ 🛠️ Errores: handleControllerError                                                                                          ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

export async function getProductVariantById (req: GetProductVariantByIdRequest, res: Response): Promise<void> {
    const { product_variant_id } = req.params;

    try {
        {/*─────────────────── 🔎 pese a ser un array de product[], siempre devolvera uno solo. 🔎 ───────────────────*/}
        const productVariantObject: ProductVariant[] = await ProductVariantModel.getProductVariantByField('_id',product_variant_id,'string');
        res
            .status(200)
            .json(productVariantObject);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 getProductVariantByProductId → Variantes por ID de producto                                                            ║
║ 📥 Entrada: { product_id }                                                                                                ║
║ 📤 Salida: JSON [ProductVariant]                                                                                          ║
║ 🛠️ Errores: handleControllerError                                                                                          ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

export async function getProductVariantByProductId (req: GetProductVariantByProductIdRequest, res: Response): Promise<void>  {
    const { product_id } = req.params;

    try {
        const productVariantsObject: ProductVariant[] = await ProductVariantModel.getProductVariantByField('product_id',product_id,'string');

        res
            .status(200)
            .json(productVariantsObject);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 getProductVariantByBrand → Variantes por marca                                                                         ║
║ 📥 Entrada: { brand }                                                                                                     ║
║ 📤 Salida: JSON [ProductVariant]                                                                                          ║
║ 🛠️ Errores: handleControllerError                                                                                          ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

export async function getProductVariantByBrand(req: GetProductVariantByBrandRequest, res: Response): Promise <void> {
    const { brand } = req.body;

    try{
        const productVariantsObject: ProductVariant[] = await ProductVariantModel.getProductVariantByField('brand',brand,'string');
        res
            .status(200)
            .json(productVariantsObject);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 getProductVariantByStock → Variantes filtradas por stock                                                               ║
║ 📥 Entrada: { stock }                                                                                                     ║
║ 📤 Salida: JSON [ProductVariant]                                                                                          ║
║ 🛠️ Errores: handleControllerError                                                                                          ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

export async function getProductVariantByStock(req: GetProductVariantByStockRequest, res: Response): Promise <void> {
    const { stock } = req.body;

    try{
        const productVariantsObject: ProductVariant[]  = await ProductVariantModel.getProductVariantByField('stock',stock,'number');
        res
            .status(200)
            .json(productVariantsObject);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 getProductVariantByPrice → Variantes filtradas por precio                                                              ║
║ 📥 Entrada: { price }                                                                                                     ║
║ 📤 Salida: JSON [ProductVariant]                                                                                          ║
║ 🛠️ Errores: handleControllerError                                                                                          ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

export async function getProductVariantByPrice(req: GetProductVariantByPriceRequest, res: Response): Promise <void> {
    const { price } = req.body;

    try{
        const productVariantsObject: ProductVariant[] = await ProductVariantModel.getProductVariantByField('price',price,'number');
        res
            .status(200)
            .json(productVariantsObject);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 getProductVariantBySize → Variantes filtradas por tamaño                                                               ║
║ 📥 Entrada: { model_size }                                                                                                ║
║ 📤 Salida: JSON [ProductVariant]                                                                                          ║
║ 🛠️ Errores: handleControllerError                                                                                          ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

export async function getProductVariantBySize(req: GetProductVariantBySizeRequest, res: Response): Promise <void> {
    const { model_size } = req.body;

    try{
        const productVariantsObject: ProductVariant[] = await ProductVariantModel.getProductVariantByField('model_size',model_size,'string');
        res
            .status(200)
            .json(productVariantsObject);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 getProductVariantByPresentation → Variantes filtradas por presentación                                                 ║
║ 📥 Entrada: { presentation }                                                                                              ║
║ 📤 Salida: JSON [ProductVariant]                                                                                          ║
║ 🛠️ Errores: handleControllerError                                                                                          ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

export async function getProductVariantByPresentation(req: GetProductVariantByPresentationRequest, res: Response): Promise <void> {
    const { model_type } = req.body;

    try{
        const productVariantObject: ProductVariant[] = await ProductVariantModel.getProductVariantByField('model_type',model_type,'string');
        res
            .status(200)
            .json(productVariantObject);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

//──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//
//──────────────────────────────────────────── 📤 POST 📤 ───────────────────────────────────────────//

/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 createProductVariant → Crear nueva variante                                                                            ║
║ 📥 Entrada: { ...campos }                                                                                                 ║
║ 📤 Salida: JSON { id, message }                                                                                           ║
║ 🛠️ Errores: handleControllerError                                                                                          ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

export async function createProductVariant(req: CreateProductVariantRequest, res: Response): Promise<void> {
    const { 
        name, description, image_url,
        gallery_urls, brand, product_id, sku, model_type, model_size, min_stock,
        stock, price, expiration_date 
    } = req.body;

    const finalImageUrl = req.file
        ? `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`
        : image_url;

    // ✅ FormData manda todo como string, hay que parsear el array
    const parsedGalleryUrls: string[] = typeof gallery_urls === "string"
        ? JSON.parse(gallery_urls)
        : gallery_urls ?? [];

    const parsedMinStock = Number(min_stock);
    const parsedStock    = Number(stock);
    const parsedPrice    = Number(price);

    try {
        const _id = await ProductVariantModel.createProductVariant({
            name, description, image_url: finalImageUrl,
            gallery_urls: parsedGalleryUrls,
            brand, product_id, sku, model_type, model_size, min_stock: parsedMinStock, 
            stock: parsedStock, price: parsedPrice, expiration_date
        });

        res.status(200).json({
            _id,
            message: "Product variant created successfully",
        });
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

//──────────────────────────────────────────── 📤 POST 📤 ───────────────────────────────────────────//
//──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//

/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 deleteProductVariant → Eliminar variante                                                                               ║
║ 📥 Entrada: { _id }                                                                                                       ║
║ 📤 Salida: JSON { id, message }                                                                                           ║
║ 🛠️ Errores: handleControllerError                                                                                          ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

export async function deleteProductVariant(req: DeleteProductVariantRequest, res: Response): Promise<void> {
    const { _id } = req.body;

    try{
        await ProductVariantModel.deleteProductVariant({ _id });
        res
            .status(200)
            .json({ message: 'Product variant Successfully deleted'});
    } catch(error: unknown) {
        handleControllerError(res, error);
    }

}

//──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//
//──────────────────────────────────────────── 🛠️ PUT 🛠️ ───────────────────────────────────────────//

/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 editProductVariant → Editar variante existente                                                                         ║
║ 📥 Entrada: { id, fields... }                                                                                             ║
║ 📤 Salida: JSON { id, message }                                                                                           ║
║ 🛠️ Errores: handleControllerError                                                                                          ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

export async function editProductVariant(req: EditProductVariantRequest, res: Response): Promise<void>  {
    const { 
        _id ,name, description, created_at, updated_at, image_url,
        gallery_urls, brand, product_id, sku, model_type, model_size,
        min_stock, stock, price, expiration_date
     } = req.body;

    try{
        await ProductVariantModel.editProductVariant({ 
            _id, name, description, created_at, updated_at, image_url,
            gallery_urls, brand, product_id, sku, model_type, model_size,
            min_stock, stock, price, expiration_date 
        });
        res
            .status(200)
            .json({
                _id,
                message: "Product variant edited successfully",
            });
    } catch(error: unknown) {
        handleControllerError(res, error);
    }
}

//──────────────────────────────────────────── 🛠️ PUT 🛠️ ───────────────────────────────────────────//