/**
 * Letramente — SeleccionPerfil (v3.0)
 * Grupo 10 | Aprende, Comprende, Crea
 *
 * Pantalla de seleccion de perfil para ninos.
 * Disenada para minimizar lectura y maximizar accesibilidad:
 *
 *   1. Avatares grandes y coloridos con el nombre del nino debajo.
 *   2. TTS (Text-to-Speech) al hacer hover o foco sobre un avatar.
 *   3. Al seleccionar: aparece teclado PIN de 4 botones grandes.
 *   4. Cada digit del PIN tiene feedback sonoro al pulsarse.
 *   5. Audio de bienvenida automatico al cargar la pagina.
 *
 * Ruta: /seleccionar?tutor=<tutor_id>
 * El adulto comparte este link con sus ninos.
 */

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const AVATAR_EMOJIS = {
  dino:  "🦕", cat:   "🐱", robot: "🤖",
  bunny: "🐰", owl:   "🦉", fox:   "🦊",
};

const AVATAR_COLORS = {
  dino:  { bg: "rgba(46,184,126,0.2)",   border: "#2eb87e",  glow: "rgba(46,184,126,0.4)"  },
  cat:   { bg: "rgba(255,123,44,0.2)",   border: "#ff7b2c",  glow: "rgba(255,123,44,0.4)"  },
  robot: { bg: "rgba(6,182,212,0.2)",    border: "#06b6d4",  glow: "rgba(6,182,212,0.4)"   },
  bunny: { bg: "rgba(236,72,153,0.2)",   border: "#ec4899",  glow: "rgba(236,72,153,0.4)"  },
  owl:   { bg: "rgba(139,92,246,0.2)",   border: "#8b5cf6",  glow: "rgba(139,92,246,0.4)"  },
  fox:   { bg: "rgba(255,210,63,0.2)",   border: "#ffd23f",  glow: "rgba(255,210,63,0.4)"  },
};

// ─── TTS helper ──────────────────────────────────────────────────────────────
const speak = (text, rate = 0.85, pitch = 1.2) => {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang   = "es-VE";
  u.rate   = rate;
  u.pitch  = pitch;
  u.volume = 1;
  const voices = window.speechSynthesis.getVoices();
  const esVoice = voices.find(v => v.lang.startsWith("es"));
  if (esVoice) u.voice = esVoice;
  setTimeout(() => window.speechSynthesis.speak(u), 50);
};

const DIGIT_WORDS = ["cero","uno","dos","tres","cuatro","cinco","seis","siete","ocho","nueve"];

// ─── Teclado PIN ─────────────────────────────────────────────────────────────
const PinKeyboard = ({ onDigit, onDelete, onSubmit, pin, error }) => {
  const digits = [1,2,3,4,5,6,7,8,9,null,0,"⌫"];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      style={{
        display:       "flex",
        flexDirection: "column",
        alignItems:    "center",
        gap:           "1.25rem",
      }}
    >
      {/* Puntos del PIN */}
      <div style={{ display: "flex", gap: "0.75rem" }}>
        {[0,1,2,3].map(i => (
          <motion.div
            key={i}
            animate={{ scale: pin.length > i ? 1.2 : 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            style={{
              width:        "18px",
              height:       "18px",
              borderRadius: "50%",
              background:   pin.length > i ? "#ffd23f" : "rgba(255,255,255,0.15)",
              border:       "2px solid rgba(255,255,255,0.3)",
              transition:   "background 0.2s",
            }}
          />
        ))}
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ color: "#fca5a5", fontFamily: "Nunito,sans-serif", fontWeight: 800, margin: 0 }}
          >
            ❌ {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Grid de botones */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.75rem",
      }}>
        {digits.map((d, i) => (
          <motion.button
            key={i}
            whileHover={d !== null ? { scale: 1.08, y: -2 } : {}}
            whileTap={d !== null ? { scale: 0.92 } : {}}
            disabled={d === null}
            onClick={() => {
              if (d === null) return;
              if (d === "⌫") {
                speak("borrar", 1, 1.3);
                onDelete();
              } else {
                speak(DIGIT_WORDS[d], 1.1, 1.3);
                onDigit(String(d));
              }
            }}
            style={{
              width:        "72px",
              height:       "72px",
              borderRadius: "1.25rem",
              border:       "2px solid rgba(255,255,255,0.15)",
              background:   d === null ? "transparent" : "rgba(255,255,255,0.06)",
              color:        "white",
              fontSize:     d === "⌫" ? "1.6rem" : "2rem",
              fontWeight:   900,
              fontFamily:   "Nunito,sans-serif",
              cursor:       d === null ? "default" : "pointer",
              display:      "flex",
              alignItems:   "center",
              justifyContent: "center",
              transition:   "all 0.15s",
            }}
          >
            {d !== null ? d : ""}
          </motion.button>
        ))}
      </div>

      {/* Boton entrar */}
      {pin.length === 4 && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.96 }}
          onClick={onSubmit}
          style={{
            padding:      "0.9rem 2.5rem",
            borderRadius: "1.25rem",
            background:   "linear-gradient(135deg, #2eb87e, #06b6d4)",
            border:       "none",
            color:        "white",
            fontSize:     "1.2rem",
            fontWeight:   900,
            fontFamily:   "Nunito,sans-serif",
            cursor:       "pointer",
            boxShadow:    "0 4px 20px rgba(46,184,126,0.4)",
          }}
        >
          ¡Entrar! 🚀
        </motion.button>
      )}
    </motion.div>
  );
};

