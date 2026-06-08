/**
 * Letramente — RetosView (Vista de Retos por Categoría)
 * Grupo 10 | Aprende, Comprende, Crea
 *
 * Muestra todos los retos de una categoría con animaciones Framer Motion.
 * Ruta: /juego/retos/:categoria
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../context/GameContext';
import RetoCard from '../../components/game/RetoCard';
import LapizRobot from '../../components/game/LapizRobot';

const CATEGORY_META = {
  Vocales: {
    label:     'Aprende — Vocales',
    icon:      '🔤',
    desc:      'Identifica las vocales A, E, I, O, U con cada reto',
    color:     'text-letra-orange',
    border:    'border-letra-orange/40',
    bg:        'from-letra-orange/15 to-bg-surface',
    badgeCls:  'badge-orange',
    modRoute:  '/juego/fonetica',
  },
  Silabas: {
    label:     'Comprende — Sílabas',
    icon:      '📝',
    desc:      'Completa las sílabas que faltan en cada palabra',
    color:     'text-letra-green',
    border:    'border-letra-green/40',
    bg:        'from-letra-green/15 to-bg-surface',
    badgeCls:  'badge-green',
    modRoute:  '/juego/palabras',
  },
  Palabras: {
    label:     'Crea — Palabras',
    icon:      '📖',
    desc:      'Lee y reconoce palabras completas',
    color:     'text-letra-purple',
    border:    'border-letra-purple/40',
    bg:        'from-letra-purple/15 to-bg-surface',
    badgeCls:  'badge-purple',
    modRoute:  '/juego/lectura',
  },
};

const RetosView = () => {
  const { categoria } = useParams();
  const navigate      = useNavigate();
  const { retos, partidas, loadRetos } = useGame();
  const [robotMood, setRobotMood] = useState('idle');

  useEffect(() => { loadRetos(); }, [loadRetos]);
  useEffect(() => { setRobotMood('start'); }, [categoria]);

  const meta         = CATEGORY_META[categoria];
  const retosCateg   = retos.filter(r => r.categoria === categoria);
  const completados  = retosCateg.filter(r => partidas?.some(p => p.reto_id?._id === r._id && p.estado));
  const pct          = retosCateg.length > 0
    ? Math.round((completados.length / retosCateg.length) * 100) : 0;

  const handlePlay = (reto) => {
    setRobotMood('start');
    navigate(meta?.modRoute || '/juego');
  };

  if (!meta) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="font-brand font-black text-2xl mb-2">Categoría no encontrada</h2>
          <button className="btn-cyan mt-4" onClick={() => navigate('/juego')}>← Volver</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">

      {/* ══ HEADER ══════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className={`relative overflow-hidden px-6 py-8 mx-4 mt-4 rounded-4xl
                    border-2 ${meta.border} bg-gradient-to-br ${meta.bg}`}
      >
        <div className="absolute right-4 top-2 text-[7rem] opacity-[0.07] select-none">{meta.icon}</div>

        <button
          id="back-retos-btn"
          className="btn-ghost btn-sm mb-4"
          onClick={() => navigate('/juego')}
        >
          ← Volver al Panel
        </button>

        <div className="flex items-start gap-4">
          <motion.div
            className="text-5xl"
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
          >
            {meta.icon}
          </motion.div>
          <div className="flex-1">
            <span className={`badge ${meta.badgeCls} mb-2`}>{meta.label}</span>
            <h1 className="font-brand font-black text-3xl text-white mb-1">{categoria}</h1>
            <p className="text-white/60 text-sm font-medium">{meta.desc}</p>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mt-6">
          <div className="flex justify-between text-xs text-white/50 font-bold mb-1.5">
            <span>Progreso</span>
            <span>{completados.length}/{retosCateg.length} completados</span>
          </div>
          <div className="progress-track">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
      </motion.div>

      {/* ══ GRID DE RETOS ═══════════════════════════════════ */}
      <div className="max-w-4xl mx-auto px-4 mt-6">

        {retosCateg.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-16 text-center"
          >
            <div className="text-6xl mb-4 animate-float">📭</div>
            <p className="font-brand font-bold text-white/60">
              Los retos de <strong>{categoria}</strong> se están cargando...
            </p>
            <p className="text-sm text-white/40 mt-2">
              Asegúrate de que el backend está corriendo y de haber ejecutado el seeder.
            </p>
          </motion.div>
        ) : (
          <AnimatePresence>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {retosCateg.map((reto, i) => {
                const partida = partidas?.find(p => p.reto_id?._id === reto._id);
                return (
                  <RetoCard
                    key={reto._id}
                    reto={reto}
                    index={i}
                    partida={partida || null}
                    onPlay={() => handlePlay(reto)}
                  />
                );
              })}
            </div>
          </AnimatePresence>
        )}

        {/* Tip pedagógico */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 p-5 rounded-3xl bg-letra-cyan/8 border border-letra-cyan/20
                     flex items-start gap-3"
        >
          <span className="text-2xl">💡</span>
          <div>
            <p className="text-letra-cyan-light font-bold text-sm">Consejo de Lapi:</p>
            <p className="text-white/60 text-sm font-medium mt-0.5">
              {categoria === 'Vocales' && '¡Pronuncia la vocal en voz alta antes de elegir! El sonido te ayuda a recordar.'}
              {categoria === 'Silabas' && '¡Divide la palabra en trozos pequeños! Por ejemplo: GA-TO, ME-SA, LU-NA.'}
              {categoria === 'Palabras' && '¡Mira la imagen primero, luego lee cada opción con cuidado! Tómate tu tiempo.'}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Lápiz-Robot */}
      <LapizRobot mood={robotMood} visible size="md" position="fixed" />
    </div>
  );
};

export default RetosView;
