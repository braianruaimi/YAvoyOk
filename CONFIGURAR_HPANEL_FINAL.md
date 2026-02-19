# ============================================

# CONFIGURACIÓN FINAL - hPanel

# SHARED HOSTING HOSTINGER

# ============================================

## ✅ COMPLETADO

Tu aplicación YAvoy está ahora en:

```
/home/u695828542/public_html/app
```

Archivos verificados: ✅ (server.js, .env, node_modules, etc.)

---

## 🔧 CONFIGURAR EN hPANEL (2 minutos)

### 1. Abre hPanel

URL: https://hpanel.hostinger.com/hosting/advanced/nodejs

### 2. Clic en "Create Application"

### 3. Rellena el formulario:

#### 📁 Application root:

```
/public_html/app
```

**NOTA:** Si el selector no funciona, escribe la ruta manualmente.

#### 🌐 Application URL:

```
http://yavoy.space
```

O selecciona tu dominio de la lista.

#### 📄 Application startup file:

```
server.js
```

#### ⚙️ Node.js version:

```
18.x
```

O la versión LTS más reciente disponible.

#### 🔌 Application port (opcional):

Déjalo **en blanco** o **5502** si pide.
hPanel asignará el puerto automáticamente.

#### 🌍 Environment mode:

```
production
```

### 4. Clic en **"CREATE"**

### 5. Espera 1-2 minutos

hPanel configurará automáticamente:

- ✅ Proxy reverso Apache/Nginx
- ✅ Variables de entorno
- ✅ Process manager
- ✅ Auto-restart

### 6. Verifica

Abre en tu navegador:

```
https://yavoy.space
```

---

## ⚠️ SI EL CAMPO "APPLICATION ROOT" NO FUNCIONA

### Opción 1: Escribir manualmente

1. Haz clic en el campo "Application root"
2. Borra todo lo que aparezca
3. Escribe: `/public_html/app`
4. Presiona Enter/Tab

### Opción 2: Contactar soporte (5 min)

**Chat en vivo:** https://hpanel.hostinger.com/support/tickets

**Mensaje:**

```
Hola, tengo un plan Premium/Business y necesito configurar
mi aplicación Node.js pero el selector de "Application Root"
no funciona correctamente.

Por favor configuren manualmente:
- Usuario: u695828542
- Application root: /home/u695828542/public_html/app
- Application URL: http://yavoy.space
- Startup file: server.js
- Node version: 18.x

¡Gracias!
```

---

## 🔍 VERIFICACIÓN DESPUÉS DE CREAR

### En hPanel verás:

- **Status:** Running ✅
- **URL:** https://yavoy.space
- **Port:** (asignado automáticamente)
- **Restart:** Disponible si hay errores

### Si ves errores de logs:

1. Verifica que el archivo `.env` esté en `/public_html/app/`
2. Revisa que `node_modules` se haya copiado
3. Reinicia la aplicación desde hPanel

### Comando para verificar archivos:

```bash
ssh -p 65002 u695828542@147.79.84.219
cd ~/public_html/app
ls -la
cat .env | head -10
```

---

## 📊 DIFERENCIAS: VPS vs SHARED HOSTING

| Característica | VPS (antes)           | Shared Hosting (ahora) |
| -------------- | --------------------- | ---------------------- |
| PM2 manual     | ✅ Usado              | ❌ No necesario        |
| Proxy reverso  | ⚠️ Manual (.htaccess) | ✅ Automático (hPanel) |
| Puerto público | ❌ 5502 no accesible  | ✅ hPanel maneja todo  |
| Configuración  | Manual SSH            | ✅ hPanel GUI          |
| Auto-restart   | PM2 save              | ✅ Incluido            |
| Permisos root  | ❌ Limitados          | ❌ No necesarios       |

---

## ✅ CHECKLIST FINAL

- [x] Aplicación copiada a `/public_html/app`
- [x] PM2 antiguo detenido
- [ ] **Crear aplicación en hPanel** ⬅️ ESTE ES TU PASO
- [ ] Verificar https://yavoy.space funcione
- [ ] (Opcional) Configurar SSL si no está activo

---

## 📞 SOPORTE

**Si algo no funciona:**

1. Revisa los logs en hPanel → Node.js Application
2. Verifica que los archivos estén completos
3. Contacta soporte con los datos arriba

**Tiempo estimado total:** 2-5 minutos

---

**Siguiente paso:** Abre hPanel y crea la aplicación Node.js 🚀
URL: https://hpanel.hostinger.com/hosting/advanced/nodejs
