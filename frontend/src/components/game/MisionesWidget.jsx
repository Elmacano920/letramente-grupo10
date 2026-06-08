/**
 * Letramente — MisionesWidget
 * Grupo 10 | Aprende, Comprende, Crea
 *
 * Panel de Misiones Diarias + Mascota Virtual para el ChildDashboard.
 * Se resetea automáticamente a medianoche (el backend lo gestiona).
 *
 * Funciones:
 *  - Muestra las 3 misiones del día con barra de progreso
 *  - Muestra la mascota con su nivel de evolución
 *  - Llama a POST /api/misiones/progreso al completar un reto
 *  - Animación de evolución cuando sube de nivel la mascota
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// URL del backend: en desarrollo usa localhost, en producción la URL de Render
// Se configura en frontend/.env (dev) y frontend/.env.production (producción)
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('letramente_token')}`,
});

// ─── Sub-componente: Barra de progreso de misión ──────────────────────────────
const MisionCard = ({ mision, onAnimate }) => {
  const pct = Math.round((mision.progreso / mision.meta) * 100);
  const completada = mision.completada;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        padding:      '0.875rem 1rem',
        borderRadius: '1rem',
        background:   completada ? 'rgba(46,184,126,0.12)' : 'rgba(255,255,255,0.04)',
        border:       `1px solid ${completada ? 'rgba(46,184,126,0.4)' : 'rgba(255,255,255,0.1)'}`,
        display:      'flex',
        flexDirection:'column',
        gap:          '0.5rem',
        transition:   'all 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '1.4rem' }}>{mision.emoji}</span>
        <div style={{ flex: 1 }}>
          <p style={{
            fontFamily: 'Nunito, sans-serif', fontWeight: 800,
            fontSize: '0.9rem', margin: 0,
            color: completada ? '#5ed4a4' : 'white',
          }}>
            {mision.titulo}
          </p>
          <p style={{
            fontFamily: 'Nunito, sans-serif', fontSize: '0.75rem',
            margin: 0, color: 'rgba(255,255,255,0.5)',
          }}>
            {mision.descripcion}
          </p>
        </div>
        <div style={{
          fontFamily: 'Nunito, sans-serif', fontWeight: 900,
          fontSize: '0.8rem',
          color: completada ? '#ffd23f' : 'rgba(255,255,255,0.4)',
        }}>
          {completada ? `+${mision.xp_reward} XP ✓` : `${mision.progreso}/${mision.meta}`}
        </div>
      </div>

      {/* Barra de progreso */}
      <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            height:     '100%',
            background: completada
              ? 'linear-gradient(90deg, #2eb87e, #06b6d4)'
              : 'linear-gradient(90deg, #ffd23f, #ff7b2c)',
            borderRadius: '3px',
          }}
        />
      </div>
    </motion.div>
  );
};

// ─── Sub-componente: Mascota ──────────────────────────────────────────────────
const MascotaPanel = ({ mascota }) => {
  if (!mascota) return null;
  const pct = mascota.proximaEvolucion
    ? Math.round(((mascota.xpTotal - mascota.xp_min) / (mascota.proximaEvolucion.xp_min - mascota.xp_min)) * 100)
    : 100;

  return (
    <div style={{
      padding:      '1rem',
      borderRadius: '1.25rem',
      background:   'rgba(139,92,246,0.1)',
      border:       '1px solid rgba(139,92,246,0.25)',
      display:      'flex',
      alignItems:   'center',
      gap:          '1rem',
      marginBottom: '1rem',
    }}>
      {/* Mascota animada */}
      <motion.div
        animate={{ y: [0, -8, 0], rotate: [0, -5, 5, 0] }}
        transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
        style={{ fontSize: '3.5rem', flexShrink: 0 }}
      >
        {mascota.emoji}
      </motion.div>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
          <span style={{
            fontFamily: 'Nunito, sans-serif', fontWeight: 900,
            fontSize: '1rem', color: 'white',
          }}>
            {mascota.nombre}
          </span>
          <span style={{
            fontFamily: 'Nunito, sans-serif', fontWeight: 700,
            fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)',
          }}>
            {mascota.xpTotal} XP
          </span>
        </div>

        {/* Barra de evolución */}
        <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.25rem' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #8b5cf6, #06b6d4)',
              borderRadius: '4px',
            }}
          />
        </div>

        {mascota.proximaEvolucion ? (
          <p style={{ fontFamily: 'Nunito', fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            {mascota.xpParaEvolucionar} XP para ser {mascota.proximaEvolucion.emoji} {mascota.proximaEvolucion.nombre}
          </p>
        ) : (
          <p style={{ fontFamily: 'Nunito', fontSize: '0.72rem', color: '#ffd23f', margin: 0, fontWeight: 800 }}>
            ✨ ¡Nivel máximo alcanzado!
          </p>
        )}
      </div>
    </div>
  );
};

