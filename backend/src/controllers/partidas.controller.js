/**
 * Letramente — Partidas Controller (NeDB)
 * Grupo 10 | Aprende, Comprende, Crea
 *
 * Una "partida" es la unidad fundamental de juego: el registro de que un
 * estudiante jugó un reto específico, con su resultado (score, errores,
 * tiempo, estrellas y puntos obtenidos).
 *
 * Tabla pivote: { _id, estudiante_id, reto_id, estado, estrellas,
 *                 errores_cometidos, puntos_ganados, tiempo_segundos, completado_en }
 *
 * Este controlador también orquesta:
 *   - El sistema de puntos y XP del estudiante
 *   - El desbloqueo de badges (logros)
 *   - El resumen estadístico por categoría
 */

const { Partida, Estudiante, Reto } = require('../config/database');

// ─── Calcular estrellas según score y errores ─────────────────────────────────
/**
 * Determina la cantidad de estrellas (0–3) obtenidas en una partida.
 *
 * FÓRMULA Y RAZONAMIENTO PEDAGÓGICO:
 *
 *   ⭐⭐⭐ (3 estrellas) → score ≥ 90  Y errores ≤ 1
 *     Casi perfecto: el estudiante domina el contenido. El umbral de 1 error
 *     tolera un tropiezo accidental (tap erróneo en touch) sin penalizar
 *     la excelencia real.
 *
 *   ⭐⭐   (2 estrellas) → score ≥ 70  Y errores ≤ 3
 *     Buen desempeño: comprende el contenido con algunos errores aceptables.
 *     Incentiva el reintento sin desmotivar. Es el resultado más frecuente
 *     para un estudiante en progreso.
 *
 *   ⭐    (1 estrella)  → score ≥ 50
 *     Aprobado mínimo: el estudiante respondió correctamente al menos la mitad.
 *     Recibe recompensa para mantener el engagement, aunque sea pequeña.
 *
 *   ☆    (0 estrellas) → score < 50
 *     No se dan puntos. El estudiante necesita repasar el contenido.
 *     WHY no dar puntos: premiar el fracaso reduciría la motivación para
 *     mejorar y distorsionaría las estadísticas de dominio.
 *
 * @param {number} score   - Puntuación porcentual (0–100) de la partida.
 * @param {number} errores - Número de respuestas incorrectas dadas.
 * @returns {0|1|2|3} Cantidad de estrellas obtenidas.
 */
const calcularEstrellas = (score, errores) => {
  if (score >= 90 && errores <= 1) return 3;
  if (score >= 70 && errores <= 3) return 2;
  if (score >= 50)                 return 1;
  return 0;
};

// ─── Calcular puntos según estrellas y tiempo ─────────────────────────────────
/**
 * Calcula los puntos finales obtenidos en una partida, aplicando multiplicadores
 * por calidad (estrellas) y velocidad (tiempo).
 *
 * TABLA DE MULTIPLICADORES POR ESTRELLAS:
 *   0 estrellas → ×0    (sin puntos; el reto no fue aprobado)
 *   1 estrella  → ×1    (puntos base completos)
 *   2 estrellas → ×1.5  (bono del 50% por buen desempeño)
 *   3 estrellas → ×2    (doble de puntos por excelencia)
 *
 *   WHY multiplicadores y no sumas fijas: escalar multiplicativamente hace
 *   que retos con más puntos_base tengan recompensas proporcionalmente mayores,
 *   incentivando que los estudiantes enfrenten retos más difíciles.
 *
 * BONO DE VELOCIDAD (speed bonus):
 *   < 30 segundos → ×1.2  (20% extra por respuesta muy rápida)
 *   < 60 segundos → ×1.1  (10% extra por respuesta rápida)
 *   ≥ 60 segundos → ×1.0  (sin bono; tomó su tiempo)
 *
 *   WHY bono de velocidad: en lectoescritura, la fluidez (automaticity) es
 *   tan importante como la precisión. Un niño que tarda 3 minutos en decidir
 *   una vocal aún está en decodificación consciente; el objetivo es que sea
 *   automático. El bono pequeño (20% máx.) incentiva velocidad sin sacrificar
 *   la precisión (el multiplicador de estrellas ya pondera la exactitud).
 *
 * @param {number} puntosBase  - Puntos base del reto (definido en retos.db).
 * @param {0|1|2|3} estrellas  - Estrellas obtenidas (calculadas antes).
 * @param {number} tiempoSeg   - Tiempo total de la partida en segundos.
 * @returns {number} Puntos finales redondeados al entero más cercano.
 */
