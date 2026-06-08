/**
 * Letramente — Personaje Guía "Lápiz-Robot"
 * Grupo 10 | Modelo Conductista: Estímulo → Respuesta → Refuerzo
 *
 * El Lápiz-Robot actúa como guía pedagógico visual del niño.
 * Reacciona a: aciertos, errores, inactividad y eventos especiales.
 */

import React, { useState, useEffect } from 'react';

// ─── Mensajes del Lápiz-Robot por contexto ──────────────────────────────────
const MESSAGES = {
  idle: [
    '¡Hola! Yo soy Lapi 🖊️ ¡Tu guía de aprendizaje!',
    '¿Listo para aprender hoy? 🌟',
    '¡Tú puedes hacerlo! Yo te ayudo 💪',
    '¡Vamos a descubrir letras juntos! 📖',
  ],
  correct: [
    '¡EXCELENTE! ¡Lo lograste! 🎉',
    '¡Muy bien! ¡Eres un crack! ⭐',
    '¡CORRECTO! ¡Eso estuvo genial! 🚀',
    '¡Bravo! ¡Tú sí que sabes! 🏆',
    '¡PERFECTO! ¡Sigue así! 💥',
  ],
  error: [
    '¡Casi! Vuelve a intentarlo 💪',
    '¡No te rindas! Inténtalo de nuevo 🔄',
    'Mmm... ¿Puedes pensar un poco más? 🤔',
    '¡Tú puedes! Solo practica más ✨',
  ],
  levelUp: [
    '¡¡SUBISTE DE NIVEL!! ¡Eres increíble! 🌟🎊',
    '¡WOW! ¡Pasaste al siguiente nivel! 🚀🏆',
  ],
  start: [
    '¡Empecemos la aventura! 🗺️',
    '¡Esta actividad es divertida! ¡Vamos! ⚡',
    '¡Yo sé que puedes! ¡Tú lo vales! 🌈',
  ],
  thinking: [
    'Tómate tu tiempo... 🤔',
    'Piensa bien... ¡Tú sabes la respuesta! 💡',
  ],
};

// ─── Expresiones faciales del Lápiz-Robot (usando emojis/CSS) ────────────────
const EXPRESSIONS = {
  idle:    { face: '😊', glow: 'rgba(255,210,63,0.3)',  rotate: '0deg',    bounce: true },
  correct: { face: '🤩', glow: 'rgba(46,184,126,0.6)',  rotate: '-10deg',  bounce: true },
  error:   { face: '😅', glow: 'rgba(255,123,44,0.4)',  rotate: '5deg',    bounce: false },
  levelUp: { face: '🤯', glow: 'rgba(139,92,246,0.7)',  rotate: '0deg',    bounce: true },
  start:   { face: '😄', glow: 'rgba(6,182,212,0.5)',   rotate: '-5deg',   bounce: true },
  thinking:{ face: '🤔', glow: 'rgba(255,210,63,0.25)', rotate: '8deg',    bounce: false },
};

