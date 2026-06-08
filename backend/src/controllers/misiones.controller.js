/**
 * Letramente — Misiones Diarias Controller
 * Grupo 10 | Aprende, Comprende, Crea
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ESTRATEGIA DE RESET DIARIO — sin cron, sin colas, sin jobs externos
 * ─────────────────────────────────────────────────────────────────────────────
 * El sistema de misiones usa una estrategia "lazy reset" (reset perezoso):
 * las misiones NO se regeneran en un horario fijo (como un cron de medianoche),
 * sino que se regeneran ON DEMAND cuando el estudiante entra a la pantalla.
 *
 * FLUJO:
 *   1. El cliente llama a GET /api/misiones/hoy.
 *   2. El servidor busca misiones con { estudiante_id, fecha_asignada: HOY }.
 *   3. Si existen → las devuelve tal cual (ya fueron generadas hoy).
 *   4. Si NO existen (primer acceso del día) → borra las viejas y genera 3 nuevas.
 *
 * WHY este enfoque (sin cron):
 *   ✔  Sin dependencias externas: no se necesita node-cron, Bull, Agenda, etc.
 *   ✔  Sin drift de zona horaria: el "día" se calcula en el momento del request,
 *      en la zona horaria del servidor. (Una mejora futura sería calcularlo en
 *      la zona del estudiante usando su offset UTC.)
 *   ✔  Eficiente: solo se hace trabajo cuando el estudiante está activo.
 *      Un estudiante que no entra en 3 días no genera 3 días de misiones vacías.
 *   ✔  Simple de debuggear: no hay procesos background que puedan fallar
 *      silenciosamente. Si las misiones no se generan, el error aparece en el request.
 *
 * TRADE-OFF: si el servidor cambia de zona horaria, los estudiantes podrían
 * ver un reset inesperado. Documentado aquí para una futura mejora.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * MAPEO XP → MASCOTA (niveles de evolución)
 * ─────────────────────────────────────────────────────────────────────────────
 * La mascota es el representante visual del progreso del estudiante.
 * Evoluciona a medida que acumula XP (experiencia), que se obtiene de:
 *   - Completar partidas (puntos_ganados × 2)
 *   - Completar misiones diarias (xp_reward de cada misión)
 *
 * Mapa de evolución:
 *   0–99   XP  → Huevo 🥚          (nivel 0: recién empezando)
 *   100–299    → Pollito 🐣         (nivel 1: primeros pasos)
 *   300–599    → Pajarito 🐥        (nivel 2: progreso visible)
 *   600–999    → Pájaro 🐦          (nivel 3: avanzado)
 *   1000–1999  → Pájaro Brillante 🦜 (nivel 4: experto)
 *   2000+      → Dragón 🐉          (nivel 5: maestro)
 *
 * WHY rangos crecientes (no intervalos iguales):
 *   Los primeros niveles son más fáciles de alcanzar (100 XP, 200 XP de diff)
 *   para dar feedback positivo temprano y enganchar al estudiante.
 *   Los niveles superiores requieren más XP acumulada, creando un arco de
 *   progresión a largo plazo que motiva el retorno durante semanas.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { Mision, Estudiante } = require('../config/database');

// ─── Plantillas de misiones disponibles ─────────────────────────────────────
/**
 * Pool de misiones posibles. Cada día se seleccionan 3 al azar de este pool.
 *
 * WHY plantillas y no misiones hardcoded para cada día:
 *   - Más variedad: el estudiante no sabe exactamente qué misiones tendrá mañana.
 *   - Fácil de extender: agregar una misión nueva solo requiere un objeto aquí.
 *   - El xp_reward está calibrado por dificultad: misiones más difíciles (racha_5,
 *     perfecto_silaba) dan más XP que las básicas (madrugador).
 *
 * @type {Array<{slug, titulo, descripcion, categoria, meta, xp_reward, emoji}>}
 */
