/**
 * Letramente — Modelo RetoLectura
 * Grupo 10 | Aprende, Comprende, Crea
 *
 * Esquema: id, titulo, categoria (Vocales, Silabas, Palabras), dificultad (1, 2, 3)
 */

const mongoose = require('mongoose');

const OpcionSchema = new mongoose.Schema({
  texto:      { type: String, required: true },
  esCorrecta: { type: Boolean, required: true, default: false },
  emoji:      { type: String, default: '' },
}, { _id: false });

const RetoLecturaSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: [true, 'El titulo es requerido'],
    trim: true,
  },
  categoria: {
    type: String,
    required: true,
    enum: {
      values: ['Vocales', 'Silabas', 'Palabras'],
      message: 'La categoria debe ser Vocales, Silabas o Palabras',
    },
  },
  dificultad: {
    type: Number,
    required: true,
    enum: {
      values: [1, 2, 3],
      message: 'La dificultad debe ser 1 (facil), 2 (medio) o 3 (dificil)',
    },
  },
  descripcion: {
    type: String,
    trim: true,
    default: '',
  },
  instruccion: {
    type: String,
    trim: true,
    default: '¿Cuál es la respuesta correcta?',
  },
  emoji: {
    type: String,
    default: '📖',
  },
  // Opciones de respuesta (para quiz de opcion multiple)
  opciones: {
    type: [OpcionSchema],
    validate: {
      validator: (arr) => arr.length >= 2 && arr.length <= 6,
      message: 'Debe haber entre 2 y 6 opciones',
    },
    default: [],
  },
  // Para retos de tipo "completar": la palabra con un hueco
  palabraConHueco: { type: String, default: '' },
  respuestaCorrecta: { type: String, default: '' },

  // Puntos base que otorga este reto
  puntos_base: { type: Number, default: 10 },

  activo: { type: Boolean, default: true },

  fecha_creacion: { type: Date, default: Date.now },
});

// Indice para busqueda rapida por categoria y dificultad
RetoLecturaSchema.index({ categoria: 1, dificultad: 1 });
RetoLecturaSchema.index({ activo: 1 });

module.exports = mongoose.model('RetoLectura', RetoLecturaSchema);
