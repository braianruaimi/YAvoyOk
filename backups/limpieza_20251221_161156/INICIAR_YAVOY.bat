@echo off
chcp 65001 >nul
cls

echo ╔══════════════════════════════════════════════════════════╗
echo ║                                                          ║
echo ║              🚀 INICIANDO YAVOY DEFINITIVO 🚀           ║
echo ║                                                          ║
echo ║         Sistema Unificado de Gestión de Pedidos         ║
echo ║                                                          ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
echo [INFO] Verificando requisitos...

:: Verificar Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no está instalado
    echo [INFO] Descarga Node.js desde: https://nodejs.org/
    pause
    exit /b 1
)

echo [✓] Node.js detectado
node --version

:: Verificar NPM
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] NPM no está instalado
    pause
    exit /b 1
)

echo [✓] NPM detectado
npm --version

echo.
echo [INFO] Verificando dependencias...

:: Verificar si existe node_modules
if not exist "node_modules\" (
    echo [WARN] Dependencias no instaladas
    echo [INFO] Instalando dependencias...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Error al instalar dependencias
        pause
        exit /b 1
    )
    echo [✓] Dependencias instaladas correctamente
) else (
    echo [✓] Dependencias ya instaladas
)

echo.
echo [INFO] Verificando carpetas...

:: Crear carpetas de registros si no existen
if not exist "registros\" mkdir registros
if not exist "registros\comercios\" mkdir registros\comercios
if not exist "registros\repartidores\" mkdir registros\repartidores
if not exist "registros\pedidos\" mkdir registros\pedidos
if not exist "registros\chats\" mkdir registros\chats

echo [✓] Estructura de carpetas verificada

echo.
echo ════════════════════════════════════════════════════════════
echo.
echo   🌐 Iniciando servidor en http://localhost:5501
echo.
echo   📋 Accesos rápidos:
echo      • Página principal: http://localhost:5501
echo      • Panel Comercio:   http://localhost:5501/panel-comercio.html
echo      • Panel Repartidor: http://localhost:5501/panel-repartidor.html
echo.
echo   ⚠️  Presiona Ctrl+C para detener el servidor
echo.
echo ════════════════════════════════════════════════════════════
echo.

:: Iniciar servidor
node server.js

:: Si el servidor se detiene
echo.
echo [INFO] Servidor detenido
pause
