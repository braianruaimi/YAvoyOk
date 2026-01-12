@echo off
title YAvoy v3.1 Server - ESTABLE
color 0A
cls
echo.
echo ==========================================
echo    🚀 YAVOY v3.1 SERVER - ESTABLE
echo ==========================================
echo.
echo Matando procesos anteriores...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 >nul

echo Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Node.js no esta instalado
    pause
    exit /b 1
)

echo Cambiando al directorio correcto...
cd /d "%~dp0"

echo Verificando archivo servidor...
if not exist "server-simple.js" (
    echo ❌ Error: server-simple.js no encontrado
    pause
    exit /b 1
)

echo.
echo 🌐 Servidor se iniciara en: http://localhost:5502
echo ⚠️  NO CIERRES ESTA VENTANA
echo.
echo Iniciando servidor...
echo.

node server-simple.js

echo.
echo ==========================================
echo El servidor se ha detenido
echo ==========================================
pause
