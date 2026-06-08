/**
 * Letramente — Módulo de Juego Universal
 * Grupo 10 | Aprende, Comprende, Crea
 *
 * Usado por: Vocales, Consonantes, Sílabas, Palabras
 * Modelo conductista: Estímulo → Respuesta → Refuerzo
 * Con pronunciación TTS en cada respuesta
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../context/GameContext';
import SpeechService from '../../services/SpeechService';
import LapizRobot from '../../components/game/LapizRobot';
import WrongAnswerFeedback from '../../components/game/WrongAnswerFeedback'; // ← NUEVO

// ── Telemetría: registrar error de confusión ──────────────────────────────────
const registrarErrorTelemetria = async ({ retoId, categoria, elegida, correcta, palabraClave, tiempoMs }) => {
  try {
    const token = localStorage.getItem('letramente_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    await fetch(`${apiUrl}/telemetria/error`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({
        reto_id:          retoId,
        categoria,
        opcion_elegida:   elegida,
        opcion_correcta:  correcta,
        palabraClave,
        tiempo_respuesta: tiempoMs,
      }),
    });
  } catch { /* No bloquear el juego por fallos de telemetría */ }
};

// ─── Colores por categoría ────────────────────────────────────────────────────
const CAT_STYLE = {
  Vocales:      { icon: '🔤', color: '#ff7b2c', bg: 'rgba(255,123,44,0.15)',  border: 'rgba(255,123,44,0.5)',  btnCls: 'btn-orange'  },
  Consonantes:  { icon: '🔡', color: '#ffd23f', bg: 'rgba(255,210,63,0.15)',  border: 'rgba(255,210,63,0.5)',  btnCls: 'btn-yellow'  },
  Silabas:      { icon: '📝', color: '#2eb87e', bg: 'rgba(46,184,126,0.15)',  border: 'rgba(46,184,126,0.5)',  btnCls: 'btn-green'   },
  Palabras:     { icon: '📖', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)',  border: 'rgba(139,92,246,0.5)',  btnCls: 'btn-purple'  },
};

const STARS_MESSAGES = {
  3: { icon: '🎉', text: '¡PERFECTO! ¡Eres un genio!',        color: '#ffd23f' },
  2: { icon: '🌟', text: '¡MUY BIEN! ¡Casi perfecto!',        color: '#2eb87e' },
  1: { icon: '👍', text: '¡BIEN HECHO! ¡Sigue practicando!', color: '#06b6d4' },
  0: { icon: '💪', text: '¡No te rindas! ¡Inténtalo de nuevo!', color: '#ff7b2c' },
};

// ─── Componente de Opción ─────────────────────────────────────────────────────
const OptionButton = ({ text, onClick, state, disabled }) => {
  const colors = {
    idle:    { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.15)', textColor: 'white' },
    correct: { bg: 'rgba(46,184,126,0.25)',  border: '#2eb87e',                textColor: '#5ed4a4' },
    wrong:   { bg: 'rgba(239,68,68,0.2)',    border: '#ef4444',                textColor: '#fca5a5' },
    reveal:  { bg: 'rgba(46,184,126,0.12)',  border: 'rgba(46,184,126,0.4)',   textColor: 'rgba(94,212,164,0.8)' },
  };
  const c = colors[state] || colors.idle;

  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.06, y: -3 }}
      whileTap={disabled   ? {} : { scale: 0.95 }}
      animate={state === 'correct' ? { scale: [1, 1.15, 1] } : {}}
      onClick={onClick}
      disabled={disabled}
      id={`option-${text}`}
      style={{
        padding: '1.2rem 0.5rem',
        fontSize: text.length > 2 ? '1.4rem' : '2.5rem',
        fontWeight: 900,
        border: `3px solid ${c.border}`,
        borderRadius: '1rem',
        background: c.bg,
        color: c.textColor,
        cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'Nunito, sans-serif',
        transition: 'all 0.2s ease',
        minHeight: '80px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {text}
    </motion.button>
  );
};