const PLANTILLAS_MISIONES = [
  { slug: 'vocales_3',      titulo: '¡A las vocales!',    descripcion: 'Completa 3 retos de Vocales',    categoria: 'Vocales',     meta: 3,  xp_reward: 30,  emoji: '🔤' },
  { slug: 'consonantes_2',  titulo: 'Consonantes pro',    descripcion: 'Completa 2 retos de Consonantes',categoria: 'Consonantes', meta: 2,  xp_reward: 25,  emoji: '🔡' },
  { slug: 'silabas_3',      titulo: 'Silabista experto',  descripcion: 'Completa 3 retos de Sílabas',    categoria: 'Silabas',     meta: 3,  xp_reward: 35,  emoji: '📝' },
  { slug: 'palabras_2',     titulo: '¡Construye palabras!',descripcion: 'Completa 2 retos de Palabras',  categoria: 'Palabras',    meta: 2,  xp_reward: 40,  emoji: '📖' },
  { slug: 'racha_5',        titulo: 'Sin fallar',          descripcion: 'Responde 5 seguidas correctas',  categoria: 'any',         meta: 5,  xp_reward: 50,  emoji: '🔥' },
  { slug: 'madrugador',     titulo: '¡Madrugador!',        descripcion: 'Juega antes de las 10am',         categoria: 'any',         meta: 1,  xp_reward: 20,  emoji: '🌅' },
  { slug: 'perfecto_silaba',titulo: '¡Perfección silábica!',descripcion: 'Obtén 3 estrellas en Sílabas',  categoria: 'Silabas',     meta: 1,  xp_reward: 45,  emoji: '⭐' },
];

/**
 * Tabla de niveles de mascota indexada por rango de XP.
 * Se busca secuencialmente; el primer nivel cuyo rango incluya xpTotal es el actual.
 * El último nivel tiene xp_max: Infinity para capturar cualquier cantidad de XP.
 */
const MASCOTA_NIVELES = [
  { xp_min: 0,    xp_max: 99,   nombre: 'Huevo',           emoji: '🥚', nivel: 0 },
  { xp_min: 100,  xp_max: 299,  nombre: 'Pollito',         emoji: '🐣', nivel: 1 },
  { xp_min: 300,  xp_max: 599,  nombre: 'Pajarito',        emoji: '🐥', nivel: 2 },
  { xp_min: 600,  xp_max: 999,  nombre: 'Pájaro',          emoji: '🐦', nivel: 3 },
  { xp_min: 1000, xp_max: 1999, nombre: 'Pájaro Brillante',emoji: '🦜', nivel: 4 },
  { xp_min: 2000, xp_max: Infinity, nombre: 'Dragón',      emoji: '🐉', nivel: 5 },
];

/**
 * Determina el nivel de mascota actual basado en la XP total del estudiante.
 *
 * WHY .find() con fallback a MASCOTA_NIVELES[0]:
 *   El fallback al Huevo (nivel 0) cubre el caso de un estudiante con XP = 0
 *   o cualquier valor que no caiga en ningún rango (edge case defensivo).
 *
 * @param {number} xpTotal - XP acumulada del estudiante (campo `experiencia` en BD).
 * @returns {object} El objeto de nivel correspondiente de MASCOTA_NIVELES.
 */
function getMascotaInfo(xpTotal) {
  return MASCOTA_NIVELES.find(n => xpTotal >= n.xp_min && xpTotal <= n.xp_max)
    || MASCOTA_NIVELES[0];
}

/**
 * Retorna la fecha de hoy en formato "YYYY-MM-DD" (solo la parte de fecha, sin hora).
 *
 * WHY solo la fecha (no datetime):
 *   Comparar fechas con timestamps completos (incluyendo hora) haría que dos
 *   requests del mismo día (a las 9am y a las 3pm) no coincidieran en la query.
 *   Truncar a YYYY-MM-DD normaliza el "día" independientemente de la hora.
 *   Esta es la clave que activa el reset: si fecha_asignada !== hoyStr(), se resetea.
 *
 * @returns {string} Fecha en formato ISO "YYYY-MM-DD", ej: "2026-06-03"
 */
function hoyStr() {
  return new Date().toISOString().split('T')[0]; // "2026-06-02"
}

/**
 * Selecciona 3 misiones aleatorias del pool de plantillas para el día.
 *
 * WHY shuffle con Math.random() - 0.5:
 *   Es el método de shuffle in-place más conciso en JS (aunque no
 *   estadísticamente perfecto como Fisher-Yates). Para un pool de 7 misiones
 *   y una selección casual, la distribución es suficientemente uniforme.
 *   Una mejora futura podría usar un shuffle de Fisher-Yates para mayor rigor.
 *
 * @returns {Array} 3 objetos de plantilla de misión seleccionados aleatoriamente.
 */
function elegirMisionesDelDia() {
  // Tomar 3 misiones aleatorias de la plantilla
  const mezcladas = [...PLANTILLAS_MISIONES].sort(() => Math.random() - 0.5);
  return mezcladas.slice(0, 3);
}

