/**
 * LectoPlay — Componente ProgressBar
 * Barra de progreso animada con colores personalizables
 */

import React from 'react';

const ProgressBar = ({
  value = 0,          // 0-100
  color = 'var(--color-primary)',
  height = 12,
  showLabel = false,
  label = '',
  animated = true,
  className = '',
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      {(showLabel || label) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {label && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</span>}
          {showLabel && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700 }}>{clampedValue}%</span>}
        </div>
      )}
      <div
        className="progress-bar-container"
        style={{ height: `${height}px` }}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Progreso'}
      >
        <div
          className="progress-bar-fill"
          style={{
            width: `${clampedValue}%`,
            background: `linear-gradient(90deg, ${color}, ${color}cc)`,
            // Si no está animado, desactivar el shimmer
            ...(animated ? {} : { animation: 'none' }),
          }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
