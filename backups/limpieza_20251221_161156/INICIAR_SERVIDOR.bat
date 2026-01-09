@echo off
chcp 65001 >nul
title YaVoy - Servidor en ejecución
cls

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║                                                          ║
echo ║          🚀 INICIANDO SERVIDOR YAVOY 🚀                 ║
echo ║                                                          ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

:: Verificar Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no está instalado
    pause
    exit /b 1
)

:: Verificar si hay un servidor corriendo
echo [INFO] Verificando puerto 5501...
netstat -ano | findstr ":5501" >nul
if %errorlevel% equ 0 (
    echo [WARN] El puerto 5501 ya está en uso
    echo [INFO] Deteniendo proceso anterior...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5501"') do (
        taskkill /PID %%a /F >nul 2>&1
    )
    timeout /t 2 /nobreak >nul
)

echo [OK] Puerto 5501 disponible
echo.
echo ════════════════════════════════════════════════════════════
echo.
echo   🌐 Servidor iniciando en http://localhost:5501
echo.
echo   📋 Accesos directos:
echo      • Página principal: http://localhost:5501
echo      • Panel Repartidor: http://localhost:5501/panel-repartidor.html
echo      • Panel Comercio:   http://localhost:5501/panel-comercio.html
echo      • Test Sistema:     http://localhost:5501/test-simple.html
echo.
echo   📊 Credenciales de prueba:
echo      • Repartidor ID: REP-01
echo.
echo   ⚠️  NO CERRAR esta ventana - El servidor está corriendo
echo   ⚠️  Presiona Ctrl+C para detener el servidor
echo.
echo ════════════════════════════════════════════════════════════
echo.

:: Iniciar servidor
node server.js

:: Si llega aquí, el servidor se detuvo
echo.
echo [INFO] Servidor detenido
pause
