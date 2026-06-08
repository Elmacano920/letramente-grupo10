/**
 * Letramente — Telemetría de Errores Controller
 * Grupo 10 | Aprende, Comprende, Crea
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ¿QUÉ ES LA TELEMETRÍA EN ESTE CONTEXTO?
 * ─────────────────────────────────────────────────────────────────────────────
 * La telemetría registra cada respuesta INCORRECTA que da un estudiante en
 * tiempo real, junto con el contexto completo de la equivocación. A diferencia
 * de las partidas (que solo guardan el resumen final), la telemetría captura
 * el momento exacto del error, permitiendo análisis granulares.
 *
 * SIGNIFICADO PEDAGÓGICO DE LOS PARES DE CONFUSIÓN:
 *   Un "par de confusión" (ej: 'B-D') es la combinación de la letra correcta
 *   y la letra que el niño eligió por error. Estos pares tienen un fundamento
 *   en psicología cognitiva de la lectura:
 *
 *   - B/D: letras especulares horizontalmente → confusión visual por simetría.
 *   - P/Q: letras especulares verticalmente → mismo problema de simetría.
 *   - M/N: formas similares, diferenciadas solo por un trazo adicional.
 *   - C/G: casi idénticas, diferenciadas por una línea pequeña.
 *   - U/V: confusión fonética + visual en etapas tempranas de lectura.
 *
 *   Identificar que un niño confunde frecuentemente B con D no es un dato
 *   trivial: sugiere que aún no ha automatizado la orientación espacial de
 *   los grafemas, lo cual es una dificultad asociada a la dislexia temprana.
 *   La recomendación pedagógica generada automáticamente ayuda al docente
 *   a intervenir con ejercicios de trazado diferenciado.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SCHEMA de cada evento de error (colección `telemetria`):
 * {
 *   estudiante_id:    string,       ← _id del estudiante (de NeDB)
 *   reto_id:          string|null,  ← _id del reto donde ocurrió el error
 *   categoria:        'Vocales'|'Consonantes'|'Silabas'|'Palabras',
 *   opcion_elegida:   'B',          ← lo que pulsó el niño (normalizado a mayúsculas)
 *   opcion_correcta:  'D',          ← lo que era correcto (normalizado a mayúsculas)
 *   par_confusion:    'B-D',        ← clave normalizada (SIEMPRE menor primero: A-Z sort)
 *   palabraClave:     'BURRO',      ← contexto de la palabra en que ocurrió el error
 *   tiempo_respuesta: 4200,         ← ms desde que apareció la pregunta hasta el tap
 *   timestamp:        Date,         ← momento exacto del error (para análisis temporal)
 * }
 *
 * ANÁLISIS disponible (GET /api/telemetria/dashboard/:estudianteId):
 *   - Top 5 pares de confusión más frecuentes
 *   - Total errores por categoría
 *   - Progreso en el tiempo (errores por día, últimos 7 días)
 *   - Ratio acierto/error general
 *   - Recomendaciones pedagógicas automáticas
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { Telemetria, Partida } = require('../config/database');

// ─── Normalizar par de confusión ─────────────────────────────────────────────
/**
 * Convierte un par (elegida, correcta) en una clave canónica ordenada.
 *
 * EL TRUCO DE NORMALIZACIÓN:
 *   Sin normalización, el par ('B', 'D') y el par ('D', 'B') serían dos claves
 *   distintas en el análisis, aunque ambos representan la misma confusión
 *   (el niño que confunde B y D, independientemente de en qué dirección).
 *
 *   Ordenar alfabéticamente antes de unir con '-' garantiza que:
 *     normalizarPar('B', 'D') === 'B-D'
 *     normalizarPar('D', 'B') === 'B-D'  ← misma clave
 *
 *   Esto es crucial para el conteo de frecuencias: si no normalizáramos,
 *   un estudiante que confundió B→D cinco veces y D→B tres veces mostraría
 *   dos pares distintos de baja frecuencia, en vez de un par de alta frecuencia
 *   (8 ocurrencias) que revelaría el patrón real de dificultad.
 *
 * @param {string} a - Primera letra (opcion_elegida, ya en mayúsculas)
 * @param {string} b - Segunda letra (opcion_correcta, ya en mayúsculas)
 * @returns {string} Par canónico en formato "X-Y" donde X < Y (orden ASCII)
 *
 * @example
 *   normalizarPar('D', 'B') // → 'B-D'
 *   normalizarPar('P', 'Q') // → 'P-Q'
 */
function normalizarPar(a, b) {
  return [a, b].sort().join('-');
}

