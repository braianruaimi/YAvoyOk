@echo off
color 0A
echo ===================================================
echo          YAVOY v3.1 - DEPLOY A HOSTINGER
echo ===================================================
echo.
echo PASO 1: Conectar al servidor SSH
echo ===================================================
echo.
echo Vas a conectarte a: 147.79.84.219
echo Usuario: u695828542
echo.
echo IMPORTANTE:
echo - Al escribir la contrasena NO VERAS nada en pantalla
echo - Esto es NORMAL por seguridad SSH
echo.
echo Contrasenas (prueba en este orden):
echo   1. Yavoy26!
echo   2. Yavoy25!
echo.
echo ===================================================
echo.
pause
echo.
echo Conectando al servidor...
echo.

ssh -p 65002 u695828542@147.79.84.219 "cd ~/public_html && git pull origin main && npm install && pm2 restart yavoy && pm2 save && echo '' && echo '===================================' && echo 'DEPLOY COMPLETADO EXITOSAMENTE' && echo '===================================' && echo '' && echo 'Tu app esta en: https://yavoy.space' && echo '' && pm2 status && echo '' && pm2 logs yavoy --lines 10"

echo.
echo.
echo ===================================================
echo Si viste errores, cierra esta ventana y vuelve
echo a ejecutar deploy-paso-a-paso.bat
echo ===================================================
echo.
pause
