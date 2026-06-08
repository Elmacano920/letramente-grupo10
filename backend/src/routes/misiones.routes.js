const express = require('express');
const router  = express.Router();
const { getMisionesHoy, actualizarProgreso, getMascota } = require('../controllers/misiones.controller');
const protect = require('../middleware/auth.middleware');

// GET  /api/misiones/hoy       → misiones del día + mascota
router.get('/hoy',      protect, getMisionesHoy);
// GET  /api/misiones/mascota   → solo estado de la mascota
router.get('/mascota',  protect, getMascota);
// POST /api/misiones/progreso  → Body: { mision_id, incremento }
router.post('/progreso', protect, actualizarProgreso);

module.exports = router;