// ─── POST /api/telemetria/error ───────────────────────────────────────────────
/**
 * Registra un evento de error en tiempo real, llamado por el frontend
 * en cada respuesta incorrecta del estudiante durante un reto.
 *
 * DISEÑO DE LA LLAMADA:
 *   WHY llamar a este endpoint en cada error individual (y no al final del reto):
 *   - Si el estudiante abandona el reto a mitad, los errores ya están guardados.
 *   - Permite análisis de tiempo_respuesta por error específico, no solo promedio.
 *   - La granularidad permite detectar si los errores se concentran en ciertos
 *     tipos de preguntas dentro de un mismo reto.
 *
 *   TRADE-OFF: más requests al servidor (uno por error). Para el volumen de
 *   usuarios típico de una plataforma educativa escolar, esto es completamente
 *   manejable. Con millones de usuarios, se consideraría batching.
 *
 * @param {import('express').Request}  req - req.user.id + body:
 *   { reto_id?, categoria?, opcion_elegida, opcion_correcta, palabraClave?, tiempo_respuesta? }
 * @param {import('express').Response} res - 201 con { success, evento } en éxito.
 */
const registrarError = async (req, res) => {
  try {
    const estudianteId = req.user.id;
    const {
      reto_id,
      categoria,
      opcion_elegida,
      opcion_correcta,
      palabraClave = '',
      tiempo_respuesta = 0,
    } = req.body;

    // Solo validamos los campos mínimos para el análisis de confusión.
    // reto_id y categoria son opcionales para tolerar llamadas desde
    // mini-juegos fuera del flujo de retos formales.
    if (!opcion_elegida || !opcion_correcta) {
      return res.status(400).json({ success: false, error: 'opcion_elegida y opcion_correcta son requeridos' });
    }

    const evento = {
      estudiante_id:   estudianteId,
      reto_id:         reto_id || null,
      categoria:       categoria || 'unknown',
      // Normalizar a mayúsculas para consistencia en el análisis.
      // WHY: 'b' y 'B' son el mismo grafema; sin normalización aparecerían
      // como letras distintas en los pares de confusión.
      opcion_elegida:  opcion_elegida.toUpperCase(),
      opcion_correcta: opcion_correcta.toUpperCase(),
      // Aplicar el truco de normalización para crear la clave canónica del par
      par_confusion:   normalizarPar(opcion_elegida.toUpperCase(), opcion_correcta.toUpperCase()),
      palabraClave:    palabraClave.toUpperCase(),
      tiempo_respuesta: Number(tiempo_respuesta), // asegurar tipo numérico para análisis estadístico
      timestamp:       new Date(),
    };

    const guardado = await Telemetria.insert(evento);
    res.status(201).json({ success: true, evento: guardado });
  } catch (err) {
    console.error('[Telemetria] Error al registrar:', err.message);
    res.status(500).json({ success: false, error: 'Error al registrar error de telemetría' });
  }
};

// ─── GET /api/telemetria/dashboard/:estudianteId ──────────────────────────────
/**
 * Genera el reporte analítico completo para padres y docentes.
 *
 * AUDIENCIA: este endpoint es para adultos (padres, maestros), no para el niño.
 * La UI del dashboard usa esta data para mostrar gráficos de progreso y áreas
 * de dificultad de forma comprensible para no-técnicos.
 *
 * SECCIONES DEL REPORTE:
 *   1. Top pares de confusión    → identifica patrones de error sistemáticos
 *   2. Errores por categoría     → señala módulos débiles (Vocales, Sílabas, etc.)
 *   3. Progreso temporal (7d)    → ventana deslizante para ver tendencia reciente
 *   4. Ratio acierto/error       → métrica de desempeño global
 *   5. Recomendaciones pedagógicas → texto accionable para el docente
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LA VENTANA DE 7 DÍAS — WHY y cómo funciona:
 * ─────────────────────────────────────────────────────────────────────────────
 *   El análisis temporal usa una "rolling window" (ventana deslizante) de los
 *   últimos 7 días, calculada en el momento del request (no en base a fechas
 *   fijas como "esta semana").
 *
 *   WHY 7 días:
 *   - Una semana es la unidad natural de planificación docente.
 *   - Es suficiente para ver si el estudiante mejoró o empeoró recientemente.
 *   - Más días diluirían errores recientes con errores antiguos ya superados.
 *
 *   WHY rolling (no semana calendario):
 *   - Si el docente revisa el dashboard el jueves, ver "lunes a domingo pasado"
 *     incluiría datos de hace 10 días. La ventana deslizante siempre muestra
 *     los 7 días MÁS RECIENTES, que es lo más relevante pedagógicamente.
 *
 *   IMPLEMENTACIÓN:
 *     Se cargan TODOS los errores del estudiante desde la BD (un solo query),
 *     y luego se filtran en memoria por fecha. WHY no filtrar en el query:
 *     NeDB no soporta operadores de comparación de fecha tan eficientemente
 *     como MongoDB. Con el índice en estudiante_id, el subconjunto de errores
 *     de un estudiante ya es pequeño; filtrar en JS es rápido.
 *
 * @param {import('express').Request}  req - req.params.estudianteId + req.user (del middleware)
 * @param {import('express').Response} res - 200 con reporte completo o early return si no hay datos.
 */
