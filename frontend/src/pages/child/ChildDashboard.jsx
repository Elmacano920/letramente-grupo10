/**
 * Letramente — ChildDashboard (Tailwind + Framer Motion)
 * Grupo 10 | Aprende, Comprende, Crea
 *
 * Vista principal del estudiante:
 * - Hero de bienvenida con avatar animado
 * - 3 zonas de categoría: Vocales / Sílabas / Palabras
 * - Mis insignias
 * - Reto del día
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import RetoCard from '../../components/game/RetoCard';
import { BadgeUnlockPopup } from '../../components/ui/Badge';
import { getLevelInfo, formatPoints } from '../../utils/gamification';
import MisionesWidget from '../../components/game/MisionesWidget'; // ← NUEVO

const AVATAR_EMOJIS = { dino: '🦕', cat: '🐱', robot: '🤖', bunny: '🐰', owl: '🦉', fox: '🦊' };

const CATEGORY_CONFIG = [
  {
    key:    'Vocales',
    label:  'Aprende',
    sub:    'Las 5 vocales: A E I O U',
    icon:   '🔤',
    emoji:  '🎨',
    route:  '/juego/retos/Vocales',
    border: 'border-letra-orange/50',
    bg:     'from-letra-orange/15 to-letra-yellow/5',
    badge:  'badge-orange',
    btnCls: 'btn-orange',
  },
  {
    key:    'Consonantes',
    label:  'Abecedario',
    sub:    'B, C, D, F... todo el abecedario',
    icon:   '🔡',
    emoji:  '📝',
    route:  '/juego/retos/Consonantes',
    border: 'border-letra-yellow/50',
    bg:     'from-letra-yellow/15 to-letra-orange/5',
    badge:  'badge-yellow',
    btnCls: 'btn-yellow',
  },
  {
    key:    'Silabas',
    label:  'Comprende',
    sub:    'Completa las sílabas',
    icon:   '📝',
    emoji:  '🌿',
    route:  '/juego/retos/Silabas',
    border: 'border-letra-green/50',
    bg:     'from-letra-green/15 to-letra-cyan/5',
    badge:  'badge-green',
    btnCls: 'btn-green',
  },
  {
    key:    'Palabras',
    label:  'Crea',
    sub:    'Reconoce palabras completas',
    icon:   '📖',
    emoji:  '🔮',
    route:  '/juego/retos/Palabras',
    border: 'border-letra-purple/50',
    bg:     'from-letra-purple/15 to-pink-500/5',
    badge:  'badge-purple',
    btnCls: 'btn-purple',
  },
];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return '¡Buenos días';
  if (h < 18) return '¡Buenas tardes';
  return '¡Buenas noches';
};

const ChildDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { retos, newBadges, loadRetos, clearBadgeNotification } = useGame();
  const [showBadge, setShowBadge] = useState(false);

  useEffect(() => { loadRetos(); }, [loadRetos]);
  useEffect(() => { if (newBadges?.length > 0) setShowBadge(true); }, [newBadges]);

  const levelInfo    = getLevelInfo(user?.experiencia || 0);
  const avatarEmoji  = AVATAR_EMOJIS[user?.avatar] || '🦕';
  const badges       = user?.badges || [];

  // Agrupar retos por categoría (incluyendo Consonantes)
  const retosPorCategoria = {
    Vocales:      retos.filter(r => r.categoria === 'Vocales'),
    Consonantes:  retos.filter(r => r.categoria === 'Consonantes'),
    Silabas:      retos.filter(r => r.categoria === 'Silabas'),
    Palabras:     retos.filter(r => r.categoria === 'Palabras'),
  };

  return (
    <div className="min-h-screen pb-10" onClick={() => {}}>

      {/* ══ NAVBAR ══════════════════════════════════════════ */}
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0,   opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        className="flex items-center justify-between px-6 py-4 mx-4 mt-4
                   rounded-3xl border border-white/10
                   bg-white/5 backdrop-blur-md shadow-card"
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <motion.img
            src="/logo.png" alt="Letramente"
            className="w-9 h-9 object-contain"
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ repeat: Infinity, duration: 5 }}
          />
          <div>
            <div className="font-brand font-black text-base text-gradient-static">Letramente</div>
            <div className="text-[0.6rem] text-white/40 font-bold tracking-wider uppercase">Aprende · Comprende · Crea</div>
          </div>
        </div>

        {/* Puntos */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-letra-yellow/10 border border-letra-yellow/25">
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-xl"
          >⭐</motion.span>
          <span className="font-brand font-black text-lg text-letra-yellow">
            {formatPoints(user?.puntos_globales || 0)}
          </span>
          <span className="text-white/40 text-xs">pts</span>
        </div>

        <button
          id="logout-btn"
          className="btn-ghost btn-sm"
          onClick={logout}
        >
          Salir 👋
        </button>
      </motion.nav>

      <div className="max-w-5xl mx-auto px-4 mt-6 space-y-8">

        {/* ══ HERO ════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 150 }}
          className="relative overflow-hidden rounded-4xl border border-letra-cyan/20
                     bg-gradient-to-br from-letra-navy/60 to-letra-cyan/10 p-8"
        >
          {/* Fondo decorativo */}
          <div className="absolute right-6 top-4 text-[8rem] opacity-[0.05] select-none pointer-events-none">🧠</div>
          <div className="absolute left-1/3 bottom-0 text-[5rem] opacity-[0.04] select-none pointer-events-none">📖</div>

          <div className="flex items-center justify-between gap-6">
            <div className="flex-1">
              {/* Puntos de marca */}
              <div className="brand-dots mb-3">
                {['bg-letra-orange','bg-letra-green','bg-letra-cyan','bg-letra-purple','bg-letra-yellow'].map((c, i) => (
                  <div key={i} className={`brand-dot ${c}`} style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>

              <h1 className="text-3xl font-brand font-black mb-1">
                {getGreeting()},{' '}
                <span className="text-letra-cyan-light">
                  {user?.nombre?.split(' ')[0] || 'Explorador'}
                </span>! 👋
              </h1>

              <p className="text-white/60 mb-5 text-base font-medium">
                ¿Listos para{' '}
                <span className="text-letra-orange font-bold">aprender</span>,{' '}
                <span className="text-letra-green font-bold">comprender</span> y{' '}
                <span className="text-letra-purple-light font-bold">crear</span> hoy?
              </p>

              {/* Nivel */}
              <div className="flex items-center gap-3">
                <span className="text-2xl">{levelInfo.icon}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="font-brand font-bold text-white text-sm">
                      Nivel {levelInfo.level}: {levelInfo.name}
                    </span>
                    {levelInfo.nextLevel && (
                      <span className="text-xs text-white/40">
                        {levelInfo.xpInCurrentLevel}/{levelInfo.xpNeededForNext} XP
                      </span>
                    )}
                  </div>
                  <div className="progress-track">
                    <motion.div
                      className="progress-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${levelInfo.progress}%` }}
                      transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Avatar */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="text-[5rem] bg-white/5 border-2 border-letra-cyan/30 rounded-full
                         w-24 h-24 flex items-center justify-center flex-shrink-0
                         shadow-glow-cyan"
            >
              {avatarEmoji}
            </motion.div>
          </div>
        </motion.div>

        {/* ══ CATEGORÍAS ══════════════════════════════════════ */}
        <section>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 mb-5"
          >
            <h2 className="text-2xl font-brand font-black">🎯 Elige tu aventura</h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {CATEGORY_CONFIG.map((cat, i) => {
              const totalRetos     = retosPorCategoria[cat.key]?.length || 0;
              return (
                <motion.div
                  key={cat.key}
                  initial={{ opacity: 0, y: 40, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0,  scale: 1 }}
                  transition={{ delay: 0.15 + i * 0.1, type: 'spring', stiffness: 200, damping: 20 }}
                  whileHover={{ y: -8, scale: 1.03 }}
                  className={`relative overflow-hidden rounded-4xl border-2 ${cat.border}
                              bg-gradient-to-br ${cat.bg} p-7 cursor-pointer
                              flex flex-col gap-4 shadow-card`}
                  onClick={() => navigate(cat.route)}
                  id={`category-${cat.key.toLowerCase()}`}
                >
                  {/* Emoji fondo */}
                  <div className="absolute -top-2 -right-2 text-[7rem] opacity-[0.08] select-none pointer-events-none rotate-12">
                    {cat.emoji}
                  </div>

                  {/* Badge de fase */}
                  <div className={`badge ${cat.badge} w-fit`}>
                    {cat.icon} {cat.label}
                  </div>

                  {/* Ícono principal animado */}
                  <motion.div
                    className="text-6xl"
                    animate={{ rotate: [0, -8, 8, 0] }}
                    transition={{ repeat: Infinity, duration: 4, delay: i * 0.5 }}
                  >
                    {cat.icon}
                  </motion.div>

                  <div>
                    <h3 className="font-brand font-black text-white text-2xl">{cat.key}</h3>
                    <p className="text-white/60 text-sm font-medium mt-0.5">{cat.sub}</p>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/10">
                    <span className="text-xs text-white/40 font-bold">
                      {totalRetos} retos
                    </span>
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      className={`btn-letramente ${cat.btnCls} text-sm px-5 py-2`}
                      onClick={(e) => { e.stopPropagation(); navigate(cat.route); }}
                      id={`go-${cat.key.toLowerCase()}-btn`}
                    >
                      ¡Explorar! 🚀
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ══ INSIGNIAS ════════════════════════════════════════ */}
        <section>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-3 mb-5"
          >
            <h2 className="text-2xl font-brand font-black">🏅 Mis Insignias</h2>
            <span className="badge badge-cyan">{badges.length}</span>
          </motion.div>

          {badges.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="glass-card p-10 text-center"
            >
              <div className="text-5xl mb-3 opacity-30">🔒</div>
              <p className="text-white/50 font-bold">¡Completa retos para desbloquear insignias!</p>
            </motion.div>
          ) : (
            <div className="flex gap-4 flex-wrap">
              {badges.map((b, i) => (
                <motion.div
                  key={b.slug}
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08, type: 'spring', stiffness: 300 }}
                  className="flex flex-col items-center gap-2 p-4 rounded-3xl
                             bg-letra-cyan/10 border border-letra-cyan/20 min-w-[90px]"
                  title={b.description}
                >
                  <span className="text-3xl">{b.icon}</span>
                  <span className="text-xs font-bold text-white/70 text-center">{b.title}</span>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* ══ MISIONES DEL DÍA + MASCOTA ══════════════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-4xl border border-letra-purple/20
                     bg-gradient-to-br from-letra-purple/10 to-letra-cyan/5 p-6"
        >
          <MisionesWidget />
        </motion.section>

      </div>

      {/* ══ POPUP DE INSIGNIA ════════════════════════════════ */}
      <AnimatePresence>
        {showBadge && (
          <BadgeUnlockPopup
            badges={newBadges}
            onClose={() => { setShowBadge(false); clearBadgeNotification?.(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChildDashboard;
