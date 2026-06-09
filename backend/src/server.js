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
// Espera 3s para que la conexión Mongoose esté establecida antes de consultar
setTimeout(async () => {
  try {
    const total = await db.Reto.count({});
    if (total === 0) {
      console.log('📦 BD vacía — ejecutando seed automático...');
      const { runSeed } = require('../seed');
      await runSeed();
      console.log('✅ Seed completado');
    } else {
      console.log(`📦 BD lista: ${total} retos en MongoDB Atlas`);
    }
  } catch (e) {
    console.warn('⚠️  Seed omitido:', e.message);
  }
}, 3000);


// ─── Rutas ────────────────────────────────────────────────────────────────────
const authRoutes        = require('./routes/auth.routes');
const retosRoutes       = require('./routes/retos.routes');
const partidasRoutes    = require('./routes/partidas.routes');
const estudiantesRoutes = require('./routes/estudiantes.routes');
const misionesRoutes    = require('./routes/misiones.routes');   // ← NUEVO
const telemetriaRoutes  = require('./routes/telemetria.routes'); // ← NUEVO

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
    // Permitir requests sin origen (Postman, curl, mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS bloqueado para: ${origin}`));
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
app.use('/api/misiones',    misionesRoutes);   // ← NUEVO
app.use('/api/telemetria',  telemetriaRoutes); // ← NUEVO

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
