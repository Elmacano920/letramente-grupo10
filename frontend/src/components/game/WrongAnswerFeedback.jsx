/**
 * Letramente — WrongAnswerFeedback
 * Grupo 10 | Aprende, Comprende, Crea
 *
 * PROBLEMA QUE RESUELVE:
 *   En plataformas educativas para niños, el feedback de error mal manejado
 *   puede generar frustración y abandono. Este componente implementa
 *   principios de UX infantil y psicología del aprendizaje:
 *
 * PRINCIPIOS DE DISEÑO:
 *   1. NUNCA usa la palabra "incorrecto" o "malo" → solo frases de aliento
 *   2. El shake es suave (no agresivo) — comunica "casi" no "fallaste"
 *   3. Auto-advance de 2s → el niño no queda bloqueado esperando un botón
 *   4. La respuesta correcta se muestra en verde → refuerzo visual positivo
 *   5. TTS lee la frase en voz alta → accesibilidad para no lectores
 *
 * ANIMACIÓN SHAKE:
 *   Usa Framer Motion con keyframes: [0, -12, 12, -8, 8, -4, 4, 0]
 *   El patrón decreciente simula un movimiento de "rebote" natural.
 *   Dura 0.5s — suficiente para percibir pero sin molestar.
 *
 * TTS (Text-to-Speech):
 *   - lang: 'es-VE' (español venezolano como preferencia)
 *   - pitch: 1.2    (tono amigable y positivo)
 *   - rate: 0.85    (ligeramente lento para comprensión)
 *   - hasSpoken ref: previene que la frase se lea dos veces en el mismo error
 *
 * AUTO-ADVANCE con barra visual:
 *   Cuando `autoAdvance` tiene valor (ej: 2000ms), la barra roja se consume
 *   en ese tiempo usando Framer Motion `animate={{ width: '0%' }}`.
 *   Esto le indica al niño cuánto tiempo tiene antes de pasar a la siguiente.
 *
 * EXPORTA DOS COSAS:
 *   default WrongAnswerFeedback → el panel completo de feedback
 *   named  WrongButton          → wrapper para shake en botones individuales
 *
 * USO BÁSICO:
 *   <WrongAnswerFeedback
 *     visible={selected !== null && !esCorrecta}
 *     respuestaCorrecta="PA"
 *     autoAdvance={2000}
 *   />
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Frases de aliento (7 rotativas, aleatorias) ──────────────────────────────
// Nunca dicen "incorrecto" ni "fallaste". Siempre enfocan en el PRÓXIMO intento.
const FRASES_ALIENTO = [
  '¡Casi! Inténtalo de nuevo 💪',
  '¡Tú puedes! Cada error enseña algo 🌟',
  '¡No te rindas! Sigue intentando 🚀',
  '¡Eso estuvo cerca! Vamos de nuevo 🎯',
  '¡Aprende y sigue! Eres valiente 🦁',
  '¡Bien, bien! La próxima te sale 🐥',
  '¡Los errores nos hacen más sabios! 🧠',
];

// ─── Variantes de animación shake ────────────────────────────────────────────
const shakeVariants = {
  idle:  { x: 0, scale: 1 },
  shake: {
    x:          [0, -12, 12, -8, 8, -4, 4, 0],
    scale:      [1, 0.97, 0.97, 0.98, 0.98, 0.99, 0.99, 1],
    transition: { duration: 0.5, ease: 'easeInOut' },
  },
};

// ─── Hook: texto de aliento aleatorio ────────────────────────────────────────
function useFraseAliento(visible) {
  const [frase, setFrase] = useState('');
  useEffect(() => {
    if (visible) {
      const idx = Math.floor(Math.random() * FRASES_ALIENTO.length);
      setFrase(FRASES_ALIENTO[idx]);
    }
  }, [visible]);
  return frase;
}

// ─── Componente WrongButton (el botón que se sacude) ─────────────────────────
export const WrongButton = ({ children, trigger, style, ...props }) => {
  const [shaking, setShaking] = useState(false);

  useEffect(() => {
    if (trigger) {
      setShaking(true);
      const t = setTimeout(() => setShaking(false), 600);
      return () => clearTimeout(t);
    }
  }, [trigger]);

  return (
    <motion.div
      variants={shakeVariants}
      animate={shaking ? 'shake' : 'idle'}
      style={style}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// ─── Componente Principal: Panel de feedback ──────────────────────────────────
const WrongAnswerFeedback = ({
  visible        = false,
  respuestaCorrecta = '',
  onContinue     = () => {},
  autoAdvance    = null,   // ms. null = esperar click manual
  speakFeedback  = true,   // leer la frase con TTS
}) => {
  const frase     = useFraseAliento(visible);
  const timerRef  = useRef(null);
  const hasSpoken = useRef(false);

  // Auto-advance
  useEffect(() => {
    if (visible && autoAdvance) {
      timerRef.current = setTimeout(onContinue, autoAdvance);
    }
    return () => clearTimeout(timerRef.current);
  }, [visible, autoAdvance, onContinue]);

  // TTS de aliento (una sola vez por aparición)
  useEffect(() => {
    if (visible && speakFeedback && frase && !hasSpoken.current) {
      hasSpoken.current = true;
      if ('speechSynthesis' in window) {
        // Cancelar cualquier habla previa
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(frase.replace(/[^\w\s¡!]/g, ''));
        utterance.lang  = 'es-VE';  // Español venezolano
        utterance.rate  = 0.85;     // Un poco lento para niños
        utterance.pitch = 1.2;      // Tono amigable y positivo
        utterance.volume = 0.9;
        // Seleccionar voz en español si existe
        const voces = window.speechSynthesis.getVoices();
        const vozES = voces.find(v => v.lang.startsWith('es'));
        if (vozES) utterance.voice = vozES;
        setTimeout(() => window.speechSynthesis.speak(utterance), 200);
      }
    }
    if (!visible) hasSpoken.current = false;
  }, [visible, frase, speakFeedback]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          id="wrong-answer-feedback"
          key="feedback"
          initial={{ opacity: 0, y: 12, scale: 0.92 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          exit={{   opacity: 0, y: -8,  scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          style={{
            marginTop:     '1rem',
            padding:       '1rem 1.25rem',
            borderRadius:  '1.2rem',
            background:    'rgba(239,68,68,0.1)',
            border:        '2px solid rgba(239,68,68,0.3)',
            display:       'flex',
            flexDirection: 'column',
            alignItems:    'center',
            gap:           '0.75rem',
          }}
        >
          {/* Ícono animado */}
          <motion.div
            animate={{ rotate: [0, -10, 10, -6, 6, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 0.6 }}
            style={{ fontSize: '2.5rem', lineHeight: 1 }}
          >
            🤔
          </motion.div>

          {/* Frase de aliento */}
          <p style={{
            fontFamily:  'Nunito, sans-serif',
            fontWeight:  800,
            fontSize:    '1.1rem',
            color:       '#fca5a5',
            textAlign:   'center',
            margin:      0,
          }}>
            {frase}
          </p>

          {/* Mostrar la respuesta correcta */}
          {respuestaCorrecta && (
            <div style={{
              padding:      '0.5rem 1.25rem',
              borderRadius: '0.75rem',
              background:   'rgba(46,184,126,0.12)',
              border:       '1px solid rgba(46,184,126,0.35)',
              display:      'flex',
              alignItems:   'center',
              gap:          '0.5rem',
            }}>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', fontFamily: 'Nunito', fontWeight: 700 }}>
                La respuesta era:
              </span>
              <span style={{ color: '#5ed4a4', fontWeight: 900, fontSize: '1.2rem', fontFamily: 'Nunito' }}>
                {respuestaCorrecta}
              </span>
            </div>
          )}

          {/* Botón de continuar (solo si no hay autoAdvance) */}
          {!autoAdvance && (
            <motion.button
              id="continue-after-wrong"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onContinue}
              style={{
                padding:      '0.6rem 1.5rem',
                borderRadius: '0.75rem',
                background:   'rgba(46,184,126,0.2)',
                border:       '2px solid #2eb87e',
                color:        '#5ed4a4',
                fontFamily:   'Nunito, sans-serif',
                fontWeight:   800,
                fontSize:     '0.95rem',
                cursor:       'pointer',
              }}
            >
              ¡Siguiente! →
            </motion.button>
          )}

          {/* Barra de progreso de autoAdvance */}
          {autoAdvance && (
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: autoAdvance / 1000, ease: 'linear' }}
              style={{
                height:       '3px',
                background:   'rgba(239,68,68,0.5)',
                borderRadius: '2px',
                alignSelf:    'stretch',
              }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WrongAnswerFeedback;
