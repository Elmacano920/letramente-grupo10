/**
 * Letramente — Sistema de Audio (Estímulos Auditivos)
 * Grupo 10 | Modelo Conductista: Estímulo → Respuesta → Refuerzo
 *
 * Genera sonidos procedurales usando la Web Audio API.
 * No requiere archivos de audio externos.
 *
 * Sonidos:
 *  - correct()   → Melodía ascendente de éxito (ding positivo)
 *  - error()     → Tono suave de intento fallido (no invasivo)
 *  - levelUp()   → Fanfarria corta de celebración
 *  - badge()     → Sonido de medalla desbloqueada
 *  - click()     → Clic suave de botón
 *  - start()     → Sonido de inicio de actividad
 */

// ─── Contexto de Audio (singleton) ───────────────────────────────────────────
let audioCtx = null;

const getAudioCtx = () => {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API no disponible:', e);
    }
  }
  return audioCtx;
};

// ─── Helper: tocar una nota ───────────────────────────────────────────────────
const playNote = (frequency, duration, type = 'sine', volume = 0.4, startDelay = 0) => {
  const ctx = getAudioCtx();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gainNode   = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type      = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + startDelay);

  // Envelope: attack → decay → sustain → release
  gainNode.gain.setValueAtTime(0, ctx.currentTime + startDelay);
  gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + startDelay + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startDelay + duration);

  oscillator.start(ctx.currentTime + startDelay);
  oscillator.stop(ctx.currentTime + startDelay + duration + 0.05);
};

// ─── Sonidos de la Plataforma ─────────────────────────────────────────────────

/**
 * Estímulo de ACIERTO — melodía ascendente alegre
 * Modelo conductista: refuerzo positivo inmediato
 */
const correct = () => {
  // Sol → La → Si → Re (ascendente triunfante)
  playNote(392, 0.15, 'triangle', 0.35, 0.00);  // G4
  playNote(440, 0.15, 'triangle', 0.35, 0.12);  // A4
  playNote(494, 0.15, 'triangle', 0.35, 0.24);  // B4
  playNote(587, 0.30, 'triangle', 0.4,  0.36);  // D5
};

/**
 * Estímulo de ERROR — tono suave, no punitivo (fomenta el reintento)
 * El conductismo educativo moderno evita castigos fuertes
 */
const error = () => {
  playNote(330, 0.12, 'sine', 0.2, 0.00);  // E4 suave
  playNote(262, 0.25, 'sine', 0.15, 0.15); // C4 bajando suave
};

/**
 * Estímulo de SUBIDA DE NIVEL — fanfarria corta de celebración
 */
const levelUp = () => {
  const notes = [262, 330, 392, 523, 659, 784]; // C D E G B G5
  notes.forEach((freq, i) => {
    playNote(freq, 0.18, 'triangle', 0.4, i * 0.1);
  });
  // Nota final larga brillante
  playNote(1047, 0.5, 'triangle', 0.3, notes.length * 0.1);
};

/**
 * Estímulo de BADGE/MEDALLA — chime especial
 */
const badge = () => {
  playNote(880, 0.2, 'triangle', 0.3, 0.0);   // A5
  playNote(1047, 0.2, 'triangle', 0.3, 0.15); // C6
  playNote(1319, 0.4, 'triangle', 0.25, 0.3); // E6
};

/**
 * Sonido de CLIC de botón — sutil, táctil
 */
const click = () => {
  playNote(800, 0.05, 'sine', 0.15, 0.0);
};

/**
 * Sonido de INICIO de actividad — "¡vamos!"
 */
const start = () => {
  playNote(392, 0.1, 'triangle', 0.3, 0.0);  // G4
  playNote(523, 0.2, 'triangle', 0.3, 0.1);  // C5
};

/**
 * Sonido de COMPLETAR PÁGINA (lectura)
 */
const pageTurn = () => {
  playNote(523, 0.08, 'sine', 0.2, 0.0);  // C5
  playNote(659, 0.12, 'sine', 0.2, 0.1);  // E5
};

/**
 * Reanudar el AudioContext si fue suspendido (requerido por navegadores)
 * Llamar desde el primer gesto del usuario
 */
const resume = () => {
  const ctx = getAudioCtx();
  if (ctx && ctx.state === 'suspended') ctx.resume();
};

const AudioService = { correct, error, levelUp, badge, click, start, pageTurn, resume };

export default AudioService;
