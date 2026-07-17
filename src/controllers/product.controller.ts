import { Request, Response } from "express";
import { ProductModel } from "../models/productModel";
import { CreateProductRequest, DeleteProductRequest, EditProductRequest, GetProductByBrandRequest, GetProductByIdRequest, GetProductByNameRequest, Product } from "@typings/product";
import { handleControllerError } from "../utils/handleControllerError";
import { CatalogService } from "../services/catalogService";

/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🕹️ Controlador de endpoints relacionados con productos 🕹️                                                                 ║
╠═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║ 📤 Métodos soportados                                                                                                     ║
║                                                                                                                           ║
║ Tipo   | Link                              | Función                        | Descripción                          | Params                | Return         | Auth Req | Status          ║
║--------|-----------------------------------|---------------------------------|---------------------------------------|------------------------|----------------|----------|-----------------║
║ GET    | /get-products                     | getProducts                     | Obtener todos los productos           | -                      | JSON [Product] | No       | 200,500         ║
║ GET    | /get-product-by-id/:_id           | getProductById                  | Obtener producto por ID               | params: { _id }        | JSON Product   | No       | 200,404,500     ║
║ GET    | /get-product-by-name              | getProductByName                | Obtener productos por nombre          | query: { name }        | JSON [Product] | No       | 200,404,500     ║
║ GET    | /get-product-by-brand             | getProductByBrand               | Obtener productos por marca           | query: { brand }       | JSON [Product] | No       | 200,404,500     ║
║ GET    | /get-products-with-presentations  | getProductsWithPresentations    | Productos + presentations resumidas   | -                      | JSON [Product] | No       | 200,500         ║
║ GET    | /search-products-with-presentations| searchProductsWithPresentations| Búsqueda cruzada producto/presentation| query: { term }        | JSON [Product] | No       | 200,500         ║
║ GET    | /get-product-stats                | getProductStats                 | Totales + stock bajo                  | -                      | JSON {stats}   | No       | 200,500         ║
║ POST   | /create-product                   | createProduct                   | Crear producto nuevo                  | body: {...campos...}   | JSON {id,msg}  | Sí       | 200,400,500     ║
║ PUT    | /edit-product                     | editProduct                     | Editar producto existente             | body: {id,fields...}   | JSON {id,msg}  | Sí       | 200,400,404,500 ║
║ DELETE | /delete-product                   | deleteProduct                   | Eliminar producto                     | body: { _id }          | JSON {id,msg}  | Sí       | 200,404,500     ║
╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

//──────────────────────────────────────────── 📥 GET 📥 ───────────────────────────────────────────//

