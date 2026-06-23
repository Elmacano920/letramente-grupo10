/**
 * Letramente — AuthContext v2
 * Grupo 10 | Aprende, Comprende, Crea
 *
 * RESPONSABILIDAD:
 *   Gestiona todo el ciclo de vida de la sesión del usuario:
 *   registro, login, logout y recuperación de sesión al recargar.
 *
 * PATRÓN JWT (JSON Web Token):
 *   El servidor genera un token firmado con JWT_SECRET al hacer login/register.
 *   El cliente guarda SOLO el token en localStorage (clave: 'letramente_token').
 *   NUNCA se guarda la contraseña en el cliente.
 *   En cada request, el token se adjunta como: Authorization: Bearer <token>
 *
 * RECUPERACIÓN DE SESIÓN:
 *   Al recargar la página, el useEffect llama a GET /api/auth/me.
 *   Si el token sigue siendo válido (no expiró), el servidor devuelve el usuario.
 *   Si expiró → se limpia localStorage y el usuario ve el login.
 *   Los tokens duran 7 días (configurado en auth.controller.js).
 *
 * ROLES:
 *   - 'child' → Accede al dashboard de juego, módulos, misiones
 *   - 'adult' → Accede al dashboard de estadísticas, telemetría de sus hijos
 *
 * TOKEN_KEY: Constante para evitar errores de typo al acceder a localStorage.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// ─── Cliente Axios ────────────────────────────────────────────────────────────
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
});

// Inyectar token en cada request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('letramente_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const TOKEN_KEY = 'letramente_token';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // ─── Recuperar sesión al arrancar ─────────────────────────────────────────
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) { setLoading(false); return; }

      try {
        const res = await API.get('/auth/me');
        if (res.data?.success) setUser(res.data.user);
        else localStorage.removeItem(TOKEN_KEY);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  // ─── Login ────────────────────────────────────────────────────────────────
  const login = useCallback(async (username, password) => {
    setError(null);
    try {
      const res = await API.post('/auth/login', { username, password });
      const { user: userData, token } = res.data;

      localStorage.setItem(TOKEN_KEY, token);
      setUser(userData);

      // 'rol' es el campo del backend (no 'role')
      return { success: true, role: userData.rol };
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Error al iniciar sesión';
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  // ─── Register ─────────────────────────────────────────────────────────────
  const register = useCallback(async (userData) => {
    setError(null);
    try {
      const res = await API.post('/auth/register', userData);
      const { user: newUser, token } = res.data;

      localStorage.setItem(TOKEN_KEY, token);
      setUser(newUser);

      return { success: true, role: newUser.rol };
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Error al registrarse';
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  // ─── Logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setError(null);
  }, []);

  // ─── Login PIN (ninos) ────────────────────────────────────────────────────
  // child_id: el _id del perfil del nino
  // pin: string de 4 digitos
  const loginPin = useCallback(async (child_id, pin) => {
    setError(null);
    try {
      const res = await API.post('/auth/login-pin', { child_id, pin });
      const { user: userData, token } = res.data;
      localStorage.setItem(TOKEN_KEY, token);
      setUser(userData);
      return { success: true, role: userData.rol };
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'PIN incorrecto';
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  // ─── Actualizar usuario localmente ────────────────────────────────────────
  const updateUser = useCallback((updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  }, []);

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isChild: user?.rol === 'child',
    isAdult: user?.rol === 'adult',
    login,
    loginPin,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return context;
};

export default AuthContext;
