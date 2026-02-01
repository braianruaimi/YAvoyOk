# 🔐 Configuración de Google OAuth en YAvoy

## ✅ Sistema implementado

El botón "Continuar con Google" ya está funcionando en el frontend y el backend está listo. Solo necesitas obtener las credenciales de Google Cloud Console.

---

## 📋 Pasos para configurar Google OAuth

### 1️⃣ Crear proyecto en Google Cloud Console

1. Ve a: **https://console.cloud.google.com**
2. Click en "Crear Proyecto" o selecciona uno existente
3. Nombra el proyecto: **YAvoy Delivery**

---

### 2️⃣ Activar Google+ API

1. En el menú lateral → **APIs y servicios** → **Biblioteca**
2. Busca: **Google+ API**
3. Click en **Habilitar**

---

### 3️⃣ Crear credenciales OAuth 2.0

1. Ve a: **APIs y servicios** → **Credenciales**
2. Click en **+ CREAR CREDENCIALES** → **ID de cliente de OAuth 2.0**
3. Si no has configurado la pantalla de consentimiento:
   - Click en **CONFIGURAR PANTALLA DE CONSENTIMIENTO**
   - Tipo: **Externo** → Siguiente
   - Rellena:
     - **Nombre de la app:** YAvoy
     - **Correo de asistencia:** yavoyen5@gmail.com
     - **Logo:** (opcional)
     - **Dominios autorizados:** yavoy.space
     - **Correo del desarrollador:** yavoyen5@gmail.com
   - Click en **Guardar y continuar** (3 veces)
4. Volver a **Credenciales** → **+ CREAR CREDENCIALES** → **ID de cliente de OAuth**
5. Tipo de aplicación: **Aplicación web**
6. Nombre: **YAvoy Web Client**
7. **URIs de redireccionamiento autorizados:**
   - Agregar: `http://localhost:5502/api/auth/google/callback`
   - Agregar: `https://yavoy.space/api/auth/google/callback`
8. Click en **CREAR**

---

### 4️⃣ Copiar credenciales al proyecto

Verás una ventana con:

- **ID de cliente:** algo como `123456789-abc.apps.googleusercontent.com`
- **Secreto del cliente:** algo como `GOCSPX-xxxxxxxxxxxxx`

Copia estos valores.

---

### 5️⃣ Configurar archivo .env

Abre el archivo `.env` (o `.env.production`) y agrega:

```env
# ==================== GOOGLE OAUTH ====================
GOOGLE_CLIENT_ID=TU_CLIENT_ID_AQUI
GOOGLE_CLIENT_SECRET=TU_CLIENT_SECRET_AQUI
GOOGLE_REDIRECT_URI=https://yavoy.space/api/auth/google/callback
```

**Ejemplo real:**

```env
GOOGLE_CLIENT_ID=123456789-abc123def456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-1a2b3c4d5e6f7g8h9i0j
GOOGLE_REDIRECT_URI=https://yavoy.space/api/auth/google/callback
```

---

### 6️⃣ Instalar dependencias

En el servidor (terminal SSH de Hostinger):

```bash
cd public_html
npm install googleapis
pm2 restart all
```

O localmente para probar:

```powershell
npm install
node server-simple.js
```

---

## 🧪 Probar la funcionalidad

### Local (http://localhost:5502):

1. Abre: `http://localhost:5502`
2. Click en **"Registrarme"**
3. Click en **"Continuar con Google"**
4. Debería abrir popup de Google
5. Selecciona tu cuenta
6. Acepta permisos
7. Se cierra el popup y quedas logueado

### Producción (https://yavoy.space):

1. Sube el `.env` con las credenciales
2. Reinicia el servidor: `pm2 restart all`
3. Abre: `https://yavoy.space`
4. Click en **"Registrarme"** → **"Continuar con Google"**
5. ✅ ¡Debería funcionar!

---

## 🔍 Verificar que funciona

**En Google Cloud Console:**

- Ve a **APIs y servicios** → **OAuth 2.0 Playground**
- Deberías ver las autenticaciones exitosas en tiempo real

**En tu servidor:**

- Revisa: `registros/clientes.json`
- Deberías ver usuarios con `"auth_provider": "google"`

---

## ⚠️ Solución de problemas

### Error: "redirect_uri_mismatch"

**Solución:** Agrega la URL exacta en Google Cloud Console:

- `https://yavoy.space/api/auth/google/callback` (sin barra final)

### Error: "invalid_client"

**Solución:** Verifica que copiaste bien el Client ID y Client Secret en `.env`

### El popup no se abre

**Solución:** Verifica que el navegador no está bloqueando popups. Permite popups en yavoy.space.

---

## 📝 Resumen de lo que hace

1. Usuario click en "Continuar con Google"
2. Frontend llama a `/api/auth/google/init`
3. Backend genera URL de Google OAuth
4. Se abre popup con formulario de Google
5. Usuario selecciona cuenta y acepta
6. Google redirige a `/api/auth/google/callback?code=...`
7. Backend intercambia código por token de acceso
8. Backend obtiene datos del usuario (nombre, email, foto)
9. Backend crea/actualiza usuario en `clientes.json`
10. Backend genera JWT de sesión
11. Popup se cierra automáticamente
12. Usuario queda logueado en YAvoy

---

## 🎯 Próximos pasos opcionales

- [ ] Agregar botón "Continuar con Google" también en login.html
- [ ] Permitir vincular cuenta Google a usuario existente
- [ ] Agregar Apple Sign-In
- [ ] Agregar Facebook Login

---

✅ **¡Sistema listo para usarse!** Solo necesitas las credenciales de Google Cloud Console.
