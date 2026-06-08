/**
 * Letramente — Módulo de Lectura
 * Grupo 10 | Aprende, Comprende, Crea
 *
 * Actividad de lectura de cuentos cortos con preguntas de comprensión.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import StarRating from '../../components/ui/StarRating';
import { getMotivationalMessage } from '../../utils/gamification';

// ─── Cuento y preguntas ───────────────────────────────────────────────────────
const STORY = {
  title: 'El Gato y la Luna',
  emoji: '🐱🌙',
  pages: [
    {
      text: 'Había una vez un gatito llamado Milo. A Milo le gustaba mucho mirar la luna por las noches.',
      illustration: '🐱',
    },
    {
      text: 'Una noche, Milo vio que la luna era muy brillante y redonda. ¡Era luna llena!',
      illustration: '🌕',
    },
    {
      text: 'Milo saltó y saltó queriendo tocar la luna, pero era demasiado alto. Entonces decidió dibujarla.',
      illustration: '🎨',
    },
    {
      text: 'Al final, Milo guardó su dibujo y se durmió feliz soñando con la luna.',
      illustration: '😴',
    },
  ],
  questions: [
    {
      question: '¿Cómo se llama el gatito del cuento?',
      options: ['Luna', 'Milo', 'Pepe', 'Nala'],
      answer: 'Milo',
    },
    {
      question: '¿Qué miraba Milo por las noches?',
      options: ['Las estrellas', 'El sol', 'La luna', 'Los pájaros'],
      answer: 'La luna',
    },
    {
      question: '¿Qué hizo Milo cuando no pudo tocar la luna?',
      options: ['Lloró', 'Se durmió', 'Dibujó la luna', 'Salió a caminar'],
      answer: 'Dibujó la luna',
    },
  ],
};

const ReadingModule = () => {
  const navigate = useNavigate();
  const { submitActivity } = useGame();

  const [mode, setMode]           = useState('read');   // 'read' | 'questions' | 'result'
  const [pageIdx, setPageIdx]     = useState(0);
  const [answers, setAnswers]     = useState([]);
  const [qIdx, setQIdx]           = useState(0);
  const [selected, setSelected]   = useState(null);
  const [result, setResult]       = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [startTime]               = useState(Date.now);

  const page = STORY.pages[pageIdx];
  const question = STORY.questions[qIdx];

  const nextPage = () => {
    if (pageIdx < STORY.pages.length - 1) {
      setPageIdx(prev => prev + 1);
    } else {
      setMode('questions');
    }
  };

  const handleAnswer = (opt) => {
    if (selected !== null) return;
    setSelected(opt);
    const isCorrect = opt === question.answer;

    setTimeout(async () => {
      const newAnswers = [...answers, isCorrect];

      if (qIdx < STORY.questions.length - 1) {
        setAnswers(newAnswers);
        setQIdx(prev => prev + 1);
        setSelected(null);
      } else {
        const correct  = newAnswers.filter(Boolean).length;
        const score    = Math.round((correct / STORY.questions.length) * 100);
        const timeSecs = Math.round((Date.now() - startTime()) / 1000);
        setMode('result');
        setSubmitting(true);
        try {
          const res = await submitActivity(3, score, timeSecs); // activity_id=3
          setResult({ score, timeSecs, stars: res?.stars || 0, pointsEarned: res?.pointsEarned || 0 });
        } catch {
          setResult({ score, timeSecs, stars: 0, pointsEarned: 0 });
        } finally {
          setSubmitting(false);
        }
      }
    }, 800);
  };

  return (
    <div style={{ minHeight: '100vh', padding: '1.5rem' }}>
      {/* Navbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button id="back-reading-btn" className="btn btn-ghost btn-sm" onClick={() => navigate('/juego')}>← Volver</button>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.5rem 1rem',
          background: 'rgba(99,102,241,0.15)',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: 'var(--border-radius-full)',
        }}>
          <span style={{ fontSize: '1.5rem' }}>📖</span>
          <span style={{ fontWeight: 800, color: '#8b5cf6' }}>Módulo de Lectura</span>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '640px' }}>
        {/* ─── LEER EL CUENTO ────────────────────────────────────── */}
        {mode === 'read' && (
          <div className="animate-fadeIn">
            {/* Título del cuento */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{STORY.emoji}</div>
              <h1 style={{ fontSize: '1.8rem' }}>{STORY.title}</h1>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>
                Página {pageIdx + 1} de {STORY.pages.length}
              </span>
            </div>

            {/* Indicadores de páginas */}
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '1.5rem' }}>
              {STORY.pages.map((_, i) => (
                <div key={i} style={{
                  width: i === pageIdx ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: i <= pageIdx ? '#6366f1' : 'rgba(255,255,255,0.1)',
                  transition: 'var(--transition)',
                }} />
              ))}
            </div>

            {/* Página del cuento */}
            <div className="card animate-fadeIn" style={{
              textAlign: 'center',
              padding: '3rem 2rem',
              marginBottom: '1.5rem',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))',
              border: '1px solid rgba(99,102,241,0.3)',
            }}>
              <div style={{ fontSize: '6rem', marginBottom: '1.5rem' }}>{page.illustration}</div>
              <p style={{
                fontSize: '1.25rem',
                color: 'var(--text-primary)',
                lineHeight: 1.7,
                fontWeight: 600,
              }}>
                {page.text}
              </p>
            </div>

            {/* Botón siguiente */}
            <div style={{ textAlign: 'center' }}>
              <button
                id="next-page-btn"
                className="btn btn-primary btn-lg"
                onClick={nextPage}
                style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
              >
                {pageIdx < STORY.pages.length - 1 ? '➡️ Siguiente página' : '🎯 Responder preguntas'}
              </button>
            </div>
          </div>
        )}

        {/* ─── PREGUNTAS DE COMPRENSIÓN ─────────────────────────── */}
        {mode === 'questions' && (
          <div className="animate-fadeIn">
            {/* Progreso */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>
                Pregunta {qIdx + 1} de {STORY.questions.length}
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {STORY.questions.map((_, i) => (
                  <div key={i} style={{
                    width: '40px', height: '8px', borderRadius: '4px',
                    background: i < qIdx
                      ? (answers[i] ? 'var(--color-success)' : 'var(--color-danger)')
                      : i === qIdx ? '#6366f1' : 'rgba(255,255,255,0.1)',
                  }} />
                ))}
              </div>
            </div>

            <div className="card" style={{ textAlign: 'center', padding: '2.5rem', marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {question.question}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {question.options.map((opt) => {
                const isSelected = selected === opt;
                const isCorrect  = opt === question.answer;
                return (
                  <button
                    key={opt}
                    id={`reading-option-${opt.replace(/\s/g, '-')}`}
                    onClick={() => handleAnswer(opt)}
                    disabled={selected !== null}
                    style={{
                      padding: '1.1rem 1.5rem',
                      border: `2px solid ${isSelected ? (isCorrect ? 'var(--color-success)' : 'var(--color-danger)') : selected !== null && isCorrect ? 'var(--color-success)' : 'rgba(255,255,255,0.15)'}`,
                      borderRadius: 'var(--border-radius-xl)',
                      background: isSelected ? (isCorrect ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)') : selected !== null && isCorrect ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)',
                      cursor: selected !== null ? 'default' : 'pointer',
                      fontFamily: 'var(--font-child)',
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      textAlign: 'left',
                      transition: 'var(--transition)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                    }}
                  >
                    <span style={{ fontSize: '1.25rem' }}>
                      {isSelected ? (isCorrect ? '✅' : '❌') : selected !== null && isCorrect ? '✅' : '○'}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── RESULTADO FINAL ────────────────────────────────────── */}
        {mode === 'result' && (
          <div className="animate-bounceIn" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            {submitting ? (
              <><div className="loading-spinner" style={{ margin: '0 auto 1rem' }} /><p>Guardando...</p></>
            ) : result && (
              <>
                <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>
                  {result.stars === 3 ? '📚✨' : '📖'}
                </div>
                <h2 style={{ marginBottom: '0.5rem' }}>{getMotivationalMessage(result.stars)}</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Has terminado el cuento "{STORY.title}"
                </p>
                <StarRating stars={result.stars} size="2rem" animate />

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', margin: '1.5rem 0', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Puntuación', value: `${result.score}%`,  color: 'var(--color-secondary)' },
                    { label: 'Puntos',     value: `+${result.pointsEarned}`, color: 'var(--color-success)' },
                  ].map(s => (
                    <div key={s.label} className="card" style={{ padding: '1rem 1.5rem', minWidth: '120px' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 900, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button id="retry-reading-btn" className="btn btn-ghost" onClick={() => {
                    setMode('read'); setPageIdx(0); setQIdx(0);
                    setAnswers([]); setSelected(null); setResult(null);
                  }}>
                    🔄 Leer otra vez
                  </button>
                  <button id="home-reading-btn" className="btn btn-primary" onClick={() => navigate('/juego')}>
                    🏠 Panel Principal
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReadingModule;
