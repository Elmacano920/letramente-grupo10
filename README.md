# 🧠 Letramente — Plataforma Gamificada de Lectoescritura

> **Aprende · Comprende · Crea** | Grupo 10 | Primer Grado Venezuela

Una aplicación web progresiva (PWA) que gamifica el aprendizaje de la
lectoescritura para niños de 6-7 años, alineada con el currículo fonético-silábico
del Ministerio de Educación venezolano.

---

## 📋 Características principales

| Módulo | Descripción |
|---|---|
| 🔤 **Vocales** | Identifica la vocal que falta en una palabra (P\_TO → A) |
| 🔡 **Consonantes** | Reconoce consonantes a través de palabras con imagen |
| 📝 **Sílabas** | Completa sílabas faltantes (PA — \[?\] → TO) con imágenes |
| 📖 **Palabras** | Reconoce y selecciona palabras completas |
| 🐣 **Mascota** | Evoluciona de 🥚 Huevo a 🐉 Dragón con XP acumulado |
| 🎯 **Misiones** | 3 misiones diarias que se resetean a medianoche |
| 📊 **Telemetría** | Dashboard para padres/docentes con análisis de confusiones |
| 📱 **PWA** | Funciona offline, instalable en móviles |

---

## 🚀 Instalación para compañeros (paso a paso)

### Requisito previo: Node.js

Antes de todo, necesitas tener **Node.js** instalado.

1. Ve a 👉 **https://nodejs.org**
2. Descarga la versión **LTS** (la verde que dice "Recommended")
3. Instala con todas las opciones por defecto (siguiente → siguiente → instalar)
4. Reinicia el equipo

Para verificar que quedó bien, abre `cmd` y escribe:
```
node --version
```
Debe aparecer algo como `v20.x.x`. Si aparece, ¡ya puedes continuar!

---

### Opción A — Instalación automática (recomendada ⭐)

1. Descarga o descomprime la carpeta `lectoplay/`
2. **Haz doble clic** en `instalar.bat`
3. Espera a que termine (instala todo y abre el navegador automáticamente)
4. ¡Listo! La app se abre en `http://localhost:5173`

> La primera vez tarda ~2-3 minutos descargando paquetes de internet.

**Para la próxima vez** (cuando ya instalaste), usa `iniciar.bat` — es más rápido.

---

### Opción B — Instalación manual

```bash
# 1. Instalar dependencias del backend
cd backend
npm install

# 2. Instalar dependencias del frontend
cd ..\frontend
npm install

# 3. Crear la base de datos con 97 retos (solo la primera vez)
cd ..\backend
node seed.js

# 4. Iniciar el backend (Terminal 1 — NO cerrar)
npm run dev

# 5. Iniciar el frontend (Terminal 2 — NO cerrar)
cd ..\frontend
npm run dev

# 6. Abrir en el navegador
# http://localhost:5173
```

---

### ❌ Problemas frecuentes y soluciones

#### "npm no se reconoce como comando"
→ Node.js no está instalado. Ve a https://nodejs.org y descarga la versión LTS.

#### "la ejecución de scripts está deshabilitada en este sistema"
→ Problema de permisos de PowerShell en Windows. Solución:
1. Abre **PowerShell como Administrador** (clic derecho → Ejecutar como administrador)
2. Escribe: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`
3. Confirma con `S` y presiona Enter
4. Cierra PowerShell y vuelve a intentar

#### "EADDRINUSE: address already in use :::3001"
→ El backend ya está corriendo en otra ventana. Cierra todas las ventanas de cmd/PowerShell negras y vuelve a intentar.

#### El navegador abre pero la app dice "Error de conexión"
→ El backend no está corriendo. Asegúrate de haber abierto **dos** terminales: una para backend y otra para frontend.

#### "Cannot find module" o errores de importación
→ Faltó el `npm install`. Ejecuta de nuevo `npm install` en la carpeta `backend/` y en `frontend/`.

---

## 🏗️ Arquitectura

```
lectoplay/
├── backend/
│   ├── src/
│   │   ├── server.js              # Entrada: Express + middlewares + rutas
│   │   ├── config/
│   │   │   └── database.js        # NeDB: 5 colecciones + índices + promisify
│   │   ├── controllers/
│   │   │   ├── auth.controller.js      # register / login / getMe
│   │   │   ├── partidas.controller.js  # registrarPartida + badges + puntos
│   │   │   ├── retos.controller.js     # CRUD retos + filtro por categoría
│   │   │   ├── misiones.controller.js  # Misiones diarias + mascota virtual
│   │   │   └── telemetria.controller.js # Errores + dashboard analítico
│   │   ├── middleware/
│   │   │   └── auth.middleware.js  # Verificación JWT Bearer Token
│   │   └── routes/                # Un archivo de rutas por recurso
│   ├── database/                  # Archivos .db generados automáticamente
│   └── seed.js                    # Poblador de 97 retos iniciales
│
└── frontend/
    ├── src/
    │   ├── context/
    │   │   ├── AuthContext.jsx    # Sesión JWT + registro + login + logout
    │   │   └── GameContext.jsx    # Estado del juego + submitPartida
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── child/
    │   │   │   ├── ChildDashboard.jsx  # Dashboard niño + misiones + mascota
    │   │   │   ├── PhonicsModule.jsx   # Módulo Vocales/Consonantes/Sílabas
    │   │   │   └── WordsModule.jsx     # Módulo Palabras (API-driven)
    │   │   └── adult/
    │   │       └── AdultDashboard.jsx  # Dashboard docentes/padres
    │   ├── components/
    │   │   ├── game/
    │   │   │   ├── LapizRobot.jsx        # Mascota guía con estados de ánimo
    │   │   │   ├── MisionesWidget.jsx    # Panel de misiones + mascota virtual
    │   │   │   └── WrongAnswerFeedback.jsx # UX de error: shake + aliento
    │   │   └── ui/                       # Badge, StarRating, ProgressBar
    │   ├── services/
    │   │   ├── api.js             # Instancia Axios con interceptores JWT
    │   │   └── SpeechService.js   # TTS Web Speech API (accesibilidad)
    │   └── utils/
    │       └── gamification.js    # Niveles XP, fórmulas puntos, badges
    └── public/
        ├── sw.js          # Service Worker: 4 estrategias de caché
        ├── manifest.json  # PWA manifest
        ├── offline.html   # Página fallback sin internet
        └── images/        # Imágenes de retos (pato, luna, sapo...)