// ─── GET /api/misiones/hoy ────────────────────────────────────────────────────
/**
 * Devuelve las 3 misiones diarias del estudiante autenticado.
 * Si no existen misiones para hoy, las genera automáticamente (lazy reset).
 *
 * También devuelve el estado completo de la mascota del estudiante para
 * que el frontend muestre la evolución y el progreso en una sola llamada.
 *
 * @param {import('express').Request}  req - req.user.id del estudiante.
 * @param {import('express').Response} res - 200 con { success, fecha, misiones, mascota }
 */
const getMisionesHoy = async (req, res) => {
  try {
    const estudianteId = req.user.id;
    const hoy = hoyStr();

    // Buscar misiones activas de hoy (fecha_asignada === "YYYY-MM-DD" de hoy)
    let misiones = await Mision.find({ estudiante_id: estudianteId, fecha_asignada: hoy });

    // Si no hay misiones para hoy → RESET: borrar viejas y generar nuevas
    if (!misiones.length) {
      // Limpiar misiones viejas de este estudiante (de días anteriores).
      // WHY borrar en vez de marcar: los datos viejos no tienen valor analítico
      // en el contexto de misiones. Borrar mantiene la colección pequeña.
      // { multi: true } es necesario para que NeDB borre más de 1 documento.
      await Mision.remove({ estudiante_id: estudianteId }, { multi: true });

      // Generar 3 misiones nuevas basadas en plantillas aleatorias
      const plantillas = elegirMisionesDelDia();
      const nuevas = plantillas.map(p => ({
        ...p,
        estudiante_id:  estudianteId,
        fecha_asignada: hoy,
        progreso:       0,          // Progreso actual hacia la meta
        completada:     false,      // Flag de completitud para la UI
        xp_otorgada:    false,      // Flag anti-duplicado (ver actualizarProgreso)
        creada_en:      new Date(),
      }));

      // Insertar secuencialmente (no en paralelo) para garantizar orden consistente
      misiones = [];
      for (const m of nuevas) {
        const insertada = await Mision.insert(m);
        misiones.push(insertada);
      }
    }

    // Calcular mascota del estudiante para respuesta completa
    const est = await Estudiante.findOne({ _id: estudianteId });
    const xpTotal = est?.experiencia || 0;
    const mascota = getMascotaInfo(xpTotal);

    // XP restante para la próxima evolución
    const siguienteNivel = MASCOTA_NIVELES.find(n => n.nivel === mascota.nivel + 1);
    const xpParaEvolucionar = siguienteNivel ? siguienteNivel.xp_min - xpTotal : 0;

    res.json({
      success: true,
      fecha:   hoy,
      misiones,
      mascota: {
        ...mascota,
        xpTotal,
        xpParaEvolucionar: Math.max(0, xpParaEvolucionar), // nunca negativo
        proximaEvolucion: siguienteNivel || null, // null si ya es nivel máximo (Dragón)
      },
    });
  } catch (err) {
    console.error('[Misiones] Error:', err.message);
    res.status(500).json({ success: false, error: 'Error al cargar misiones' });
  }
};

// ─── POST /api/misiones/progreso ──────────────────────────────────────────────
/**
 * Actualiza el progreso de una misión y otorga XP si se completa por primera vez.
 *
 * Body: { mision_id, incremento? }
 *   - mision_id:  ID de la misión a actualizar (debe pertenecer al estudiante de hoy)
 *   - incremento: cuánto avanzar el progreso (default 1). El frontend puede pasar
 *                 valores > 1 si el estudiante completó múltiples acciones de golpe.
 *
 * PROTECCIÓN ANTI-DOBLE-XP con `xp_otorgada`:
 *   El campo `xp_otorgada` (boolean) es el mecanismo que previene que el mismo
 *   estudiante reciba XP dos veces por la misma misión.
 *
 *   WHY es necesario:
 *     Sin este flag, si actualizarProgreso se llama dos veces cuando completada=true
 *     (ej: bug en el frontend, request duplicado por timeout+retry), el servidor
 *     otorgaría XP en cada llamada, inflando fraudulentamente la experiencia.
 *
 *   FLUJO:
 *     Primera vez que completada pasa a true:
 *       → xp_otorgada era false → se otorga XP → se setea xp_otorgada = true
 *     Llamadas posteriores cuando completada = true:
 *       → xp_otorgada es true → NO se otorga más XP → xpGanada = 0
 *
 *   WHY no usar completada como guard:
 *     completada=true devuelve early exit, pero el check explícito !mision.xp_otorgada
 *     dentro del bloque de completada es una segunda línea de defensa para race conditions.
 *
 * @param {import('express').Request}  req - req.user.id + body: { mision_id, incremento? }
 * @param {import('express').Response} res - 200 con { success, mision, xpGanada, completada, mensaje }
 */
