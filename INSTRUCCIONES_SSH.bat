@echo off
color 0A
cls
echo ============================================
echo   YAVOY v3.1 - INSTRUCCIONES SSH DEPLOY
echo ============================================
echo.
echo PASO 1: CONECTAR POR SSH
echo ============================================
echo.
echo Copia y ejecuta este comando:
echo.
echo   ssh -p 65002 u695828542@147.79.84.219
echo.
echo Password: Yavoy26!  (si no funciona usa: Yavoy25!)
echo.
echo ============================================
echo.
echo PASO 2: EJECUTAR COMANDOS UNO POR UNO
echo ============================================
echo.
echo Una vez conectado, copia y pega estos comandos:
echo.
echo # 1. Ir al directorio correcto
echo cd ~/public_html
echo.
echo # 2. Limpiar todo
echo rm -rf * .[^.]*
echo.
echo # 3. Clonar desde GitHub
echo git clone https://github.com/braianruaimi/YAvoyOk.git .
echo.
echo # 4. Instalar dependencias
echo npm install --production
echo.
echo # 5. Crear archivo .env (COPIA TODO HASTA EOF)
echo cat ^> .env ^<^< 'EOF'
echo DB_HOST=localhost
echo DB_PORT=3306
echo DB_NAME=u695828542_yavoy_web
echo DB_USER=u695828542_yavoyen5
echo DB_PASSWORD=Yavoy26!
echo NODE_ENV=production
echo PORT=5502
echo JWT_SECRET=YAvoy_Enterprise_JWT_Secret_2024_Ultra_Secure_MySQL
echo SESSION_SECRET=YAvoy_Session_Secret_2024_MySQL_Enterprise
echo ALLOWED_ORIGINS=https://yavoy.space,https://www.yavoy.space
echo SMTP_HOST=smtp.hostinger.com
echo SMTP_PORT=587
echo SMTP_USER=yavoyen5@yavoy.space
echo SMTP_PASS=BrainCesar26!
echo SMTP_SECURE=false
echo SMTP_TLS=true
echo VAPID_PUBLIC_KEY=BL4P9zTOxEkQBAmTV3XiyK9305PJDZKoPr52a0NNedpV5OVfuZGlf9SL21zVE9D4AwNfgWzKw8bHA-peL_g-qZs
echo VAPID_PRIVATE_KEY=SmZvfO1ZhLtbCrewuGFDnG0gfuTeV5DT9vRBjmWlBL4
echo VAPID_SUBJECT=mailto:yavoyen5@yavoy.space
echo EOF
echo.
echo # 6. Instalar PM2 si no esta instalado
echo npm list -g pm2 ^|^| npm install -g pm2
echo.
echo # 7. Detener proceso anterior
echo pm2 delete yavoy 2^>^/dev^/null ^|^| true
echo.
echo # 8. Iniciar aplicacion
echo pm2 start server.js --name yavoy
echo.
echo # 9. Guardar configuracion PM2
echo pm2 save
echo.
echo # 10. Ver estado y logs
echo pm2 status
echo pm2 logs yavoy --lines 20
echo.
echo ============================================
echo   TU APP ESTARA EN: https://yavoy.space
echo ============================================
echo.
pause
