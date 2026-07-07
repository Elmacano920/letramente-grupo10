/**
 * Letramente — Ninos Controller (v3.1)
 * Grupo 10 | Aprende, Comprende, Crea
 *
 * v3.1 — Acceso sin PIN:
 *   - Los ninos entran con un simple clic en su avatar (estilo Netflix).
 *   - No se requiere PIN ni contrasena para los perfiles child.
 *   - El adulto sigue controlando quien puede entrar (crea/elimina perfiles).
 */

const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
const { Estudiante } = require("../config/database");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || "letramente_secret_2024", { expiresIn: "7d" });

// ─── GET /api/ninos ───────────────────────────────────────────────────────────
const getMisNinos = async (req, res) => {
  try {
    const ninos = await Estudiante.find({ tutor_id: req.user.id, rol: "child" });
    const seguros = ninos.map(({ password_hash, pin_hash, ...n }) => n);
    res.json({ success: true, total: seguros.length, ninos: seguros });
  } catch (err) {
    console.error("[ninos/get]", err.message);
    res.status(500).json({ success: false, error: "Error al obtener los ninos" });
  }
};

// ─── POST /api/ninos ──────────────────────────────────────────────────────────
// v3.1: el PIN ya no es requerido. Solo nombre y avatar.
const crearNino = async (req, res) => {
  try {
    const { nombre, avatar = "dino" } = req.body;
    if (!nombre)
      return res.status(400).json({ success: false, error: "El nombre es requerido" });

    // Username interno unico: nombre_normalizado + fragmento de tutor_id + timestamp
    const base     = nombre.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    const username = `${base}_${req.user.id.slice(-6)}_${Date.now().toString(36)}`;

    // password_hash ficticio — los ninos no usan contrasena real
    const password_hash = await bcrypt.hash(`child_${Date.now()}`, 6);

    const nino = await Estudiante.insert({
      nombre,
      username,
      password_hash,
      pin_hash:        null,
      rol:             "child",
      avatar,
      tutor_id:        req.user.id,
      puntos_globales: 0,
      experiencia:     0,
      badges:          [],
      fecha_creacion:  new Date(),
    });

    const { password_hash: _, pin_hash: __, ...safe } = nino;
    res.status(201).json({ success: true, nino: safe });
  } catch (err) {
    console.error("[ninos/crear]", err.message);
    res.status(500).json({ success: false, error: "Error al crear el nino" });
  }
};

// ─── PUT /api/ninos/:id ───────────────────────────────────────────────────────
const actualizarNino = async (req, res) => {
  try {
    const { nombre, avatar } = req.body;
    const nino = await Estudiante.findOne({ _id: req.params.id, tutor_id: req.user.id });
    if (!nino) return res.status(404).json({ success: false, error: "Nino no encontrado" });

    const updates = {};
    if (nombre) updates.nombre = nombre;
    if (avatar) updates.avatar = avatar;

    const actualizado = await Estudiante.update({ _id: req.params.id }, { $set: updates });
    const { password_hash: _, pin_hash: __, ...safe } = actualizado;
    res.json({ success: true, nino: safe });
  } catch (err) {
    console.error("[ninos/actualizar]", err.message);
    res.status(500).json({ success: false, error: "Error al actualizar" });
  }
};

// ─── DELETE /api/ninos/:id ────────────────────────────────────────────────────
const eliminarNino = async (req, res) => {
  try {
    const nino = await Estudiante.findOne({ _id: req.params.id, tutor_id: req.user.id });
    if (!nino) return res.status(404).json({ success: false, error: "Nino no encontrado" });
    await Estudiante.remove({ _id: req.params.id });
    res.json({ success: true, message: "Perfil eliminado" });
  } catch (err) {
    console.error("[ninos/eliminar]", err.message);
    res.status(500).json({ success: false, error: "Error al eliminar" });
  }
};

// ─── POST /api/auth/child-login ───────────────────────────────────────────────
// Acceso directo del nino con solo su ID — sin PIN, sin contrasena.
// El adulto ya controla quien existe en el sistema (crea/elimina perfiles).
// Body: { child_id }
const childLogin = async (req, res) => {
  try {
    const { child_id } = req.body;
    if (!child_id)
      return res.status(400).json({ success: false, error: "child_id requerido" });

    const nino = await Estudiante.findOne({ _id: child_id, rol: "child" });
    if (!nino)
      return res.status(401).json({ success: false, error: "Perfil no encontrado" });

    const token = generateToken(nino._id);
    const { password_hash: _, pin_hash: __, ...safe } = nino;
    res.json({ success: true, token, user: safe });
  } catch (err) {
    console.error("[auth/child-login]", err.message);
    res.status(500).json({ success: false, error: "Error al iniciar sesion" });
  }
};

// loginPin mantenido por compatibilidad, redirige a childLogin
const loginPin = childLogin;

module.exports = { getMisNinos, crearNino, actualizarNino, eliminarNino, childLogin, loginPin };