```

---

## 🗄️ Base de datos (NeDB)

### ¿Qué es NeDB?
NeDB es una base de datos embebida en JavaScript puro:
- **Sin servidor** — los datos son archivos `.db` en `backend/database/`
- **API idéntica a MongoDB/Mongoose** — fácil migración si se necesita escalar
- **Sin costo** — completamente gratis, sin límites de almacenamiento
- **Sin configuración** — funciona al instalar el paquete npm

### Colecciones

| Colección | Uso | Índices |
|---|---|---|
| `estudiantes.db` | Usuarios (niños y adultos) | `username` (único) |
| `retos.db` | Catálogo de 97 retos | `categoria` |
| `partidas.db` | Historial de juego | `estudiante_id`, `reto_id` |
| `misiones.db` | Misiones diarias | `estudiante_id`, `fecha_asignada` |
| `telemetria.db` | Errores fonéticos | `estudiante_id`, `par_confusion` |

---

## 🔌 API REST

### Base URL: `http://localhost:3001/api`
### Autenticación: `Authorization: Bearer <token>`

#### Auth
```
POST /api/auth/register   { nombre, username, password, rol, avatar }
POST /api/auth/login      { username, password }
GET  /api/auth/me
```

#### Retos
```
GET  /api/retos
GET  /api/retos/categoria/:cat        ?tipoReto=silaba
GET  /api/retos/:id
```

#### Partidas (Juego)
```
POST /api/partidas        { reto_id, score, errores_cometidos, tiempo_segundos }
GET  /api/partidas/:estudianteId
GET  /api/partidas/:estudianteId/resumen
```

#### Misiones (Sistema de misiones diarias)
```
GET  /api/misiones/hoy               → misiones + estado mascota
GET  /api/misiones/mascota           → solo la mascota
POST /api/misiones/progreso          { mision_id, incremento }
```

#### Telemetría (Analytics educativo)
```
POST /api/telemetria/error           { categoria, opcion_elegida, opcion_correcta, ... }
GET  /api/telemetria/mis-errores
GET  /api/telemetria/dashboard/:id   → solo para adultos
```

---

## 🎮 Sistema de gamificación

### Fórmula de estrellas
```
score ≥ 90% AND errores ≤ 1  →  ⭐⭐⭐
score ≥ 70% AND errores ≤ 3  →  ⭐⭐
score ≥ 50%                  →  ⭐
score < 50%                  →  (sin estrellas)
```

### Fórmula de puntos
```
puntos = puntosBase × multiplicadorEstrellas × bonusVelocidad
         { 0:0x, 1:1x, 2:1.5x, 3:2x }   ×   { <30s:1.2x, <60s:1.1x, else:1x }
```

### Mascota virtual (XP acumulado)
```
0 XP    → 🥚 Huevo
100 XP  → 🐣 Pollito
300 XP  → 🐥 Pajarito
600 XP  → 🐦 Pájaro
1000 XP → 🦜 Pájaro Brillante
2000 XP → 🐉 Dragón
```

---

## 📱 PWA — Modo offline

El Service Worker (`public/sw.js`) implementa 4 estrategias:

| Recurso | Estrategia | Límite |
|---|---|---|
| Imágenes `/images/*` | Cache-First | 80 archivos |
| Audio `/audio/*` | Cache-First | 120 archivos |
| API `/api/*` | Network-First | Fallback JSON |
| Google Fonts | Stale-While-Revalidate | Ilimitado |

---

## 🔐 Seguridad

- Contraseñas hasheadas con **bcrypt (10 rondas)**
- Autenticación **JWT** con expiración de 7 días
- CORS configurado solo para `localhost:5173`
- Password hash **nunca se envía** al cliente
- Middleware `protect` en todas las rutas privadas

---

## 👥 Equipo

**Grupo 10** — Proyecto Educativo de Lectoescritura
> Plataforma gamificada para el fortalecimiento de la lectoescritura en niños de primer grado.
> Currículo venezolano — Enfoque fonético-silábico.
"# Letramente" 
