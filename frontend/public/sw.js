/**
 * Letramente — Service Worker v2.0
 * Grupo 10 | Aprende, Comprende, Crea
 *
 * ESTRATEGIA DE CACHÉ POR TIPO DE RECURSO:
 * ┌──────────────────────────┬─────────────────────────────────────────────┐
 * │ Tipo                     │ Estrategia                                  │
 * ├──────────────────────────┼─────────────────────────────────────────────┤
 * │ Shell HTML/JS/CSS        │ Cache-First (app shell)                     │
 * │ Imágenes /images/*       │ Cache-First, máx 60 días                    │
 * │ Audio /audio/*           │ Cache-First, máx 90 días (rara vez cambia)  │
 * │ Google Fonts             │ Stale-While-Revalidate, máx 1 año          │
 * │ API /api/*               │ Network-First, fallback offline JSON        │
 * └──────────────────────────┴─────────────────────────────────────────────┘
 */

const CACHE_VERSION  = 'letramente-v2.0';
const SHELL_CACHE    = `${CACHE_VERSION}-shell`;
const IMAGES_CACHE   = `${CACHE_VERSION}-images`;
const AUDIO_CACHE    = `${CACHE_VERSION}-audio`;
const FONTS_CACHE    = `${CACHE_VERSION}-fonts`;

// ─── App Shell: precaché en install ──────────────────────────────────────────
// Vite genera hashes en los nombres. Aquí cacheamos las rutas conocidas.
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  // Imágenes del currículo (fonemas y sílabas)
  '/images/pato.png',
  '/images/luna.png',
  '/images/sapo.png',
  '/images/mesa.png',
  '/images/mapa.png',
  '/images/nido.png',
  // Fallback offline
  '/offline.html',
];

// Límites de caché
const MAX_IMAGES = 80;   // máx 80 imágenes cacheadas
const MAX_AUDIO  = 120;  // máx 120 audios cacheados

// ─── INSTALL: precachear shell ────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Letramente SW v2.0');
  event.waitUntil(
    caches.open(SHELL_CACHE).then(cache => {
      // addAll falla si algún recurso no existe — usamos add individual con catch
      return Promise.allSettled(
        APP_SHELL.map(url => cache.add(url).catch(() => console.warn('[SW] No se pudo cachear:', url)))
      );
    }).then(() => self.skipWaiting())
  );
});

// ─── ACTIVATE: limpiar cachés viejos ─────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando nueva versión');
  const CACHES_VÁLIDOS = [SHELL_CACHE, IMAGES_CACHE, AUDIO_CACHE, FONTS_CACHE];
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => !CACHES_VÁLIDOS.includes(key))
          .map(key => { console.log('[SW] Eliminando caché viejo:', key); return caches.delete(key); })
      )
    ).then(() => self.clients.claim())
  );
});

// ─── FETCH: interceptar peticiones ───────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo manejar GET
  if (request.method !== 'GET') return;

  // 1. API calls → Network-First (siempre datos frescos, fallback offline)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }

  // 2. Google Fonts → Stale-While-Revalidate
  if (url.hostname.includes('fonts.g') || url.hostname.includes('fonts.googleapis')) {
    event.respondWith(staleWhileRevalidate(request, FONTS_CACHE));
    return;
  }

  // 3. Imágenes → Cache-First, máx 60 días
  if (url.pathname.startsWith('/images/') || /\.(png|jpg|jpeg|svg|webp|gif)$/.test(url.pathname)) {
    event.respondWith(cacheFirstWithLimit(request, IMAGES_CACHE, MAX_IMAGES));
    return;
  }

  // 4. Audio → Cache-First, máx 90 días (muy raro que cambie)
  if (url.pathname.startsWith('/audio/') || /\.(mp3|ogg|wav|m4a)$/.test(url.pathname)) {
    event.respondWith(cacheFirstWithLimit(request, AUDIO_CACHE, MAX_AUDIO));
    return;
  }

  // 5. App Shell (JS/CSS/HTML) → Cache-First
  event.respondWith(cacheFirst(request, SHELL_CACHE));
});

// ══════════════════════════════════════════════════════════════════════════════
// ESTRATEGIAS DE CACHÉ
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Cache-First simple: sirve desde caché, si falla va a red
 */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Fallback: página offline
    return caches.match('/offline.html') || new Response('Sin conexión', { status: 503 });
  }
}

/**
 * Cache-First con límite de entradas (LRU simplificado por conteo)
 * Para imágenes y audios que pueden acumularse mucho
 */
async function cacheFirstWithLimit(request, cacheName, maxEntries) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      // Limpiar si supera el límite
      const keys = await cache.keys();
      if (keys.length >= maxEntries) {
        // Eliminar las más antiguas (primeras en la lista)
        const toDelete = keys.slice(0, keys.length - maxEntries + 1);
        await Promise.all(toDelete.map(k => cache.delete(k)));
      }
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 503, statusText: 'Sin conexión' });
  }
}

/**
 * Network-First: intenta red primero, si falla usa caché
 * Para llamadas a la API
 */
async function networkFirstWithFallback(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(request, { signal: AbortSignal.timeout(5000) });
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    // Respuesta offline para la API
    return new Response(
      JSON.stringify({ success: false, offline: true, error: 'Sin conexión a internet' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Stale-While-Revalidate: sirve caché inmediatamente, actualiza en segundo plano
 * Para fuentes de Google
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Revalidar en segundo plano (sin bloquear)
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);

  return cached || fetchPromise;
}

// ─── Recibir mensaje del cliente (ej: forzar actualización) ──────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'CLEAR_CACHE') {
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
  }
});