const calcularPuntos = (puntosBase, estrellas, tiempoSeg) => {
  const mult = { 0: 0, 1: 1, 2: 1.5, 3: 2 }; // multiplicador por estrellas
  const bonus = tiempoSeg < 30 ? 1.2 : tiempoSeg < 60 ? 1.1 : 1; // bono de velocidad
  return Math.round(puntosBase * (mult[estrellas] || 1) * bonus);
};

// ─── Badges disponibles ────────────────────────────────────────────────────────
/**
 * Definición de todos los badges (logros) que el sistema puede otorgar.
 *
 * DISEÑO DEL SISTEMA DE BADGES:
 *   Cada badge tiene una función `check(ctx)` que recibe el contexto actual
 *   del estudiante y retorna true/false.
 *
 *   WHY funciones predicate en lugar de reglas hardcoded:
 *   - Fácil de extender: agregar un badge nuevo es solo un objeto nuevo en el array.
 *   - Fácil de testear: cada función es pura y testeable en aislamiento.
 *   - El contexto (ctx) se calcula UNA VEZ y se pasa a todos los checks,
 *     evitando múltiples consultas a la BD por badge.
 *
 *   WHY badges por cantidad acumulada (no por sesión):
 *   - Motivan el retorno diario y la práctica sostenida.
 *   - Un badge como "Maestro de Vocales" (5 retos) requiere varias sesiones,
 *     creando un arco de progresión que va más allá de una sola partida.
 *
 * @type {Array<{slug: string, title: string, description: string, icon: string,
 *               check: function({totalPartidas, ultimasEstrellas, conteoVocales,
 *                                conteoSilabas, conteopalabras}): boolean}>}
 */
const BADGES = [
  {
    slug: 'primera-estrella',
    title: '¡Primera Estrella!',
    description: 'Completaste tu primer reto',
    icon: '⭐',
    // Se otorga en la mismísima primera partida completada. Es el "onboarding badge",
    // fundamental para que el niño sienta éxito desde el inicio.
    check: ({ totalPartidas }) => totalPartidas === 1,
  },
  {
    slug: 'tres-estrellas',
    title: 'Perfección Total',
    description: 'Obtuviste 3 estrellas en un reto',
    icon: '🌟',
    // Basado en la ÚLTIMA partida (ultimasEstrellas), no en el histórico.
    // WHY: es un logro de calidad instantánea, no acumulativa. Se puede obtener
    // en cualquier momento, incentivando volver a intentar retos con excelencia.
    check: ({ ultimasEstrellas }) => ultimasEstrellas === 3,
  },
  {
    slug: 'vocales-master',
    title: 'Maestro de Vocales',
    description: 'Completaste 5 retos de Vocales',
    icon: '🔤',
    // WHY umbral 5: las vocales son la base de la lectoescritura en español.
    // Completar 5 retos indica dominio sólido del módulo fundacional.
    check: ({ conteoVocales }) => conteoVocales >= 5,
  },
  {
    slug: 'silabas-pro',
    title: 'Pro de Sílabas',
    description: 'Completaste 4 retos de Sílabas',
    icon: '📝',
    // WHY umbral 4 (menor que vocales): las sílabas son más complejas, así que
    // el umbral es ligeramente menor para mantener la motivación alcanzable.
    check: ({ conteoSilabas }) => conteoSilabas >= 4,
  },
  {
    slug: 'palabras-crack',
    title: '¡Crack de Palabras!',
    description: 'Completaste 4 retos de Palabras',
    icon: '📖',
    check: ({ conteopalabras }) => conteopalabras >= 4,
  },
];

