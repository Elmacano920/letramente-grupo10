/**
 * Letramente — LoginPage (Tailwind + Framer Motion)
 * Grupo 10 | Aprende, Comprende, Crea
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const AVATARS = [
  { id: 'dino',  emoji: '🦕', name: 'Dino'   },
  { id: 'cat',   emoji: '🐱', name: 'Gatito' },
  { id: 'robot', emoji: '🤖', name: 'Robot'  },
  { id: 'bunny', emoji: '🐰', name: 'Conejo' },
  { id: 'owl',   emoji: '🦉', name: 'Búho'   },
  { id: 'fox',   emoji: '🦊', name: 'Zorro'  },
];

const BG_ITEMS = ['A','B','C','🔤','📖','✏️','🧠','⭐','💡','🌟','ABC','📚','🔡','🎨','🏆'];

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, register, error } = useAuth();

  const [mode, setMode]     = useState('login');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('dino');
  const [form, setForm]     = useState({ name: '', username: '', password: '', confirmPassword: '' });

  const handleChange = e => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLocalError('');
    try {
      if (mode === 'login') {
        const res = await login(form.username, form.password);
        if (res.success) navigate(res.role === 'child' ? '/juego' : '/adulto', { replace: true });
        else setLocalError(res.error || 'Usuario o contraseña incorrectos');
      } else {
        if (form.password !== form.confirmPassword) {
          setLocalError('Las contraseñas no coinciden');
          setLoading(false);
          return;
        }
        // v3.0: registro exclusivo para adultos
        const res = await register({
          nombre: form.name, username: form.username,
          password: form.password, rol: 'adult', avatar: selectedAvatar,
        });
        if (res.success) navigate('/adulto', { replace: true });
        else setLocalError(res.error || 'Error al crear la cuenta');
      }
    } finally { setLoading(false); }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">

      {/* ── Fondo animado de letras/emojis ─────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {BG_ITEMS.map((item, i) => (
          <motion.div
            key={i}
            className="absolute font-brand font-black select-none"
            style={{
              left:  `${(i * 7 + 3) % 95}%`,
              top:   `${(i * 11 + 5) % 88}%`,
              fontSize: `${0.9 + (i % 4) * 0.35}rem`,
              color: ['#ff7b2c','#2eb87e','#06b6d4','#8b5cf6','#ffd23f','#ec4899'][i % 6],
              opacity: 0.06,
            }}
            animate={{ y: [0, -12, 0] }}
            transition={{ repeat: Infinity, duration: 3 + (i % 4), delay: i * 0.35, ease: 'easeInOut' }}
          >
            {item}
          </motion.div>
        ))}

        {/* Puntos de conectividad */}
        {Array.from({ length: 18 }).map((_, i) => (
          <motion.div
            key={`dot-${i}`}
            className="absolute rounded-full"
            style={{
              left:   `${(i * 6 + 1) % 100}%`,
              top:    `${(i * 13 + 2) % 100}%`,
              width:  '7px', height: '7px',
              background: ['#ff7b2c','#2eb87e','#06b6d4','#8b5cf6','#ffd23f'][i % 5],
              opacity: 0.1,
            }}
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ repeat: Infinity, duration: 2 + (i % 3), delay: i * 0.25 }}
          />
        ))}
      </div>

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 22 }}
      >
        {/* ── Logo y título ─────────────────────────────────── */}
        <div className="text-center mb-7">
          <motion.img
            src="/logo.png" alt="Letramente"
            className="w-24 h-24 object-contain mx-auto mb-3 drop-shadow-[0_8px_24px_rgba(6,182,212,0.4)]"
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          />
          <h1 className="font-brand font-black text-5xl mb-1 text-gradient-brand">
            Letramente
          </h1>
          <p className="text-white/60 font-bold text-base mb-3">
            Aprende, Comprende, Crea ✨
          </p>
          <div className="brand-dots justify-center">
            {['bg-letra-orange','bg-letra-green','bg-letra-cyan','bg-letra-purple','bg-letra-yellow'].map((c, i) => (
              <div key={i} className={`brand-dot ${c}`} style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
          <div className="mt-2">
            <span className="badge badge-navy">Grupo 10</span>
          </div>
        </div>

        {/* ── Card del formulario ────────────────────────────── */}
        <div className="glass-card p-8 border-letra-cyan/20">

          {/* Tabs */}
          <div className="flex bg-white/5 rounded-2xl p-1 mb-6 gap-1">
            {[{ id: 'login', label: '🚪 Entrar' }, { id: 'register', label: '✨ Registrarse' }].map(tab => (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => { setMode(tab.id); setLocalError(''); }}
                className={`
                  flex-1 py-2.5 rounded-xl font-brand font-extrabold text-sm
                  transition-all duration-200 cursor-pointer border-none
                  ${mode === tab.id
                    ? 'bg-gradient-to-br from-letra-cyan to-letra-navy-light text-white shadow-glow-cyan'
                    : 'text-white/50 hover:text-white/80 bg-transparent'}
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, x: mode === 'login' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{   opacity: 0, x: mode === 'login' ?  20 : -20 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit}
              className="flex flex-col gap-4"
            >
              {/* Selector de rol ELIMINADO — solo adultos se registran */}
              {/* Los ninos los crea el adulto desde su panel */}
              {mode === 'register' && (
                <div style={{
                  padding:      '0.75rem 1rem',
                  borderRadius: '1rem',
                  background:   'rgba(6,182,212,0.08)',
                  border:       '1px solid rgba(6,182,212,0.2)',
                  fontSize:     '0.8rem',
                  color:        'rgba(255,255,255,0.55)',
                  fontWeight:   600,
                  lineHeight:   1.5,
                }}>
                  👩‍🏫 <strong style={{ color:'#06b6d4' }}>Este registro es para Maestros y Padres.</strong><br />
                  Los perfiles de ninos se crean desde el Panel de Control del adulto.
                </div>
              )}

              {mode === 'register' && (
                <div>
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-1.5">
                    Nombre completo
                  </label>
                  <input
                    id="name-input" name="name" type="text" required
                    className="input-letramente"
                    placeholder={role === 'child' ? '¿Cómo te llamas?' : 'Tu nombre'}
                    value={form.name} onChange={handleChange}
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-1.5">
                  Nombre de usuario
                </label>
                <input
                  id="username-input" name="username" type="text"
                  required autoComplete="username"
                  className="input-letramente"
                  placeholder={role === 'child' ? '¡Tu nombre especial! 🌟' : 'nombre.usuario'}
                  value={form.username} onChange={handleChange}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-1.5">
                  Contraseña
                </label>
                <input
                  id="password-input" name="password" type="password"
                  required autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="input-letramente"
                  placeholder={role === 'child' ? 'Tu clave secreta 🔒' : 'Contraseña segura'}
                  value={form.password} onChange={handleChange}
                />
              </div>

              {mode === 'register' && (
                <div>
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-1.5">
                    Confirmar contraseña
                  </label>
                  <input
                    id="confirm-password-input" name="confirmPassword" type="password"
                    required autoComplete="new-password"
                    className="input-letramente"
                    placeholder="Repite tu clave"
                    value={form.confirmPassword} onChange={handleChange}
                  />
                </div>
              )}

              {/* Avatar picker — solo para adultos en registro */}
              {mode === 'register' && (
                <div>
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-2">
                    Tu avatar
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {AVATARS.map(av => (
                      <motion.button
                        key={av.id} type="button" id={`avatar-${av.id}`}
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: 1.1 }}
                        onClick={() => setSelectedAvatar(av.id)}
                        title={av.name}
                        className={`
                          w-12 h-12 rounded-2xl text-2xl border-2 cursor-pointer
                          transition-all duration-150
                          ${selectedAvatar === av.id
                            ? 'border-letra-orange bg-letra-orange/20 scale-110'
                            : 'border-white/10 bg-bg-surface hover:border-white/30'}
                        `}
                      >
                        {av.emoji}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Error */}
              <AnimatePresence>
                {displayError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{   opacity: 0, height: 0 }}
                    className="px-4 py-3 rounded-2xl bg-red-500/15 border border-red-500/30
                               text-red-300 text-sm font-bold"
                  >
                    ❌ {displayError}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.button
                id="submit-btn" type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{  scale: loading ? 1 : 0.97 }}
                className="btn-cyan btn-lg w-full mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading
                  ? <><div className="spinner w-5 h-5 border-2" /> Cargando...</>
                  : mode === 'login' ? '🚀 ¡Comenzar!' : '✨ ¡Crear cuenta!'}
              </motion.button>
            </motion.form>
          </AnimatePresence>

          {/* Info demo */}
          <div className="mt-5 px-4 py-3 rounded-2xl bg-letra-cyan/8 border border-letra-cyan/20
                          text-xs text-white/50 font-medium">
            <strong className="text-letra-cyan-light">💡 Tip:</strong>{' '}
            Regístrate como estudiante para jugar o como adulto para ver el progreso.
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-5 text-white/30 text-xs font-bold">
          🧠 Letramente · Alfabetizar la mente, inteligentemente
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
