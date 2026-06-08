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
import { useAuth } from '../../context/AuthContext';
import { usersService, progressService } from '../../services/api';
import ProgressBar from '../../components/ui/ProgressBar';

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

  const [students, setStudents]           = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentProgress, setStudentProgress] = useState(null);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [activeTab, setActiveTab]         = useState('students'); // 'students' | 'leaderboard'
  const [leaderboard, setLeaderboard]     = useState([]);

  // Cargar estudiantes y leaderboard
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
        // Demo data si no hay backend
        setStudents([
          { id: 1, name: 'Ana García',    avatar: 'cat',   points: 150, level: 2 },
          { id: 2, name: 'Carlos López',  avatar: 'dino',  points: 85,  level: 1 },
          { id: 3, name: 'Sofía Méndez',  avatar: 'bunny', points: 220, level: 3 },
          { id: 4, name: 'Diego Torres',  avatar: 'robot', points: 60,  level: 1 },
          { id: 5, name: 'Valentina Ruiz', avatar: 'owl',  points: 180, level: 2 },
        ]);
      } finally {
        setLoadingStudents(false);
      }
    };
    loadData();
  }, []);

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
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Panel de Control — Grupo 10
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
            }}>
              {[
                { id: 'students',    label: '👦 Estudiantes' },
                { id: 'leaderboard', label: '🏆 Ranking' },
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
    </div>
  );
};

export default AdultDashboard;
