import express from 'express';
import { 
  createProvider, 
  deleteProvider, 
  editProvider, 
  getProviderById, 
  getProviders, 
  getProvidersByContact, 
  getProvidersByName, 
  getProvidersByValoration, 
  getProvidersStats, 
  home 
} from '../controllers/provider.controller';

const router = express.Router();

/*──────────────────────────────
🚐 ProviderRouter
──────────────────────────────
📜 Propósito:
Define las rutas relacionadas con proveedores y las conecta con sus controladores.

📂 Endpoints:
- GET    /                         → home (lista de endpoints)
- GET    /get-providers            → obtener todos los proveedores
- GET    /get-provider-by-id       → obtener proveedor por ID
- GET    /get-provider-by-name     → obtener proveedores por nombre
- GET    /get-provider-by-valoration → obtener proveedores por valoración
- GET    /get-providers-by-contact → obtener proveedores por contacto
- POST   /create-provider          → crear proveedor nuevo
- DELETE /delete-provider          → eliminar proveedor
- PUT    /edit-provider            → editar proveedor existente
──────────────────────────────*/

router.get('/', home);
router.get('/get-providers', getProviders);
router.get('/get-provider-by-id', getProviderById);
router.get('/get-provider-by-name', getProvidersByName);
router.get('/get-provider-by-valoration', getProvidersByValoration);
router.get('/get-providers-by-contact', getProvidersByContact);
router.get('/get-providers-stats', getProvidersStats);

router.post('/create-provider', createProvider);
router.delete('/delete-provider', deleteProvider);
router.put('/edit-provider', editProvider);

export default router;