const getDashboard = async (req, res) => {
  try {
    const { estudianteId } = req.params;

    // Control de acceso: el propio estudiante o un adulto puede ver el reporte.
    // WHY no solo el adulto: el niño mayor podría querer ver su propio progreso.
    // req.user.rol viene del payload JWT si se incluyera el rol en generateToken;
    // actualmente el JWT solo incluye el id, por lo que req.user.rol sería undefined
    // y la condición siempre permitiría acceso al propio estudiante.
    if (req.user.id !== estudianteId && req.user.rol !== 'adult') {
      return res.status(403).json({ success: false, error: 'Sin permisos para ver este reporte' });
    }

    // Un único query trae todos los errores; el análisis multi-dimensión se hace en memoria
    const errores = await Telemetria.find({ estudiante_id: estudianteId }, { timestamp: -1 });

    // Early return: si no hay errores, el reporte está vacío — no hay nada que calcular
    if (!errores.length) {
      return res.json({
        success: true,
        estudianteId,
        total_errores: 0,
        pares_confusion: [],
        errores_por_categoria: {},
        progreso_temporal: [],
        ratio_global: { aciertos: 0, errores: 0, porcentaje_acierto: 0 },
      });
    }

    // ── 1. Top pares de confusión ─────────────────────────────────────────────
    // Agrupar errores por par_confusion y contar frecuencias.
    // Como par_confusion ya está normalizado (siempre X-Y con X < Y), la
    // agrupación es directa: no hay duplicados por orden de letras.
    const frecuenciaPares = {};
    errores.forEach(e => {
      frecuenciaPares[e.par_confusion] = (frecuenciaPares[e.par_confusion] || 0) + 1;
    });
    const pares_confusion = Object.entries(frecuenciaPares)
      .map(([par, count]) => ({ par, count, letras: par.split('-') })) // letras: ['B','D']
      .sort((a, b) => b.count - a.count) // ordenar de más a menos frecuente
      .slice(0, 5); // Top 5: suficientes para mostrar en UI sin sobrecargar al docente

    // ── 2. Errores por categoría ──────────────────────────────────────────────
    // Agrupación simple por el campo `categoria` de cada evento de error.
    // Permite identificar si el niño tiene más dificultades en Sílabas que en Vocales.
    const errores_por_categoria = {};
    errores.forEach(e => {
      errores_por_categoria[e.categoria] = (errores_por_categoria[e.categoria] || 0) + 1;
    });

    // ── 3. Progreso temporal (últimos 7 días) — rolling window ────────────────
    // Construir un arreglo de 7 elementos, uno por día, del más antiguo al más reciente.
    const ahora = new Date();
    const progreso_temporal = [];
    for (let i = 6; i >= 0; i--) {
      const dia = new Date(ahora);
      dia.setDate(dia.getDate() - i); // i=6 → hace 6 días; i=0 → hoy
      const diaStr = dia.toISOString().split('T')[0]; // "YYYY-MM-DD"

      // Filtrar en memoria: comparar solo la parte de fecha (misma técnica que hoyStr())
      const erroresDia = errores.filter(e => {
        const eStr = new Date(e.timestamp).toISOString().split('T')[0];
        return eStr === diaStr;
      });

      progreso_temporal.push({
        fecha:  diaStr,
        errores: erroresDia.length,
        // Desglose por categoría ese día: permite ver si el error del martes
        // fue específicamente en Sílabas, dando contexto a la tendencia.
        categorias: erroresDia.reduce((acc, e) => {
          acc[e.categoria] = (acc[e.categoria] || 0) + 1;
          return acc;
        }, {}),
      });
    }

    // ── 4. Ratio global (necesita datos de partidas) ──────────────────────────
    // El ratio acierto/error se calcula combinando partidas (para los aciertos)
    // con la telemetría (para los errores).
    //
    // APROXIMACIÓN UTILIZADA:
    //   total_respuestas ≈ suma(errores por partida) + cantidad de partidas
    //   WHY: cada partida completada implica AL MENOS una respuesta correcta
    //   (la que cerró el reto). Esta es una aproximación, no el conteo exacto
    //   de respuestas, pero es suficiente para una métrica de tendencia general.
    const partidas = await Partida.find({ estudiante_id: estudianteId }, { completado_en: -1 });
    const totalRespuestas = partidas.reduce((acc, p) => acc + (p.errores_cometidos || 0), 0) + partidas.length;
    const totalAciertos   = partidas.length; // proxy: una partida = al menos un acierto
    const porcentajeAcierto = totalRespuestas > 0
      ? Math.round((totalAciertos / totalRespuestas) * 100)
      : 0;

    // ── 5. Recomendaciones pedagógicas automáticas ────────────────────────────
    // Lógica basada en reglas (rule-based) para generar texto accionable.
    // WHY rule-based y no ML: el volumen de datos por estudiante es pequeño
    // (decenas de errores, no miles). Las reglas simples son más confiables,
    // interpretables y mantenibles que un modelo en este contexto.
    const recomendaciones = [];

    // Regla 1: Si el par más confundido aparece 3+ veces, es un patrón sistemático
    if (pares_confusion[0]?.count >= 3) {
      const [a, b] = pares_confusion[0].letras;
      recomendaciones.push({
        tipo: 'confusion_frecuente',
        mensaje: `El estudiante confunde frecuentemente "${a}" con "${b}". Practica con trazos diferenciados.`,
        par: pares_confusion[0].par,
        // urgencia alta si ocurrió 5+ veces: sugiere un patrón entrenado difícil de romper
        urgencia: pares_confusion[0].count >= 5 ? 'alta' : 'media',
      });
    }

    // Regla 2: Si los errores en Sílabas son más del doble que en Vocales,
    // probablemente el estudiante no consolidó las vocales antes de avanzar.
    // La recomendación es retroceder al módulo prerequisito.
    if ((errores_por_categoria['Silabas'] || 0) > (errores_por_categoria['Vocales'] || 0) * 2) {
      recomendaciones.push({
        tipo: 'categoria_debil',
        mensaje: 'El módulo de Sílabas muestra más dificultad. Repasar módulo de Consonantes primero.',
        urgencia: 'media',
      });
    }

    res.json({
      success: true,
      estudianteId,
      generado_en:           new Date().toISOString(),
      total_errores:         errores.length,
      pares_confusion,       // Top 5 pares, ordenados por frecuencia
      errores_por_categoria, // { Vocales: 3, Silabas: 8, ... }
      progreso_temporal,     // Array de 7 días con conteo y desglose por categoría
      ratio_global: {
        aciertos:           totalAciertos,
        errores:            errores.length,
        porcentaje_acierto: porcentajeAcierto,
      },
      recomendaciones,       // Array de objetos { tipo, mensaje, urgencia, par? }
    });
  } catch (err) {
    console.error('[Telemetria] Dashboard error:', err.message);
    res.status(500).json({ success: false, error: 'Error al generar dashboard' });
  }
};

