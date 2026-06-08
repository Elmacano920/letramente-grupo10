/**
 * Letramente — Modelo Estudiante
 * Grupo 10 | Aprende, Comprende, Crea
 *
 * Esquema: id, nombre, avatar, puntos_globales, fecha_creacion
 * Extendido con: username, password_hash, rol
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const EstudianteSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    maxlength: [60, 'El nombre no puede superar 60 caracteres'],
  },
  username: {
    type: String,
    required: [true, 'El username es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    minlength: [3, 'El username debe tener al menos 3 caracteres'],
  },
  password_hash: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    select: false,           // No se devuelve por defecto en queries
  },
  avatar: {
    type: String,
    enum: ['dino', 'cat', 'robot', 'bunny', 'owl', 'fox'],
    default: 'dino',
  },
  puntos_globales: {
    type: Number,
    default: 0,
    min: 0,
  },
  experiencia: {
    type: Number,
    default: 0,
    min: 0,
  },
  rol: {
    type: String,
    enum: ['child', 'adult'],
    default: 'child',
  },
  badges: [{
    slug:        String,
    title:       String,
    description: String,
    icon:        String,
    unlocked_at: { type: Date, default: Date.now },
  }],
  fecha_creacion: {
    type: Date,
    default: Date.now,
  },
});

// ─── Middleware: hashear contraseña antes de guardar ──────────────────────────
EstudianteSchema.pre('save', async function (next) {
  if (!this.isModified('password_hash')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password_hash = await bcrypt.hash(this.password_hash, salt);
  next();
});

// ─── Método: comparar contraseña ──────────────────────────────────────────────
EstudianteSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password_hash);
};

// ─── Método: devolver objeto seguro (sin password) ────────────────────────────
EstudianteSchema.methods.toSafeObject = function () {
  return {
    id:              this._id,
    nombre:          this.nombre,
    username:        this.username,
    avatar:          this.avatar,
    puntos_globales: this.puntos_globales,
    experiencia:     this.experiencia,
    rol:             this.rol,
    badges:          this.badges,
    fecha_creacion:  this.fecha_creacion,
  };
};

module.exports = mongoose.model('Estudiante', EstudianteSchema);
