# ============================================

# DEPLOY YAVOY - SHARED HOSTING HOSTINGER

# (Premium/Business con Node.js)

# ============================================

## ⚠️ IMPORTANTE: Diferencias con VPS

Tu plan es **Shared Hosting Premium/Business**, NO VPS.

### Limitaciones del Shared Hosting:

- ❌ NO puedes modificar Apache (sin sudo/root)
- ❌ NO puedes habilitar módulos (mod_proxy)
- ❌ Los puertos personalizados (5502) NO son accesibles externamente
- ❌ PM2 funcionará SOLO mientras dure la sesión SSH
- ✅ SÍ puedes usar Node.js via "Setup Node.js Application"
- ✅ SÍ tienes acceso SSH (limitado)

---

## 🎯 SOLUCIÓN CORRECTA PARA SHARED HOSTING

### Método 1: Setup Node.js Application (hPanel) ⭐ OFICIAL

#### Problema: Campo "Application Root" solo muestra `/`

**SOLUCIÓN A - Mover aplicación a public_html:**

```bash
# Conectar por SSH
ssh -p 65002 u695828542@147.79.84.219

# Crear carpeta app dentro de public_html
mkdir -p /home/u695828542/public_html/app

# Mover todo el proyecto
mv /home/u695828542/yavoy-app/* /home/u695828542/public_html/app/
mv /home/u695828542/yavoy-app/.env /home/u695828542/public_html/app/
mv /home/u695828542/yavoy-app/.git /home/u695828542/public_html/app/

# Detener PM2 (ya no se usará)
pm2 delete all
pm2 kill
```

Ahora en hPanel:

1. Ve a **Advanced → Setup Node.js Application**
2. Clic **Create Application**
3. **Application root:** Ahora verás `/public_html/app` ✅
4. **Application URL:** `http://yavoy.space`
5. **Application startup file:** `server.js`
6. **Node.js version:** 18.x
7. Clic **Create**
8. Espera 1-2 minutos
9. Prueba: https://yavoy.space

---

**SOLUCIÓN B - Contactar Soporte (Más rápido):**

Ya que el campo no funciona correctamente, contacta soporte:

```
Hola, tengo un plan Premium/Business y necesito configurar una
aplicación Node.js pero el campo "Application Root" en
"Setup Node.js Application" solo muestra "/" y no me deja
seleccionar mi directorio.

Mi aplicación está en: /home/u695828542/yavoy-app
Archivo principal: server.js
Dominio: yavoy.space

¿Pueden configurarlo manualmente o decirme cómo seleccionar
el directorio correcto?

Gracias!
```

---

### Método 2: Usar .htaccess + CGI (Alternativa)

Si "Setup Node.js Application" no funciona, puedes ejecutar Node.js como CGI:

```bash
# En /home/u695828542/public_html/.htaccess
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /cgi-bin/app.cgi/$1 [L]
```

```bash
# Crear /home/u695828542/public_html/cgi-bin/app.cgi
#!/home/u695828542/.nvm/versions/node/v18.20.8/bin/node

process.chdir('/home/u695828542/yavoy-app');
require('./server.js');
```

⚠️ **Problema:** Esto inicia Node.js en cada request (muy lento, NO recomendado)

---

### Método 3: Migrar a Hosting con Node.js Real

Si Hostinger Shared no soporta bien Node.js, considera:

1. **Hostinger VPS** (desde $4.99/mes)
2. **Railway.app** (gratis hasta 500 hrs/mes)
3. **Render.com** (gratis con limitaciones)
4. **Vercel** (gratis, ideal para Node.js)
5. **Heroku** (desde $5/mes)

---

## 📋 PASOS ESPECÍFICOS PARA TU CASO

### Opción Recomendada: Mover a public_html/app

```powershell
# 1. Conectar por SSH desde PowerShell
ssh -p 65002 u695828542@147.79.84.219

# 2. Ejecutar comandos (copia todo de una vez):
cd ~
mkdir -p public_html/app
shopt -s dotglob  # Incluir archivos ocultos
cp -r yavoy-app/* public_html/app/
cd public_html/app
ls -la  # Verificar que todo se copió

# 3. Detener PM2 (no funciona persistente en shared)
pm2 delete all
pm2 kill

# 4. Probar que funciona
cd /home/u695828542/public_html/app
node server.js &
# Esperar 5 segundos
curl http://localhost:5502/
# Ctrl+C para detener

# 5. Salir de SSH
exit
```

Ahora en **hPanel**:

1. Advanced → Setup Node.js Application
2. Create Application
3. Application root: `/public_html/app` (debería aparecer ahora)
4. Application URL: `http://yavoy.space`
5. Application startup file: `server.js`
6. Node version: 18.x
7. CREATE

Espera 2-3 minutos y prueba: **https://yavoy.space**

---

## 🔍 Verificar tipo de hosting

Para confirmar qué tienes:

```bash
# Conectar SSH
ssh -p 65002 u695828542@147.79.84.219

# Verificar si tienes VPS o Shared
uname -a
cat /etc/os-release
pwd
ls -la ~
ls -la /home
whoami

# Si ves "cpanel" o "plesk" → Shared Hosting
# Si ves Ubuntu/Debian completo → VPS
```

---

## ⚡ SOLUCIÓN RÁPIDA (Script Automatizado)

Ejecuta este script desde tu PC:

```powershell
# Mover aplicación a public_html/app
ssh -p 65002 u695828542@147.79.84.219 @"
cd ~
mkdir -p public_html/app
shopt -s dotglob
cp -r yavoy-app/* public_html/app/ 2>/dev/null || true
cd public_html/app
echo '✅ Aplicación copiada a public_html/app'
ls -la | head -20
"@

Write-Host "`n✅ Aplicación movida!" -ForegroundColor Green
Write-Host "Ahora ve a hPanel → Setup Node.js Application" -ForegroundColor Cyan
Write-Host "Application Root: /public_html/app`n" -ForegroundColor Yellow
Start-Process "https://hpanel.hostinger.com/hosting/advanced/nodejs"
```

---

## 📞 Contactar Soporte (Opción más rápida)

Si nada funciona:

1. Abre: https://hpanel.hostinger.com/support/tickets
2. Mensaje:

```
Asunto: Configurar aplicación Node.js en Shared Hosting

Hola, tengo un plan Premium/Business y necesito ayuda para
configurar mi aplicación Node.js.

Usuario: u695828542
Dominio: yavoy.space
Aplicación: /home/u695828542/yavoy-app (o /public_html/app)
Archivo principal: server.js
Puerto: 5502

Problemas:
1. El campo "Application Root" en "Setup Node.js Application"
   solo muestra "/" y no puedo seleccionar mi directorio
2. He intentado .htaccess con ProxyPass pero no funciona
   (supongo que mod_proxy no está habilitado)

¿Pueden configurar mi aplicación manualmente o indicarme
el procedimiento correcto para Shared Hosting?

¡Gracias!
```

---

## 🎯 RESUMEN

**Para Shared Hosting Premium/Business:**

1. ✅ **Mover app** a `/home/u695828542/public_html/app`
2. ✅ **Usar hPanel** → Setup Node.js Application
3. ✅ **O contactar soporte** para configuración manual
4. ❌ **NO usar PM2** (se detiene al cerrar SSH)
5. ❌ **NO intentar configurar Apache** (sin permisos)

**Tu servidor ya está funcionando.** Solo necesitas que hPanel
lo configure oficialmente para acceso web.

---

**Siguiente paso:** ¿Quieres que ejecute el script para mover
la aplicación a public_html/app?
