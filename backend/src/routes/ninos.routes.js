const express  = require("express");
const router   = express.Router();
const protect  = require("../middleware/auth.middleware");
const {
  getMisNinos, crearNino, actualizarNino, eliminarNino,
} = require("../controllers/ninos.controller");
const { Estudiante } = require("../config/database");

// ─── Ruta PUBLICA: pantalla de seleccion de perfil del nino ──────────────────
// No requiere token — el adulto comparte este link con sus ninos.
// Solo devuelve: _id, nombre, avatar (nunca pin_hash ni password_hash).
router.get("/publico", async (req, res) => {
  try {
    const { tutor } = req.query;
    if (!tutor) return res.status(400).json({ success:false, error:"tutor requerido" });
    const ninos = await Estudiante.find({ tutor_id: tutor, rol: "child" });
    const seguros = ninos.map(({ _id, nombre, avatar, puntos_globales, experiencia }) =>
      ({ _id, nombre, avatar, puntos_globales, experiencia }));
    res.json({ success: true, ninos: seguros });
  } catch (err) {
    res.status(500).json({ success: false, error: "Error" });
  }
});

// ─── Rutas protegidas (requieren token de adulto) ─────────────────────────────
router.get("/",       protect, getMisNinos);
router.post("/",      protect, crearNino);
router.put("/:id",    protect, actualizarNino);
router.delete("/:id", protect, eliminarNino);

module.exports = router;

