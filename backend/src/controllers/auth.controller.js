/**
 * Letramente — Auth Controller (NeDB)
 * Grupo 10 | Aprende, Comprende, Crea
 *
 * Responsabilidades de este módulo:
 *   - Registrar nuevos estudiantes (con hash de contraseña)
 *   - Autenticar credenciales y emitir JWTs
 *   - Devolver el perfil del usuario autenticado
 *
 * Dependencias de seguridad:
 *   - bcryptjs → hash de contraseñas con salt aleatorio
 *   - jsonwebtoken → firma y verificación de tokens JWT
 */

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { Estudiante } = require('../config/database');

/**
 * Genera un JWT firmado con el id del estudiante como payload.
 *
 * WHY expiresIn '7d':
 *   - 7 días es un balance entre comodidad (el niño no tiene que re-loguearse
 *     cada día) y seguridad (si el token se roba, expira en una semana).
 *   - Para una app de niños, sesiones largas son preferibles a la fricción
 *     de loguearse frecuentemente.
 *   - En apps financieras o médicas, el estándar sería 15 minutos con
 *     refresh tokens; aquí la sensibilidad de los datos es baja.
 *
 * @param {string} id - El _id del documento de estudiante en NeDB.
 * @returns {string} Token JWT firmado, listo para enviar al cliente.
 */
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'letramente_secret_2024',
    { expiresIn: '7d' });

// ─── POST /api/auth/register ──────────────────────────────────────────────────
/**
 * Registra un nuevo estudiante en el sistema.
 *
 * Flujo:
 *   1. Validar campos obligatorios y longitud mínima de contraseña.
 *   2. Verificar unicidad del username (colisión temprana, antes del hash).
 *   3. Hashear la contraseña con bcrypt (10 rondas de sal).
 *   4. Insertar el documento del estudiante con valores iniciales en cero.
 *   5. Generar y devolver el JWT junto al perfil (sin password_hash).
 *
 * WHY bcrypt con 10 rondas de sal (salt rounds):
 *   - bcrypt es un algoritmo de hash LENTO por diseño. Cada "ronda" duplica
 *     el tiempo de cómputo. Con 10 rondas tarda ~100ms en hardware moderno.
 *   - Esto hace que un atacante que robe la base de datos tardaría siglos en
 *     crackear las contraseñas por fuerza bruta (comparado con MD5 o SHA-1).
 *   - El "salt" es una cadena aleatoria generada internamente por bcrypt y
 *     embebida en el hash resultante. Significa que dos usuarios con la MISMA
 *     contraseña tienen hashes DISTINTOS → un atacante no puede usar tablas
 *     arco-iris (rainbow tables) precalculadas.
 *   - 10 es el valor por defecto de bcrypt y el punto de equilibrio estándar
 *     entre seguridad y rendimiento para la mayoría de aplicaciones web.
 *     Bancos suelen usar 12-14; apps de baja sensibilidad, 8-10.
 *
 * @param {import('express').Request}  req - Body: { nombre, username, password, rol?, avatar? }
 * @param {import('express').Response} res - 201 con { success, token, user } en éxito.
 */
