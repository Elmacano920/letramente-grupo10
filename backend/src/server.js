/**
 * Letramente Backend — server.js (MongoDB Atlas)
 * Grupo 10 | Aprende, Comprende, Crea
 *
 * Stack: Node.js + Express + MongoDB Atlas (Mongoose)
 * Datos persistentes en la nube — no se pierden al reiniciar.
 */

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');

// Inicializar conexión a MongoDB Atlas
const db = require('./config/database');

// ─── Auto-seed: poblar retos si la BD está vacía ──────────────────────────────
// Usamos el evento 'open' de Mongoose para garantizar que la conexión
// está lista ANTES de intentar consultar la BD.
const mongoose = require('mongoose');
mongoose.connection.once('open', async () => {
  try {
    const db = require('./config/database');
    const total = await db.Reto.count({});
    if (total === 0) {
      console.log('📦 BD vacía — ejecutando seed automático...');
      const { runSeed } = require('../seed');
      await runSeed();
      console.log('✅ Seed completado en MongoDB Atlas');
    } else {
      console.log(`📦 BD lista: ${total} retos en MongoDB Atlas`);
    }
  } catch (e) {
    console.warn('⚠️  Seed omitido:', e.message);
  }
});


// ─── Rutas ────────────────────────────────────────────────────────────────────
const authRoutes        = require('./routes/auth.routes');
const retosRoutes       = require('./routes/retos.routes');
const partidasRoutes    = require('./routes/partidas.routes');
const estudiantesRoutes = require('./routes/estudiantes.routes');
const misionesRoutes    = require('./routes/misiones.routes');
const telemetriaRoutes  = require('./routes/telemetria.routes');
const ninosRoutes       = require('./routes/ninos.routes');  // ← v3.0

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── Middlewares ──────────────────────────────────────────────────────────────
app.set('etag', false);                  // ← Desactiva caché HTTP (evita 304)
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');  // ← Nunca cachear respuestas de API
  next();
});
// Orígenes permitidos: localhost (dev) + URL de producción (Vercel)
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:4173', // vite preview
];
// Si el usuario configura FRONTEND_URL con la URL de Vercel, se agrega automáticamente
if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: (origin, callback) => {
    // Para el entorno de producción (educativo), permitimos cualquier origen dinámicamente
    // Esto evita bloqueos por falta de configuración de FRONTEND_URL, trailing slashes, etc.
    callback(null, origin || true);
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ─── Rutas de la API ──────────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/retos',       retosRoutes);
app.use('/api/partidas',    partidasRoutes);
app.use('/api/estudiantes', estudiantesRoutes);
app.use('/api/misiones',    misionesRoutes);
app.use('/api/telemetria',  telemetriaRoutes);
app.use('/api/ninos',       ninosRoutes);   // ← v3.0 gestion de ninos por tutor

// ─── Ruta de Salud ────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status:    'OK',
    message:   '🧠 Letramente API funcionando',
    version:   '2.0.0',
    db:        'NeDB (local, sin pago)',
    grupo:     'Grupo 10',
    fases:     ['Aprende', 'Comprende', 'Crea'],
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ success: false, error: `Ruta ${req.originalUrl} no encontrada` });
});

// ─── Error global ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(err.statusCode || 500).json({ success: false, error: err.message || 'Error interno' });
});

// ─── Iniciar servidor ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║   🧠  L E T R A M E N T E  — API v2.0      ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║   Puerto : http://localhost:${PORT}             ║`);
  console.log('║   BD     : NeDB (local, sin MongoDB, gratis)║');
  console.log('║   Fases  : Aprende · Comprende · Crea       ║');
  console.log('║   Grupo  : 10                               ║');
  console.log('╚══════════════════════════════════════════════╝\n');
});

module.exports = app;
