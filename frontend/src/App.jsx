/**
 * Letramente — App.jsx
 * Grupo 10 | Aprende, Comprende, Crea
 *
 * Router principal con rutas protegidas por rol.
 * v2.0 — Mongoose + Tailwind CSS + Framer Motion
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GameProvider } from './context/GameContext';

// ─── Carga diferida de páginas ────────────────────────────────────────────────
const LoginPage      = lazy(() => import('./pages/LoginPage'));
const ChildDashboard = lazy(() => import('./pages/child/ChildDashboard'));
const RetosView      = lazy(() => import('./pages/child/RetosView'));
const PhonicsModule  = lazy(() => import('./pages/child/PhonicsModule'));
const AdultDashboard = lazy(() => import('./pages/adult/AdultDashboard'));

// ─── Pantalla de Carga ────────────────────────────────────────────────────────
const LoadingScreen = () => (
  <div className="fixed inset-0 flex flex-col items-center justify-center bg-bg-body gap-5">
    <motion.div
      className="text-6xl"
      animate={{ y: [0, -14, 0] }}
      transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
    >
      🧠
    </motion.div>
    <div className="spinner" />
    <p className="text-white/60 font-brand font-bold text-lg">
      Cargando Letramente...
    </p>
    <div className="brand-dots">
      {['bg-letra-orange','bg-letra-green','bg-letra-cyan','bg-letra-purple','bg-letra-yellow'].map((c, i) => (
        <div key={i} className={`brand-dot ${c}`} style={{ animationDelay: `${i * 0.2}s` }} />
      ))}
    </div>
  </div>
);

// ─── Rutas Protegidas ─────────────────────────────────────────────────────────
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const ChildRoute = ({ children }) => {
  const { isAuthenticated, isChild, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login"  replace />;
  if (!isChild)         return <Navigate to="/adulto" replace />;
  return children;
};

const AdultRoute = ({ children }) => {
  const { isAuthenticated, isAdult, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdult)         return <Navigate to="/juego" replace />;
  return children;
};

const HomeRedirect = () => {
  const { isAuthenticated, isChild, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return isChild ? <Navigate to="/juego" replace /> : <Navigate to="/adulto" replace />;
};

// ─── Router Principal ─────────────────────────────────────────────────────────
const AppRouter = () => (
  <Suspense fallback={<LoadingScreen />}>
    <Routes>
      {/* Inicio */}
      <Route path="/" element={<HomeRedirect />} />

      {/* Autenticación */}
      <Route path="/login" element={<LoginPage />} />

      {/* ── Panel del Niño ── */}
      <Route path="/juego"               element={<ChildRoute><ChildDashboard /></ChildRoute>} />
      {/* Rutas de categoría — usan PhonicsModule con :categoria */}
      <Route path="/juego/retos/:categoria" element={<ChildRoute><PhonicsModule /></ChildRoute>} />
      <Route path="/juego/fonetica"      element={<ChildRoute><PhonicsModule /></ChildRoute>} />
      <Route path="/juego/palabras"      element={<ChildRoute><PhonicsModule /></ChildRoute>} />
      <Route path="/juego/lectura"       element={<ChildRoute><PhonicsModule /></ChildRoute>} />

      {/* ── Panel del Adulto ── */}
      <Route path="/adulto" element={<AdultRoute><AdultDashboard /></AdultRoute>} />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
);

// ─── App Root ─────────────────────────────────────────────────────────────────
const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <GameProvider>
        <AppRouter />
      </GameProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
