const express  = require('express');
const router   = express.Router();
const { getEstudiantes, getLeaderboard, getProgresoEstudiante } = require('../controllers/estudiantes.controller');
const protect  = require('../middleware/auth.middleware');

router.get('/',                    protect, getEstudiantes);
router.get('/leaderboard',         protect, getLeaderboard);
router.get('/:id/progreso',        protect, getProgresoEstudiante);

module.exports = router;
