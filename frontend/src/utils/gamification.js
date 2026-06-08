/**
 * LectoPlay — Utilidades de Gamificación
 * Grupo 10
 *
 * Este módulo centraliza TODA la lógica de recompensas:
 *   - Niveles de XP del jugador (5 niveles con nombres pedagógicos)
 *   - Cálculo de estrellas (0–3) por puntuación
 *   - Cálculo de puntos con multiplicadores de velocidad
 *   - Catálogo de badges (insignias desbloqueables)
 *   - Mensajes motivacionales contextuales
 *
 * PRINCIPIO DE DISEÑO: Todo el cálculo ocurre aquí para que
 * los componentes de juego no contengan lógica de negocio.
 * Si necesitas cambiar la fórmula de puntos, solo cambias este archivo.
 */

// ─── Sistema de Niveles ───────────────────────────────────────────────────────
// Los nombres siguen una progresión pedagógica:
// Aprendiz → Explorador → Lector → Escritor → Maestro
// Esto motiva al niño con un objetivo claro y alcanzable.
export const LEVELS = [
  { level: 1, name: 'Aprendiz',   icon: '🌱', minXP: 0,   maxXP: 49,  color: '#10b981' },
  { level: 2, name: 'Explorador', icon: '🗺️', minXP: 50,  maxXP: 149, color: '#f59e0b' },
  { level: 3, name: 'Lector',     icon: '📖', minXP: 150, maxXP: 299, color: '#6366f1' },
  { level: 4, name: 'Escritor',   icon: '✍️', minXP: 300, maxXP: 499, color: '#ec4899' },
  { level: 5, name: 'Maestro',    icon: '🏆', minXP: 500, maxXP: null, color: '#f59e0b' },
];

// ─── Badges Disponibles ───────────────────────────────────────────────────────
export const BADGES_CATALOG = [
  { slug: 'first_letter',   title: 'Primera Letra',         icon: '🌟', description: 'Completaste tu primera actividad de fonética' },
  { slug: 'word_explorer',  title: 'Explorador de Palabras', icon: '🗺️', description: 'Completaste 5 actividades de palabras' },
  { slug: 'super_reader',   title: 'Super Lector',           icon: '📚', description: 'Terminaste tu primer cuento' },
  { slug: 'perfect_score',  title: 'Perfección',             icon: '⭐', description: 'Obtuviste 3 estrellas en una actividad' },
  { slug: 'streak_7',       title: 'Semana de Campeón',      icon: '🏆', description: 'Jugaste 7 días seguidos' },
  { slug: 'points_100',     title: 'Cien Puntos',            icon: '💯', description: 'Alcanzaste 100 puntos' },
];

// ─── Funciones de Utilidad ───────────────────────────────────────────────────

/**
 * Obtener información completa del nivel actual basado en XP total.
 *
 * Algoritmo: itera todos los niveles y se queda con el último
 * cuyo minXP sea ≤ a la experiencia del usuario (reduce con acumulador).
 *
 * @param {number} experience - XP total acumulado del usuario
 * @returns {{
 *   level: number,
 *   name: string,
 *   icon: string,
 *   nextLevel: object|null,     // null si está en el nivel máximo
 *   xpInCurrentLevel: number,   // XP dentro del nivel actual
 *   xpNeededForNext: number|null, // cuánto falta para subir
 *   progress: number            // 0-100, para la barra de progreso
 * }}
 */
export const getLevelInfo = (experience = 0) => {
  const currentLevel = LEVELS.reduce((acc, lvl) => {
    if (experience >= lvl.minXP) return lvl;
    return acc;
  }, LEVELS[0]);

  const nextLevel = LEVELS.find(l => l.level === currentLevel.level + 1);
  const xpInCurrentLevel = experience - currentLevel.minXP;
  const xpNeededForNext = nextLevel ? nextLevel.minXP - currentLevel.minXP : null;
  const progress = xpNeededForNext ? Math.min((xpInCurrentLevel / xpNeededForNext) * 100, 100) : 100;

  return {
    ...currentLevel,
    nextLevel,
    xpInCurrentLevel,
    xpNeededForNext,
    progress: Math.round(progress),
  };
};