// ─── Componente Principal ─────────────────────────────────────────────────────
const PhonicsModule = () => {
  const navigate             = useNavigate();
  const { categoria }        = useParams();
  const { retos, loadRetos, submitPartida } = useGame();

  const [quiz, setQuiz]               = useState([]);
  const [idx,  setIdx]                = useState(0);
  const [selected, setSelected]       = useState(null);
  const [answers, setAnswers]         = useState([]);
  const [mode, setMode]               = useState('loading');
  const [result, setResult]           = useState(null);
  const [robotMood, setRobotMood]     = useState('start');
  const [startTime]                   = useState(() => Date.now());
  const [wordFlash, setWordFlash]     = useState(false);
  const [questionStart, setQStart]    = useState(() => Date.now()); // ← telemetría

  // Cargar retos de la categoría correcta
  useEffect(() => {
    const iniciar = async () => {
      let lista = retos.filter(r => r.categoria === categoria);
      if (!lista.length) {
        await loadRetos();
        lista = retos.filter(r => r.categoria === categoria);
      }
      if (!lista.length) { setMode('empty'); return; }

      // Mezclar y tomar máx 8 retos
      const mezclados = [...lista].sort(() => Math.random() - 0.5).slice(0, 8);
      setQuiz(mezclados);
      setMode('playing');

      // Presentación en voz
      setTimeout(() => SpeechService.sayWelcome(categoria), 600);
    };
    iniciar();
  }, [categoria, retos, loadRetos]);

  const question = quiz[idx];
  const style    = CAT_STYLE[categoria] || CAT_STYLE.Palabras;

  // Leer la instrucción del reto actual
  useEffect(() => {
    if (question?.instruccion && mode === 'playing') {
      const t = setTimeout(() => SpeechService.sayInstruction(question.instruccion), 500);
      return () => clearTimeout(t);
    }
  }, [idx, mode, question]);

  const handleSelect = useCallback((opcion) => {
    if (selected !== null) return;

    setSelected(opcion.texto);
    const esCorrecta = opcion.esCorrecta;
    const tiempoRespMs = Date.now() - questionStart;

    if (esCorrecta) {
      setRobotMood('correct');
      setWordFlash(true);
      setTimeout(() => setWordFlash(false), 1200);
      const palabra = question.palabraClave || question.respuestaCorrecta || '';
      setTimeout(() => SpeechService.sayCorrect(palabra), 300);
    } else {
      setRobotMood('error');
      const palabraCorrecta = question.palabraClave || question.respuestaCorrecta || '';
      setTimeout(() => SpeechService.sayWrong(palabraCorrecta), 200);
      // ← TELEMETRÍA: registrar confusión específica
      registrarErrorTelemetria({
        retoId:      question._id,
        categoria,
        elegida:     opcion.texto,
        correcta:    question.respuestaCorrecta,
        palabraClave: question.palabraClave || '',
        tiempoMs:    tiempoRespMs,
      });
    }

    setTimeout(async () => {
      const newAnswers = [...answers, esCorrecta];

      if (idx < quiz.length - 1) {
        setAnswers(newAnswers);
        setIdx(p => p + 1);
        setSelected(null);
        setRobotMood('idle');
      } else {
        // Fin del juego
        const correctas   = newAnswers.filter(Boolean).length;
        const score        = Math.round((correctas / quiz.length) * 100);
        const errores      = quiz.length - correctas;
        const tiempoSegs   = Math.round((Date.now() - startTime) / 1000);
        const estrellas    = score >= 90 && errores <= 1 ? 3 : score >= 70 ? 2 : score >= 50 ? 1 : 0;

        setMode('result');
        SpeechService.sayResult(estrellas);
        setRobotMood(estrellas >= 3 ? 'levelUp' : 'correct');

        try {
          const res = await submitPartida({
            reto_id:         question._id,
            score,
            errores_cometidos: errores,
            tiempo_segundos: tiempoSegs,
          });
          setResult({ score, estrellas: res?.stars ?? estrellas, puntos: res?.pointsEarned ?? 0, correctas, total: quiz.length });
        } catch {
          setResult({ score, estrellas, puntos: 0, correctas, total: quiz.length });
        }
      }
    }, esCorrecta ? 1500 : 2200);
  }, [selected, idx, quiz, answers, startTime, question, submitPartida]);

  // ─── PANTALLA: Cargando ────────────────────────────────────────────────────
  if (mode === 'loading') return (
    <div className="loading-screen">
      <div className="spinner" />
      <p style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Nunito,sans-serif', fontWeight: 700 }}>
        Cargando retos...
      </p>
    </div>
  );

  // ─── PANTALLA: Sin retos ───────────────────────────────────────────────────
  if (mode === 'empty') return (
    <div className="loading-screen" style={{ gap: '1rem' }}>
      <div style={{ fontSize: '5rem' }}>📭</div>
      <h2 style={{ fontFamily: 'Nunito,sans-serif' }}>No hay retos de {categoria}</h2>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Nunito,sans-serif' }}>
        Ejecuta el seeder primero: <code>node seed.js</code>
      </p>
      <button className="btn-cyan" onClick={() => navigate('/juego')}>← Volver</button>
    </div>
  );

  const starMsg = STARS_MESSAGES[result?.estrellas ?? 0];

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '6rem' }}>

      {/* ── NAVBAR ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0,   opacity: 1 }}
        style={{
          display: 'flex', alignItems: 'center', gap: '1rem',
          padding: '1rem 1.5rem', margin: '1rem',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '1.5rem', backdropFilter: 'blur(12px)',
        }}
      >
        <button className="btn-ghost btn-sm" onClick={() => navigate('/juego')}>← Volver</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>{style.icon}</span>
          <span style={{ fontWeight: 900, color: style.color, fontFamily: 'Nunito,sans-serif' }}>
            {categoria}
          </span>
        </div>
        {mode === 'playing' && (
          <div style={{ marginLeft: 'auto', fontFamily: 'Nunito,sans-serif', fontWeight: 700, color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
            {idx + 1} / {quiz.length}
          </div>
        )}
      </motion.div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 1rem' }}>

        {/* ═══ MODO JUGANDO ══════════════════════════════════════════════ */}
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
                <div className="progress-fill" style={{ width: `${((idx) / quiz.length) * 100}%` }} />
              </div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                {quiz.map((_, i) => (
                  <div key={i} style={{
                    flex: 1, height: '6px', borderRadius: '3px',
                    background: i < idx
                      ? (answers[i] ? '#2eb87e' : '#ef4444')
                      : i === idx ? style.color : 'rgba(255,255,255,0.1)',
                    transition: 'background 0.3s',
                  }} />
                ))}
              </div>
            </div>

            {/* Tarjeta del estímulo */}
            <motion.div
              animate={wordFlash ? { scale: [1, 1.04, 1], borderColor: ['rgba(46,184,126,0.5)', '#2eb87e', 'rgba(46,184,126,0.5)'] } : {}}
              transition={{ duration: 0.6 }}
              style={{
                textAlign: 'center', padding: '2rem 1.5rem',
                marginBottom: '1.5rem', borderRadius: '1.5rem',
                background: style.bg,
                border: `2px solid ${style.border}`,
                position: 'relative',
              }}
            >
              {/* Botón de pronunciar instrucción */}
              <button
                id="say-instruction-btn"
                onClick={() => SpeechService.sayInstruction(question.instruccion)}
                style={{
                  position: 'absolute', right: '1rem', top: '1rem',
                  background: 'rgba(6,182,212,0.2)', border: '1px solid rgba(6,182,212,0.4)',
                  borderRadius: '50%', width: '36px', height: '36px',
                  cursor: 'pointer', fontSize: '1rem', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}
                title="Escuchar instrucción"
              >🔊</button>

              {/* ── MODO SÍLABA: imagen + cajas de sílabas ── */}
              {question.tipoReto === 'silaba' ? (
                <>
                  {/* Imagen de la palabra */}
                  {question.imagenUrl ? (
                    <img
                      src={question.imagenUrl}
                      alt={question.palabraClave}
                      style={{
                        width: '140px', height: '140px', objectFit: 'contain',
                        margin: '0 auto 1rem', display: 'block',
                        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
                        animation: 'float 3s ease-in-out infinite',
                      }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ repeat: Infinity, duration: 3 }}
                      style={{ fontSize: '6rem', marginBottom: '1rem', display: 'inline-block' }}
                    >
                      {question.emoji}
                    </motion.div>
                  )}

                  {/* Cajas de sílabas: PA — [___] */}
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    {(question.silabas || []).map((sil, i) => {
                      const isBlank = sil.isBlank;
                      const isAnswered = selected !== null && isBlank;
                      const isRight = isAnswered && selected === question.respuestaCorrecta;
                      return (
                        <React.Fragment key={i}>
                          {i > 0 && (
                            <span style={{ fontSize: '2rem', color: 'rgba(255,255,255,0.4)', fontWeight: 900 }}>—</span>
                          )}
                          <div style={{
                            minWidth: '72px', height: '72px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '2rem', fontWeight: 900,
                            fontFamily: 'Nunito, sans-serif',
                            borderRadius: '1rem',
                            border: isBlank
                              ? `3px dashed ${isAnswered ? (isRight ? '#2eb87e' : '#ef4444') : style.color}`
                              : `2px solid rgba(255,255,255,0.2)`,
                            background: isBlank
                              ? (isAnswered
                                  ? (isRight ? 'rgba(46,184,126,0.2)' : 'rgba(239,68,68,0.15)')
                                  : `${style.bg}`)
                              : 'rgba(255,255,255,0.07)',
                            color: isBlank
                              ? (isAnswered ? (isRight ? '#5ed4a4' : '#fca5a5') : style.color)
                              : 'white',
                            transition: 'all 0.3s ease',
                            letterSpacing: '0.05em',
                          }}>
                            {isBlank
                              ? (selected !== null ? selected : '?')
                              : sil.texto}
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* Instrucción */}
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: '1rem', fontFamily: 'Nunito,sans-serif' }}>
                    {question.instruccion}
                  </p>
                </>
              ) : (
                /* ── MODO LETRA (Vocales, Consonantes, Palabras) — sin cambios ── */
                <>
                  {/* Emoji principal animado */}
                  <motion.div
                    animate={{ y: [0, -10, 0], rotate: [0, -3, 3, 0] }}
                    transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
                    style={{ fontSize: '7rem', marginBottom: '1rem', display: 'inline-block' }}
                  >
                    {question.emoji}
                  </motion.div>

                  {/* Palabra/hueco a completar */}
                  {question.palabraConHueco ? (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '0.3em', color: 'white', fontFamily: 'Nunito,sans-serif' }}>
                        {question.palabraConHueco.split('').map((c, i) => (
                          <span key={i} style={{
                            color: c === '_'
                              ? (selected !== null ? (answers[idx] || selected === question.respuestaCorrecta ? '#2eb87e' : '#ef4444') : style.color)
                              : 'white',
                            fontSize: c === '_' ? '3rem' : '2.2rem',
                          }}>
                            {c === '_' ? (selected !== null ? selected : '_') : c}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <motion.div
                      style={{
                        fontSize: '2rem', fontWeight: 900, fontFamily: 'Nunito,sans-serif',
                        marginBottom: '0.5rem', letterSpacing: '0.08em',
                        color: wordFlash ? '#5ed4a4' : 'white',
                        transition: 'color 0.3s',
                      }}
                    >
                      {question.palabraClave && question.palabraClave.split('').map((ch, i) => (
                        <span key={i} style={{
                          color: i === 0
                            ? (wordFlash ? '#5ed4a4' : style.color)
                            : (wordFlash ? 'rgba(94,212,164,0.8)' : 'rgba(255,255,255,0.7)'),
                          transition: 'color 0.3s',
                        }}>{ch}</span>
                      ))}
                    </motion.div>
                  )}

                  {/* Instrucción */}
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: '1rem', fontFamily: 'Nunito,sans-serif' }}>
                    {question.instruccion}
                  </p>
                </>
              )}

              {/* Feedback post-respuesta (compartido) */}
              <AnimatePresence>
                {selected !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0,  scale: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      marginTop: '1rem', fontSize: '1.1rem', fontWeight: 800,
                      fontFamily: 'Nunito,sans-serif',
                      color: question.opciones?.find(o => o.texto === selected)?.esCorrecta
                        ? '#5ed4a4' : '#fca5a5',
                    }}
                  >
                    {question.opciones?.find(o => o.texto === selected)?.esCorrecta
                      ? `✅ ¡Correcto! ${question.tipoReto === 'silaba' ? `La sílaba es: ${question.respuestaCorrecta}` : `La respuesta es: ${question.palabraClave || question.respuestaCorrecta}`}`
                      : `❌ Era: ${question.respuestaCorrecta}`}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Opciones de respuesta */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: question.opciones?.length === 4 ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)',
              gap: '0.875rem',
            }}>
              {(question.opciones || []).map((op) => {
                const isSelected = selected === op.texto;
                const state = !isSelected
                  ? selected !== null && op.esCorrecta ? 'reveal' : 'idle'
                  : op.esCorrecta ? 'correct' : 'wrong';
                return (
                  <OptionButton
                    key={op.texto}
                    text={op.texto}
                    state={state}
                    disabled={selected !== null}
                    onClick={() => handleSelect(op)}
                  />
                );
              })}
            </div>

            {/* ← NUEVO: Feedback de error con shake y aliento */}
            <WrongAnswerFeedback
              visible={selected !== null && !question.opciones?.find(o => o.texto === selected)?.esCorrecta}
              respuestaCorrecta={question.respuestaCorrecta}
              autoAdvance={2000}
              speakFeedback={true}
              onContinue={() => {}}
            />

            {/* Tip: botón de sonido */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              style={{
                marginTop: '1.5rem', padding: '0.875rem 1rem',
                borderRadius: '1rem', background: 'rgba(6,182,212,0.08)',
                border: '1px solid rgba(6,182,212,0.2)',
                display: 'flex', alignItems: 'center', gap: '0.75rem',
              }}
            >
              <span style={{ fontSize: '1.3rem' }}>🔊</span>
              <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem', fontFamily: 'Nunito,sans-serif', fontWeight: 700 }}>
                Haz clic en 🔊 para escuchar la instrucción de nuevo
              </span>
              <button
                id="repeat-audio-btn"
                onClick={() => {
                  SpeechService.sayInstruction(question.instruccion);
                  if (question.palabraClave) setTimeout(() => SpeechService.sayWord(question.palabraClave), 2000);
                }}
                style={{
                  marginLeft: 'auto', padding: '0.4rem 0.9rem',
                  borderRadius: '0.75rem', border: '1px solid rgba(6,182,212,0.4)',
                  background: 'rgba(6,182,212,0.15)', color: '#67e8f9',
                  cursor: 'pointer', fontFamily: 'Nunito,sans-serif', fontWeight: 800, fontSize: '0.85rem',
                }}
              >
                Escuchar
              </button>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>

        {/* ═══ RESULTADO ════════════════════════════════════════════════ */}
        <AnimatePresence>
        {mode === 'result' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            style={{ textAlign: 'center', padding: '2rem 1rem' }}
          >
            {!result ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <div className="spinner" />
                <p style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Nunito,sans-serif', fontWeight: 700 }}>
                  Guardando tu progreso...
                </p>
              </div>
            ) : (
              <>
                {/* Resultado */}
                <motion.div
                  animate={{ scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] }}
                  transition={{ repeat: 2, duration: 0.5 }}
                  style={{ fontSize: '6rem', marginBottom: '0.75rem' }}
                >
                  {starMsg.icon}
                </motion.div>

                <h2 style={{ fontFamily: 'Nunito,sans-serif', fontWeight: 900, fontSize: '1.8rem', marginBottom: '0.5rem', color: starMsg.color }}>
                  {starMsg.text}
                </h2>

                {/* Estrellas */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', fontSize: '3rem', marginBottom: '1.5rem' }}>
                  {[1, 2, 3].map(n => (
                    <motion.span
                      key={n}
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: n * 0.2, type: 'spring', stiffness: 300 }}
                      style={{ filter: n <= result.estrellas ? 'none' : 'grayscale(1) opacity(0.3)' }}
                    >⭐</motion.span>
                  ))}
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '2rem' }}>
                  {[
                    { label: 'Puntuación', value: `${result.score}%`,                          color: style.color },
                    { label: '+ Puntos',   value: `+${result.puntos}`,                         color: '#ffd23f' },
                    { label: 'Correctas',  value: `${result.correctas}/${result.total}`,        color: '#2eb87e' },
                  ].map(s => (
                    <div key={s.label} style={{
                      padding: '1rem', borderRadius: '1rem',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}>
                      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: s.color, fontFamily: 'Nunito,sans-serif' }}>{s.value}</div>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, fontFamily: 'Nunito,sans-serif', textTransform: 'uppercase' }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Botones */}
                <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button className="btn-ghost" onClick={() => {
                    setIdx(0); setAnswers([]); setSelected(null);
                    setMode('playing'); setResult(null); setRobotMood('start');
                    setTimeout(() => SpeechService.sayWelcome(categoria), 400);
                  }}>
                    🔄 Repetir
                  </button>
                  <button className={`btn-letramente ${style.btnCls}`} onClick={() => navigate('/juego')}>
                    🏠 Ir al inicio
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      {/* Robot Lapi */}
      <LapizRobot mood={robotMood} visible size="md" position="fixed" />
    </div>
  );
};

export default PhonicsModule;
