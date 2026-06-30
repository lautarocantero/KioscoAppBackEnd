import { Request, Response } from "express";
import { ProductModel } from "../models/productModel";
import { CreateProductRequest, DeleteProductRequest, EditProductRequest, GetProductByBrandRequest, GetProductByIdRequest, GetProductByNameRequest, Product } from "@typings/product";
import { handleControllerError } from "../utils/handleControllerError";

/*═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🕹️ Controlador de endpoints relacionados con productos 🕹️                                                                 ║
╠═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║ 📤 Métodos soportados                                                                                                     ║
║                                                                                                                           ║
║ Tipo   | Link                  | Función             | Descripción                  | Params                  | Return        | Auth Req | Status       ║
║--------|-----------------------|---------------------|------------------------------|-------------------------|---------------|----------|--------------║
║ GET    | /get-products         | getProducts         | Obtener todos los productos  | -                       | JSON [Product]| No       | 200,500      ║
║ GET    | /get-product-by-id    | getProductById      | Obtener producto por ID      | body: { _id }           | JSON [Product] [0]  | No       | 200,404,500  ║
║ GET    | /get-product-by-name  | getProductByName    | Obtener productos por nombre | body: { name }          | JSON [Product]| No       | 200,404,500  ║
║ GET    | /get-product-by-brand | getProductByBrand   | Obtener productos por marca  | body: { brand }         | JSON [Product]| No       | 200,404,500  ║
║ POST   | /create-product       | createProduct       | Crear producto nuevo         | body: {...campos...}    | JSON {id,msg} | Sí       | 201,400,500  ║
║ PUT    | /edit-product         | editProduct         | Editar producto existente    | body: {id,fields...}    | JSON {id,msg} | Sí       | 200,400,404,500 ║
║ DELETE | /delete-product       | deleteProduct       | Eliminar producto            | body: { _id }           | JSON {id,msg} | Sí       | 200,404,500  ║
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
          ----Get:  /get-product-by-id<br>
          ----Get:  /get-product-by-name<br>
          ----Get:  /get-product-by-brand<br>
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

export async function getProducts( _req: Request,res: Response): Promise <void> {

  try {
    const productsObject: Product[] = await ProductModel.getProducts();
    res
        .status(200)
        .json(productsObject);
  } catch (error: unknown) {
        handleControllerError(res, error);
  }
}

/*══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 getProductById → Busca producto por ID                                                                                 ║
║ 📥 Entrada: { _id }                                                                                                       ║
║ 📤 Salida: JSON Product                                                                                                   ║
║ 🛠️ Errores: handleControllerError                                                                                          ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

export async function getProductById(req: GetProductByIdRequest, res: Response): Promise<void> {
    const _id = req.params._id ?? req.body._id;   // ← params primero, body como fallback

    try {
        const productObject: Product[] = await ProductModel.getProductByField('_id', _id, 'string');

        if (!productObject.length) {
            res.status(404).json({ message: 'Producto no encontrado' });
            return;
        }

        res.status(200).json(productObject[0]);   // ← devuelve objeto, no array
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

/*══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 getProductByName → Busca productos por nombre                                                                          ║
║ 📥 Entrada: { name }                                                                                                      ║
║ 📤 Salida: JSON [Product]                                                                                                 ║
║ 🛠️ Errores: handleControllerError                                                                                          ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

export async function getProductByName (req: GetProductByNameRequest, res: Response): Promise<void> {
    const name = (req.query.name as string) ?? req.body.name;

    try {
        const productsObject: Product[] = await ProductModel.searchByField('name', name);
        res.status(200).json(productsObject);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}


/*══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 getProductByBrand → Busca productos por marca                                                                          ║
║ 📥 Entrada: { brand }                                                                                                     ║
║ 📤 Salida: JSON [Product]                                                                                                 ║
║ 🛠️ Errores: handleControllerError                                                                                          ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

export async function getProductByBrand (req: GetProductByBrandRequest, res: Response): Promise<void> {
    const { brand } = req.body;

    try {
        const productsObject: Product[] = await ProductModel.getProductByField('brand',brand,'string');
        res
            .status(200)
            .json(productsObject);
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}

//──────────────────────────────────────────── 📤 GET 📤 ───────────────────────────────────────────//
//──────────────────────────────────────────── 📤 POST 📤 ───────────────────────────────────────────//

/*══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 createProduct → Crea producto nuevo                                                                                    ║
║ 📥 Entrada: { name, description, created_at, updated_at, image_url, gallery_urls, brand, presentations }                       ║
║ 📤 Salida: JSON { _id, message }                                                                                          ║
║ 🛠️ Errores: handleControllerError                                                                                          ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

export async function createProduct(req: CreateProductRequest, res: Response): Promise <void> {
    const {
        name, description, created_at, updated_at,
        image_url, gallery_urls, brand, presentations,
    } = req.body;

    try{
        const _id: string = await ProductModel.create({
            name, description, created_at, updated_at, image_url, gallery_urls, 
            brand, presentations
        });
        res
            .status(200)
            .json({
                _id,
                message: 'Product created successfully',
            });
    } catch(error: unknown) {
        handleControllerError(res, error);
    }
}
//──────────────────────────────────────────── 📤 POST 📤 ───────────────────────────────────────────//
//──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//

/*══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 deleteProduct → Elimina producto                                                                                       ║
║ 📥 Entrada: { _id }                                                                                                       ║
║ 📤 Salida: JSON { _id, message }                                                                                          ║
║ 🛠️ Errores: handleControllerError                                                                                          ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

export async function deleteProduct (req: DeleteProductRequest, res: Response): Promise <void> {
    const { _id } = req.body;

    try{
        await ProductModel.delete({ _id });
        res
            .status(200)
            .json({
                _id,
                message: 'Product has been deleted successfully',
            });
    } catch(error: unknown) {
        handleControllerError(res, error);
    }
}

//──────────────────────────────────────────── 🗑️ DELETE 🗑️ ───────────────────────────────────────────//
//──────────────────────────────────────────── 🛠️ EDIT 🛠️ ───────────────────────────────────────────//

/*══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║ 🎮 editProduct → Edita producto existente                                                                                 ║
║ 📥 Entrada: { _id, name, description, created_at, updated_at, image_url, gallery_urls, brand, presentations }                  ║
║ 📤 Salida: JSON { _id, message }                                                                                          ║
║ 🛠️ Errores: handleControllerError                                                                                          ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝*/

export async function editProduct (req: EditProductRequest, res: Response) : Promise<void> {
    const { 
        _id,name,description,created_at,
        updated_at,image_url,gallery_urls,
        brand,presentations 
    } = req.body;
                        
    try {
        await ProductModel.edit({_id,name,description,created_at,
            updated_at,image_url,gallery_urls, brand,presentations});
        res
            .status(200)
            .json({
                _id,
                message: 'Product has been edited successfully',
            });
    } catch (error: unknown) {
        handleControllerError(res, error);
    }
}
//──────────────────────────────────────────── 🛠️ EDIT 🛠️ ───────────────────────────────────────────//