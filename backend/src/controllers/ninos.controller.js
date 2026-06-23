/**
 * Letramente — Niños Controller (v3.0)
 * Grupo 10 | Aprende, Comprende, Crea
 *
 * Gestiona los perfiles de ninos bajo la tutela de un adulto.
 * Todos los endpoints requieren autenticacion de adulto (rol === "adult").
 *
 * Relacion: 1 adulto → N ninos (campo tutor_id en el Estudiante child)
 */

const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const { Estudiante } = require("../config/database");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || "letramente_secret_2024", { expiresIn: "7d" });

// ─── GET /api/ninos ───────────────────────────────────────────────────────────
// Devuelve todos los ninos vinculados al adulto autenticado.
const getMisNinos = async (req, res) => {
  try {
    const ninos = await Estudiante.find({ tutor_id: req.user.id, rol: "child" });
    // Nunca enviar hashes al cliente
    const seguros = ninos.map(({ password_hash, pin_hash, ...n }) => n);
    res.json({ success: true, total: seguros.length, ninos: seguros });
  } catch (err) {
    console.error("[ninos/get]", err.message);
    res.status(500).json({ success: false, error: "Error al obtener los ninos" });
  }
};

// ─── POST /api/ninos ──────────────────────────────────────────────────────────
// El adulto crea un perfil de nino. El nino NO necesita username/password propios:
// su autenticacion es via PIN de 4 digitos elegido por el adulto.
const crearNino = async (req, res) => {
  try {
    const { nombre, avatar = "dino", pin } = req.body;
    if (!nombre || !pin)
      return res.status(400).json({ success: false, error: "nombre y pin son requeridos" });
    if (!/^\d{4}$/.test(pin))
      return res.status(400).json({ success: false, error: "El PIN debe ser exactamente 4 digitos" });

    // Username interno: <nombre_normalizado>_<tutor_id[:6]> — garantiza unicidad
    const base = nombre.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    const username = `${base}_${req.user.id.slice(-6)}_${Date.now().toString(36)}`;

    // Los ninos no tienen password real, usamos el PIN como password_hash tambien
    // para respetar el campo requerido del schema.
    const pin_hash      = await bcrypt.hash(pin, 10);
    const password_hash = pin_hash; // mismo hash; el login normal no es aplicable a ninos

    const nino = await Estudiante.insert({
      nombre,
      username,
      password_hash,
      pin_hash,
      rol:             "child",
      avatar,
      tutor_id:        req.user.id,   // vincula al adulto
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
// El adulto actualiza el nombre, avatar o PIN de uno de sus ninos.
const actualizarNino = async (req, res) => {
  try {
    const { nombre, avatar, pin } = req.body;
    // Verificar que el nino pertenece a este tutor
    const nino = await Estudiante.findOne({ _id: req.params.id, tutor_id: req.user.id });
    if (!nino) return res.status(404).json({ success: false, error: "Nino no encontrado" });

    const updates = {};
    if (nombre) updates.nombre = nombre;
    if (avatar) updates.avatar = avatar;
    if (pin) {
      if (!/^\d{4}$/.test(pin))
        return res.status(400).json({ success: false, error: "PIN invalido" });
      updates.pin_hash      = await bcrypt.hash(pin, 10);
      updates.password_hash = updates.pin_hash;
    }

    const actualizado = await Estudiante.update({ _id: req.params.id }, { $set: updates });
    const { password_hash: _, pin_hash: __, ...safe } = actualizado;
    res.json({ success: true, nino: safe });
  } catch (err) {
    console.error("[ninos/actualizar]", err.message);
    res.status(500).json({ success: false, error: "Error al actualizar" });
  }
};

// ─── DELETE /api/ninos/:id ────────────────────────────────────────────────────
// El adulto elimina un perfil de nino suyo.
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

// ─── POST /api/auth/login-pin ─────────────────────────────────────────────────
// Autenticacion del nino con PIN de 4 digitos.
// Body: { child_id, pin }
// No requiere username ni password largo.
const loginPin = async (req, res) => {
  try {
    const { child_id, pin } = req.body;
    if (!child_id || !pin)
      return res.status(400).json({ success: false, error: "child_id y pin requeridos" });

    const nino = await Estudiante.findOne({ _id: child_id, rol: "child" });
    if (!nino)
      return res.status(401).json({ success: false, error: "Perfil no encontrado" });

    const match = await bcrypt.compare(String(pin), nino.pin_hash);
    if (!match)
      return res.status(401).json({ success: false, error: "PIN incorrecto" });

    const token = generateToken(nino._id);
    const { password_hash: _, pin_hash: __, ...safe } = nino;
    res.json({ success: true, token, user: safe });
  } catch (err) {
    console.error("[auth/login-pin]", err.message);
    res.status(500).json({ success: false, error: "Error al iniciar sesion con PIN" });
  }
};

module.exports = { getMisNinos, crearNino, actualizarNino, eliminarNino, loginPin };