// ─── Componente Principal ─────────────────────────────────────────────────────
const LapizRobot = ({ mood = 'idle', visible = true, size = 'md', position = 'fixed' }) => {
  const [message, setMessage]         = useState('');
  const [showMsg, setShowMsg]         = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentMood, setCurrentMood] = useState(mood);

  const sizeMap = {
    sm: { robot: '60px', font: '0.7rem' },
    md: { robot: '80px', font: '0.8rem' },
    lg: { robot: '100px', font: '0.9rem' },
  };
  const sz = sizeMap[size] || sizeMap.md;

  // Reaccionar al cambio de mood
  useEffect(() => {
    if (!visible) return;
    setCurrentMood(mood);
    const msgs  = MESSAGES[mood] || MESSAGES.idle;
    const msg   = msgs[Math.floor(Math.random() * msgs.length)];
    setMessage(msg);
    setShowMsg(true);
    setIsAnimating(true);

    // Ocultar el mensaje después de 3.5 segundos
    const t1 = setTimeout(() => setShowMsg(false), 3500);
    const t2 = setTimeout(() => setIsAnimating(false), 600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [mood, visible]);

  // Rotar mensajes en idle cada 8 segundos
  useEffect(() => {
    if (mood !== 'idle' || !visible) return;
    const interval = setInterval(() => {
      const msgs = MESSAGES.idle;
      setMessage(msgs[Math.floor(Math.random() * msgs.length)]);
      setShowMsg(true);
      setTimeout(() => setShowMsg(false), 3500);
    }, 8000);
    return () => clearInterval(interval);
  }, [mood, visible]);

  if (!visible) return null;

  const expr = EXPRESSIONS[currentMood] || EXPRESSIONS.idle;

  return (
    <div
      id="lapiz-robot"
      role="img"
      aria-label={`Lapi el Lápiz-Robot dice: ${message}`}
      style={{
        position: position,
        bottom: position === 'fixed' ? '2rem' : 'auto',
        right: position === 'fixed' ? '2rem' : 'auto',
        zIndex: 500,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '0.5rem',
        pointerEvents: 'none',
      }}
    >
      {/* ── Burbuja de diálogo ─────────────────────────────────── */}
      <div style={{
        opacity: showMsg ? 1 : 0,
        transform: showMsg ? 'scale(1) translateY(0)' : 'scale(0.85) translateY(8px)',
        transition: 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        maxWidth: '220px',
        background: 'rgba(6,18,50,0.92)',
        backdropFilter: 'blur(12px)',
        border: `2px solid ${expr.glow.replace('rgba', 'rgb').replace(/,\s*[\d.]+\)/, ')')}`,
        borderRadius: '1rem 1rem 0.25rem 1rem',
        padding: '0.625rem 0.875rem',
        fontSize: sz.font,
        fontFamily: 'Nunito, sans-serif',
        fontWeight: 700,
        color: '#eef2ff',
        lineHeight: 1.4,
        boxShadow: `0 4px 24px ${expr.glow}`,
        pointerEvents: 'none',
      }}>
        {message}
      </div>

      {/* ── Cuerpo del Lápiz-Robot ─────────────────────────────── */}
      <div
        style={{
          width: sz.robot,
          height: sz.robot,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          animation: expr.bounce
            ? (isAnimating ? 'bounceIn 0.5s cubic-bezier(0.34,1.56,0.64,1)' : 'float 3s ease-in-out infinite')
            : 'none',
          filter: `drop-shadow(0 0 18px ${expr.glow})`,
          transform: `rotate(${expr.rotate})`,
          transition: 'transform 0.4s ease, filter 0.4s ease',
          cursor: 'default',
        }}
      >
        {/* Aura de brillo */}
        <div style={{
          position: 'absolute', inset: '-4px',
          borderRadius: '50%',
          background: expr.glow,
          animation: 'pulse-cyan 2s ease-in-out infinite',
          opacity: 0.5,
        }} />

        {/* Cuerpo: lápiz con cara */}
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          {/* Punta del lápiz (triángulo) */}
          <div style={{
            position: 'absolute', bottom: '-8px', left: '50%',
            transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: `${parseInt(sz.robot)/5}px solid transparent`,
            borderRight: `${parseInt(sz.robot)/5}px solid transparent`,
            borderTop: `${parseInt(sz.robot)/4}px solid #ffd23f`,
          }} />

          {/* Cuerpo principal del lápiz */}
          <div style={{
            width: `${parseInt(sz.robot) * 0.65}px`,
            height: `${parseInt(sz.robot) * 0.7}px`,
            background: 'linear-gradient(180deg, #ffd23f 0%, #ff7b2c 100%)',
            borderRadius: '8px 8px 2px 2px',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'flex-start',
            paddingTop: '6px',
            boxShadow: `0 4px 16px ${expr.glow}`,
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Goma (top) */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              height: '22%',
              background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
              borderRadius: '6px 6px 0 0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {/* Cara del robot */}
              <div style={{
                display: 'flex', gap: '3px', alignItems: 'center',
                fontSize: `${parseInt(sz.robot) * 0.12}px`,
              }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#eef2ff' }} />
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#eef2ff' }} />
              </div>
            </div>

            {/* Expresión principal */}
            <div style={{ marginTop: '28%', fontSize: `${parseInt(sz.robot) * 0.35}px`, lineHeight: 1 }}>
              {expr.face}
            </div>

            {/* Rayas decorativas del lápiz */}
            <div style={{ position: 'absolute', right: 0, top: '22%', bottom: '12%', width: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px' }} />
            <div style={{ position: 'absolute', left: 0, top: '22%', bottom: '12%', width: '4px', background: 'rgba(0,0,0,0.1)', borderRadius: '2px' }} />
          </div>

          {/* Brazos del robot */}
          {isAnimating && currentMood === 'correct' && (
            <>
              <div style={{ position: 'absolute', left: '-16px', top: '40%', fontSize: '1.2rem', animation: 'bounceIn 0.3s ease' }}>🙌</div>
            </>
          )}
        </div>
      </div>

      {/* Indicador de nivel debajo */}
      <div style={{
        fontSize: '0.65rem', fontWeight: 800,
        color: 'var(--color-cyan-light)',
        textAlign: 'center', letterSpacing: '0.05em',
        opacity: 0.8,
        fontFamily: 'Nunito, sans-serif',
      }}>
        Lapi 🖊️
      </div>
    </div>
  );
};

export default LapizRobot;
