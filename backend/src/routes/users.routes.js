/**
 * LectoPlay — Rutas de Usuarios
 * Grupo 10
 */

const express = require('express');
const router = express.Router();
const { getAllChildren, getUserById, updateAvatar, getLeaderboard } = require('../controllers/users.controller');
const { authMiddleware, requireAdult } = require('../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/users — Listar todos los niños (solo adultos)
router.get('/', requireAdult, getAllChildren);

// GET /api/users/leaderboard — Top 10 por puntos
router.get('/leaderboard', getLeaderboard);

// GET /api/users/:id — Ver perfil de usuario
router.get('/:id', getUserById);

// PUT /api/users/:id/avatar — Actualizar avatar
router.put('/:id/avatar', updateAvatar);

module.exports = router;
