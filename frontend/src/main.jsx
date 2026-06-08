/**
 * Letramente — main.jsx
 * Grupo 10 | Aprende, Comprende, Crea
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import AnimatedBackground from './components/ui/AnimatedBackground.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Fondo animado mágico — visible en todas las páginas */}
    <AnimatedBackground />
    {/* App principal encima del fondo */}
    <div style={{ position: 'relative', zIndex: 1 }}>
      <App />
    </div>
  </React.StrictMode>
);