/**
 * Calcular número de estrellas basado en score (0-100).
 *
 * CRITERIOS PEDAGÓGICOS:
 *   95%+ → 3 estrellas: dominio completo de la habilidad
 *   75%+ → 2 estrellas: comprensión sólida con algunos errores
 *   50%+ → 1 estrella:  comprensión básica, necesita práctica
 *   <50% → 0 estrellas: requiere refuerzo antes de avanzar
 *
 * Nota: El backend usa umbrales ligeramente distintos (90/70/50)
 * basados además en errores_cometidos. Esta función es para
 * cálculos rápidos en el frontend sin esperar la respuesta del servidor.
 *
 * @param {number} score - Porcentaje de aciertos (0-100)
 * @returns {0|1|2|3}
 */
export const calculateStars = (score) => {
  if (score >= 95) return 3;
  if (score >= 75) return 2;
  if (score >= 50) return 1;
  return 0;
};

/**
 * Calcular el total de puntos ganados por una actividad.
 *
 * ESTRUCTURA DE PUNTOS:
 *   base (10 pts)          — por participar
 *   + starBonus (0/5/15)   — bonus por 1/2/3 estrellas
 *   + speedBonus (5)       — si completa en < 30 segundos
 *   + firstTimeBonus (5)   — primera vez que completa el reto
 *
 * El bonus de velocidad incentiva la fluidez lectora, que es
 * un indicador clave del desarrollo de la lectoescritura.
 *
 * @param {number} score       - Score de la actividad (0-100)
 * @param {number} timeSecs    - Tiempo utilizado en segundos
 * @param {boolean} isFirstTime - Si es la primera vez completada
 * @returns {{ total, base, starBonus, speedBonus, firstTimeBonus }}
 */
export const calculatePoints = (score, timeSecs = 0, isFirstTime = true) => {
  if (score < 50) return { total: 0, base: 0, starBonus: 0, speedBonus: 0 };

  const base = 10;
  const stars = calculateStars(score);
  const starBonus = stars === 3 ? 15 : stars === 2 ? 5 : 0;
  const speedBonus = (timeSecs > 0 && timeSecs < 30 && isFirstTime) ? 5 : 0;
  const firstTimeBonus = isFirstTime ? 5 : 0;

  return {
    base,
    starBonus,
    speedBonus,
    firstTimeBonus,
    total: base + starBonus + speedBonus + firstTimeBonus,
  };
};

/**
 * Formatear número de puntos con separador de miles
 * @param {number} points
 * @returns {string}
 */
export const formatPoints = (points = 0) => {
  return points.toLocaleString('es-ES');
};

/**
 * Obtener color por módulo
 * @param {string} slug - 'phonics' | 'words' | 'reading'
 */
export const getModuleColor = (slug) => {
  const colors = {
    phonics: '#f59e0b',
    words:   '#10b981',
    reading: '#6366f1',
  };
  return colors[slug] || '#7c3aed';
};

/**
 * Obtener mensaje motivacional aleatorio
 * @param {number} stars - 0 | 1 | 2 | 3
 * @returns {string}
 */
export const getMotivationalMessage = (stars) => {
  const messages = {
    3: ['¡Perfecto! 🎉', '¡Increíble! ⭐', '¡Eres un genio! 🧠', '¡Fantástico! 🚀'],
    2: ['¡Muy bien! 😊', '¡Buen trabajo! 👏', '¡Lo lograste! 🎊', '¡Estupendo! ✨'],
    1: ['¡Bien! 💪', '¡Sigue así! 🌟', '¡Ya casi! 😄'],
    0: ['¡Inténtalo de nuevo! 💪', '¡Tú puedes! 🌈', '¡Sigue practicando! 📚'],
  };
  const options = messages[stars] || messages[0];
  return options[Math.floor(Math.random() * options.length)];
};

/**
 * Calcular porcentaje de completitud de un módulo
 */
export const getModuleCompletion = (progress) => {
  if (!progress?.total_activities || progress.total_activities === 0) return 0;
  return Math.round((progress.completed_activities / progress.total_activities) * 100);
};