// ─── GET /api/telemetria/mis-errores ─────────────────────────────────────────
/**
 * Vista simplificada de errores para el propio estudiante (no el reporte adulto).
 *
 * WHY un endpoint separado del dashboard:
 *   - El dashboard es para adultos y genera cálculos costosos (pares, ratios, etc.)
 *   - El niño solo necesita ver sus errores recientes de forma simple para reflexionar.
 *   - Limitado a 20 errores: más sería abrumador para un estudiante de primaria.
 *   - No incluye recomendaciones pedagógicas (lenguaje orientado a adultos).
 *
 * WHY slice(0, 20) en la capa de aplicación y no con .limit() en la query:
 *   NeDB soporta .limit() en cursores (store.find().limit(20)), pero el helper
 *   promisify del database.js no expone esa opción. El slice en JS es O(1)
 *   y para volúmenes pequeños es totalmente aceptable.
 *
 * @param {import('express').Request}  req - req.user.id del estudiante.
 * @param {import('express').Response} res - 200 con { success, total, errores } (últimos 20)
 */
const getMisErrores = async (req, res) => {
  try {
    const errores = await Telemetria.find(
      { estudiante_id: req.user.id },
      { timestamp: -1 } // más recientes primero
    );
    res.json({ success: true, total: errores.length, errores: errores.slice(0, 20) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al cargar errores' });
  }
};

module.exports = { registrarError, getDashboard, getMisErrores };
