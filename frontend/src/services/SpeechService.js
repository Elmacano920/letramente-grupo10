/**
 * Letramente — SpeechService v2 (Síntesis de Voz)
 * Grupo 10
 *
 * PROPÓSITO PEDAGÓGICO:
 *   Los niños de primer grado (6-7 años) que aún no leen con fluidez
 *   necesitan escuchar las instrucciones. Este servicio usa la Web Speech API
 *   nativa del navegador (0 KB descargado, sin dependencias externas).
 *
 * CONFIGURACIÓN DE VOZ:
 *   - rate: 0.78–0.88  → Más lento que el habla normal (facilita comprensión)
 *   - pitch: 1.1–1.3   → Tono más agudo, más amigable para niños
 *   - lang: 'es-MX'    → Español latino (más natural que es-ES para Venezuela)
 *
 * SELECCIÓN DE VOZ (por prioridad):
 *   1. es-MX (México)     → Acento neutro, muy claro
 *   2. es-419 (Latinoamérica general)
 *   3. es-US (EE.UU. en español)
 *   4. es    (cualquier español como fallback)
 *
 * BUG DE CHROME CORREGIDO:
 *   Chrome tiene un bug donde la síntesis de voz se congela después de ~15
 *   segundos. El fix es hacer window.speechSynthesis.resume() cada 5s si
 *   está en pausa. Se limpia con onend/onerror para no quedar activo.
 *
 * ASYNC EN CHROME:
 *   getVoices() es sincrónico en Firefox pero ASÍNCRONO en Chrome. Por eso
 *   escuchamos el evento 'voiceschanged' y recargamos la voz cuando Chrome
 *   finalmente expone las voces del sistema.
 */

// ── Referencia a la voz en español seleccionada ──────────────────────────────
// Se carga de forma lazy usando el evento 'voiceschanged' de la Web Speech API
let _voiceEs = null;

const loadVoice = () => {
  if (!window.speechSynthesis) return;
  const voices = window.speechSynthesis.getVoices();
  _voiceEs = voices.find(v =>
    v.lang.startsWith('es-MX') || v.lang.startsWith('es-419') ||
    v.lang.startsWith('es-US') || v.lang.startsWith('es')
  ) || null;
};

// Cargar inmediatamente (Firefox) y también al cambiar (Chrome)
if (window.speechSynthesis) {
  loadVoice();
  window.speechSynthesis.onvoiceschanged = loadVoice;
}

// ── Stop ──────────────────────────────────────────────────────
const stop = () => {
  try { window.speechSynthesis?.cancel(); } catch {}
};

// ── Función base ──────────────────────────────────────────────
const speak = (text, { rate = 0.82, pitch = 1.15, volume = 1.0 } = {}) => {
  if (!window.speechSynthesis || !text) return;
  stop();

  // Recargar voz por si aún no estaba lista
  if (!_voiceEs) loadVoice();

  const utter    = new SpeechSynthesisUtterance(text);
  utter.lang     = 'es-MX';
  utter.rate     = rate;
  utter.pitch    = pitch;
  utter.volume   = volume;
  if (_voiceEs) utter.voice = _voiceEs;

  // Fix Chrome bug: síntesis que se congela después de ~15 seg
  const resumeHack = setInterval(() => {
    if (window.speechSynthesis.paused) window.speechSynthesis.resume();
  }, 5000);
  utter.onend = () => clearInterval(resumeHack);
  utter.onerror = () => clearInterval(resumeHack);

  window.speechSynthesis.speak(utter);
};

// ── API pública ───────────────────────────────────────────────

/** Lee la instrucción del reto */
const sayInstruction = (text) => speak(text, { rate: 0.78 });

/** Pronuncia una letra: "A... A de Árbol" */
const sayLetter = (letter, example = '') => {
  const msg = example ? `${letter}... ${letter} de ${example}` : letter;
  speak(msg, { rate: 0.70, pitch: 1.2 });
};

/** Pronuncia una palabra con pausa entre sílabas visuales */
const sayWord = (word) => speak(word, { rate: 0.75, pitch: 1.1 });

/** Respuesta correcta + dice la palabra */
const sayCorrect = (word = '') => {
  const frases = ['¡Excelente!', '¡Muy bien!', '¡Correcto!', '¡Genial!', '¡Fantástico!'];
  const frase  = frases[Math.floor(Math.random() * frases.length)];
  const msg    = word ? `${frase} La respuesta es: ${word}` : frase;
  speak(msg, { rate: 0.88, pitch: 1.3 });
};

/** Respuesta incorrecta */
const sayWrong = (correcta = '') => {
  const msg = correcta
    ? `Casi. La respuesta correcta es: ${correcta}. ¡Tú puedes!`
    : 'Inténtalo de nuevo. ¡Tú puedes!';
  speak(msg, { rate: 0.82, pitch: 1.0 });
};

/** Resultado final */
const sayResult = (stars) => {
  const msgs = {
    3: '¡Perfecto! ¡Tres estrellas! ¡Eres una estrella del saber!',
    2: '¡Muy bien! ¡Dos estrellas! ¡Sigue así!',
    1: '¡Buen intento! Una estrella. ¡Practica un poco más!',
    0: '¡No te rindas! ¡Inténtalo de nuevo, tú puedes!',
  };
  speak(msgs[stars] ?? msgs[0], { rate: 0.90, pitch: 1.2 });
};

/** Bienvenida al iniciar categoría */
const sayWelcome = (categoria) => {
  const msgs = {
    Vocales:     '¡Vamos a aprender las vocales! Escucha bien y elige la letra correcta.',
    Consonantes: '¡Hora de aprender el abecedario! ¿Sabes qué letra empieza cada palabra?',
    Silabas:     '¡Completa las sílabas! Piensa bien antes de elegir.',
    Palabras:    '¡Reconoce las palabras! Lee con cuidado y elige la correcta.',
  };
  speak(msgs[categoria] ?? '¡Comencemos!', { rate: 0.82 });
};

const SpeechService = {
  speak, stop,
  sayInstruction, sayLetter, sayWord,
  sayCorrect, sayWrong, sayResult, sayWelcome,
  // alias
  sayTryAgain: () => sayWrong(),
};

export default SpeechService;
