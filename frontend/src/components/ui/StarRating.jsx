/**
 * LectoPlay — Componente StarRating
 * Muestra 1-3 estrellas con animación de aparición
 */

import React, { useEffect, useState } from 'react';

const StarRating = ({
  stars = 0,           // 0 | 1 | 2 | 3
  size = '1.5rem',
  animate = true,
  showCount = true,
  className = '',
}) => {
  const [visibleStars, setVisibleStars] = useState(animate ? 0 : stars);

  useEffect(() => {
    if (!animate) {
      setVisibleStars(stars);
      return;
    }
    // Animar estrellas apareciendo una por una
    setVisibleStars(0);
    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      setVisibleStars(current);
      if (current >= 3) clearInterval(interval);
    }, 300);

    return () => clearInterval(interval);
  }, [stars, animate]);

  return (
    <div className={`star-rating ${className}`} style={{ alignItems: 'center' }}>
      {[1, 2, 3].map((star) => (
        <span
          key={star}
          className={`star ${star <= visibleStars ? 'active' : ''}`}
          style={{
            fontSize: size,
            animationDelay: animate ? `${(star - 1) * 0.15}s` : '0s',
          }}
          aria-label={star <= stars ? 'estrella ganada' : 'estrella no ganada'}
        >
          ⭐
        </span>
      ))}
      {showCount && (
        <span style={{
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          fontWeight: 700,
          marginLeft: '0.25rem'
        }}>
          {stars}/3
        </span>
      )}
    </div>
  );
};

export default StarRating;
