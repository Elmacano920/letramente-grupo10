/**
 * LectoPlay — Rutas de Módulos de Aprendizaje
 * Grupo 10
 */

const express = require('express');
const router = express.Router();
const { getAllModules, getModuleBySlug } = require('../controllers/modules.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.use(authMiddleware);

// GET /api/modules — Listar todos los módulos
router.get('/', getAllModules);

// GET /api/modules/:slug — Obtener módulo con actividades
router.get('/:slug', getModuleBySlug);

module.exports = router;
