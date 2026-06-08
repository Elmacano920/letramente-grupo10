/**
 * Letramente — Modelo Partida (Tabla Pivote)
 * Grupo 10 | Aprende, Comprende, Crea
 *
 * Esquema: id, estudiante_id, reto_id, estado (Boolean), estrellas (0-3), errores_cometidos
 */

const mongoose = require('mongoose');

const PartidaSchema = new mongoose.Schema({
  estudiante_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Estudiante',
    required: [true, 'El estudiante es requerido'],
    index: true,
  },
  reto_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RetoLectura',
    required: [true, 'El reto es requerido'],
    index: true,
  },
  estado: {
    type: Boolean,
    required: true,
    default: false,          // false = en progreso, true = completada
  },
  estrellas: {
    type: Number,
    min: [0, 'Las estrellas no pueden ser negativas'],
    max: [3, 'El maximo son 3 estrellas'],
    default: 0,
  },
  errores_cometidos: {
    type: Number,
    default: 0,
    min: 0,
  },
  puntos_ganados: {
    type: Number,
    default: 0,
  },
  tiempo_segundos: {
    type: Number,
    default: 0,
  },
  completado_en: {
    type: Date,
    default: Date.now,
  },
});

// Indice compuesto para busqueda rapida de historial
PartidaSchema.index({ estudiante_id: 1, completado_en: -1 });
PartidaSchema.index({ estudiante_id: 1, reto_id: 1 });

// Metodo estatico: calcular estrellas segun score
PartidaSchema.statics.calcularEstrellas = function (score, errores) {
  if (score >= 90 && errores <= 1) return 3;
  if (score >= 70 && errores <= 3) return 2;
  if (score >= 50)                 return 1;
  return 0;
};

// Metodo estatico: calcular puntos
PartidaSchema.statics.calcularPuntos = function (puntosBase, estrellas, tiempoSeg) {
  const bonusEstrella = { 0: 0, 1: 1, 2: 1.5, 3: 2 };
  const bonusTiempo  = tiempoSeg < 30 ? 1.2 : tiempoSeg < 60 ? 1.1 : 1;
  return Math.round(puntosBase * (bonusEstrella[estrellas] || 1) * bonusTiempo);
};

module.exports = mongoose.model('Partida', PartidaSchema);
