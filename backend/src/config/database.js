/**
 * Letramente — Base de Datos con NeDB
 * Grupo 10 | Aprende, Comprende, Crea
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ¿POR QUÉ NeDB Y NO MongoDB?
 * ─────────────────────────────────────────────────────────────────────────────
 * La decisión de usar NeDB fue deliberada para este contexto académico:
 *
 *  VENTAJAS de NeDB (por qué lo elegimos):
 *  ✔  Sin instalación externa — corre en Node.js puro, sin proceso aparte.
 *  ✔  Sin costo — no requiere MongoDB Atlas ni un servidor gestionado.
 *  ✔  Sin red — los datos viven en archivos .db locales dentro del proyecto;
 *      ideal para demostraciones y despliegues simples.
 *  ✔  API idéntica a MongoDB — las mismas queries ({$set}, {$inc}, find, sort)
 *      permiten migrar a MongoDB cambiando solo este archivo.
 *  ✔  Persistencia automática — autoload:true carga el archivo al iniciar y
 *      escribe cada cambio al disco de forma incremental (append-only log).
 *
 *  LIMITACIONES de NeDB (por qué NO usarlo en producción real):
 *  ✗  Sin soporte para aggregation pipeline de MongoDB.
 *  ✗  Rendimiento limitado para >100k documentos (archivo plano, no B-tree).
 *  ✗  Sin replicación ni sharding para alta disponibilidad.
 *  ✗  corruptAlertThreshold:0 → falla estricta ante cualquier línea corrupta,
 *     lo que en producción sería demasiado agresivo (pero aquí nos avisa rápido).
 *
 *  PLAN DE MIGRACIÓN (si el proyecto escala):
 *  1. Instalar mongoose.
 *  2. Reemplazar este archivo con modelos Mongoose equivalentes.
 *  3. Los controladores NO cambian porque ya usan la misma API.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Colecciones del sistema:
 *   estudiantes.db  → Modelo ESTUDIANTE  (usuarios, puntos, badges, XP)
 *   retos.db        → Modelo RETO_LECTURA (preguntas y opciones de cada reto)
 *   partidas.db     → Modelo PARTIDA      (historial de juego de cada niño)
 *   misiones.db     → Modelo MISION       (misiones diarias asignadas por día)
 *   telemetria.db   → Modelo TELEMETRIA   (log de cada error cometido en tiempo real)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const path   = require('path');
const Datastore = require('@seald-io/nedb');

/** Ruta base donde se guardan todos los archivos .db en disco */
const DB_DIR = path.join(__dirname, '../../database');

// ─── Crear colecciones ────────────────────────────────────────────────────────
// Cada Datastore corresponde a una "colección" (como en MongoDB).
// autoload:true hace que NeDB lea el archivo .db al arrancar el proceso,
// sin necesidad de llamar manualmente a db.loadDatabase().
const db = {
  estudiantes: new Datastore({
    filename:  path.join(DB_DIR, 'estudiantes.db'),
    autoload:  true,
    corruptAlertThreshold: 0, // 0 = rechazar cualquier línea corrupta (fail-fast en desarrollo)
  }),
  retos: new Datastore({
    filename:  path.join(DB_DIR, 'retos.db'),
    autoload:  true,
    corruptAlertThreshold: 0,
  }),
  partidas: new Datastore({
    filename:  path.join(DB_DIR, 'partidas.db'),
    autoload:  true,
    corruptAlertThreshold: 0,
  }),
  // ── NUEVO: Misiones diarias ───────────────────────────────────────────────
  misiones: new Datastore({
    filename:  path.join(DB_DIR, 'misiones.db'),
    autoload:  true,
    corruptAlertThreshold: 0,
  }),
  // ── NUEVO: Telemetría de errores ──────────────────────────────────────────
  telemetria: new Datastore({
    filename:  path.join(DB_DIR, 'telemetria.db'),
    autoload:  true,
    corruptAlertThreshold: 0,
  }),
};

// ─── Índices para búsqueda rápida ────────────────────────────────────────────
// NeDB usa índices tipo B-tree en memoria. Sin índice, cada búsqueda hace
// un full-scan del archivo en disco (O(n)). Con índice es O(log n).

/**
 * Índice ÚNICO en `username`.
 * WHY: el username es el identificador de login; debe ser único para evitar
 * colisiones. NeDB lanzará `uniqueViolated` si se intenta insertar duplicados,
 * lo que el auth controller captura y convierte en HTTP 409.
 */
db.estudiantes.ensureIndex({ fieldName: 'username', unique: true });

/**
 * Índice en `categoria` (retos).
 * WHY: la pantalla de selección de retos filtra por categoría ('Vocales',
 * 'Sílabas', 'Palabras'). Sin este índice, cada filtro escanearía todos
 * los retos en disco.
 */
db.retos.ensureIndex({ fieldName: 'categoria' });

/**
 * Índice en `estudiante_id` (partidas).
 * WHY: la consulta más frecuente es "dame todas las partidas de este niño".
 * Sin índice, escalar a miles de partidas sería muy lento.
 */