// ─── Componente Principal ─────────────────────────────────────────────────────
const MisionesWidget = () => {
  const [misiones, setMisiones] = useState([]);
  const [mascota,  setMascota]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [evolucion, setEvolucion] = useState(null); // popup de evolución

  const cargarMisiones = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/misiones/hoy`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setMisiones(data.misiones);
        // Detectar evolución
        if (mascota && data.mascota.nivel > mascota.nivel) {
          setEvolucion(data.mascota);
        }
        setMascota(data.mascota);
      }
    } catch (err) {
      console.error('[MisionesWidget] Error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [mascota]);

  useEffect(() => { cargarMisiones(); }, []);

  const misionesCompletadas = misiones.filter(m => m.completada).length;

  if (loading) return (
    <div style={{ padding: '1.5rem', textAlign: 'center', opacity: 0.5 }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
      <p style={{ fontFamily: 'Nunito', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
        Cargando misiones...
      </p>
    </div>
  );

  return (
    <div>
      {/* Mascota */}
      <MascotaPanel mascota={mascota} />

      {/* Header misiones */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: '1.1rem', margin: 0 }}>
          🎯 Misiones del día
        </h3>
        <span style={{
          background: misionesCompletadas === misiones.length && misiones.length > 0
            ? 'rgba(46,184,126,0.2)' : 'rgba(255,255,255,0.08)',
          border: `1px solid ${misionesCompletadas === misiones.length && misiones.length > 0 ? 'rgba(46,184,126,0.4)' : 'rgba(255,255,255,0.1)'}`,
          padding: '0.2rem 0.6rem',
          borderRadius: '999px',
          fontFamily: 'Nunito', fontWeight: 800, fontSize: '0.8rem',
          color: misionesCompletadas === misiones.length && misiones.length > 0 ? '#5ed4a4' : 'rgba(255,255,255,0.5)',
        }}>
          {misionesCompletadas}/{misiones.length}
        </span>
      </div>

      {/* Lista de misiones */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {misiones.map((m, i) => (
          <motion.div key={m._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <MisionCard mision={m} />
          </motion.div>
        ))}
        {misiones.length === 0 && (
          <p style={{ fontFamily: 'Nunito', color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '1rem' }}>
            No hay misiones hoy. ¡Reinicia el servidor para generarlas!
          </p>
        )}
      </div>

      {/* Popup de evolución */}
      <AnimatePresence>
        {evolucion && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            }}
            onClick={() => setEvolucion(null)}
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] }}
              transition={{ repeat: 3, duration: 0.5 }}
              style={{ textAlign: 'center', padding: '2rem' }}
            >
              <div style={{ fontSize: '8rem', marginBottom: '1rem' }}>{evolucion.emoji}</div>
              <h2 style={{ fontFamily: 'Nunito', fontWeight: 900, fontSize: '2rem', color: '#ffd23f' }}>
                ¡{evolucion.nombre}!
              </h2>
              <p style={{ fontFamily: 'Nunito', color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem' }}>
                ¡Tu mascota ha evolucionado! 🎉
              </p>
              <button onClick={() => setEvolucion(null)} style={{
                marginTop: '1rem', padding: '0.75rem 2rem',
                background: '#ffd23f', border: 'none', borderRadius: '1rem',
                fontFamily: 'Nunito', fontWeight: 900, fontSize: '1rem', cursor: 'pointer',
              }}>
                ¡Genial! 🚀
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MisionesWidget;
export { MisionesWidget };