// ─── POST /api/partidas ───────────────────────────────────────────────────────
/**
 * Registra una nueva partida completada y actualiza el perfil del estudiante.
 *
 * Orquestación completa (en orden):
 *   1. Validar que reto_id existe en la BD.
 *   2. Calcular estrellas y puntos con las fórmulas anteriores.
 *   3. Persistir la partida en partidas.db.
 *   4. Actualizar puntos_globales y experiencia del estudiante.
 *      - puntos_globales += puntos_ganados  (para ranking entre estudiantes)
 *      - experiencia     += puntos_ganados * 2  (para nivel de mascota; factor 2
 *        hace que la mascota evolucione más rápido que los puntos del ranking)
 *   5. Evaluar si se desbloquearon nuevos badges.
 *   6. Responder con la partida, estrellas, puntos y badges nuevos.
 *
 * @param {import('express').Request}  req - req.user.id + body: { reto_id, score, errores_cometidos, tiempo_segundos }
 * @param {import('express').Response} res - 201 con { success, partida, estrellas, puntos_ganados, badges_nuevos }
 */
const registrarPartida = async (req, res) => {
  try {
    const { reto_id, score = 0, errores_cometidos = 0, tiempo_segundos = 0 } = req.body;
    const estudiante_id = req.user.id;

    if (!reto_id)
      return res.status(400).json({ success: false, error: 'reto_id es requerido' });

    const reto = await Reto.findOne({ _id: reto_id });
    if (!reto)
      return res.status(404).json({ success: false, error: 'Reto no encontrado' });

    const estrellas      = calcularEstrellas(score, errores_cometidos);
    const puntos_ganados = calcularPuntos(reto.puntos_base || 10, estrellas, tiempo_segundos);

    // Guardar la partida — registro permanente e inmutable del desempeño
    const partida = await Partida.insert({
      estudiante_id,
      reto_id,
      estado:            true,        // true = completada (vs. partida abandonada)
      estrellas,
      errores_cometidos,
      puntos_ganados,
      tiempo_segundos,
      completado_en:     new Date(),
    });

    // Actualizar el perfil del estudiante con los nuevos puntos y XP
    const estudiante = await Estudiante.findOne({ _id: estudiante_id });
    const puntosNuevos = (estudiante?.puntos_globales || 0) + puntos_ganados;
    // XP = puntos * 2: la mascota evoluciona el doble de rápido que el ranking,
    // dando feedback de progreso más frecuente para mantener la motivación.
    const expNueva     = (estudiante?.experiencia     || 0) + puntos_ganados * 2;

    await Estudiante.update(
      { _id: estudiante_id },
      { $set: { puntos_globales: puntosNuevos, experiencia: expNueva } }
    );

    // ── Calcular badges nuevos ──────────────────────────────────────────────
    // Recuperamos TODAS las partidas completadas para calcular el contexto de badges.
    // WHY no cachear esto: el contexto de badges debe ser exacto. Cualquier
    // inconsistencia podría otorgar badges duplicados o perdidos.
    const todasLasPartidas = await Partida.find({ estudiante_id, estado: true });

    // Contar partidas por categoría (requiere un JOIN implícito con retos.db)
    const conteo = { Vocales: 0, Silabas: 0, Palabras: 0 };
    for (const p of todasLasPartidas) {
      const r = await Reto.findOne({ _id: p.reto_id });
      if (r?.categoria) conteo[r.categoria] = (conteo[r.categoria] || 0) + 1;
    }

    // Contexto pasado a todas las funciones `check` de los badges
    const ctx = {
      totalPartidas:    todasLasPartidas.length,
      ultimasEstrellas: estrellas,          // estrellas de ESTA partida específica
      conteoVocales:    conteo.Vocales,
      conteoSilabas:    conteo.Silabas,
      conteopalabras:   conteo.Palabras,
    };

    /**
     * WHY usar un Set para deduplicación de badges:
     *   Los badges ya obtenidos están en estudiante.badges como array de objetos.
     *   Convertirlos a un Set de slugs permite verificar pertenencia en O(1)
     *   (badgesActuales.has(slug)) en vez de O(n) con Array.includes().
     *   Esto es especialmente importante si el array de badges crece con el tiempo.
     *   El Set también garantiza que aunque hubiera un duplicado en el array
     *   almacenado (por un bug anterior), no se vuelva a otorgar el mismo badge.
     */
    const badgesActuales = new Set((estudiante?.badges || []).map(b => b.slug));
    const badgesNuevos   = BADGES.filter(b => !badgesActuales.has(b.slug) && b.check(ctx))
      // Omitir la función `check` del objeto antes de guardarlo en la BD:
      // Las funciones no son serializables a JSON y causarían un error en NeDB.
      .map(({ check: _, ...b }) => b);

    if (badgesNuevos.length > 0) {
      const todosLosBadges = [...(estudiante?.badges || []), ...badgesNuevos];
      await Estudiante.update({ _id: estudiante_id }, { $set: { badges: todosLosBadges } });
    }

    res.status(201).json({
      success:       true,
      partida,
      estrellas,
      puntos_ganados,
      badges_nuevos: badgesNuevos, // El frontend usa esto para mostrar animaciones de logro
    });
  } catch (err) {
    console.error('[partidas/registrar]', err.message);
    res.status(500).json({ success: false, error: 'Error al registrar la partida' });
  }
};

