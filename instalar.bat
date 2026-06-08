@echo off
:: ============================================================
:: Letramente — Script de instalación automática
:: Grupo 10 | Ejecutar como: doble clic en instalar.bat
:: ============================================================
:: Soluciona automáticamente:
::   1. Instala dependencias de Node.js (node_modules)
::   2. Crea la base de datos con los 97 retos iniciales
::   3. Arranca el backend (puerto 3001) en nueva ventana
::   4. Arranca el frontend (puerto 5173) en nueva ventana
:: ============================================================

title Letramente - Instalacion Automatica - Grupo 10
color 0A

echo.
echo ============================================================
echo     LETRAMENTE - Plataforma de Lectoescritura
echo     Grupo 10 - Instalacion Automatica
echo ============================================================
echo.

:: --- Verificar Node.js ---
echo [1/5] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: Node.js no esta instalado.
    echo  Descargalo desde: https://nodejs.org
    echo  Instala la version LTS ^(recomendada^)
    echo.
    pause
    exit /b 1
)
echo  OK - Node.js encontrado
node --version

:: --- Instalar dependencias del backend ---
echo.
echo [2/5] Instalando dependencias del BACKEND...
cd backend
call npm install --silent
if %errorlevel% neq 0 (
    echo  ERROR al instalar backend. Intentando con --legacy-peer-deps...
    call npm install --legacy-peer-deps
)
echo  OK - Backend listo

:: --- Instalar dependencias del frontend ---
echo.
echo [3/5] Instalando dependencias del FRONTEND...
cd ..\frontend
call npm install --silent
if %errorlevel% neq 0 (
    echo  ERROR al instalar frontend. Intentando con --legacy-peer-deps...
    call npm install --legacy-peer-deps
)
echo  OK - Frontend listo

:: --- Poblar la base de datos ---
echo.
echo [4/5] Creando base de datos con 97 retos...
cd ..\backend
node seed.js
if %errorlevel% neq 0 (
    echo  ADVERTENCIA: El seed fallo, pero la app puede funcionar sin datos iniciales.
)
echo  OK - Base de datos lista

:: --- Iniciar servidores ---
echo.
echo [5/5] Iniciando servidores...
echo.
echo  Backend  -> http://localhost:3001
echo  Frontend -> http://localhost:5173
echo.

:: Iniciar backend en nueva ventana
start "Letramente - BACKEND (puerto 3001)" cmd /k "cd /d "%~dp0backend" && npm run dev"

:: Esperar 3 segundos para que el backend arranque primero
timeout /t 3 /nobreak >nul

:: Iniciar frontend en nueva ventana
start "Letramente - FRONTEND (puerto 5173)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

:: Esperar que Vite inicie y abrir el navegador
timeout /t 5 /nobreak >nul
start http://localhost:5173

echo.
echo ============================================================
echo  INSTALACION COMPLETA
echo.
echo  Se abrieron 2 ventanas nuevas (Backend y Frontend).
echo  El navegador deberia abrirse en http://localhost:5173
echo.
echo  Si el navegador no abrio, abrelo manualmente en:
echo    http://localhost:5173
echo.
echo  Para detener: cierra las 2 ventanas negras
echo ============================================================
echo.
pause
