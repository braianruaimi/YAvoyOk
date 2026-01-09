@echo off
chcp 65001 >nul
title YAvoy Server - Puerto 3000
color 0B

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║                                                          ║
echo ║          🚀 SERVIDOR YAVOY v3.1 INICIANDO 🚀            ║
echo ║                                                          ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

:start
cls
echo.
echo ════════════════════════════════════════════════════════════
echo   🌐 SERVIDOR YAVOY CORRIENDO EN PUERTO 3000
echo ════════════════════════════════════════════════════════════
echo.
echo   📋 ACCESOS:
echo.
echo      🏠 Principal:      http://localhost:3000
echo      🚴 Repartidor:     http://localhost:3000/panel-repartidor.html
echo      🏪 Comercio:       http://localhost:3000/panel-comercio.html
echo      👤 Cliente:        http://localhost:3000/panel-cliente-pro.html
echo      🎯 CEO:            http://localhost:3000/panel-ceo-master.html
echo      🧪 Test Estilos:   http://localhost:3000/test.html
echo.
echo ════════════════════════════════════════════════════════════
echo   💡 Presiona Ctrl+C para detener el servidor
echo ════════════════════════════════════════════════════════════
echo.

node server.js

if errorlevel 1 (
    echo.
    echo ⚠️  El servidor se detuvo con un error
    echo 🔄  Reiniciando en 3 segundos...
    timeout /t 3 >nul
    goto start
)

pause
