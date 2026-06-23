/**
 * Letramente — Base de Datos con MongoDB Atlas + Mongoose
 * Grupo 10 | Aprende, Comprende, Crea
 *
 * v3.0 — Relacion Adulto <-> Ninos:
 *   - Solo adultos se registran externamente.
 *   - Adultos crean perfiles de ninos desde su panel.
 *   - Los ninos acceden con PIN de 4 digitos (pin_hash).
 */

const mongoose = require('mongoose');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/letramente';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB Atlas conectado'))
  .catch(err => console.error('❌ Error MongoDB:', err.message));

const { Schema } = mongoose;

const EstudianteSchema = new Schema({
  nombre:          { type: String, required: true },
  username:        { type: String, required: true, unique: true, lowercase: true },
  password_hash:   { type: String, required: true },
  pin_hash:        { type: String, default: null },
  rol:             { type: String, enum: ['child', 'adult'], default: 'adult' },
  avatar:          { type: String, default: 'dino' },
  tutor_id:        { type: String, default: null, index: true },
  puntos_globales: { type: Number, default: 0 },
  experiencia:     { type: Number, default: 0 },
  badges:          { type: Array,  default: [] },
  fecha_creacion:  { type: Date,   default: Date.now },
});

const RetoSchema = new Schema({
  titulo:            String,
  categoria:         { type: String, index: true },
  tipoReto:          { type: String, default: 'letra' },
  dificultad:        { type: Number, default: 1 },
  puntos_base:       { type: Number, default: 10 },
  instruccion:       String,
  emoji:             String,
  imagenUrl:         String,
  activo:            { type: Boolean, default: true },
  palabraClave:      String,
  palabraConHueco:   String,
  respuestaCorrecta: String,
  opciones:          Array,
  silabas:           Array,
  fecha_creacion:    { type: Date, default: Date.now },
});

const PartidaSchema = new Schema({
  estudiante_id:     { type: String, index: true },
  reto_id:           { type: String, index: true },
  estado:            { type: Boolean, default: true },
  estrellas:         { type: Number, default: 0 },
  errores_cometidos: { type: Number, default: 0 },
  puntos_ganados:    { type: Number, default: 0 },
  tiempo_segundos:   { type: Number, default: 0 },
  completado_en:     { type: Date,   default: Date.now },
});

const MisionSchema = new Schema({
  estudiante_id:  { type: String, index: true },
  fecha_asignada: { type: String, index: true },
  slug:           String,
  titulo:         String,
  descripcion:    String,
  categoria:      String,
  meta:           Number,
  progreso:       { type: Number, default: 0 },
  completada:     { type: Boolean, default: false },
  xp_reward:      Number,
  xp_otorgada:    { type: Boolean, default: false },
  emoji:          String,
  creada_en:      { type: Date, default: Date.now },
});

const TelemetriaSchema = new Schema({
  estudiante_id:   { type: String, index: true },
  reto_id:         String,
  categoria:       String,
  opcion_elegida:  String,
  opcion_correcta: String,
  par_confusion:   { type: String, index: true },
  palabraClave:    String,
  tiempo_respuesta:Number,
  timestamp:       { type: Date, default: Date.now },
});

const EstudianteModel = mongoose.model('Estudiante', EstudianteSchema);
const RetoModel       = mongoose.model('Reto',       RetoSchema);
const PartidaModel    = mongoose.model('Partida',    PartidaSchema);
const MisionModel     = mongoose.model('Mision',     MisionSchema);
const TelemetriaModel = mongoose.model('Telemetria', TelemetriaSchema);

const toPlain = (doc) => {
  if (!doc) return null;
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  if (obj._id) obj._id = obj._id.toString();
  return obj;
};

const adapt = (Model) => ({
  findOne: async (query) => {
    const doc = await Model.findOne(query).lean();
    return toPlain(doc);
  },
  find: async (query = {}, sort = {}) => {
    const docs = await Model.find(query).sort(sort).lean();
    return docs.map(toPlain);
  },
  insert: async (doc) => {
    const created = await Model.create(doc);
    return toPlain(created);
  },
  update: async (query, update, opts = {}) => {
    if (opts.multi) { await Model.updateMany(query, update); return null; }
    const doc = await Model.findOneAndUpdate(query, update, { new: true }).lean();
    return toPlain(doc);
  },
  remove: async (query, opts = {}) => {
    if (opts.multi) { const res = await Model.deleteMany(query); return res.deletedCount; }
    const res = await Model.deleteOne(query);
    return res.deletedCount;
  },
  count: (query = {}) => Model.countDocuments(query),
});

module.exports = {
  Estudiante:      adapt(EstudianteModel),
  Reto:            adapt(RetoModel),
  Partida:         adapt(PartidaModel),
  Mision:          adapt(MisionModel),
  Telemetria:      adapt(TelemetriaModel),
  EstudianteModel,
  RetoModel,
};
