import express from 'express';
import {
    home,
    getPresentations,
    getPresentationById,
    getPresentationByProductId,
    getPresentationByStock,
    getPresentationByPrice,
    getPresentationByStatus,
    getPresentationByModelSize,
    createPresentation,
    editPresentation,
    deletePresentation,
    searchPresentationsByProductId,
    getPresentationAnalytics,
} from '../controllers/presentation.controller';
import multer from 'multer';

/*──────────────────────────────
🎭 PresentationRouter
──────────────────────────────
📜 Propósito:
Rutas de presentationes de producto. Sin multer — imagen removida del modelo.

📂 Endpoints:
── GET ────────────────────────────────────────────────────────────────
- GET    /                                           → home
- GET    /get-product-presentations                       → todas
- GET    /get-presentation-by-id/:id              → por ID
- GET    /get-presentation-by-product-id/:pid     → por producto ← usado en el listado de presentaciones
- GET    /get-presentation-by-stock               → body: { stock }
- GET    /get-presentation-by-price               → body: { price }
- GET    /get-presentation-by-status              → body: { status }
- GET    /get-presentation-by-net-content         → body: { model_size }
- GET    /get-presentation-by-product-id/:product_id/search        → body: { por ID }

── POST / PUT / DELETE ────────────────────────────────────────────────
- POST   /create-presentation                     → body: { ...campos }
- PUT    /edit-presentation                       → body: { _id, ...campos }
- DELETE /delete-presentation                     → body: { _id }

🗑️ Endpoints eliminados vs versión anterior:
- /get-presentation-by-brand        (brand removido del modelo)
- /get-presentation-by-size         (model_size removido → usar model_size)
- /get-presentation-by-presentation (model_type removido → usar status/model_size)
──────────────────────────────*/

const router = express.Router();
const upload = multer();

// ── GET ───────────────────────────────────────────────────────────────────────
router.get('/',                                    home);
router.get('/get-product-presentations',                getPresentations);
router.get('/get-presentation-by-id/:product_presentation_id', getPresentationById);
router.get('/get-presentation-by-product-id/:product_id', getPresentationByProductId);
router.get('/get-presentation-by-stock',        getPresentationByStock);
router.get('/get-presentation-by-price',        getPresentationByPrice);
router.get('/get-presentation-by-status',       getPresentationByStatus);
router.get('/get-presentation-by-model-size',   getPresentationByModelSize);
router.get('/get-presentation-by-product-id/:product_id/search', searchPresentationsByProductId);
router.get('/get-presentation-analytics/:presentation_id',getPresentationAnalytics);

// ── POST / PUT / DELETE ───────────────────────────────────────────────────────
router.post('/create-presentation', upload.single('image'), createPresentation);
router.put('/edit-presentation/:presentation_id', editPresentation);
router.delete('/delete-presentation', deletePresentation);

export default router;