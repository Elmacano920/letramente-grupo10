const express  = require('express');
const router   = express.Router();
const { registrarPartida, getPartidasEstudiante, getResumenEstudiante } = require('../controllers/partidas.controller');
const protect  = require('../middleware/auth.middleware');

router.post('/',                                protect, registrarPartida);
router.get('/:estudianteId',                    protect, getPartidasEstudiante);
router.get('/:estudianteId/resumen',            protect, getResumenEstudiante);

module.exports = router;