// ─── GET /api/partidas/:estudianteId ─────────────────────────────────────────
/**
 * Devuelve el historial de partidas de un estudiante, enriquecido con la
 * información del reto correspondiente a cada partida.
 *
 * WHY slice(0, 50):
 *   Limitar a las últimas 50 partidas protege contra payloads gigantescos
 *   si un estudiante ha jugado cientos de veces. El historial completo rara
 *   vez es útil en la UI; la pantalla solo muestra las más recientes.
 *   Para casos de análisis completo, existe GET /resumen que agrega los datos.
 *
 * @param {import('express').Request}  req - req.params.estudianteId
 * @param {import('express').Response} res - 200 con { success, total, partidas }
 */
const getPartidasEstudiante = async (req, res) => {
  try {
    const { estudianteId } = req.params;
    // Ordenar por completado_en descendente: las más recientes primero
    const partidas = await Partida.find({ estudiante_id: estudianteId }, { completado_en: -1 });

    // "Poblar" el reto: reemplazar reto_id (string) por el objeto completo del reto.
    // WHY Promise.all: lanzar todas las búsquedas de retos en paralelo es más
    // rápido que secuencial (await dentro de for loop). Para 50 partidas, esto
    // hace ~50 lecturas en paralelo en vez de secuencialmente.
    const conReto = await Promise.all(partidas.slice(0, 50).map(async p => {
      const reto = await Reto.findOne({ _id: p.reto_id });
      return { ...p, reto_id: reto || p.reto_id }; // fallback al id si el reto fue eliminado
    }));

    res.json({ success: true, total: conReto.length, partidas: conReto });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al obtener las partidas' });
  }
};

// ─── GET /api/partidas/:estudianteId/resumen ──────────────────────────────────
/**
 * Devuelve un resumen agregado del desempeño del estudiante, agrupado por categoría.
 *
 * Output: { resumen: { Vocales: { total_jugadas, estrellas_total, puntos_total }, ... } }
 *
 * WHY este endpoint separado de getPartidasEstudiante:
 *   El resumen trabaja sobre TODAS las partidas (sin límite de 50) porque necesita
 *   datos completos para calcular promedios significativos. Si el estudiante jugó
 *   200 partidas, el resumen las agrega todas. El historial paginado sirve para
 *   mostrar en pantalla; el resumen sirve para estadísticas de progreso.
 *
 * @param {import('express').Request}  req - req.params.estudianteId
 * @param {import('express').Response} res - 200 con { success, resumen }
 */
const getResumenEstudiante = async (req, res) => {
  try {
    const { estudianteId } = req.params;
    // Solo partidas completadas (estado: true) para estadísticas limpias
    const partidas = await Partida.find({ estudiante_id: estudianteId, estado: true });

    // Acumular métricas por categoría usando el reto de cada partida
    const resumen = {};
    for (const p of partidas) {
      const reto = await Reto.findOne({ _id: p.reto_id });
      const cat  = reto?.categoria || 'Sin categoría';
      if (!resumen[cat]) resumen[cat] = { total_jugadas: 0, estrellas_total: 0, puntos_total: 0 };
      resumen[cat].total_jugadas++;
      resumen[cat].estrellas_total += p.estrellas;
      resumen[cat].puntos_total    += p.puntos_ganados;
    }

    res.json({ success: true, resumen });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al obtener el resumen' });
  }
};

module.exports = { registrarPartida, getPartidasEstudiante, getResumenEstudiante };