const actualizarProgreso = async (req, res) => {
  try {
    const estudianteId = req.user.id;
    const { mision_id, incremento = 1 } = req.body;
    const hoy = hoyStr();

    // Buscar con triple filtro: mision_id + estudiante + fecha de hoy.
    // WHY los tres: evita que un estudiante actualice misiones de otro estudiante
    // (seguridad) o misiones de días anteriores (integridad de datos).
    const mision = await Mision.findOne({
      _id:            mision_id,
      estudiante_id:  estudianteId,
      fecha_asignada: hoy,
    });

    if (!mision) return res.status(404).json({ success: false, error: 'Misión no encontrada' });

    // Si ya estaba completada, devolver sin hacer nada (idempotente).
    // WHY idempotente: el cliente puede reintentar sin consecuencias.
    if (mision.completada) return res.json({ success: true, mision, xpGanada: 0, mensaje: 'Ya completada' });

    // Avanzar el progreso sin superar la meta (Math.min previene overflow)
    const nuevoProg = Math.min(mision.progreso + incremento, mision.meta);
    const completada = nuevoProg >= mision.meta;
    let xpGanada = 0;

    const updates = {
      $set: {
        progreso:   nuevoProg,
        completada,
        // Solo agregar completada_en si acaba de completarse (no sobreescribir en updates futuros)
        ...(completada ? { completada_en: new Date() } : {}),
      },
    };

    // Dar XP si se completa por primera vez (doble guard: completada + !xp_otorgada)
    if (completada && !mision.xp_otorgada) {
      xpGanada = mision.xp_reward;
      updates.$set.xp_otorgada = true; // Bloquear futuros otorgamientos de esta misión

      // $inc es atómico en NeDB: suma sin leer el valor actual primero.
      // WHY $inc y no $set: evita race conditions si dos requests llegan simultáneamente.
      await Estudiante.update(
        { _id: estudianteId },
        { $inc: { experiencia: xpGanada, puntos_globales: Math.round(xpGanada / 2) } }
      );
    }

    const misionActualizada = await Mision.update({ _id: mision_id }, updates);

    res.json({
      success: true,
      mision:    misionActualizada,
      xpGanada,
      completada,
      mensaje:   completada ? `✅ ¡Misión "${mision.titulo}" completada! +${xpGanada} XP` : 'Progreso actualizado',
    });
  } catch (err) {
    console.error('[Misiones] Error progreso:', err.message);
    res.status(500).json({ success: false, error: 'Error al actualizar progreso' });
  }
};

// ─── GET /api/misiones/mascota ────────────────────────────────────────────────
/**
 * Devuelve el estado detallado de la mascota del estudiante autenticado.
 *
 * Incluye el porcentaje de progreso hacia la próxima evolución, útil para
 * mostrar una barra de XP en la UI sin necesidad de cargar las misiones.
 *
 * CÁLCULO DEL PORCENTAJE:
 *   porcentaje = ((xpTotal - xp_min_actual) / (xp_min_siguiente - xp_min_actual)) × 100
 *   WHY: normaliza el XP dentro del rango del nivel actual para obtener un
 *   valor 0–100 que representa qué tan cerca está el estudiante de evolucionar.
 *
 * @param {import('express').Request}  req - req.user.id del estudiante.
 * @param {import('express').Response} res - 200 con { success, mascota }
 */
const getMascota = async (req, res) => {
  try {
    const est = await Estudiante.findOne({ _id: req.user.id });
    const xpTotal = est?.experiencia || 0;
    const mascota = getMascotaInfo(xpTotal);
    const siguiente = MASCOTA_NIVELES.find(n => n.nivel === mascota.nivel + 1);
    res.json({
      success: true,
      mascota: {
        ...mascota,
        xpTotal,
        xpParaEvolucionar: siguiente ? Math.max(0, siguiente.xp_min - xpTotal) : 0,
        proximaEvolucion:  siguiente || null,
        // porcentaje: qué fracción del rango actual se ha completado.
        // Si ya es nivel máximo (Dragón), porcentaje = 100 (barra llena).
        porcentaje: siguiente
          ? Math.round(((xpTotal - mascota.xp_min) / (siguiente.xp_min - mascota.xp_min)) * 100)
          : 100,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al obtener mascota' });
  }
};

module.exports = { getMisionesHoy, actualizarProgreso, getMascota, getMascotaInfo, MASCOTA_NIVELES };
