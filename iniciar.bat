@echo off
:: ============================================================
:: Letramente — Inicio rápido (después de instalar)
:: Grupo 10 | Solo para cuando ya se hizo instalar.bat antes
:: ============================================================
title Letramente - Inicio Rapido

echo.
echo  Iniciando Letramente...
echo  Backend  -^> http://localhost:3001
echo  Frontend -^> http://localhost:5173
echo.

start "Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"
timeout /t 4 /nobreak >nul
start "Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"
timeout /t 5 /nobreak >nul
start http://localhost:5173
