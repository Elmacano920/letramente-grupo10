/**
 * Letramente — AnimatedBackground
 * Grupo 10 | Aprende, Comprende, Crea
 *
 * Fondo mágico interactivo:
 * - Estrellas brillantes flotantes
 * - Burbujas de colores
 * - Letras del abecedario girando
 * - Nubes suaves
 * Diseñado para niños de 5-7 años.
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const PALETTE = ['#ff7b2c', '#ffd23f', '#2eb87e', '#06b6d4', '#8b5cf6', '#ec4899', '#f97316', '#34d399'];
const LETTERS = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
const STARS   = ['⭐','🌟','✨','💫'];
const SHAPES  = ['●','■','▲','◆','★'];

// Semilla determinística para posiciones fijas (evita re-renders)
const rand = (seed, max) => {
  const x = Math.sin(seed) * 10000;
  return ((x - Math.floor(x)) * max);
};

// ─── Estrella ────────────────────────────────────────────────
const Star = ({ i }) => {
  const x    = rand(i * 7.3, 100);
  const y    = rand(i * 3.7, 100);
  const size = rand(i * 1.1, 22) + 8;
  const dur  = rand(i * 2.3, 3) + 2;
  const del  = rand(i * 5.1, 3);
  const color= PALETTE[i % PALETTE.length];

  return (
    <motion.div
      style={{
        position: 'absolute',
        left:     `${x}%`,
        top:      `${y}%`,
        width:    size,
        height:   size,
        borderRadius: '50%',
        background: color,
        boxShadow: `0 0 ${size}px ${color}88`,
        pointerEvents: 'none',
      }}
      animate={{
        y:       [0, -16, 0],
        scale:   [1, 1.4, 1],
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: dur,
        delay: del,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
};

// ─── Letra flotante ──────────────────────────────────────────
const FloatingLetter = ({ i }) => {
  const x     = rand(i * 11.3, 95);
  const y     = rand(i * 6.7, 90);
  const size  = rand(i * 2.2, 28) + 16;
  const dur   = rand(i * 3.1, 5) + 4;
  const del   = rand(i * 4.7, 4);
  const rot   = rand(i * 1.9, 40) - 20;
  const color = PALETTE[i % PALETTE.length];
  const letter= LETTERS[i % LETTERS.length];

  return (
    <motion.div
      style={{
        position:    'absolute',
        left:        `${x}%`,
        top:         `${y}%`,
        fontSize:    size,
        fontWeight:  900,
        fontFamily:  'Nunito, sans-serif',
        color,
        opacity:     0.12,
        userSelect:  'none',
        pointerEvents: 'none',
        textShadow: `0 0 20px ${color}`,
      }}
      animate={{
        y:       [0, -20, 0],
        rotate:  [rot, rot + 8, rot],
        opacity: [0.08, 0.18, 0.08],
      }}
      transition={{
        duration: dur,
        delay:    del,
        repeat:   Infinity,
        ease:     'easeInOut',
      }}
    >
      {letter}
    </motion.div>
  );
};

// ─── Burbuja ─────────────────────────────────────────────────
const Bubble = ({ i }) => {
  const x    = rand(i * 8.9, 98);
  const size = rand(i * 2.7, 60) + 20;
  const dur  = rand(i * 1.6, 8) + 6;
  const del  = rand(i * 3.3, 5);
  const col  = PALETTE[i % PALETTE.length];

  return (
    <motion.div
      style={{
        position:    'absolute',
        left:        `${x}%`,
        bottom:      `-${size}px`,
        width:       size,
        height:      size,
        borderRadius: '50%',
        border:      `3px solid ${col}55`,
        background:  `${col}0a`,
        pointerEvents: 'none',
      }}
      animate={{ y: [0, -(window.innerHeight + size * 2)] }}
      transition={{
        duration: dur,
        delay:    del,
        repeat:   Infinity,
        ease:     'linear',
      }}
    />
  );
};

// ─── Nube emoji ───────────────────────────────────────────────
const Cloud = ({ i }) => {
  const y   = rand(i * 9.1, 40) + 5;
  const dur = rand(i * 2.8, 20) + 25;
  const del = rand(i * 7.3, 10);
  const sz  = rand(i * 1.4, 30) + 24;

  return (
    <motion.div
      style={{
        position:    'absolute',
        top:         `${y}%`,
        fontSize:    sz,
        opacity:     0.08,
        pointerEvents: 'none',
        userSelect:  'none',
      }}
      initial={{ x: '-15vw' }}
      animate={{ x: '110vw' }}
      transition={{
        duration: dur,
        delay:    del,
        repeat:   Infinity,
        ease:     'linear',
      }}
    >
      ☁️
    </motion.div>
  );
};

// ─── Componente principal ─────────────────────────────────────
const AnimatedBackground = () => {
  const stars   = useMemo(() => Array.from({ length: 28 }), []);
  const letters = useMemo(() => Array.from({ length: 20 }), []);
  const bubbles = useMemo(() => Array.from({ length: 12 }), []);
  const clouds  = useMemo(() => Array.from({ length: 5  }), []);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      overflow: 'hidden',
      zIndex: 0,
      pointerEvents: 'none',
    }}>
      {stars.map((_, i)   => <Star          key={`s-${i}`} i={i} />)}
      {letters.map((_, i) => <FloatingLetter key={`l-${i}`} i={i} />)}
      {bubbles.map((_, i) => <Bubble         key={`b-${i}`} i={i} />)}
      {clouds.map((_, i)  => <Cloud          key={`c-${i}`} i={i} />)}
    </div>
  );
};

export default AnimatedBackground;
