const express  = require('express');
const router   = express.Router();
const { getRetos, getRetosPorCategoria, getRetoPorId, crearReto } = require('../controllers/retos.controller');
const protect  = require('../middleware/auth.middleware');

router.get('/',                    protect, getRetos);
router.get('/categoria/:cat',      protect, getRetosPorCategoria);
router.get('/:id',                 protect, getRetoPorId);
router.post('/',                   protect, crearReto);

module.exports = router;
