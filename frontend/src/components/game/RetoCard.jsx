/**
 * Letramente — RetoCard (Tailwind + Framer Motion)
 * Grupo 10 | Aprende, Comprende, Crea
 *
 * Tarjeta de reto individual con animación de entrada spring.
 */

import React from 'react';
import { motion } from 'framer-motion';

const CATEGORY_STYLES = {
  Vocales: {
    bg:      'from-letra-orange/20 to-letra-yellow/10',
    border:  'border-letra-orange/50',
    btnCls:  'btn-orange',
    badgeCls:'badge-orange',
    glow:    'shadow-glow-orange',
    stars:   '⭐',
    icon:    '🔤',
    label:   'Aprende',
  },
  Silabas: {
    bg:      'from-letra-green/20 to-letra-cyan/10',
    border:  'border-letra-green/50',
    btnCls:  'btn-green',
    badgeCls:'badge-green',
    glow:    'shadow-glow-green',
    stars:   '🌿',
    icon:    '📝',
    label:   'Comprende',
  },
  Palabras: {
    bg:      'from-letra-purple/20 to-letra-pink/10',
    border:  'border-letra-purple/50',
    btnCls:  'btn-purple',
    badgeCls:'badge-purple',
    glow:    'shadow-glow-purple',
    stars:   '🔮',
    icon:    '📖',
    label:   'Crea',
  },
};

const DIFFICULTY_LABELS = { 1: '⭐ Fácil', 2: '⭐⭐ Medio', 3: '⭐⭐⭐ Difícil' };

const RetoCard = ({ reto, index = 0, partida = null, onPlay }) => {
  const style    = CATEGORY_STYLES[reto.categoria] || CATEGORY_STYLES.Vocales;
  const jugado   = partida !== null;
  const estrellas = partida?.estrellas ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.92 }}
      animate={{ opacity: 1, y: 0,  scale: 1 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 200, damping: 20 }}
      whileHover={{ y: -6, scale: 1.02 }}
      className={`
        relative flex flex-col gap-4 p-6 rounded-3xl cursor-pointer
        border-2 ${style.border}
        bg-gradient-to-br ${style.bg}
        shadow-card transition-shadow duration-300
        ${jugado ? 'opacity-95' : ''}
      `}
      onClick={onPlay}
      id={`reto-card-${reto._id}`}
    >
      {/* Emoji decorativo de fondo */}
      <div className="absolute top-3 right-4 text-[5rem] opacity-[0.07] select-none pointer-events-none">
        {reto.emoji}
      </div>

      {/* Header */}
      <div className="flex items-start gap-3">
        <motion.span
          className="text-4xl"
          animate={{ rotate: [0, -5, 5, 0] }}
          transition={{ repeat: Infinity, duration: 3, delay: index * 0.3 }}
        >
          {reto.emoji}
        </motion.span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`badge ${style.badgeCls}`}>{style.icon} {style.label}</span>
            <span className="badge badge-navy">{DIFFICULTY_LABELS[reto.dificultad]}</span>
          </div>
          <h3 className="font-brand font-extrabold text-white text-lg leading-tight truncate">
            {reto.titulo}
          </h3>
        </div>
      </div>

      {/* Instrucción */}
      {reto.instruccion && (
        <p className="text-white/60 text-sm font-medium leading-relaxed line-clamp-2">
          {reto.instruccion}
        </p>
      )}

      {/* Estrellas obtenidas */}
      {jugado && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white/50 uppercase tracking-wider">Tu resultado:</span>
          <div className="flex gap-0.5">
            {[1, 2, 3].map(n => (
              <motion.span
                key={n}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 * n, type: 'spring' }}
                className={`text-lg ${n <= estrellas ? 'grayscale-0' : 'grayscale opacity-30'}`}
              >
                ⭐
              </motion.span>
            ))}
          </div>
        </div>
      )}

      {/* Puntos base */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/10">
        <span className="text-xs text-white/40 font-bold">
          +{reto.puntos_base} pts base
        </span>
        <motion.button
          whileTap={{ scale: 0.93 }}
          className={`btn-letramente ${style.btnCls} text-sm px-5 py-2`}
          onClick={(e) => { e.stopPropagation(); onPlay?.(reto); }}
          id={`play-reto-${reto._id}`}
        >
          {jugado ? '🔄 Repetir' : '🚀 ¡Jugar!'}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default RetoCard;
