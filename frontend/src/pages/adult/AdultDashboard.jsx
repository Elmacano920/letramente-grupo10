/**
 * Letramente — Panel de Control para Adultos (Maestro/Padre)
 * Grupo 10 | Aprende, Comprende, Crea
 *
 * Muestra:
 * - Lista de estudiantes con progreso general
 * - Detalle de progreso por módulo de cada estudiante
 * - Top de estudiantes (leaderboard)
 * - Resumen estadístico del grupo
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { usersService, progressService } from '../../services/api';
import ProgressBar from '../../components/ui/ProgressBar';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('letramente_token')}`,
});

const AVATAR_EMOJIS = {
  dino: '🦕', cat: '🐱', robot: '🤖',
  bunny: '🐰', owl: '🦉', fox: '🦊',
};

const MODULE_COLORS = {
  phonics: '#ff7b2c',
  words:   '#2eb87e',
  reading: '#8b5cf6',
};

const MODULE_ICONS = {
  phonics: '🔤',
  words:   '📝',
  reading: '📖',
};

const AdultDashboard = () => {
  const { user, logout } = useAuth();

  const [students, setStudents]               = useState([]);
  const [selectedStudent, setSelectedStudent]   = useState(null);
  const [studentProgress, setStudentProgress]   = useState(null);
  const [loadingStudents, setLoadingStudents]   = useState(true);
  const [loadingProgress, setLoadingProgress]   = useState(false);
  const [activeTab, setActiveTab]               = useState('students');
  const [leaderboard, setLeaderboard]           = useState([]);

  // Gestion de ninos (v3.0)
  const [ninos,         setNinos]         = useState([]);
  const [loadingNinos,  setLoadingNinos]  = useState(false);
  const [showModal,     setShowModal]     = useState(false);
  const [ninoForm,      setNinoForm]      = useState({ nombre:'', avatar:'dino', pin:'' });
  const [ninoError,     setNinoError]     = useState('');
  const [ninoLoading,   setNinoLoading]   = useState(false);
  const [linkCopied,    setLinkCopied]    = useState(false);

  // Cargar estudiantes, leaderboard y ninos
  useEffect(() => {
    const loadData = async () => {
      try {
        const [studentsRes, leaderRes] = await Promise.all([
          usersService.getAllChildren(),
          usersService.getLeaderboard(),
        ]);
        setStudents(studentsRes.data?.children || []);
        setLeaderboard(leaderRes.data?.leaderboard || []);
      } catch (err) {
        console.error('Error cargando datos:', err);
        setStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    };
    loadData();
    fetchNinos();
  }, []);

  // Cargar ninos del tutor (v3.0)
  const fetchNinos = async () => {
    setLoadingNinos(true);
    try {
      const res = await fetch(`${API_BASE}/ninos`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setNinos(data.ninos || []);
    } catch {}
    finally { setLoadingNinos(false); }
  };

  // Crear nino
  const handleCrearNino = async (e) => {
    e.preventDefault();
    setNinoError('');
    if (!/^\d{4}$/.test(ninoForm.pin))
      return setNinoError('El PIN debe ser exactamente 4 digitos (0-9)');
    setNinoLoading(true);
    try {
      const res = await fetch(`${API_BASE}/ninos`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(ninoForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setNinoForm({ nombre:'', avatar:'dino', pin:'' });
        fetchNinos();
      } else {
        setNinoError(data.error || 'Error al crear el perfil');
      }
    } catch { setNinoError('Error de red'); }
    finally { setNinoLoading(false); }
  };

  // Eliminar nino
  const handleEliminarNino = async (id) => {
    if (!confirm('¿Eliminar este perfil? Se perderan sus datos.')) return;
    await fetch(`${API_BASE}/ninos/${id}`, { method:'DELETE', headers: getAuthHeaders() });
    fetchNinos();
  };

  // Copiar enlace de seleccion al portapapeles
  const copiarEnlace = () => {
    const url = `${window.location.origin}/seleccionar?tutor=${user?._id || user?.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  // Cargar progreso detallado de un estudiante
  const loadStudentProgress = async (student) => {
    setSelectedStudent(student);
    setLoadingProgress(true);
    try {
      const res = await progressService.getUserProgress(student.id);
      setStudentProgress(res.data);
    } catch {
      // Demo data
      setStudentProgress({
        moduleSummary: [
          { slug: 'phonics', title: 'Fonética',        icon: '🔤', total_activities: 10, activities_completed: 7, avg_score: 82, total_stars: 18 },
          { slug: 'words',   title: 'Palabras Simples', icon: '📝', total_activities: 10, activities_completed: 4, avg_score: 65, total_stars: 8 },
          { slug: 'reading', title: 'Lectura',          icon: '📖', total_activities: 5,  activities_completed: 2, avg_score: 90, total_stars: 6 },
        ],
      });
    } finally {
      setLoadingProgress(false);
    }
  };

  // Calcular estadísticas del grupo
  const groupStats = {
    total: students.length,
    avgPoints: students.length
      ? Math.round(students.reduce((s, st) => s + (st.points || 0), 0) / students.length)
      : 0,
    topStudent: students[0]?.name || '—',
  };

  const levelNames = ['Aprendiz', 'Explorador', 'Lector', 'Escritor', 'Maestro'];

  return (
    <div style={{ minHeight: '100vh', padding: '1.5rem', fontFamily: 'var(--font-adult)' }}>
      {/* ─── Navbar ──────────────────────────────────────────────── */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(12px)',
        borderRadius: 'var(--border-radius-xl)',
        padding: '1rem 1.5rem',
        border: '1px solid var(--border-color)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src="/logo.png" alt="Letramente" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
          <div>
            <div style={{ fontWeight: 900, fontSize: '1.2rem' }}>
              <span className="brand-gradient-static">Letramente</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Panel de Control
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
              👩‍🏫 {user?.name || 'Adulto'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Maestro/Padre</div>
          </div>
          <button id="adult-logout-btn" className="btn btn-ghost btn-sm" onClick={logout}>
            Salir 👋
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* ─── Estadísticas del Grupo ──────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          marginBottom: '2rem',
        }}>
          {[
            { label: 'Estudiantes',       value: groupStats.total,     icon: '👦', color: '#6366f1' },
            { label: 'Promedio de Puntos', value: groupStats.avgPoints, icon: '⭐', color: '#f59e0b' },
            { label: 'Mejor Estudiante',  value: groupStats.topStudent, icon: '🏆', color: '#10b981', isText: true },
          ].map((stat) => (
            <div key={stat.label} className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
              <div style={{ fontSize: stat.isText ? '1.1rem' : '2rem', fontWeight: 900, color: stat.color }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.25rem' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selectedStudent ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
          {/* ─── Panel izquierdo: Estudiantes / Leaderboard ──────── */}
          <div>
            {/* Tabs */}
            <div style={{
              display: 'flex',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 'var(--border-radius)',
              padding: '4px',
              marginBottom: '1rem',
              width: 'fit-content',
              flexWrap: 'wrap',
              gap: '2px',
            }}>
              {[
                { id: 'students',    label: '👦 Estudiantes' },
                { id: 'leaderboard', label: '🏆 Ranking' },
                { id: 'mis-ninos',   label: '➕ Mis Niños' },
              ].map(t => (
                <button
                  key={t.id}
                  id={`adult-tab-${t.id}`}
                  onClick={() => setActiveTab(t.id)}
                  style={{
                    padding: '0.5rem 1rem',
                    border: 'none',
                    borderRadius: 'calc(var(--border-radius) - 2px)',
                    background: activeTab === t.id
                      ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))'
                      : 'transparent',
                    color: activeTab === t.id ? 'white' : 'var(--text-secondary)',
                    fontFamily: 'var(--font-adult)',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Lista de estudiantes */}
            {activeTab === 'students' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {loadingStudents ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
                    Cargando estudiantes...
                  </div>
                ) : students.length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                    <p style={{ color: 'var(--text-muted)' }}>No hay estudiantes registrados aún.</p>
                  </div>
                ) : (
                  students.map((student) => (
                    <button
                      key={student.id}
                      id={`student-btn-${student.id}`}
                      onClick={() => loadStudentProgress(student)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem 1.25rem',
                        background: selectedStudent?.id === student.id
                          ? 'rgba(124,58,237,0.15)'
                          : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${selectedStudent?.id === student.id ? 'rgba(124,58,237,0.5)' : 'var(--border-color)'}`,
                        borderRadius: 'var(--border-radius-xl)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'var(--transition)',
                        width: '100%',
                      }}
                      onMouseEnter={(e) => { if (selectedStudent?.id !== student.id) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                      onMouseLeave={(e) => { if (selectedStudent?.id !== student.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                    >
                      {/* Avatar */}
                      <div style={{
                        width: '44px', height: '44px',
                        background: 'rgba(124,58,237,0.2)',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.5rem', flexShrink: 0,
                      }}>
                        {AVATAR_EMOJIS[student.avatar] || '🦕'}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                          {student.name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Nivel {student.level} — {levelNames[(student.level || 1) - 1]}
                        </div>
                      </div>

                      {/* Puntos */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontWeight: 900, color: 'var(--color-secondary)', fontSize: '1.1rem' }}>
                          {student.points || 0}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>pts</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Leaderboard */}
            {activeTab === 'leaderboard' && (
              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>🏆 Top Estudiantes</h3>
                {(leaderboard.length > 0 ? leaderboard : students).map((student, idx) => (
                  <div
                    key={student.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 0',
                      borderBottom: idx < students.length - 1 ? '1px solid var(--border-color)' : 'none',
                    }}
                  >
                    <div style={{
                      width: '32px', height: '32px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: '50%',
                      background: idx === 0 ? 'rgba(245,158,11,0.2)' : idx === 1 ? 'rgba(200,200,200,0.15)' : 'rgba(180,100,50,0.15)',
                      fontWeight: 900,
                      fontSize: idx < 3 ? '1.25rem' : '0.875rem',
                      color: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : idx === 2 ? '#cd7c2b' : 'var(--text-muted)',
                    }}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                    </div>
                    <span style={{ fontSize: '1.25rem' }}>{AVATAR_EMOJIS[student.avatar] || '🦕'}</span>
                    <span style={{ flex: 1, fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{student.name}</span>
                    <span style={{ fontWeight: 900, color: 'var(--color-secondary)' }}>{student.points || 0} pts</span>
                  </div>
                ))}
              </div>
            )}

            {/* Tab Mis Ninos (v3.0) */}
            {activeTab === 'mis-ninos' && (
              <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                {/* Enlace de acceso para ninos */}
                <div style={{
                  padding:'1rem', borderRadius:'1.25rem',
                  background:'rgba(6,182,212,0.08)', border:'1px solid rgba(6,182,212,0.2)',
                }}>
                  <p style={{ fontFamily:'var(--font-adult)', fontWeight:700, fontSize:'0.85rem', marginBottom:'0.5rem', color:'#06b6d4' }}>
                    🔗 Enlace de acceso para tus niños
                  </p>
                  <p style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.5)', marginBottom:'0.75rem', lineHeight:1.5 }}>
                    Comparte este enlace con tus niños. Ellos verán sus avatares y entrarán con su PIN.
                  </p>
                  <button
                    onClick={copiarEnlace}
                    style={{
                      padding:'0.5rem 1.25rem', borderRadius:'0.75rem',
                      background: linkCopied ? 'rgba(46,184,126,0.2)' : 'rgba(6,182,212,0.15)',
                      border: `1px solid ${linkCopied ? '#2eb87e' : 'rgba(6,182,212,0.4)'}`,
                      color: linkCopied ? '#5ed4a4' : '#06b6d4',
                      fontFamily:'var(--font-adult)', fontWeight:700, fontSize:'0.85rem', cursor:'pointer',
                    }}
                  >
                    {linkCopied ? '✅ Copiado!' : '📋 Copiar enlace'}
                  </button>
                </div>

                {/* Boton agregar */}
                <button
                  id="add-nino-btn"
                  onClick={() => setShowModal(true)}
                  style={{
                    padding:'0.75rem 1.5rem', borderRadius:'1rem',
                    background:'linear-gradient(135deg,#2eb87e,#06b6d4)',
                    border:'none', color:'white', fontFamily:'var(--font-adult)',
                    fontWeight:700, fontSize:'0.95rem', cursor:'pointer',
                    alignSelf:'flex-start',
                  }}
                >
                  ➕ Agregar niño
                </button>

                {/* Lista de ninos */}
                {loadingNinos ? (
                  <p style={{ color:'rgba(255,255,255,0.4)', fontFamily:'var(--font-adult)' }}>Cargando...</p>
                ) : ninos.length === 0 ? (
                  <div className="card" style={{ textAlign:'center', padding:'2rem' }}>
                    <div style={{ fontSize:'2.5rem', marginBottom:'0.5rem' }}>👶</div>
                    <p style={{ color:'var(--text-muted)' }}>Aún no tienes niños registrados.</p>
                  </div>
                ) : ninos.map(nino => (
                  <div key={nino._id} style={{
                    display:'flex', alignItems:'center', gap:'1rem',
                    padding:'0.875rem 1.25rem', borderRadius:'1.25rem',
                    background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)',
                  }}>
                    <div style={{ fontSize:'2.2rem' }}>{AVATAR_EMOJIS[nino.avatar] || '🦕'}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, color:'var(--text-primary)' }}>{nino.nombre}</div>
                      <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>
                        {nino.puntos_globales || 0} pts · Nivel {Math.ceil((nino.experiencia||0)/100) || 1}
                      </div>
                    </div>
                    <button
                      onClick={() => handleEliminarNino(nino._id)}
                      style={{
                        padding:'0.4rem 0.9rem', borderRadius:'0.75rem',
                        background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)',
                        color:'#fca5a5', fontFamily:'var(--font-adult)', fontSize:'0.8rem', cursor:'pointer',
                      }}
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ─── Panel derecho: Detalle de Estudiante ─────────── */}
          {selectedStudent && (
            <div className="animate-fadeIn">
              <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                {/* Header del estudiante */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{
                    width: '56px', height: '56px',
                    background: 'rgba(124,58,237,0.2)',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '2rem',
                  }}>
                    {AVATAR_EMOJIS[selectedStudent.avatar] || '🦕'}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{selectedStudent.name}</h3>
                    <div className="badge badge-primary" style={{ marginTop: '0.25rem' }}>
                      Nivel {selectedStudent.level} — {levelNames[(selectedStudent.level || 1) - 1]}
                    </div>
                  </div>
                  <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <div style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--color-secondary)' }}>
                      {selectedStudent.points || 0}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>puntos totales</div>
                  </div>
                </div>

                {/* Badges del estudiante */}
                {studentProgress?.student?.badges?.length > 0 && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Insignias
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {studentProgress.student.badges.map(b => (
                        <span key={b.slug} style={{ fontSize: '1.5rem' }} title={b.title}>{b.icon}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Progreso por módulo */}
                {loadingProgress ? (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <div className="loading-spinner" style={{ margin: '0 auto' }} />
                  </div>
                ) : studentProgress?.moduleSummary ? (
                  <div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Progreso por Módulo
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {studentProgress.moduleSummary.map((mod) => {
                        const pct = mod.total_activities > 0
                          ? Math.round((mod.activities_completed / mod.total_activities) * 100)
                          : 0;
                        return (
                          <div key={mod.slug}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                {MODULE_ICONS[mod.slug]} {mod.title}
                              </span>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                {mod.activities_completed}/{mod.total_activities} actividades • ⭐ {mod.total_stars || 0}
                              </span>
                            </div>
                            <ProgressBar value={pct} color={MODULE_COLORS[mod.slug]} showLabel height={12} />
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Promedio: <strong style={{ color: MODULE_COLORS[mod.slug] }}>{Math.round(mod.avg_score || 0)}%</strong>
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                    Este estudiante aún no ha realizado actividades.
                  </p>
                )}
              </div>

              <button
                id="close-student-btn"
                className="btn btn-ghost btn-sm"
                onClick={() => { setSelectedStudent(null); setStudentProgress(null); }}
              >
                ✕ Cerrar detalle
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── Modal crear nino (v3.0) ─────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            exit={{ opacity:0 }}
            style={{
              position:'fixed', inset:0, zIndex:9999,
              display:'flex', alignItems:'center', justifyContent:'center',
              background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)',
              padding:'1rem',
            }}
            onClick={() => setShowModal(false)}
          >
            <motion.form
              initial={{ scale:0.85, y:20 }}
              animate={{ scale:1,    y:0 }}
              exit={{ scale:0.85, y:20 }}
              onSubmit={handleCrearNino}
              onClick={e => e.stopPropagation()}
              style={{
                background:'rgba(14,15,23,0.97)', border:'1px solid rgba(255,255,255,0.1)',
                borderRadius:'2rem', padding:'2rem', width:'100%', maxWidth:'420px',
                display:'flex', flexDirection:'column', gap:'1.25rem',
              }}
            >
              <h3 style={{ fontFamily:'var(--font-adult)', fontWeight:900, margin:0, color:'white' }}>
                \u2795 Agregar Ni\u00f1o
              </h3>

              {/* Nombre */}
              <div>
                <label style={{ display:'block', fontSize:'0.8rem', fontWeight:700, color:'rgba(255,255,255,0.5)', marginBottom:'0.4rem' }}>Nombre</label>
                <input
                  required
                  value={ninoForm.nombre}
                  onChange={e => setNinoForm(f=>({...f, nombre:e.target.value}))}
                  placeholder="Nombre del ni\u00f1o"
                  style={{
                    width:'100%', padding:'0.75rem 1rem', borderRadius:'0.875rem',
                    background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.15)',
                    color:'white', fontFamily:'var(--font-adult)', fontSize:'0.95rem', boxSizing:'border-box',
                  }}
                />
              </div>

              {/* Avatar */}
              <div>
                <label style={{ display:'block', fontSize:'0.8rem', fontWeight:700, color:'rgba(255,255,255,0.5)', marginBottom:'0.5rem' }}>Avatar</label>
                <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
                  {Object.entries(AVATAR_EMOJIS).map(([id,emoji]) => (
                    <button
                      key={id} type="button"
                      onClick={() => setNinoForm(f=>({...f, avatar:id}))}
                      style={{
                        width:'52px', height:'52px', borderRadius:'1rem',
                        fontSize:'1.8rem', cursor:'pointer',
                        background: ninoForm.avatar===id ? 'rgba(6,182,212,0.2)' : 'rgba(255,255,255,0.05)',
                        border: `2px solid ${ninoForm.avatar===id ? '#06b6d4' : 'rgba(255,255,255,0.1)'}`,
                      }}
                    >{emoji}</button>
                  ))}
                </div>
              </div>

              {/* PIN */}
              <div>
                <label style={{ display:'block', fontSize:'0.8rem', fontWeight:700, color:'rgba(255,255,255,0.5)', marginBottom:'0.4rem' }}>PIN de 4 d\u00edgitos</label>
                <input
                  required
                  type="password"
                  maxLength={4}
                  value={ninoForm.pin}
                  onChange={e => setNinoForm(f=>({...f, pin:e.target.value.replace(/\D/g,'').slice(0,4)}))}
                  placeholder="Ej: 1234"
                  style={{
                    width:'100%', padding:'0.75rem 1rem', borderRadius:'0.875rem',
                    background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.15)',
                    color:'white', fontFamily:'var(--font-adult)', fontSize:'1.5rem', letterSpacing:'0.5rem',
                    boxSizing:'border-box',
                  }}
                />
                <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.35)', marginTop:'0.3rem' }}>
                  El ni\u00f1o usar\u00e1 este PIN para acceder.
                </p>
              </div>

              {ninoError && (
                <p style={{ color:'#fca5a5', fontFamily:'var(--font-adult)', fontWeight:700, margin:0 }}>\u274c {ninoError}</p>
              )}

              <div style={{ display:'flex', gap:'0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    flex:1, padding:'0.75rem', borderRadius:'1rem',
                    background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
                    color:'rgba(255,255,255,0.6)', fontFamily:'var(--font-adult)', cursor:'pointer',
                  }}
                >Cancelar</button>
                <button
                  type="submit"
                  disabled={ninoLoading}
                  style={{
                    flex:2, padding:'0.75rem', borderRadius:'1rem',
                    background:'linear-gradient(135deg,#2eb87e,#06b6d4)',
                    border:'none', color:'white', fontFamily:'var(--font-adult)',
                    fontWeight:700, cursor:'pointer', opacity: ninoLoading ? 0.6 : 1,
                  }}
                >
                  {ninoLoading ? 'Creando...' : '\u2714\ufe0f Crear perfil'}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdultDashboard;
