@echo off
title YAvoy v3.1 Enterprise Server
color 0A

echo.
echo ========================================
echo   YAvoy v3.1 Enterprise Server
echo ========================================
echo.
echo Iniciando servidor en http://localhost:5502
echo.
echo Presiona Ctrl+C para detener
echo.

cd /d "%~dp0"
node server-enterprise.js

echo.
echo Servidor detenido.
pause