db.partidas.ensureIndex({ fieldName: 'estudiante_id' });

/**
 * Índice en `reto_id` (partidas).
 * WHY: permite calcular "cuántas veces se jugó este reto" eficientemente,
 * útil para estadísticas de popularidad de retos.
 */
db.partidas.ensureIndex({ fieldName: 'reto_id' });

/**
 * Índice en `estudiante_id` (misiones).
 * WHY: getMisionesHoy filtra { estudiante_id, fecha_asignada }; este índice
 * reduce el espacio de búsqueda al subconjunto del estudiante.
 */
db.misiones.ensureIndex({ fieldName: 'estudiante_id' });

/**
 * Índice en `fecha_asignada` (misiones).
 * WHY: el sistema de reset diario consulta misiones por fecha (YYYY-MM-DD).
 * El índice hace que la verificación "¿ya hay misiones para hoy?" sea O(log n)
 * en vez de escanear todas las misiones históricas.
 */
db.misiones.ensureIndex({ fieldName: 'fecha_asignada' });

/**
 * Índice en `estudiante_id` (telemetría).
 * WHY: el dashboard de padres/docentes carga TODOS los errores de un estudiante.
 * Sin índice, esto escanearía los errores de todos los estudiantes del sistema.
 */
db.telemetria.ensureIndex({ fieldName: 'estudiante_id' });

/**
 * Índice en `par_confusion` (telemetría).
 * WHY: `par_confusion` es la clave normalizada (ej: 'B-D') que representa
 * un par de letras confundidas. Un futuro análisis global ("¿qué pares son
 * más problemáticos en toda la plataforma?") puede aprovechar este índice
 * sin tocar el índice de estudiante.
 */
db.telemetria.ensureIndex({ fieldName: 'par_confusion' });

// ─── Helper: promisificar operaciones de NeDB ─────────────────────────────────
// WHY: NeDB usa callbacks al estilo Node.js clásico (error-first callback).
// Los controladores usan async/await, que requiere Promises.
// En lugar de llamar util.promisify() función por función, envolvemos toda
// la API de un Datastore en un objeto con métodos que devuelven Promise.
// Esto nos da una capa de abstracción que:
//   1. Hace los controladores más legibles (sin callback hell).
//   2. Facilita el manejo de errores con try/catch.
//   3. Permite cambiar la implementación subyacente (ej: MongoDB) sin tocar
//      ningún controlador.
const promisify = (store) => ({

  /** Devuelve el primer documento que coincide con `query`, o null. */
  findOne: (query) => new Promise((res, rej) =>
    store.findOne(query, (err, doc) => err ? rej(err) : res(doc))),

  /**
   * Devuelve todos los documentos que coinciden con `query`,
   * ordenados según `sort` (e.g. { timestamp: -1 } para más recientes primero).
   */
  find: (query = {}, sort = {}) => new Promise((res, rej) =>
    store.find(query).sort(sort).exec((err, docs) => err ? rej(err) : res(docs))),

  /** Inserta un nuevo documento y devuelve el documento insertado (con _id generado). */
  insert: (doc) => new Promise((res, rej) =>
    store.insert(doc, (err, newDoc) => err ? rej(err) : res(newDoc))),

  /**
   * Actualiza documentos que coinciden con `query` usando operadores MongoDB
   * ($set, $inc, etc.). returnUpdatedDocs:true devuelve el documento resultante,
   * no solo el conteo de filas afectadas.
   */
  update: (query, update, opts = {}) => new Promise((res, rej) =>
    store.update(query, update, { ...opts, returnUpdatedDocs: true },
      (err, _, doc) => err ? rej(err) : res(doc))),

  /**
   * Elimina documentos. Por defecto solo el primero; pasar { multi: true }
   * para borrar todos los que coincidan (necesario en el reset de misiones).
   */
  remove: (query, opts = {}) => new Promise((res, rej) =>
    store.remove(query, opts, (err, n) => err ? rej(err) : res(n))),

  /** Cuenta documentos que coinciden con `query`. Útil para estadísticas. */
  count: (query = {}) => new Promise((res, rej) =>
    store.count(query, (err, n) => err ? rej(err) : res(n))),
});

// ─── Exportar colecciones promisificadas ──────────────────────────────────────
// Los nombres en PascalCase (Estudiante, Reto...) siguen la convención de
// modelos de Mongoose, facilitando una futura migración.
// `raw` expone los Datastores originales para operaciones avanzadas que no
// estén cubiertas por el helper (e.g. cursores paginados con .skip().limit()).
module.exports = {
  Estudiante: promisify(db.estudiantes),
  Reto:       promisify(db.retos),
  Partida:    promisify(db.partidas),
  Mision:     promisify(db.misiones),
  Telemetria: promisify(db.telemetria),
  raw:        db,
};

console.log('📦 Base de datos NeDB lista (sin servidores, sin pago)');
console.log(`   📂 Datos en: ${DB_DIR}`);
