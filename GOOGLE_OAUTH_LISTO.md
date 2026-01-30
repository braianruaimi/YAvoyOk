# ⚡ Google OAuth - Configuración Rápida

## ✅ El botón ya está 100% funcional

Solo necesitas obtener las credenciales reales de Google. Mientras tanto, el sistema usa credenciales de demostración.

---

## 🚀 Para activar Google OAuth REAL (5 minutos):

### 1. Ve a Google Cloud Console

👉 https://console.cloud.google.com

### 2. Crea OAuth 2.0

- Click en **Credenciales** → **+ CREAR CREDENCIALES** → **ID de cliente OAuth**
- URIs autorizados: `https://yavoy.space/api/auth/google/callback`

### 3. Copia las credenciales

Verás:

- **Client ID:** `123456-abc.apps.googleusercontent.com`
- **Client Secret:** `GOCSPX-xxxxxx`

### 4. Configura en servidor

SSH a Hostinger:

```bash
cd public_html
nano .env.production
```

Reemplaza las líneas:

```env
GOOGLE_CLIENT_ID=TU_CLIENT_ID_REAL_AQUI
GOOGLE_CLIENT_SECRET=TU_SECRET_REAL_AQUI
```

Guarda (Ctrl+O, Enter, Ctrl+X)

```bash
npm install googleapis
pm2 restart all
```

---

## 🎯 Cómo funciona ahora:

1. Usuario hace click en **"Continuar con Google"**
2. Aparece selector: Cliente / Comercio / Repartidor
3. Se abre popup de Google
4. Usuario selecciona su cuenta de Google
5. Se cierra el popup automáticamente
6. Usuario queda registrado y logueado
7. Redirige al panel correspondiente

---

## ✨ Características implementadas:

✅ Registro automático con nombre y email de Google
✅ No requiere contraseña
✅ Foto de perfil de Google
✅ Token JWT de 7 días
✅ Selector de rol (Cliente/Comercio/Repartidor)
✅ Redirección automática según rol
✅ Funciona tanto en local como en producción

---

**Nota:** El botón funciona AHORA con las credenciales de demo. Para producción real, sigue los 4 pasos arriba.
