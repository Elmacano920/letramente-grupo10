/**
 * Letramente — Componente GameCard
 * Tarjeta de módulo de aprendizaje para el panel del niño
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressBar from '../ui/ProgressBar';

const MODULE_ROUTES = {
  phonics: '/juego/fonetica',
  words:   '/juego/palabras',
  reading: '/juego/lectura',
};

const GameCard = ({ module }) => {
  const navigate = useNavigate();
  const { slug, title, description, icon, color, progress } = module;

  const completedPct = progress?.total_activities > 0
    ? Math.round((progress.completed_activities / progress.total_activities) * 100)
    : 0;

  const handlePlay = () => {
    navigate(MODULE_ROUTES[slug] || '/juego');
  };

  return (
    <div
      id={`module-card-${slug}`}
      style={{
        background: `linear-gradient(135deg, ${color}22, ${color}11)`,
        border: `2px solid ${color}55`,
        borderRadius: 'var(--border-radius-xl)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        transition: 'var(--transition)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
      onClick={handlePlay}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
        e.currentTarget.style.boxShadow = `0 20px 50px ${color}44`;
        e.currentTarget.style.borderColor = `${color}88`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
        e.currentTarget.style.borderColor = `${color}55`;
      }}
    >
      {/* Fondo decorativo */}
      <div style={{
        position: 'absolute',
        top: '-20px',
        right: '-20px',
        fontSize: '8rem',
        opacity: 0.06,
        pointerEvents: 'none',
        userSelect: 'none',
      }}>
        {icon}
      </div>

      {/* Ícono y título */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{
          fontSize: '2.5rem',
          background: `${color}33`,
          padding: '0.5rem',
          borderRadius: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {icon}
        </span>
        <div>
          <h3 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1.2rem' }}>{title}</h3>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.85rem', marginTop: '0.15rem' }}>
            {description}
          </p>
        </div>
      </div>

      {/* Barra de progreso */}
      <ProgressBar
        value={completedPct}
        color={color}
        showLabel
        label={`${progress?.completed_activities || 0}/${progress?.total_activities || 0} actividades`}
        height={10}
      />

      {/* Botón de jugar */}
      <button
        className="btn"
        id={`play-btn-${slug}`}
        style={{
          background: `linear-gradient(135deg, ${color}, ${color}cc)`,
          color: 'white',
          fontWeight: 800,
          fontSize: '1rem',
          width: '100%',
          boxShadow: `0 4px 20px ${color}55`,
        }}
        onClick={(e) => { e.stopPropagation(); handlePlay(); }}
      >
        ¡Jugar! 🚀
      </button>
    </div>
  );
};

export default GameCard;
