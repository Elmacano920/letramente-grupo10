/**
 * Letramente — Retos Controller (NeDB)
 * Grupo 10 | Aprende, Comprende, Crea
 */

const { Reto } = require('../config/database');

// ─── GET /api/retos ───────────────────────────────────────────────────────────
const getRetos = async (req, res) => {
  try {
    const { categoria, dificultad } = req.query;
    const filtro = { activo: true };
    if (categoria)  filtro.categoria  = categoria;
    if (dificultad) filtro.dificultad = Number(dificultad);

    const retos = await Reto.find(filtro, { dificultad: 1 });
    res.json({ success: true, total: retos.length, retos });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al obtener los retos' });
  }
};

// ─── GET /api/retos/categoria/:cat ────────────────────────────────────────────
const getRetosPorCategoria = async (req, res) => {
  try {
    const { cat } = req.params;
    const validas = ['Vocales', 'Consonantes', 'Silabas', 'Palabras'];
    if (!validas.includes(cat))
      return res.status(400).json({ success: false, error: `Usa: ${validas.join(', ')}` });

    const { tipoReto } = req.query;
    const filtro = { categoria: cat, activo: true };
    if (tipoReto) filtro.tipoReto = tipoReto;

    const retos = await Reto.find(filtro, { dificultad: 1 });
    res.json({ success: true, categoria: cat, total: retos.length, retos });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al obtener los retos' });
  }
};

// ─── GET /api/retos/:id ───────────────────────────────────────────────────────
const getRetoPorId = async (req, res) => {
  try {
    const reto = await Reto.findOne({ _id: req.params.id });
    if (!reto || !reto.activo)
      return res.status(404).json({ success: false, error: 'Reto no encontrado' });
    res.json({ success: true, reto });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al obtener el reto' });
  }
};

// ─── POST /api/retos ──────────────────────────────────────────────────────────
const crearReto = async (req, res) => {
  try {
    const { titulo, categoria, dificultad } = req.body;
    if (!titulo || !categoria || !dificultad)
      return res.status(400).json({ success: false, error: 'titulo, categoria y dificultad son requeridos' });

    const reto = await Reto.insert({ ...req.body, activo: true, fecha_creacion: new Date() });
    res.status(201).json({ success: true, reto });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al crear el reto' });
  }
};

module.exports = { getRetos, getRetosPorCategoria, getRetoPorId, crearReto };