const register = async (req, res) => {
  try {
    const { nombre, username, password, rol = 'adult', avatar = 'dino' } = req.body;

    // v3.0: el registro publico es EXCLUSIVAMENTE para adultos.
    // Los perfiles de ninos los crea el adulto desde su panel (POST /api/ninos).
    if (rol === 'child')
      return res.status(403).json({
        success: false,
        error: 'Los perfiles de ninos los crea tu maestro o padre desde su panel. Pide que te agreguen.'
      });

    // Validación básica: rechazar antes de tocar la BD para economizar recursos
    if (!nombre || !username || !password)
      return res.status(400).json({ success: false, error: 'Nombre, usuario y contraseña son requeridos' });

    // Longitud mínima de 4 caracteres: suficiente para niños pequeños que
    // recordarán PINs simples, sin ser un obstáculo de usabilidad.
    if (password.length < 4)
      return res.status(400).json({ success: false, error: 'La contraseña debe tener al menos 4 caracteres' });

    // Normalizar username a minúsculas antes de buscar o insertar.
    // WHY: evita duplicados case-sensitive ("Juan" vs "juan" serían usuarios distintos).
    // NeDB no tiene collation insensible, así que normalizamos en la aplicación.
    const existe = await Estudiante.findOne({ username: username.toLowerCase() });
    if (existe)
      return res.status(409).json({ success: false, error: 'Ese nombre de usuario ya existe. Elige otro.' });

    // bcrypt.hash(password, 10): el 10 es el cost factor (salt rounds).
    // bcrypt genera internamente el salt, lo aplica y devuelve un string con
    // formato "$2b$10$<salt22chars><hash31chars>" — todo en un único campo.
    const password_hash = await bcrypt.hash(password, 10);

    const estudiante = await Estudiante.insert({
      nombre,
      username:        username.toLowerCase(),
      password_hash,         // Solo se guarda el hash, NUNCA la contraseña en texto plano
      avatar:          avatar || 'dino',
      puntos_globales: 0,    // Puntos acumulados por partidas (afecta ranking)
      experiencia:     0,    // XP total (afecta nivel de mascota)
      rol,                   // 'child' | 'adult' — controla acceso a dashboards
      badges:          [],   // Array de objetos badge desbloqueados
      fecha_creacion:  new Date(),
    });

    const token = generateToken(estudiante._id);

    // Destrucción con renombre para excluir password_hash de la respuesta.
    // WHY: nunca debemos enviar el hash al cliente, aunque esté hasheado.
    // Un atacante con el hash puede intentar ataques offline sin comprometer
    // el servidor. El operador `...safe` copia todos los demás campos.
    const { password_hash: _, ...safe } = estudiante;
    res.status(201).json({ success: true, token, user: safe });
  } catch (err) {
    console.error('[auth/register]', err.message);
    // NeDB lanza errorType:'uniqueViolated' si el índice único de username es violado
    // en una race condition (dos registros simultáneos con el mismo username).
    // Lo capturamos aquí como segunda línea de defensa, además del check previo.
    if (err.errorType === 'uniqueViolated')
      return res.status(409).json({ success: false, error: 'Ese nombre de usuario ya existe.' });
    res.status(500).json({ success: false, error: 'Error al crear la cuenta' });
  }
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
/**
 * Autentica un estudiante existente y emite un JWT.
 *
 * Decisión de seguridad — mensaje de error genérico:
 *   El error "Usuario o contraseña incorrectos" es INTENCIONALMENTE ambiguo.
 *   Si dijéramos "usuario no encontrado" vs "contraseña incorrecta" por separado,
 *   un atacante podría enumerar qué usernames existen en el sistema (user
 *   enumeration attack). El mensaje unificado previene esto.
 *
 * @param {import('express').Request}  req - Body: { username, password }
 * @param {import('express').Response} res - 200 con { success, token, user } en éxito.
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ success: false, error: 'Usuario y contraseña requeridos' });

    // Buscar con username normalizado a minúsculas (consistente con el registro)
    const estudiante = await Estudiante.findOne({ username: username.toLowerCase() });
    if (!estudiante)
      return res.status(401).json({ success: false, error: 'Usuario o contraseña incorrectos' });

    // bcrypt.compare() extrae el salt del hash almacenado, hashea la contraseña
    // entrante con ese mismo salt y compara. Nunca se "deshashea" el original.
    // WHY no comparar directamente los strings: bcrypt.compare es timing-safe,
    // evitando ataques de temporización que miden cuánto tarda la comparación.
    const match = await bcrypt.compare(password, estudiante.password_hash);
    if (!match)
      return res.status(401).json({ success: false, error: 'Usuario o contraseña incorrectos' });

    const token = generateToken(estudiante._id);

    // Eliminar password_hash del objeto antes de enviarlo (misma razón que en register)
    const { password_hash: _, ...safe } = estudiante;

    res.json({ success: true, token, user: safe });
  } catch (err) {
    console.error('[auth/login]', err.message);
    res.status(500).json({ success: false, error: 'Error al iniciar sesión' });
  }
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
/**
 * Devuelve el perfil completo del estudiante autenticado.
 *
 * WHY este endpoint existe:
 *   Al cargar la app, el cliente tiene el token guardado pero puede no tener
 *   el perfil actualizado en memoria (ej: tras cerrar y reabrir la app).
 *   GET /me permite rehidratar el estado del usuario con datos frescos de la BD,
 *   usando solo el token (sin pedir credenciales de nuevo).
 *
 *   También es útil para reflejar cambios que ocurrieron en el servidor mientras
 *   el cliente estaba activo (nuevos badges, puntos actualizados por otra sesión).
 *
 * @param {import('express').Request}  req - req.user.id debe estar seteado por el middleware protect.
 * @param {import('express').Response} res - 200 con { success, user } (sin password_hash).
 */
const getMe = async (req, res) => {
  try {
    // req.user.id fue inyectado por el middleware protect tras verificar el JWT
    const estudiante = await Estudiante.findOne({ _id: req.user.id });
    if (!estudiante)
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });

    // Nuevamente, strip del hash antes de responder
    const { password_hash: _, ...safe } = estudiante;
    res.json({ success: true, user: safe });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al obtener usuario' });
  }
};

// loginPin se maneja en ninos.controller pero la ruta se registra en auth.routes
const { loginPin } = require('./ninos.controller');
module.exports = { register, login, getMe, loginPin };
