/**
 * Letramente — Estudiantes Controller (NeDB)
 * Grupo 10
 */

const { Estudiante, Partida } = require('../config/database');

// ─── GET /api/estudiantes ─────────────────────────────────────────────────────
const getEstudiantes = async (req, res) => {
  try {
    const todos = await Estudiante.find({ rol: 'child' }, { puntos_globales: -1 });
    const seguros = todos.map(({ password_hash: _, ...s }) => s);
    res.json({ success: true, total: seguros.length, estudiantes: seguros });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al obtener estudiantes' });
  }
};

// ─── GET /api/estudiantes/leaderboard ─────────────────────────────────────────
const getLeaderboard = async (req, res) => {
  try {
    const todos = await Estudiante.find({ rol: 'child' }, { puntos_globales: -1 });
    const top10 = todos.slice(0, 10).map(({ password_hash: _, ...s }) => s);
    res.json({ success: true, leaderboard: top10 });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al obtener el leaderboard' });
  }
};

// ─── GET /api/estudiantes/:id/progreso ────────────────────────────────────────
const getProgresoEstudiante = async (req, res) => {
  try {
    const est = await Estudiante.findOne({ _id: req.params.id });
    if (!est) return res.status(404).json({ success: false, error: 'Estudiante no encontrado' });

    const partidas = await Partida.find({ estudiante_id: req.params.id, estado: true },
      { completado_en: -1 });

    const { password_hash: _, ...safe } = est;

    res.json({
      success:    true,
      estudiante: safe,
      partidas,
      stats: {
        total_partidas:  partidas.length,
        estrellas_total: partidas.reduce((s, p) => s + (p.estrellas || 0), 0),
        puntos_total:    partidas.reduce((s, p) => s + (p.puntos_ganados || 0), 0),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al obtener el progreso' });
  }
};

module.exports = { getEstudiantes, getLeaderboard, getProgresoEstudiante };
