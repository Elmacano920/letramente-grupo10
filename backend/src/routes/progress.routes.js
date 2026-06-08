/**
 * LectoPlay — Rutas de Progreso y Gamificación
 * Grupo 10
 */

const express = require('express');
const router = express.Router();
const { saveProgress, getMyProgress, getUserProgress } = require('../controllers/progress.controller');
const { authMiddleware, requireAdult } = require('../middleware/auth.middleware');

router.use(authMiddleware);

// POST /api/progress — Guardar resultado de actividad
router.post('/', saveProgress);

// GET /api/progress/me — Ver mi propio progreso
router.get('/me', getMyProgress);

// GET /api/progress/user/:userId — Ver progreso de un estudiante (solo adultos)
router.get('/user/:userId', requireAdult, getUserProgress);

module.exports = router;
