@echo off
echo ==================================================
echo YAVOY v3.1 - CONEXION SSH HOSTINGER
echo ==================================================
echo.
echo Conectando al servidor VPS...
echo Host: 147.79.84.219
echo Puerto: 65002
echo Usuario: u695828542
echo.
echo IMPORTANTE: Al escribir la contrasena NO SE VERA
echo             Esto es NORMAL por seguridad SSH
echo.
echo --------------------------------------------------
echo PRUEBA ESTAS CONTRASENAS EN ORDEN:
echo --------------------------------------------------
echo 1. Yavoy26!  [NUEVA - Prueba esta primero]
echo 2. Yavoy25!  [ANTIGUA - Si la 1 falla]
echo --------------------------------------------------
echo.
pause
echo.
echo Conectando...
echo.
ssh -p 65002 u695828542@147.79.84.219
echo.
echo --------------------------------------------------
echo Si te conectaste exitosamente, ejecuta estos comandos:
echo --------------------------------------------------
echo cd ~/public_html
echo git pull origin main
echo npm install
echo pm2 restart yavoy
echo pm2 save
echo pm2 logs yavoy --lines 20
echo --------------------------------------------------
echo.
pause
