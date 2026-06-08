/**
 * Letramente — Badge Components (Tailwind + Framer Motion)
 * Grupo 10
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Tarjeta de insignia individual ──────────────────────────────────────────
export const BadgeCard = ({ badge, size = 'md' }) => {
  const sizeMap = { sm: 'w-16 h-16 text-2xl', md: 'w-20 h-20 text-3xl', lg: 'w-28 h-28 text-5xl' };
  return (
    <motion.div
      whileHover={{ scale: 1.08 }}
      className="flex flex-col items-center gap-2"
      title={badge.description}
    >
      <div className={`${sizeMap[size]} rounded-3xl flex items-center justify-center
                       bg-gradient-to-br from-letra-cyan/20 to-letra-purple/20
                       border-2 border-letra-cyan/30 shadow-glow-cyan`}>
        <span>{badge.icon}</span>
      </div>
      <span className="text-xs font-bold text-white/70 text-center max-w-[80px]">{badge.title}</span>
    </motion.div>
  );
};

// ─── Popup de desbloqueo de insignia ─────────────────────────────────────────
export const BadgeUnlockPopup = ({ badges = [], onClose }) => {
  if (!badges || badges.length === 0) return null;
  const badge = badges[0];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{   opacity: 0 }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Card */}
      <motion.div
        className="relative z-10 glass-card p-10 text-center max-w-sm w-full border-letra-yellow/40"
        initial={{ scale: 0.4, opacity: 0, y: 40 }}
        animate={{ scale: 1,   opacity: 1, y: 0 }}
        exit={{   scale: 0.8,  opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      >
        {/* Confetti de fondo */}
        {['🌟','✨','🎉','⭐','💫'].map((e, i) => (
          <motion.span
            key={i}
            className="absolute text-2xl select-none pointer-events-none"
            style={{ left: `${10 + i * 18}%`, top: '10%' }}
            animate={{ y: [0, -20, 0], rotate: [0, 360] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
          >{e}</motion.span>
        ))}

        <motion.div
          className="text-7xl mb-5"
          animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
          transition={{ repeat: 2, duration: 0.5 }}
        >
          {badge.icon}
        </motion.div>

        <div className="badge badge-yellow mx-auto mb-3">¡Nueva Insignia!</div>
        <h3 className="font-brand font-black text-2xl text-white mb-2">{badge.title}</h3>
        <p className="text-white/60 font-medium text-sm mb-7">{badge.description}</p>

        <motion.button
          id="close-badge-popup"
          whileTap={{ scale: 0.95 }}
          className="btn-yellow w-full"
          onClick={onClose}
        >
          ¡Genial! 🚀
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default BadgeCard;
