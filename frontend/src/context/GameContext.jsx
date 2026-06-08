/**
 * Letramente — GameContext v2.0
 * Grupo 10 | Aprende, Comprende, Crea
 *
 * RESPONSABILIDAD:
 *   Estado global del juego. Actúa como una capa de servicio entre
 *   los componentes React y el backend Express.
 *
 * QUÉ CONTIENE:
 *   - retos[]       → Catálogo de retos cargado desde la API
 *   - partidas[]    → Historial de partidas del estudiante activo
 *   - newBadges[]   → Badges recién desbloqueados (para mostrar popup)
 *   - notification  → Estado de la última partida (éxito/fracaso)
 *
 * PATRÓN DE DISEÑO: Context + Custom Hook
 *   GameProvider envuelve la app y provee el estado.
 *   useGame() es el hook que consumen los componentes hijos.
 *   Esto evita "prop drilling" (pasar props por 5+ niveles de componentes).
 *
 * FLUJO DE UNA PARTIDA COMPLETA (submitPartida):
 *   1. Frontend calcula score (% respuestas correctas)
 *   2. Llama a submitPartida({ reto_id, score, errores, tiempo })
 *   3. Backend calcula estrellas, puntos y verifica badges
 *   4. Frontend actualiza user.puntos_globales y user.experiencia localmente
 *   5. Si hay badges nuevos, aparece el BadgeUnlockPopup
 *
 * CACHE-BUST: La instancia Axios tiene `_t: Date.now()` en cada request
 * para evitar que el navegador devuelva respuestas HTTP cacheadas de la API.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

// Instancia Axios con cache-busting automático
// 'no-cache' en headers previene respuestas 304 Not Modified del servidor
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  headers: { 'Cache-Control': 'no-cache' },
});

// Inyectar token JWT en CADA request automáticamente.
// El token se lee de localStorage en el momento del request (no al crear la instancia)
// para que siempre use el token más reciente después de un login/logout.
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('letramente_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.params = { ...config.params, _t: Date.now() }; // cache-bust por query param
  return config;
});

const GameContext = createContext(null);

export const GameProvider = ({ children }) => {
  const { user, updateUser } = useAuth();

  const [retos,        setRetos]        = useState([]);
  const [partidas,     setPartidas]     = useState([]);
  const [newBadges,    setNewBadges]    = useState([]);
  const [notification, setNotification] = useState(null);
  const [loadingRetos, setLoadingRetos] = useState(false);

  // ─── Cargar todos los retos ─────────────────────────────────────────────────
  const loadRetos = useCallback(async () => {
    setLoadingRetos(true);
    try {
      const res = await API.get('/retos');
      setRetos(res.data.retos || []);
    } catch (err) {
      console.error('[GameContext] Error cargando retos:', err.message);
    } finally {
      setLoadingRetos(false);
    }
  }, []);

  // ─── Cargar partidas de un estudiante ───────────────────────────────────────
  const loadPartidas = useCallback(async (estudianteId) => {
    if (!estudianteId) return;
    try {
      const res = await API.get(`/partidas/${estudianteId}`);
      setPartidas(res.data.partidas || []);
    } catch (err) {
      console.error('[GameContext] Error cargando partidas:', err.message);
    }
  }, []);

  // ─── Registrar partida completada ───────────────────────────────────────────
  const submitPartida = useCallback(async ({ reto_id, score, errores_cometidos = 0, tiempo_segundos = 0 }) => {
    try {
      const res = await API.post('/partidas', { reto_id, score, errores_cometidos, tiempo_segundos });
      const result = res.data;

      // Actualizar puntos del usuario
      if (user?.id) {
        updateUser({
          puntos_globales: (user.puntos_globales || 0) + (result.puntos_ganados || 0),
          experiencia:     (user.experiencia     || 0) + (result.puntos_ganados || 0) * 2,
        });
      }

      // Notificación de estrellas
      setNotification({
        type:        result.estrellas === 3 ? 'perfect' : result.estrellas > 0 ? 'success' : 'try_again',
        stars:       result.estrellas,
        pointsEarned: result.puntos_ganados,
        timestamp:   Date.now(),
      });

      // Badges nuevos
      if (result.badges_nuevos?.length > 0) {
        setNewBadges(result.badges_nuevos);
        updateUser({ badges: [...(user?.badges || []), ...result.badges_nuevos] });
      }

      // Actualizar lista de partidas en el contexto
      if (result.partida) {
        setPartidas(prev => [result.partida, ...prev]);
      }

      return {
        stars:       result.estrellas,
        pointsEarned: result.puntos_ganados,
        badgesNuevos: result.badges_nuevos || [],
      };
    } catch (err) {
      console.error('[GameContext] Error registrando partida:', err.message);
      throw err;
    }
  }, [user, updateUser]);

  // Alias compatible con módulos existentes
  const submitActivity = useCallback(async (activityId, score, timeSecs = 0) => {
    // Mapeo de activity_id legacy → reto por categoría
    const ACTIVITY_TO_CATEGORY = { 1: 'Vocales', 2: 'Silabas', 3: 'Palabras' };
    const categoria = ACTIVITY_TO_CATEGORY[activityId] || 'Vocales';
    const reto = retos.find(r => r.categoria === categoria);
    if (!reto) return { stars: 0, pointsEarned: 0 };
    return submitPartida({ reto_id: reto._id, score, tiempo_segundos: timeSecs });
  }, [retos, submitPartida]);

  const clearBadgeNotification = useCallback(() => setNewBadges([]), []);
  const clearNotification      = useCallback(() => setNotification(null), []);

  const value = {
    // Data
    retos, partidas, newBadges, notification, loadingRetos,
    // Acciones
    loadRetos, loadPartidas, submitPartida, submitActivity,
    clearBadgeNotification, clearNotification,
    // Legacy aliases
    modules: retos, loadModules: loadRetos,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame debe usarse dentro de <GameProvider>');
  return context;
};

export default GameContext;