// ─── Componente Principal ─────────────────────────────────────────────────────
const SeleccionPerfil = () => {
  const [searchParams] = useSearchParams();
  const navigate        = useNavigate();
  const { loginPin }    = useAuth();

  const tutorId = searchParams.get("tutor");

  const [ninos,       setNinos]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [selected,    setSelected]    = useState(null); // nino seleccionado
  const [pin,         setPin]         = useState("");
  const [pinError,    setPinError]    = useState("");
  const [loggingIn,   setLoggingIn]   = useState(false);

  // Cargar los ninos del tutor (endpoint publico — no requiere token)
  useEffect(() => {
    if (!tutorId) { setLoading(false); return; }
    fetch(`${API_BASE}/ninos/publico?tutor=${tutorId}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setNinos(data.ninos || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tutorId]);

  // Bienvenida por TTS al cargar
  useEffect(() => {
    const t = setTimeout(() => {
      speak("Hola. Elige tu personaje para jugar.", 0.82, 1.15);
    }, 700);
    return () => clearTimeout(t);
  }, []);

  const handleSelectNino = (nino) => {
    setSelected(nino);
    setPin("");
    setPinError("");
    speak(`Hola ${nino.nombre}! Escribe tu clave secreta.`, 0.85, 1.2);
  };

  const handleDigit = useCallback((d) => {
    setPin(p => p.length < 4 ? p + d : p);
    setPinError("");
  }, []);

  const handleDelete = useCallback(() => {
    setPin(p => p.slice(0, -1));
    setPinError("");
  }, []);

  const handleSubmit = async () => {
    if (pin.length !== 4 || !selected) return;
    setLoggingIn(true);
    speak("Entrando...", 0.9, 1.1);
    const res = await loginPin(selected._id, pin);
    setLoggingIn(false);
    if (res.success) {
      navigate("/juego", { replace: true });
    } else {
      speak("Esa clave no es correcta. Intenta de nuevo.", 0.85, 1.1);
      setPinError("PIN incorrecto. ¡Inténtalo de nuevo!");
      setPin("");
    }
  };

  // ─── Pantalla de carga ────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:"1rem" }}>
      <div style={{ fontSize:"4rem" }}>⏳</div>
      <p style={{ fontFamily:"Nunito,sans-serif", color:"rgba(255,255,255,0.5)" }}>Cargando perfiles...</p>
    </div>
  );

  // ─── Sin tutor ────────────────────────────────────────────────────────────
  if (!tutorId) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:"1rem", textAlign:"center", padding:"2rem" }}>
      <div style={{ fontSize:"5rem" }}>🔗</div>
      <h2 style={{ fontFamily:"Nunito,sans-serif", color:"white" }}>Enlace incompleto</h2>
      <p style={{ fontFamily:"Nunito,sans-serif", color:"rgba(255,255,255,0.5)" }}>
        Pídele a tu maestro o padre que te dé el enlace correcto.
      </p>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"2rem", gap:"2rem" }}>

      {/* Logo */}
      <motion.div
        initial={{ opacity:0, y:-20 }}
        animate={{ opacity:1, y:0 }}
        style={{ textAlign:"center" }}
      >
        <div style={{ fontSize:"4rem", marginBottom:"0.25rem" }}>🧠</div>
        <h1 style={{ fontFamily:"Nunito,sans-serif", fontWeight:900, fontSize:"2rem", margin:0,
                     background:"linear-gradient(135deg,#06b6d4,#8b5cf6)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
          Letramente
        </h1>
        <p style={{ fontFamily:"Nunito,sans-serif", color:"rgba(255,255,255,0.5)", margin:"0.25rem 0 0" }}>
          ¿Quién eres tú? 👇
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* ─── Seleccion de avatar ─────────────────────────────────────── */}
        {!selected && (
          <motion.div
            key="avatars"
            initial={{ opacity:0, x:-40 }}
            animate={{ opacity:1, x:0 }}
            exit={{ opacity:0, x:-40 }}
            style={{ display:"flex", flexWrap:"wrap", gap:"1.5rem", justifyContent:"center", maxWidth:"600px" }}
          >
            {ninos.length === 0 ? (
              <div style={{ textAlign:"center", padding:"2rem" }}>
                <div style={{ fontSize:"3rem" }}>📭</div>
                <p style={{ fontFamily:"Nunito,sans-serif", color:"rgba(255,255,255,0.4)", marginTop:"0.75rem" }}>
                  No hay perfiles aún. Pídele a tu maestro que te agregue.
                </p>
              </div>
            ) : ninos.map((nino, i) => {
              const colors = AVATAR_COLORS[nino.avatar] || AVATAR_COLORS.dino;
              return (
                <motion.button
                  key={nino._id}
                  id={`perfil-${nino._id}`}
                  initial={{ opacity:0, y:30, scale:0.8 }}
                  animate={{ opacity:1, y:0,  scale:1  }}
                  transition={{ delay: i * 0.1, type:"spring", stiffness:200 }}
                  whileHover={{ y:-10, scale:1.06 }}
                  whileTap={{ scale:0.95 }}
                  onClick={() => handleSelectNino(nino)}
                  onMouseEnter={() => speak(`Hola, soy ${nino.nombre}`, 0.85, 1.2)}
                  onFocus={() => speak(`Hola, soy ${nino.nombre}`, 0.85, 1.2)}
                  style={{
                    display:       "flex",
                    flexDirection: "column",
                    alignItems:    "center",
                    gap:           "0.75rem",
                    padding:       "1.5rem 1.75rem",
                    borderRadius:  "2rem",
                    border:        `3px solid ${colors.border}`,
                    background:    colors.bg,
                    cursor:        "pointer",
                    boxShadow:     `0 8px 32px ${colors.glow}`,
                    minWidth:      "130px",
                    transition:    "all 0.2s ease",
                  }}
                >
                  <motion.div
                    animate={{ y:[0,-8,0] }}
                    transition={{ repeat:Infinity, duration:2.5, delay: i*0.4, ease:"easeInOut" }}
                    style={{ fontSize:"4.5rem", lineHeight:1 }}
                  >
                    {AVATAR_EMOJIS[nino.avatar] || "🦕"}
                  </motion.div>
                  <span style={{ fontFamily:"Nunito,sans-serif", fontWeight:900, fontSize:"1.1rem", color:"white" }}>
                    {nino.nombre}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        )}

        {/* ─── Ingreso de PIN ──────────────────────────────────────────── */}
        {selected && (
          <motion.div
            key="pin"
            initial={{ opacity:0, x:40 }}
            animate={{ opacity:1, x:0 }}
            exit={{ opacity:0, x:40 }}
            style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"1.25rem" }}
          >
            {/* Avatar del seleccionado */}
            <motion.div
              animate={{ y:[0,-6,0] }}
              transition={{ repeat:Infinity, duration:2.5, ease:"easeInOut" }}
              style={{ fontSize:"5rem" }}
            >
              {AVATAR_EMOJIS[selected.avatar] || "🦕"}
            </motion.div>
            <h2 style={{ fontFamily:"Nunito,sans-serif", fontWeight:900, fontSize:"1.5rem", margin:0, color:"white" }}>
              ¡Hola, {selected.nombre}!
            </h2>
            <p style={{ fontFamily:"Nunito,sans-serif", color:"rgba(255,255,255,0.5)", margin:0, fontSize:"0.95rem" }}>
              🔒 Escribe tu clave secreta
            </p>

            {loggingIn ? (
              <div style={{ fontSize:"3rem" }}>⏳</div>
            ) : (
              <PinKeyboard
                pin={pin}
                error={pinError}
                onDigit={handleDigit}
                onDelete={handleDelete}
                onSubmit={handleSubmit}
              />
            )}

            {/* Volver */}
            <button
              onClick={() => { setSelected(null); speak("Elige tu personaje.", 0.85, 1.1); }}
              style={{
                background:"none", border:"none", color:"rgba(255,255,255,0.4)",
                fontFamily:"Nunito,sans-serif", fontSize:"0.9rem", cursor:"pointer", marginTop:"0.5rem",
              }}
            >
              ← Cambiar perfil
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enlace para adultos */}
      <p style={{ fontFamily:"Nunito,sans-serif", fontSize:"0.75rem", color:"rgba(255,255,255,0.2)", textAlign:"center" }}>
        ¿Eres maestro o padre?{" "}
        <a href="/login" style={{ color:"rgba(6,182,212,0.6)", textDecoration:"none" }}>
          Inicia sesión aquí
        </a>
      </p>
    </div>
  );
};

export default SeleccionPerfil;
