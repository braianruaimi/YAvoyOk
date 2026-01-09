@echo off
echo ========================================
echo    INICIANDO YAVOY EN MICROSOFT EDGE
echo ========================================
echo.
echo 1. Verificando Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js no esta instalado
    echo Por favor instala Node.js desde https://nodejs.org
    pause
    exit /b 1
)
echo    Node.js encontrado: OK
echo.

echo 2. Deteniendo servidores previos...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo    Servidores previos detenidos: OK
echo.

echo 3. Iniciando servidor YAvoy...
cd /d "%~dp0"
start /B node server.js
timeout /t 3 /nobreak >nul
echo    Servidor iniciado en puerto 5501: OK
echo.

echo 4. Abriendo Microsoft Edge...
start msedge "http://localhost:5501/test-simple.html"
echo    Edge abierto: OK
echo.

echo ========================================
echo    YAVOY INICIADO CORRECTAMENTE
echo ========================================
echo.
echo Servidor corriendo en: http://localhost:5501
echo Pagina de pruebas: http://localhost:5501/test-simple.html
echo.
echo Para detener el servidor: presiona Ctrl+C
echo.
pause
