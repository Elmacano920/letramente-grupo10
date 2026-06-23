/**
 * Letramente — Retos Controller (v3.0)
 * Grupo 10 | Aprende, Comprende, Crea
 *
 * Motor de Aleatoriedad con MongoDB $sample:
 *   - $sample extrae N documentos al azar directamente en el motor de MongoDB,
 *     sin traer toda la coleccion a Node.js. Mas eficiente que sort + shuffle en JS.
 *   - Cada llamada produce un orden diferente: el nino nunca ve los retos iguales.
 *   - El parametro ?limit= controla cuantos retos se devuelven (default: 8, max: 20).
 */

const { Reto, RetoModel } = require("../config/database");

// ─── Funcion helper: retos aleatorios con $sample de MongoDB ─────────────────
const retosAleatorios = async (filtro, limit = 8) => {
  const safeLimit = Math.min(Math.max(parseInt(limit) || 8, 1), 20);
  const docs = await RetoModel.aggregate([
    { $match: filtro },
    { $sample: { size: safeLimit } },
  ]);
  return docs.map(d => ({ ...d, _id: d._id.toString() }));
};

// ─── GET /api/retos ───────────────────────────────────────────────────────────
const getRetos = async (req, res) => {
  try {
    const { categoria, dificultad, limit } = req.query;
    const filtro = { activo: true };
    if (categoria)  filtro.categoria  = categoria;
    if (dificultad) filtro.dificultad = Number(dificultad);

    const retos = await retosAleatorios(filtro, limit);
    res.json({ success: true, total: retos.length, retos });
  } catch (err) {
    console.error("[retos/get]", err.message);
    res.status(500).json({ success: false, error: "Error al obtener los retos" });
  }
};

// ─── GET /api/retos/categoria/:cat ────────────────────────────────────────────
const getRetosPorCategoria = async (req, res) => {
  try {
    const { cat } = req.params;
    const validas = ["Vocales", "Consonantes", "Silabas", "Palabras"];
    if (!validas.includes(cat))
      return res.status(400).json({ success: false, error: "Usa: " + validas.join(", ") });

    const { tipoReto, limit } = req.query;
    const filtro = { categoria: cat, activo: true };
    if (tipoReto) filtro.tipoReto = tipoReto;

    const retos = await retosAleatorios(filtro, limit);
    res.json({ success: true, categoria: cat, total: retos.length, retos });
  } catch (err) {
    console.error("[retos/categoria]", err.message);
    res.status(500).json({ success: false, error: "Error al obtener los retos" });
  }
};

// ─── GET /api/retos/:id ───────────────────────────────────────────────────────
const getRetoPorId = async (req, res) => {
  try {
    const reto = await Reto.findOne({ _id: req.params.id });
    if (!reto || !reto.activo)
      return res.status(404).json({ success: false, error: "Reto no encontrado" });
    res.json({ success: true, reto });
  } catch (err) {
    res.status(500).json({ success: false, error: "Error al obtener el reto" });
  }
};

// ─── POST /api/retos ──────────────────────────────────────────────────────────
const crearReto = async (req, res) => {
  try {
    const { titulo, categoria, dificultad } = req.body;
    if (!titulo || !categoria || !dificultad)
      return res.status(400).json({ success: false, error: "titulo, categoria y dificultad son requeridos" });

    const reto = await Reto.insert({ ...req.body, activo: true, fecha_creacion: new Date() });
    res.status(201).json({ success: true, reto });
  } catch (err) {
    res.status(500).json({ success: false, error: "Error al crear el reto" });
  }
};

module.exports = { getRetos, getRetosPorCategoria, getRetoPorId, crearReto };