/*══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 home → Devuelve listado de endpoints disponibles                                                                       ║
║ 📥 Entrada: -                                                                                                             ║
║ 📤 Salida: HTML con endpoints                                                                                              ║
║ 🛠️ Errores: No aplica                                                                                          ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

export async function home(_req: Request, res: Response): Promise<void> {
    res
        .status(200)
        .send(`
          Estas en product<br>
          Endpoints =><br>
          ----Get:  /get-products<br>
          ----Get:  /get-product-by-id/:_id<br>
          ----Get:  /get-product-by-name<br>
          ----Get:  /get-product-by-brand<br>
          ----Get:  /get-products-with-presentations<br>
          ----Get:  /search-products-with-presentations<br>
          ----Get:  /get-product-stats<br>
          ----Post: /create-product<br>
          ----Delete: /delete-product<br>
          ----Put: /edit-product<br>
        `);
}

/*══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 getProducts → Obtiene todos los productos                                                                              ║
║ 📥 Entrada: -                                                                                                             ║
║ 📤 Salida: JSON [Product]                                                                                                 ║
║ 🛠️ Errores: handleControllerError                                                                                          ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

export async function getProducts(_req: Request, res: Response): Promise<void> {
  try {
    const productsObject: Product[] = await ProductModel.getProducts();
    res.status(200).json(productsObject);
  } catch (error: unknown) {
    handleControllerError(res, error);
  }
}

/*══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 getProductById → Busca producto por ID                                                                                 ║
║ 📥 Entrada: params: { _id }                                                                                               ║
║ 📤 Salida: JSON Product                                                                                                   ║
║ 🛠️ Errores: handleControllerError                                                                                          ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

export async function getProductById(req: GetProductByIdRequest, res: Response): Promise<void> {
    const { _id } = req.params;

    if (!_id) {
        res.status(400).json({ message: 'ID inválido o faltante' });
        return;
    }

    try {
        const [product] = await ProductModel.getProductByField('_id', _id, 'string');

        if (!product) {
            res.status(404).json({ message: 'Producto no encontrado' });
            return;
        }

        res.status(200).json(product);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

/*══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 getProductByName → Busca productos por nombre                                                                          ║
║ 📥 Entrada: query: { name }                                                                                               ║
║ 📤 Salida: JSON [Product]                                                                                                 ║
║ 🛠️ Errores: handleControllerError                                                                                          ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

export async function getProductByName(req: GetProductByNameRequest, res: Response): Promise<void> {
    const name = req.query.name as string;

    try {
        const productsObject: Product[] = await ProductModel.searchByField('name', name);
        res.status(200).json(productsObject);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

/*══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 getProductByBrand → Busca productos por marca                                                                          ║
║ 📥 Entrada: query: { brand }                                                                                              ║
║ 📤 Salida: JSON [Product]                                                                                                 ║
║ 🛠️ Errores: handleControllerError                                                                                          ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

export async function getProductByBrand(req: GetProductByBrandRequest, res: Response): Promise<void> {
    const brand = req.query.brand as string;

    try {
        const productsObject: Product[] = await ProductModel.getProductByField('brand', brand, 'string');
        res.status(200).json(productsObject);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

//──────────────────────────────────────────── 🗂️ CATALOG (products + presentations) ───────────────────────────//
// Estos 3 endpoints combinan dos dominios → delegan en CatalogService, no en ProductModel.

/*══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 getProductsWithPresentations → Productos + sus presentations resumidas                                                 ║
║ 📥 Entrada: -                                                                                                             ║
║ 📤 Salida: JSON [Product] (presentations resumidas)                                                                       ║
║ 🛠️ Errores: handleControllerError                                                                                          ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

export async function getProductsWithPresentations(_req: Request, res: Response): Promise<void> {
    try {
        const productsObject: Product[] = await CatalogService.getProductsWithPresentations();
        res.status(200).json(productsObject);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

/*══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 searchProductsWithPresentations → Busca productos por nombre propio o nombre de presentación ║
║ 📥 Entrada: query: { term }                                                                       ║
║ 📤 Salida: JSON [Product] (con presentations resumidas)                                          ║
║ 🛠️ Errores: handleControllerError                                                                 ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

export async function searchProductsWithPresentations(req: Request, res: Response): Promise<void> {
    const term = req.query.term as string;

    try {
        const productsObject: Product[] = await CatalogService.searchProductsWithPresentations(term);
        res.status(200).json(productsObject);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

/*══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 getProductStats → Devuelve total de productos y cuántos tienen stock bajo (stock < min_stock) ║
║ 📥 Entrada: -                                                                                     ║
║ 📤 Salida: JSON { totalProducts, lowStockProducts }                                               ║
║ 🛠️ Errores: handleControllerError                                                                  ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

export async function getProductStats(_req: Request, res: Response): Promise<void> {
    try {
        const stats = await CatalogService.getStats();
        res.status(200).json(stats);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

//──────────────────────────────────────────── 📤 POST 📤 ───────────────────────────────────────────//

/*══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 createProduct → Crea producto nuevo                                                                                    ║
║ 📥 Entrada: { name, description, created_at, updated_at, image_url, brand }                       ║
║ 📤 Salida: JSON { _id, message }                                                                                          ║
║ 🛠️ Errores: handleControllerError                                                                                          ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

export async function createProduct(req: CreateProductRequest, res: Response): Promise<void> {
    const {
        name, description, created_at, updated_at,
        image_url, brand,
    } = req.body;

    try {
        const _id: string = await ProductModel.create({
            name, description, created_at, updated_at, image_url,
            brand
        });
        res.status(200).json({
            _id,
            message: 'Product created successfully',
        });
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

//──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//

/*══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 deleteProduct → Elimina producto                                                                                       ║
║ 📥 Entrada: { _id }                                                                                                       ║
║ 📤 Salida: JSON { _id, message }                                                                                          ║
║ 🛠️ Errores: handleControllerError                                                                                          ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

export async function deleteProduct(req: DeleteProductRequest, res: Response): Promise<void> {
    const { _id } = req.body;

    try {
        await ProductModel.delete({ _id });
        res.status(200).json({
            _id,
            message: 'Product has been deleted successfully',
        });
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

//──────────────────────────────────────────── 🛠️ EDIT 🛠️ ───────────────────────────────────────────//

/*══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 editProduct → Edita producto existente                                                                                 ║
║ 📥 Entrada: { _id, name, description, created_at, updated_at, image_url, brand }                  ║
║ 📤 Salida: JSON { _id, message }                                                                                          ║
║ 🛠️ Errores: handleControllerError                                                                                          ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

export async function editProduct(req: EditProductRequest, res: Response): Promise<void> {
    const {
        _id, name, description, created_at,
        updated_at, image_url,
        brand
    } = req.body;

    try {
        await ProductModel.edit({
            _id, name, description, created_at,
            updated_at, image_url, brand
        });
        res.status(200).json({
            _id,
            message: 'Product has been edited successfully',
        });
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}