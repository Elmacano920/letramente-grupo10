const express = require('express');
const router  = express.Router();
const { registrarError, getDashboard, getMisErrores } = require('../controllers/telemetria.controller');
const protect = require('../middleware/auth.middleware');

// POST /api/telemetria/error                      → registrar un error
router.post('/error',              protect, registrarError);
// GET  /api/telemetria/mis-errores                → errores propios (niño)
router.get('/mis-errores',         protect, getMisErrores);
// GET  /api/telemetria/dashboard/:estudianteId    → reporte completo (padres/docentes)
router.get('/dashboard/:estudianteId', protect, getDashboard);

module.exports = router;
