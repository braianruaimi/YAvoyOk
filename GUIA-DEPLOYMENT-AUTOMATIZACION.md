# 🚀 GUÍA COMPLETA: DEPLOYMENT Y AUTOMATIZACIÓN YAVOY

## 📋 ÍNDICE

1. [Deployment Inicial](#fase-1-deployment-inicial)
2. [Sistema de Automatización](#fase-2-automatización)
3. [Verificación y Monitoreo](#verificación)
4. [Solución de Problemas](#troubleshooting)

---

## ✅ FASE 1: DEPLOYMENT INICIAL

### Objetivo
Levantar YAvoy en Hostinger por primera vez.

### Requisitos Previos
- ✅ Plan Business de Hostinger activo
- ✅ Acceso SSH configurado
- ✅ PuTTY instalado (Windows) - [Descargar](https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html)
- ✅ Git configurado localmente
- ✅ Código YAvoy en tu PC

### Paso 1: Ejecutar Script de Deployment

```powershell
# Desde tu directorio del proyecto
.\DEPLOY-INICIAL-HOSTINGER.ps1
```

**El script automáticamente:**
1. ✅ Verifica conexión SSH
2. ✅ Detecta si tienes Node.js disponible
3. ✅ Limpia el directorio web
4. ✅ Clona el repositorio desde GitHub
5. ✅ Instala dependencias npm (si Node.js está disponible)
6. ✅ Crea archivo .env de producción
7. ✅ Inicia la aplicación
8. ✅ Verifica el deployment

**Duración:** 3-5 minutos

### Paso 2: Verificar el Sitio

Abre en tu navegador:
```
https://yavoy.space
```

**Si ves la página principal → ✅ Deployment exitoso**

### Paso 3 (Opcional): Configurar Node.js Selector

Si tu plan tiene Node.js Selector:

1. Ve a: https://hpanel.hostinger.com
2. Selecciona tu dominio
3. Busca **"Node.js"** en el menú
4. Configura:
   - **Application root:** `/home/u695828542/public_html`
   - **Startup file:** `server.js`
   - **Mode:** `production`
   - **Node.js version:** `18.x` o `20.x`
5. Click **"Enable"** o **"Restart"**

---

## 🤖 FASE 2: AUTOMATIZACIÓN

### Objetivo
Configurar deployment automático en cada `git push`.

### Cómo Funciona

```
Tu PC → git push → GitHub → GitHub Actions → Hostinger → ✅ Actualizado
```

### Paso 1: Ejecutar Setup de Automatización

```powershell
.\SETUP-AUTO-DEPLOYMENT.ps1
```

**El script te guiará para:**
1. ✅ Generar claves SSH para GitHub Actions
2. ✅ Configurar acceso en Hostinger
3. ✅ Crear GitHub Secrets
4. ✅ Activar workflow de auto-deployment

**Duración:** 10-15 minutos (una sola vez)

### Paso 2: Configurar GitHub Secrets

El script generará un archivo con todos los secrets necesarios.

**Agrégalos en:**
```
https://github.com/braianruaimi/YAvoyOk/settings/secrets/actions
```

**Secrets requeridos:**
1. `HOSTINGER_SSH_KEY` - Clave SSH privada
2. `HOSTINGER_HOST` - 147.79.84.219
3. `HOSTINGER_PORT` - 65002
4. `HOSTINGER_USER` - u695828542
5. `HOSTINGER_DEPLOY_PATH` - /home/u695828542/public_html
6. `APP_URL` - https://yavoy.space

### Paso 3: Probar Auto-Deployment

```bash
# Haz un cambio simple
echo "# Test" >> README.md

# Commit y push
git add .
git commit -m "test: Probando auto-deployment"
git push origin main
```

**Ve a GitHub Actions:**
```
https://github.com/braianruaimi/YAvoyOk/actions
```

Verás el workflow ejecutándose en tiempo real 🎉

---

## 📊 VERIFICACIÓN Y MONITOREO

### Ver Logs de Deployment

**En GitHub:**
- Ve a: https://github.com/braianruaimi/YAvoyOk/actions
- Click en el último workflow
- Revisa cada step

**En Hostinger (SSH):**
```bash
ssh -p 65002 u695828542@147.79.84.219

# Ver logs de la aplicación
tail -f ~/public_html/app.log

# Ver procesos Node.js
ps aux | grep node

# Ver uso de recursos
top
```

### Health Check Manual

```bash
# Test endpoint
curl -I https://yavoy.space

# Debe responder 200 OK o 301/302 (redirect)
```

### Monitoreo Automático

El workflow de GitHub Actions incluye:
- ✅ Health check después de cada deployment
- ✅ Rollback automático si falla
- ✅ Notificaciones de éxito/error
- ✅ Summary con detalles del deployment

---

## 🚀 FLUJO DE TRABAJO DIARIO

Una vez configurado, tu workflow será:

### 1. Desarrollo Local

```bash
# Hacer cambios en tu código
code .

# Ver cambios
git status
```

### 2. Commit

```bash
git add .
git commit -m "feat: Nueva funcionalidad X"
```

### 3. Push

```bash
git push origin main
```

### 4. Deploy Automático

**GitHub Actions automáticamente:**
- ⏱️ Se dispara en 5-10 segundos
- 🔄 Conecta a Hostinger
- 📥 Pull del código más reciente
- 📦 Instala/actualiza dependencias
- 🔄 Reinicia la aplicación
- ✅ Verifica que funcione
- 📧 Te notifica del resultado

**Duración:** 2-3 minutos

### 5. Verificación

```bash
# Opcional: Ver en tiempo real
# https://github.com/braianruaimi/YAvoyOk/actions

# Verificar sitio
# https://yavoy.space
```

---

## 🛠️ TROUBLESHOOTING

### Problema 1: SSH No Conecta

**Síntoma:**
```
Connection refused
Permission denied
```

**Solución:**
```bash
# Verifica credenciales
ssh -p 65002 u695828542@147.79.84.219

# Si pide password: Yavoy26! o Yavoy25!
```

### Problema 2: Node.js No Disponible

**Síntoma:**
```
node: command not found
```

**Soluciones:**

**A. Verificar Node.js Selector en hPanel**
- Ve a hPanel > busca "Node.js"
- Si existe, actívalo

**B. Sin Node.js → Usar Render.com**
1. Frontend en Hostinger (estático)
2. Backend en Render.com (gratis)
3. Sigue: `DEPLOY_HOSTINGER_BUSINESS_PLAN.md`

**C. Upgrade a VPS** (~$5/mes)
- Node.js completo
- PM2 funcionando
- Control total

### Problema 3: Deployment Falla en GitHub Actions

**Síntoma:**
Workflow en rojo ❌

**Solución:**
```bash
# 1. Ve al detalle del error en GitHub Actions
# 2. Revisa el step que falló
# 3. Errores comunes:

# - SSH Key inválida
#   → Regenera con SETUP-AUTO-DEPLOYMENT.ps1

# - Path incorrecto
#   → Verifica HOSTINGER_DEPLOY_PATH

# - Permisos
ssh -p 65002 u695828542@147.79.84.219
chmod 755 ~/public_html
```

### Problema 4: Sitio No Carga

**Síntoma:**
https://yavoy.space no responde

**Solución:**

**A. Revisar logs:**
```bash
ssh -p 65002 u695828542@147.79.84.219
tail -100 ~/public_html/app.log
```

**B. Verificar proceso Node.js:**
```bash
ps aux | grep node
# Si no hay proceso:
cd ~/public_html
node server.js
```

**C. Verificar MySQL:**
```bash
mysql -h localhost -u u695828542_ssh -p u695828542_YAvoyOk26
# Password: Yavoy26!
```

### Problema 5: Cambios No Se Reflejan

**Síntoma:**
Hice push pero el sitio no cambia

**Solución:**
```bash
# 1. Verificar que el workflow se ejecutó
# https://github.com/braianruaimi/YAvoyOk/actions

# 2. Limpiar cache del navegador
Ctrl + Shift + R (Chrome)
Ctrl + F5 (Firefox)

# 3. Verificar en SSH que el código se actualizó
ssh -p 65002 u695828542@147.79.84.219
cd ~/public_html
git log -1
```

---

## 📊 COMANDOS ÚTILES

### Deployment Manual

```bash
# Conectarse
ssh -p 65002 u695828542@147.79.84.219

# Actualizar código
cd ~/public_html
git pull origin main
npm install --production

# Reiniciar app
pkill -f "node server.js"
nohup node server.js > app.log 2>&1 &

# O con PM2 (si disponible)
pm2 restart yavoy
```

### Monitoreo

```bash
# Ver logs en tiempo real
tail -f ~/public_html/app.log

# Ver últimas 100 líneas
tail -100 ~/public_html/app.log

# Buscar errores
grep -i "error" ~/public_html/app.log

# Ver procesos Node.js
ps aux | grep node

# Ver uso de recursos
top
htop (si disponible)
```

### Backup

```bash
# Backup manual antes de cambios grandes
cd ~
tar -czf backup-yavoy-$(date +%Y%m%d).tar.gz public_html/

# Ver backups
ls -lh ~/backup-yavoy-*.tar.gz

# Restaurar backup
tar -xzf backup-yavoy-20260219.tar.gz
```

---

## 🎯 RESUMEN

### Una Vez Configurado

```
git add .
git commit -m "mensaje"
git push
```

**→ Sitio actualizado automáticamente en 2-3 minutos ✅**

### Beneficios

✅ **Sin deployment manual**
✅ **Zero-downtime deployments**
✅ **Rollback automático si falla**
✅ **Health checks incluidos**
✅ **Historial de deployments**
✅ **Notificaciones automáticas**

---

## 📚 ARCHIVOS DE REFERENCIA

- `DEPLOY-INICIAL-HOSTINGER.ps1` - Script deployment inicial
- `SETUP-AUTO-DEPLOYMENT.ps1` - Setup automatización
- `.github/workflows/auto-deploy.yml` - Workflow GitHub Actions
- `DEPLOY_HOSTINGER_BUSINESS_PLAN.md` - Guía plan Business
- `DEPLOY_HOSTINGER_SHARED_HOSTING.md` - Alternativas hosting

---

## 📞 SOPORTE

**GitHub Issues:**
https://github.com/braianruaimi/YAvoyOk/issues

**Hostinger Support:**
https://hpanel.hostinger.com → Support → Live Chat

**GitHub Actions Logs:**
https://github.com/braianruaimi/YAvoyOk/actions

---

## ✅ CHECKLIST FINAL

Después de completar todo:

- [ ] ✅ Deployment inicial exitoso
- [ ] ✅ Sitio carga en https://yavoy.space
- [ ] ✅ Auto-deployment configurado
- [ ] ✅ GitHub Secrets agregados
- [ ] ✅ Primer push automático funcionando
- [ ] ✅ Health checks pasando
- [ ] ✅ Logs accesibles
- [ ] ✅ Documentación leída

---

**🎉 ¡YAvoy está en producción con deployment automático!** 🚀
