/**
 * Letramente — Auth Middleware JWT (NeDB)
 * Grupo 10
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * PATRÓN JWT BEARER TOKEN — ¿por qué lo usamos?
 * ─────────────────────────────────────────────────────────────────────────────
 * JWT (JSON Web Token) es un estándar (RFC 7519) para transmitir información
 * firmada digitalmente entre cliente y servidor.
 *
 * FLUJO completo:
 *   1. El cliente llama a POST /api/auth/login con {username, password}.
 *   2. El servidor verifica las credenciales y emite un JWT firmado con
 *      JWT_SECRET que contiene el payload { id: estudiante._id }.
 *   3. El cliente guarda el token (localStorage / AsyncStorage en React Native).
 *   4. En cada petición posterior, el cliente envía el header:
 *        Authorization: Bearer <token>
 *   5. ESTE middleware extrae y verifica el token antes de que el controlador
 *      procese la petición.
 *
 * ¿POR QUÉ AUTENTICACIÓN STATELESS (sin sesiones en servidor)?
 *   - Sin sesiones → el servidor NO necesita guardar estado de quién está
 *     conectado. Cualquier réplica del servidor puede verificar el token con
 *     solo conocer JWT_SECRET. Esto facilita escalado horizontal.
 *   - Sin cookies → funciona igual para apps móviles, SPAs y APIs REST puras.
 *   - El token expira solo (7d), reduciendo la necesidad de logout explícito
 *     (aunque el cliente puede simplemente descartar el token).
 *
 * SEGURIDAD: el token está FIRMADO (no cifrado). La firma HMAC-SHA256 con
 * JWT_SECRET garantiza integridad: si alguien modifica el payload, la firma
 * no coincidirá y jwt.verify() lanzará JsonWebTokenError.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * FORMATO DEL HEADER esperado:
 *   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                          └─── el token JWT base64url ───────────┘
 * ─────────────────────────────────────────────────────────────────────────────
 */

const jwt = require('jsonwebtoken');

/**
 * Middleware Express que protege rutas privadas verificando el JWT Bearer token.
 *
 * Si el token es válido, adjunta `req.user` al objeto de petición para que
 * los controladores downstream sepan quién hace la petición, sin tener que
 * volver a consultar la base de datos en cada request.
 *
 * @param {import('express').Request}  req  - Objeto de petición Express.
 *   Se espera req.headers.authorization con formato "Bearer <token>".
 * @param {import('express').Response} res  - Objeto de respuesta Express.
 * @param {import('express').NextFunction} next - Función para pasar al siguiente middleware.
 *
 * @sets req.user.id {string} — el _id del estudiante extraído del payload JWT.
 *   WHY: el _id de NeDB es un string único generado automáticamente (similar
 *   a ObjectId de MongoDB pero en formato string). Todos los controladores
 *   usan req.user.id para filtrar documentos del estudiante autenticado,
 *   garantizando aislamiento de datos entre usuarios.
 *
 * @returns HTTP 401 si el token falta, es inválido o está expirado.
 */
const protect = (req, res, next) => {
  let token;

  // Extraer el token del header Authorization.
  // WHY startsWith('Bearer '): el estándar OAuth 2.0 (RFC 6750) exige el
  // prefijo "Bearer " (con espacio). Verificarlo evita aceptar otros esquemas
  // de autenticación (Basic, Digest, etc.) que pudieran llegar por error.
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1]; // parte después de "Bearer "
  }

  // Si no se proporcionó token, rechazar antes de hacer ninguna consulta a la BD.
  // HTTP 401 Unauthorized = "no sé quién eres, identifícate primero".
  if (!token)
    return res.status(401).json({ success: false, error: 'No autorizado. Inicia sesión primero.' });

  try {
    // jwt.verify() hace DOS cosas a la vez:
    //   1. Verifica la firma HMAC: confirma que el token fue emitido por NOSOTROS.
    //   2. Verifica la expiración (campo `exp`): rechaza tokens caducados.
    // Si alguna falla, lanza una excepción (capturada abajo).
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'letramente_secret_2024');

    // Adjuntar solo el id al request; no toda la info del estudiante.
    // WHY solo el id: los controladores que necesiten más datos del usuario
    // deben buscarlos en la BD (datos frescos). Incluir nombre/rol en req.user
    // podría llevar a usar datos desactualizados si el perfil cambió después
    // de emitir el token.
    req.user = { id: decoded.id };

    next(); // Pasar el control al siguiente middleware o al controlador de la ruta
  } catch {
    // JsonWebTokenError  → firma inválida (token falsificado o corrupto)
    // TokenExpiredError  → el token superó su vida útil de 7 días
    // NotBeforeError     → el token no es válido aún (raro en nuestro caso)
    return res.status(401).json({ success: false, error: 'Token inválido o expirado.' });
  }
};

module.exports = protect;
