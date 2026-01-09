# 🚀 YAvoy v7 — Guía de Subida a Hostinger Premium

## 📦 Archivo Listo
`YAvoy_Hostinger_v7.zip` — Optimizado para hosting compartido (sin Node.js backend)

---

## 🎯 Pasos para Subir a Hostinger Premium

### Método 1 — Panel hPanel (Recomendado)

1. **Accede a tu panel Hostinger**
   - URL: https://hpanel.hostinger.com
   - Ingresa con tus credenciales

2. **Ve a tu hosting**
   - Click en el dominio donde quieres instalar YAvoy
   - Ejemplo: `tudominio.com` o `yavoy.com.ar`

3. **Abre el Administrador de Archivos**
   - Menú lateral → "Archivos" → "Administrador de archivos"
   - Se abrirá el explorador de archivos del servidor

4. **Navega a la carpeta correcta**
   - Si es tu dominio principal: `public_html/`
   - Si es un subdominio: `public_html/subdominio/`
   - Si quieres probarlo en una carpeta: `public_html/yavoy/`

5. **Sube el ZIP**
   - Click en "Subir archivos" (botón arriba a la derecha)
   - Selecciona `YAvoy_Hostinger_v7.zip`
   - Espera que suba (puede tardar 1-2 min según tu conexión)

6. **Extrae el ZIP**
   - Click derecho sobre `YAvoy_Hostinger_v7.zip`
   - Selecciona "Extraer"
   - Confirma la carpeta destino
   - Elimina el ZIP después de extraer (opcional, para ahorrar espacio)

7. **Verifica los archivos**
   - Deberías ver:
     - `index.html`
     - `styles.css`
     - `script.js`
     - `sw.js`
     - `manifest.json`
     - `offline.html`
     - Carpetas: `icons/`, `styles/`, `components/`, `hooks/`, `utils/`
     - Docs: `README.md`, `LEEME.txt`, etc.

8. **Accede a tu sitio**
   - **Dominio principal**: `https://tudominio.com`
   - **Subcarpeta**: `https://tudominio.com/yavoy/`
   - **Subdominio**: `https://yavoy.tudominio.com`

---

### Método 2 — FTP/SFTP (Más Control)

1. **Obtén tus credenciales FTP**
   - hPanel → "Archivos" → "Cuentas FTP"
   - Anota: Host, Usuario, Contraseña, Puerto

2. **Descarga FileZilla** (si no lo tienes)
   - https://filezilla-project.org/download.php?type=client

3. **Conecta a tu servidor**
   - Abre FileZilla
   - Host: `ftp.tudominio.com` (o la IP que te dio Hostinger)
   - Usuario: tu usuario FTP
   - Contraseña: tu contraseña FTP
   - Puerto: 21 (FTP) o 22 (SFTP recomendado)
   - Click "Conexión rápida"

4. **Navega a `public_html/`**
   - Panel derecho (servidor remoto)
   - Doble click en `public_html`

5. **Sube los archivos**
   - Panel izquierdo: navega a la carpeta descomprimida `YAvoy_Hostinger_v7`
   - Selecciona todo (Ctrl+A)
   - Arrastra al panel derecho
   - Espera que termine la transferencia

6. **Verifica permisos** (importante)
   - Archivos: 644
   - Carpetas: 755
   - Click derecho → "Permisos de archivo" si necesitas ajustar

---

### Método 3 — Git Deploy (Avanzado - Opcional)

Si tu código está en GitHub:

1. **hPanel → "Avanzado" → "Git"**
2. **"Crear nuevo repositorio"**
3. **Conecta tu cuenta GitHub/GitLab**
4. **Selecciona el repositorio YAvoy**
5. **Rama**: `main` o `master`
6. **Ruta destino**: `/public_html/`
7. **Click "Crear"**
8. Cada push al repo actualiza automáticamente

---

## ⚙️ Configuración Post-Subida

### 1. Configura HTTPS (Obligatorio para PWA)
- hPanel → "Seguridad" → "SSL/TLS"
- Activa "SSL automático" o instala certificado gratuito Let's Encrypt
- Fuerza redirección HTTPS:
  - hPanel → "Avanzado" → "htaccess Editor"
  - Añade:
```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

### 2. Ajusta URLs en el código (si usas subcarpeta)
Si instalaste en `public_html/yavoy/`, edita:

**sw.js** (línea ~10):
```javascript
const CACHE_NAME = 'yavoy-v7';
const BASE_PATH = '/yavoy/'; // añade esta línea si está en subcarpeta
```

**manifest.json**:
```json
{
  "start_url": "/yavoy/",
  "scope": "/yavoy/"
}
```

### 3. Verifica el Service Worker
- Abre tu sitio: `https://tudominio.com`
- F12 → Console
- Busca: "Service Worker registrado" ✅
- F12 → Application → Service Workers
- Debe aparecer activo

### 4. Prueba la PWA
- Chrome/Edge: botón "Instalar" en la barra de direcciones
- Android: Menú → "Agregar a pantalla de inicio"

---

## 📊 Panel de Control Hostinger Premium

### Recursos Incluidos
✅ **100 GB SSD**: espacio suficiente para miles de comercios
✅ **Dominio gratis**: conecta tu `.com.ar` o `.com`
✅ **SSL gratuito**: automático con Let's Encrypt
✅ **CDN gratuito**: Cloudflare incluido para velocidad global
✅ **Email profesional**: `contacto@tudominio.com`
✅ **Backups semanales**: automáticos

### Limitaciones del Plan
❌ **No ejecuta Node.js persistente**: `server.js` no funcionará
❌ **No ejecuta npm install**: solo archivos estáticos

### Soluciones para Backend

**Opción A — Firebase (Gratis)**
1. Crea proyecto en https://console.firebase.google.com
2. Activa Firestore Database
3. Reemplaza localStorage por Firestore en `script.js`:
```javascript
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  projectId: "yavoy-db"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Guardar comercio
async function guardarComercio(comercio) {
  await addDoc(collection(db, "comercios"), comercio);
}
```

**Opción B — Supabase (Gratis)**
1. Crea proyecto en https://supabase.com
2. Crea tabla `comercios` con columnas: id, nombre, categoria, whatsapp, email, created_at
3. Usa el cliente JS de Supabase

**Opción C — Upgrade a VPS Hostinger**
- Plan VPS desde $4.99/mes
- Instalas Node.js y ejecutas `server.js` completo
- Control total del servidor

---

## 🧪 Verificación Final

### Checklist Post-Deploy
- [ ] Sitio carga en `https://tudominio.com` ✅
- [ ] Certificado SSL activo (candado verde) 🔒
- [ ] Service Worker registrado (F12 → Console) ⚙️
- [ ] Manifest detectado (F12 → Application) 📱
- [ ] Iconos se ven correctamente 🖼️
- [ ] Formularios funcionan (datos a localStorage) 📝
- [ ] Modal WhatsApp abre correctamente 💬
- [ ] Botón "Instalar App" aparece 📲
- [ ] Responsive en móvil perfecto 📱

---

## 🆘 Problemas Comunes

### "ERR_SSL_PROTOCOL_ERROR"
**Solución:** Espera 10-15 min para que el SSL se propague. Fuerza HTTPS con .htaccess.

### "Service Worker no se registra"
**Solución:** 
- Verifica que estés en HTTPS (obligatorio)
- Limpia caché del navegador (Ctrl+Shift+Delete)
- Revisa rutas en `sw.js` si usas subcarpeta

### "Mixed Content" en consola
**Solución:** Cambia todos los `http://` a `https://` en tu código.

### Archivos no se ven
**Solución:** 
- Verifica permisos: archivos 644, carpetas 755
- Revisa que estén en `public_html/` (no en una subcarpeta extra)

### localStorage no persiste
**Solución:** Normal en modo incógnito. Prueba en ventana normal.

---

## 📞 Soporte Hostinger

- Chat 24/7: hPanel → botón chat abajo a la derecha
- Email: support@hostinger.com
- Base conocimiento: https://support.hostinger.com

---

## 🎉 ¡Listo!

Tu sitio YAvoy v7 está en producción con:
- ✅ HTTPS seguro
- ✅ PWA instalable
- ✅ Dominio profesional
- ✅ Velocidad global (CDN)
- ✅ Email corporativo

**Próximos pasos:**
1. Configura Analytics (Google Analytics 4)
2. Añade backend (Firebase/Supabase)
3. Conecta dominio personalizado si aún no lo hiciste
4. Comparte URL con tu socio

---

**Versión:** 7.0  
**Actualizado:** 30 Nov 2025  
**Soporte:** YAvoy5@gmail.com
