/**
 * LectoPlay — Middleware Global de Manejo de Errores
 * Grupo 10
 */

/**
 * Middleware de errores Express (4 parámetros)
 * Debe registrarse DESPUÉS de todas las rutas
 */
const errorMiddleware = (err, req, res, next) => {
  // Loguear el error completo en desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', err);
  }

  // Errores de validación de SQLite
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({
      success: false,
      message: 'Ya existe un registro con ese dato. Por favor verifica los campos.',
    });
  }

  // Error genérico con statusCode personalizado
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Ha ocurrido un error interno del servidor.';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Helper para crear errores con statusCode personalizado
 */
const createError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

module.exports = errorMiddleware;
module.exports.createError = createError;
