/**
 * Letramente — Módulo de Sílabas (Comprende)
 * Grupo 10 | Aprende, Comprende, Crea
 *
 * Actividad de completar SÍLABAS (no letras individuales).
 * Muestra: PA — [___] y el niño elige entre TO, TA, TE, TI
 * Los retos vienen de la API: GET /api/retos/categoria/Silabas?tipoReto=silaba
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../context/GameContext';
import { retosService } from '../../services/api';
import LapizRobot from '../../components/game/LapizRobot';
import SpeechService from '../../services/SpeechService';

const STYLE = {
  color: '#2eb87e', bg: 'rgba(46,184,126,0.12)',
  border: 'rgba(46,184,126,0.45)',
};

// ─── Botón de opción de sílaba ────────────────────────────────────────────────
const SilabaBtn = ({ texto, onClick, state, disabled }) => {
  const colors = {
    idle:    { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.18)', color: 'white'    },
    correct: { bg: 'rgba(46,184,126,0.25)',  border: '#2eb87e',                color: '#5ed4a4'  },
    wrong:   { bg: 'rgba(239,68,68,0.2)',    border: '#ef4444',                color: '#fca5a5'  },
    reveal:  { bg: 'rgba(46,184,126,0.1)',   border: 'rgba(46,184,126,0.35)', color: 'rgba(94,212,164,0.8)' },
  };
  const c = colors[state] || colors.idle;
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.08, y: -4 }}
      whileTap={disabled ? {}   : { scale: 0.94 }}
      animate={state === 'correct' ? { scale: [1, 1.18, 1] } : {}}
      onClick={onClick}
      disabled={disabled}
      id={`silaba-option-${texto}`}
      style={{
        padding: '1.25rem 0.5rem',
        fontSize: '2.2rem', fontWeight: 900,
        fontFamily: 'Nunito, sans-serif',
        border: `3px solid ${c.border}`,
        borderRadius: '1.2rem',
        background: c.bg, color: c.color,
        cursor: disabled ? 'default' : 'pointer',
        transition: 'all 0.2s ease',
        minHeight: '88px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        letterSpacing: '0.04em',
      }}
    >
      {texto}
    </motion.button>
  );
};

// ─── Componente Principal ─────────────────────────────────────────────────────
const WordsModule = () => {
  const navigate = useNavigate();
  const { submitPartida } = useGame();

  const [quiz,      setQuiz]      = useState([]);
  const [idx,       setIdx]       = useState(0);
  const [selected,  setSelected]  = useState(null);
  const [answers,   setAnswers]   = useState([]);
  const [mode,      setMode]      = useState('loading');
  const [result,    setResult]    = useState(null);
  const [robotMood, setRobotMood] = useState('start');
  const [startTime]               = useState(() => Date.now());

  // Cargar retos silábicos desde la API
  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await retosService.getByCategoria('Silabas', { tipoReto: 'silaba' });
        const lista = res.retos || [];
        if (!lista.length) { setMode('empty'); return; }
        const mezclados = [...lista].sort(() => Math.random() - 0.5).slice(0, 8);
        setQuiz(mezclados);
        setMode('playing');
        setTimeout(() => SpeechService.sayWelcome('Sílabas'), 600);
      } catch {
        setMode('empty');
      }
    };
    cargar();
  }, []);

  const question = quiz[idx];

  useEffect(() => {
    if (question?.instruccion && mode === 'playing') {
      const t = setTimeout(() => SpeechService.sayInstruction(question.instruccion), 500);
      return () => clearTimeout(t);
    }
  }, [idx, mode, question]);

  const handleSelect = useCallback((opcion) => {
    if (selected !== null) return;
    setSelected(opcion.texto);

    if (opcion.esCorrecta) {
      setRobotMood('correct');
      SpeechService.sayCorrect(question.respuestaCorrecta);
    } else {
      setRobotMood('error');
      SpeechService.sayWrong(question.respuestaCorrecta);
    }

    setTimeout(async () => {
      const newAnswers = [...answers, opcion.esCorrecta];

      if (idx < quiz.length - 1) {
        setAnswers(newAnswers);
        setIdx(p => p + 1);
        setSelected(null);
        setRobotMood('idle');
      } else {
        const correctas  = newAnswers.filter(Boolean).length;
        const score      = Math.round((correctas / quiz.length) * 100);
        const errores    = quiz.length - correctas;
        const tiempoSegs = Math.round((Date.now() - startTime) / 1000);
        const estrellas  = score >= 90 && errores <= 1 ? 3 : score >= 70 ? 2 : score >= 50 ? 1 : 0;

        setMode('result');
        SpeechService.sayResult(estrellas);
        setRobotMood(estrellas >= 3 ? 'levelUp' : 'correct');

        try {
          const res = await submitPartida({
            reto_id: question._id, score,
            errores_cometidos: errores, tiempo_segundos: tiempoSegs,
          });
          setResult({ score, estrellas: res?.stars ?? estrellas, puntos: res?.pointsEarned ?? 0, correctas, total: quiz.length });
        } catch {
          setResult({ score, estrellas, puntos: 0, correctas, total: quiz.length });
        }
      }
    }, opcion.esCorrecta ? 1400 : 2100);
  }, [selected, idx, quiz, answers, startTime, question, submitPartida]);

  // ── Pantallas auxiliares ───────────────────────────────────────────────────
  if (mode === 'loading') return (
    <div className="loading-screen">
      <div className="spinner" />
      <p style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Nunito,sans-serif', fontWeight: 700 }}>
        Cargando sílabas...
      </p>
    </div>
  );

  if (mode === 'empty') return (
    <div className="loading-screen" style={{ gap: '1rem' }}>
      <div style={{ fontSize: '5rem' }}>📭</div>
      <h2 style={{ fontFamily: 'Nunito,sans-serif' }}>No hay retos de sílabas</h2>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Nunito,sans-serif' }}>
        Ejecuta el seeder: <code>node seed.js</code>
      </p>
      <button className="btn-ghost" onClick={() => navigate('/juego')}>← Volver</button>
    </div>
  );

  const STARS_MSG = {
    3: { icon: '🎉', text: '¡PERFECTO! ¡Eres genial!',           color: '#ffd23f' },
    2: { icon: '🌟', text: '¡MUY BIEN! ¡Casi perfecto!',         color: '#2eb87e' },
    1: { icon: '👍', text: '¡BIEN HECHO! ¡Sigue practicando!',   color: '#06b6d4' },
    0: { icon: '💪', text: '¡No te rindas! ¡Inténtalo de nuevo!',color: '#ff7b2c' },
  };
  const starMsg = STARS_MSG[result?.estrellas ?? 0];

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '6rem' }}>

      {/* NAVBAR */}
      <motion.div
        initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        style={{
          display: 'flex', alignItems: 'center', gap: '1rem',
          padding: '1rem 1.5rem', margin: '1rem',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '1.5rem', backdropFilter: 'blur(12px)',
        }}
      >
        <button id="back-btn" className="btn-ghost btn-sm" onClick={() => navigate('/juego')}>← Volver</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>📝</span>
          <span style={{ fontWeight: 900, color: STYLE.color, fontFamily: 'Nunito,sans-serif' }}>
            Comprende — Sílabas
          </span>
        </div>
        {mode === 'playing' && (
          <div style={{ marginLeft: 'auto', fontFamily: 'Nunito,sans-serif', fontWeight: 700, color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
            {idx + 1} / {quiz.length}
          </div>
        )}
      </motion.div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 1rem' }}>

        {/* ═══ JUGANDO ══════════════════════════════════════════════ */}
        <AnimatePresence mode="wait">
        {mode === 'playing' && question && (
          <motion.div
            key={`q-${idx}`}
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0,  scale: 1 }}
            exit={{   opacity: 0, x: -60, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 250, damping: 22 }}
          >
            {/* Barra de progreso */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${(idx / quiz.length) * 100}%` }} />
              </div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                {quiz.map((_, i) => (
                  <div key={i} style={{
                    flex: 1, height: '6px', borderRadius: '3px',
                    background: i < idx
                      ? (answers[i] ? '#2eb87e' : '#ef4444')
                      : i === idx ? STYLE.color : 'rgba(255,255,255,0.1)',
                    transition: 'background 0.3s',
                  }} />
                ))}
              </div>
            </div>

            {/* Tarjeta de la palabra */}
            <div style={{
              textAlign: 'center', padding: '2rem 1.5rem',
              marginBottom: '1.5rem', borderRadius: '1.5rem',
              background: STYLE.bg, border: `2px solid ${STYLE.border}`,
              position: 'relative',
            }}>
              {/* Botón de audio */}
              <button
                id="repeat-audio-btn"
                onClick={() => SpeechService.sayInstruction(question.instruccion)}
                style={{
                  position: 'absolute', right: '1rem', top: '1rem',
                  background: 'rgba(6,182,212,0.2)', border: '1px solid rgba(6,182,212,0.4)',
                  borderRadius: '50%', width: '36px', height: '36px',
                  cursor: 'pointer', fontSize: '1rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >🔊</button>

              {/* Imagen de la palabra */}
              {question.imagenUrl ? (
                <img
                  src={question.imagenUrl}
                  alt={question.palabraClave}
                  style={{
                    width: '150px', height: '150px', objectFit: 'contain',
                    margin: '0 auto 1rem', display: 'block',
                    filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.35))',
                    animation: 'float 3s ease-in-out infinite',
                  }}
                  onError={e => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  style={{ fontSize: '7rem', marginBottom: '1rem', display: 'inline-block' }}
                >
                  {question.emoji}
                </motion.div>
              )}

              {/* Cajas de sílabas: PA — [?] */}
              <div style={{
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                gap: '0.6rem', marginBottom: '1rem', flexWrap: 'wrap',
              }}>
                {(question.silabas || []).map((sil, i) => {
                  const isBlank    = sil.isBlank;
                  const isAnswered = selected !== null && isBlank;
                  const isRight    = isAnswered && selected === question.respuestaCorrecta;
                  return (
                    <React.Fragment key={i}>
                      {i > 0 && (
                        <span style={{ fontSize: '2rem', color: 'rgba(255,255,255,0.35)', fontWeight: 900 }}>—</span>
                      )}
                      <motion.div
                        animate={isAnswered && isRight ? { scale: [1, 1.2, 1] } : {}}
                        style={{
                          minWidth: '80px', height: '80px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '2.2rem', fontWeight: 900,
                          fontFamily: 'Nunito, sans-serif',
                          borderRadius: '1.1rem',
                          border: isBlank
                            ? `3px dashed ${isAnswered ? (isRight ? '#2eb87e' : '#ef4444') : STYLE.color}`
                            : `2px solid rgba(255,255,255,0.2)`,
                          background: isBlank
                            ? (isAnswered ? (isRight ? 'rgba(46,184,126,0.2)' : 'rgba(239,68,68,0.15)') : 'rgba(46,184,126,0.08)')
                            : 'rgba(255,255,255,0.06)',
                          color: isBlank
                            ? (isAnswered ? (isRight ? '#5ed4a4' : '#fca5a5') : STYLE.color)
                            : 'white',
                          transition: 'all 0.3s ease',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {isBlank ? (selected !== null ? selected : '?') : sil.texto}
                      </motion.div>
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Instrucción */}
              <p style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: '1rem', fontFamily: 'Nunito,sans-serif' }}>
                {question.instruccion}
              </p>

              {/* Feedback inline */}
              <AnimatePresence>
                {selected !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      marginTop: '0.75rem', fontSize: '1.1rem', fontWeight: 800,
                      fontFamily: 'Nunito,sans-serif',
                      color: question.opciones?.find(o => o.texto === selected)?.esCorrecta ? '#5ed4a4' : '#fca5a5',
                    }}
                  >
                    {question.opciones?.find(o => o.texto === selected)?.esCorrecta
                      ? `✅ ¡Correcto! La sílaba es: ${question.respuestaCorrecta}`
                      : `❌ Era: ${question.respuestaCorrecta}`}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Opciones de sílabas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.875rem' }}>
              {(question.opciones || []).map(op => {
                const isSelected = selected === op.texto;
                const state = !isSelected
                  ? selected !== null && op.esCorrecta ? 'reveal' : 'idle'
                  : op.esCorrecta ? 'correct' : 'wrong';
                return (
                  <SilabaBtn
                    key={op.texto}
                    texto={op.texto}
                    state={state}
                    disabled={selected !== null}
                    onClick={() => handleSelect(op)}
                  />
                );
              })}
            </div>

          </motion.div>
        )}
        </AnimatePresence>

        {/* ═══ RESULTADO ══════════════════════════════════════════════ */}
        <AnimatePresence>
        {mode === 'result' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            style={{ textAlign: 'center', padding: '2rem 1rem' }}
          >
            {!result ? (
              <><div className="spinner" style={{ margin: '0 auto 1rem' }} /><p>Guardando...</p></>
            ) : (
              <>
                <motion.div
                  animate={{ scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] }}
                  transition={{ repeat: 2, duration: 0.5 }}
                  style={{ fontSize: '6rem', marginBottom: '0.75rem' }}
                >{starMsg.icon}</motion.div>

                <h2 style={{ fontFamily: 'Nunito,sans-serif', fontWeight: 900, fontSize: '1.8rem', color: starMsg.color, marginBottom: '0.5rem' }}>
                  {starMsg.text}
                </h2>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', fontSize: '3rem', marginBottom: '1.5rem' }}>
                  {[1,2,3].map(n => (
                    <motion.span key={n} initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: n * 0.2, type: 'spring', stiffness: 300 }}
                      style={{ filter: n <= result.estrellas ? 'none' : 'grayscale(1) opacity(0.3)' }}>⭐</motion.span>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '2rem' }}>
                  {[
                    { label: 'Puntuación', value: `${result.score}%`,                    color: STYLE.color },
                    { label: '+ Puntos',   value: `+${result.puntos}`,                   color: '#ffd23f'   },
                    { label: 'Correctas',  value: `${result.correctas}/${result.total}`, color: '#2eb87e'   },
                  ].map(s => (
                    <div key={s.label} style={{ padding: '1rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: s.color, fontFamily: 'Nunito,sans-serif' }}>{s.value}</div>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, fontFamily: 'Nunito,sans-serif', textTransform: 'uppercase' }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button id="retry-words-btn" className="btn-ghost" onClick={() => {
                    setIdx(0); setAnswers([]); setSelected(null);
                    setMode('loading'); setResult(null); setRobotMood('start');
                  }}>🔄 Repetir</button>
                  <button id="home-btn-words" className="btn-letramente btn-green" onClick={() => navigate('/juego')}>
                    🏠 Inicio
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      <LapizRobot mood={robotMood} visible size="md" position="fixed" />
    </div>
  );
};

export default WordsModule;
