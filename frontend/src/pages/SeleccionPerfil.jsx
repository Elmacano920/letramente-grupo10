/**
 * Letramente — SeleccionPerfil (v3.1)
 * Grupo 10 | Aprende, Comprende, Crea
 *
 * Pantalla de seleccion de perfil estilo "Netflix para ninos":
 *  - Grid de avatares grandes y coloridos.
 *  - Tooltip con el nombre aparece al hacer hover (CSS puro, sin librerias).
 *  - Clic en el avatar = inicio de sesion inmediato (sin PIN).
 *  - TTS da la bienvenida y anuncia el nombre al pasar el cursor.
 *  - Animacion de seleccion con "check" y redireccion suave.
 *
 * Ruta publica: /seleccionar?tutor=<tutor_id>
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

// ─── Configuracion de avatares ────────────────────────────────────────────────
const AVATAR_CONFIG = {
  dino:  { emoji: "🦕", color: "#2eb87e", shadow: "rgba(46,184,126,0.55)",  bg: "linear-gradient(145deg,#0d3d27,#1a6644)" },
  cat:   { emoji: "🐱", color: "#ff7b2c", shadow: "rgba(255,123,44,0.55)",  bg: "linear-gradient(145deg,#3d1a08,#7a3010)" },
  robot: { emoji: "🤖", color: "#06b6d4", shadow: "rgba(6,182,212,0.55)",   bg: "linear-gradient(145deg,#082a35,#0e5568)" },
  bunny: { emoji: "🐰", color: "#ec4899", shadow: "rgba(236,72,153,0.55)",  bg: "linear-gradient(145deg,#3b0f27,#7c1f52)" },
  owl:   { emoji: "🦉", color: "#8b5cf6", shadow: "rgba(139,92,246,0.55)",  bg: "linear-gradient(145deg,#1e0b3d,#3d1a7a)" },
  fox:   { emoji: "🦊", color: "#ffd23f", shadow: "rgba(255,210,63,0.55)",  bg: "linear-gradient(145deg,#3d3008,#7a610f)" },
};

// ─── TTS helper ──────────────────────────────────────────────────────────────
let ttsTimeout = null;
const speak = (text, rate = 0.88, pitch = 1.15) => {
  if (!("speechSynthesis" in window)) return;
  clearTimeout(ttsTimeout);
  ttsTimeout = setTimeout(() => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "es-VE"; u.rate = rate; u.pitch = pitch; u.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const esVoice = voices.find(v => v.lang.startsWith("es"));
    if (esVoice) u.voice = esVoice;
    window.speechSynthesis.speak(u);
  }, 120);
};

// ─── CSS inyectado una sola vez en el <head> ─────────────────────────────────
// Todo el efecto tooltip y las animaciones estan en CSS puro.
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;900&display=swap');

  .sp-root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
    gap: 2.5rem;
    background: radial-gradient(ellipse at 30% 0%, rgba(139,92,246,0.12) 0%, transparent 60%),
                radial-gradient(ellipse at 80% 80%, rgba(6,182,212,0.1) 0%, transparent 60%);
    font-family: 'Nunito', 'Comic Sans MS', cursive, sans-serif;
  }

  /* ── Header ── */
  .sp-header {
    text-align: center;
    animation: sp-fadeDown 0.6s ease both;
  }
  .sp-header h1 {
    font-size: clamp(1.8rem, 5vw, 2.8rem);
    font-weight: 900;
    margin: 0.2rem 0 0;
    background: linear-gradient(135deg, #06b6d4, #8b5cf6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .sp-header p {
    color: rgba(255,255,255,0.45);
    font-size: 1rem;
    margin: 0.3rem 0 0;
    font-weight: 700;
  }

  /* ── Grid de perfiles ── */
  .sp-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 2rem;
    max-width: 720px;
    width: 100%;
    animation: sp-fadeUp 0.5s ease 0.2s both;
  }

  /* ── Tarjeta de perfil ── */
  .sp-card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    cursor: pointer;
    border: none;
    background: none;
    padding: 0;
    outline: none;
    -webkit-tap-highlight-color: transparent;
  }
  .sp-card:focus-visible .sp-avatar {
    outline: 3px solid white;
    outline-offset: 4px;
  }

  /* ── Avatar circular ── */
  .sp-avatar {
    width: clamp(110px, 18vw, 148px);
    height: clamp(110px, 18vw, 148px);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: clamp(3.5rem, 8vw, 5rem);
    border: 4px solid transparent;
    transition: transform 0.22s cubic-bezier(.34,1.56,.64,1),
                box-shadow 0.22s ease,
                border-color 0.22s ease;
    position: relative;
    line-height: 1;
    user-select: none;
  }
  .sp-avatar::after {
    content: '';
    position: absolute;
    inset: -6px;
    border-radius: 50%;
    border: 3px solid transparent;
    transition: border-color 0.22s ease, opacity 0.22s ease;
    opacity: 0;
  }
  .sp-card:hover .sp-avatar,
  .sp-card:focus-visible .sp-avatar {
    transform: scale(1.12) translateY(-8px);
  }
  .sp-card:hover .sp-avatar::after,
  .sp-card:focus-visible .sp-avatar::after {
    opacity: 1;
  }
  .sp-card:active .sp-avatar {
    transform: scale(0.96) translateY(0);
  }

  /* ── TOOLTIP CSS PURO: nombre del nino ── */
  .sp-tooltip {
    position: absolute;
    bottom: calc(100% + 14px);
    left: 50%;
    transform: translateX(-50%) scale(0.85);
    background: rgba(15, 16, 28, 0.96);
    border: 2px solid rgba(255,255,255,0.18);
    border-radius: 1rem;
    padding: 0.45rem 1.1rem;
    white-space: nowrap;
    font-family: 'Nunito', cursive;
    font-size: 1rem;
    font-weight: 900;
    color: white;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.18s ease, transform 0.18s cubic-bezier(.34,1.56,.64,1);
    backdrop-filter: blur(12px);
    z-index: 10;
  }
  /* Flechita del tooltip */
  .sp-tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 7px solid transparent;
    border-top-color: rgba(15,16,28,0.96);
  }
  /* Activar tooltip al hover de la tarjeta */
  .sp-card:hover .sp-tooltip,
  .sp-card:focus-visible .sp-tooltip {
    opacity: 1;
    transform: translateX(-50%) scale(1);
  }

  /* ── Nombre debajo del avatar ── */
  .sp-name {
    margin-top: 0.85rem;
    font-size: 1.05rem;
    font-weight: 900;
    color: rgba(255,255,255,0.82);
    letter-spacing: 0.01em;
    transition: color 0.2s ease;
    text-align: center;
    max-width: 130px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .sp-card:hover .sp-name {
    color: white;
  }

  /* ── Estado: seleccionando (loading) ── */
  .sp-card.sp-selecting .sp-avatar {
    animation: sp-pulse 0.5s ease infinite alternate;
  }
  @keyframes sp-pulse {
    from { box-shadow: 0 0 0 0 rgba(255,255,255,0.3); }
    to   { box-shadow: 0 0 0 16px rgba(255,255,255,0); }
  }

  /* ── Overlay de bienvenida al seleccionar ── */
  .sp-welcome-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    background: rgba(8,9,18,0.92);
    backdrop-filter: blur(16px);
    animation: sp-fadeIn 0.25s ease both;
  }
  .sp-welcome-avatar {
    font-size: 7rem;
    animation: sp-bounce 0.6s cubic-bezier(.34,1.56,.64,1) both;
  }
  .sp-welcome-text {
    font-size: 2rem;
    font-weight: 900;
    color: white;
    animation: sp-fadeUp 0.4s ease 0.2s both;
  }
  .sp-welcome-sub {
    font-size: 1.1rem;
    color: rgba(255,255,255,0.5);
    animation: sp-fadeUp 0.4s ease 0.35s both;
  }

  /* ── Estados de error / carga ── */
  .sp-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    color: rgba(255,255,255,0.45);
    font-size: 1rem;
    font-weight: 700;
    text-align: center;
    padding: 2rem;
  }
  .sp-state-icon { font-size: 4rem; }

  /* ── Footer ── */
  .sp-footer {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.18);
    text-align: center;
  }
  .sp-footer a {
    color: rgba(6,182,212,0.5);
    text-decoration: none;
  }
  .sp-footer a:hover { color: rgba(6,182,212,0.8); }

  /* ── Keyframes ── */
  @keyframes sp-fadeDown {
    from { opacity: 0; transform: translateY(-20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes sp-fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes sp-fadeIn {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes sp-bounce {
    from { opacity: 0; transform: scale(0.4); }
    to   { opacity: 1; transform: scale(1); }
  }

  /* ── Entrada escalonada de tarjetas ── */
  .sp-card { animation: sp-cardIn 0.45s cubic-bezier(.34,1.56,.64,1) both; }
  .sp-card:nth-child(1) { animation-delay: 0.05s; }
  .sp-card:nth-child(2) { animation-delay: 0.12s; }
  .sp-card:nth-child(3) { animation-delay: 0.19s; }
  .sp-card:nth-child(4) { animation-delay: 0.26s; }
  .sp-card:nth-child(5) { animation-delay: 0.33s; }
  .sp-card:nth-child(6) { animation-delay: 0.40s; }
  @keyframes sp-cardIn {
    from { opacity: 0; transform: scale(0.7) translateY(30px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
`;

// ─── Inyectar CSS una sola vez ────────────────────────────────────────────────
let styleInjected = false;
const injectStyles = () => {
  if (styleInjected) return;
  styleInjected = true;
  const tag = document.createElement("style");
  tag.setAttribute("data-sp", "1");
  tag.textContent = STYLES;
  document.head.appendChild(tag);
};

// ─── Componente Principal ─────────────────────────────────────────────────────
const SeleccionPerfil = () => {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const { loginPin }   = useAuth();

  const tutorId = searchParams.get("tutor");

  const [ninos,     setNinos]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState(null);  // nino que esta entrando
  const [entering,  setEntering]  = useState(false);

  // Inyectar CSS al montar
  useEffect(() => { injectStyles(); }, []);

  // Cargar perfiles del tutor (endpoint publico)
  useEffect(() => {
    if (!tutorId) { setLoading(false); return; }
    fetch(`${API_BASE}/ninos/publico?tutor=${tutorId}`)
      .then(r => r.json())
      .then(d => { if (d.success) setNinos(d.ninos || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tutorId]);

  // Bienvenida por voz al cargar
  useEffect(() => {
    if (!loading && ninos.length > 0) {
      const t = setTimeout(() => speak("Hola! Toca tu personaje para entrar.", 0.84, 1.15), 800);
      return () => clearTimeout(t);
    }
  }, [loading, ninos.length]);

  // ─── Clic en avatar = entrar directamente ────────────────────────────────
  const handleSelect = useCallback(async (nino) => {
    if (entering) return;
    setEntering(true);
    setSelected(nino);
    speak(`Hola ${nino.nombre}! Entrando al juego.`, 0.86, 1.18);

    // loginPin viene de AuthContext — actualiza user + token en un solo paso
    // El segundo argumento (pin) se ignora en v3.1 (endpoint child-login sin PIN)
    const res = await loginPin(nino._id, null);

    if (res.success) {
      // Esperar que el niño vea la animación de bienvenida, luego redirigir
      setTimeout(() => navigate("/juego", { replace: true }), 1600);
    } else {
      setEntering(false);
      setSelected(null);
    }
  }, [entering, navigate, loginPin]);

  // ─── Pantalla: cargando ──────────────────────────────────────────────────
  if (loading) return (
    <div className="sp-root">
      <div className="sp-state">
        <div className="sp-state-icon">⏳</div>
        <span>Cargando perfiles...</span>
      </div>
    </div>
  );

  // ─── Pantalla: sin tutor_id en la URL ────────────────────────────────────
  if (!tutorId) return (
    <div className="sp-root">
      <div className="sp-state">
        <div className="sp-state-icon">🔗</div>
        <h2 style={{ color: "white", margin: 0 }}>Enlace incompleto</h2>
        <p>Pídele a tu maestro o padre que te dé el enlace correcto.</p>
      </div>
    </div>
  );

  const cfg  = selected ? (AVATAR_CONFIG[selected.avatar] || AVATAR_CONFIG.dino) : null;

  return (
    <>
      {/* ── Overlay de bienvenida al seleccionar ── */}
      {entering && selected && (
        <div className="sp-welcome-overlay">
          <div className="sp-welcome-avatar">{(AVATAR_CONFIG[selected.avatar] || AVATAR_CONFIG.dino).emoji}</div>
          <div className="sp-welcome-text">¡Hola, {selected.nombre}! 👋</div>
          <div className="sp-welcome-sub">Preparando tu juego...</div>
        </div>
      )}

      <div className="sp-root">
        {/* ── Header ── */}
        <div className="sp-header">
          <div style={{ fontSize: "3.5rem" }}>🧠</div>
          <h1>Letramente</h1>
          <p>¿Quién eres tú? Toca tu personaje 👇</p>
        </div>

        {/* ── Grid de perfiles ── */}
        {ninos.length === 0 ? (
          <div className="sp-state">
            <div className="sp-state-icon">📭</div>
            <p>No hay perfiles todavía.<br/>Pídele a tu maestro que te agregue.</p>
          </div>
        ) : (
          <div className="sp-grid">
            {ninos.map((nino) => {
              const av = AVATAR_CONFIG[nino.avatar] || AVATAR_CONFIG.dino;
              return (
                <button
                  key={nino._id}
                  className="sp-card"
                  onClick={() => handleSelect(nino)}
                  onMouseEnter={() => speak(nino.nombre, 0.88, 1.2)}
                  onFocus={() => speak(nino.nombre, 0.88, 1.2)}
                  aria-label={`Entrar como ${nino.nombre}`}
                >
                  {/* Tooltip CSS puro — aparece al hover sin JS */}
                  <div
                    className="sp-tooltip"
                    style={{ borderColor: av.color, color: av.color }}
                  >
                    {nino.nombre}
                  </div>

                  {/* Avatar */}
                  <div
                    className="sp-avatar"
                    style={{
                      background: av.bg,
                      borderColor: av.color,
                      boxShadow: `0 8px 32px ${av.shadow}`,
                    }}
                  >
                    {av.emoji}
                  </div>

                  {/* Nombre debajo */}
                  <div className="sp-name">{nino.nombre}</div>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Footer ── */}
        <div className="sp-footer">
          ¿Eres maestro o padre?{" "}
          <a href="/login">Inicia sesión aquí</a>
        </div>
      </div>
    </>
  );
};

export default SeleccionPerfil;
