# 📦 YAvoy - Instrucciones para Instalar y Ejecutar

## 🎯 Guía Rápida para tu Socio

### Opción 1: 📂 Compartir por carpeta comprimida (Recomendado)

#### 1️⃣ **Preparar el proyecto para compartir:**

1. **Comprimir la carpeta completa:**
   - Clic derecho en `YAvoy_DEFINITIVO`
   - Enviar a → Carpeta comprimida
   - Se creará `YAvoy_DEFINITIVO.zip`

2. **Compartir el archivo .zip por:**
   - Google Drive / OneDrive / Dropbox
   - WeTransfer (https://wetransfer.com) - hasta 2GB gratis
   - Pen drive USB

#### 2️⃣ **Instrucciones para tu socio:**

Cuando reciba el archivo, debe:

1. **Descomprimir** el archivo .zip en el escritorio
2. **Instalar Node.js** (si no lo tiene):
   - Descargar desde: https://nodejs.org/
   - Versión recomendada: LTS (actual)
   - Durante instalación, marcar: "Add to PATH"

3. **Abrir PowerShell** en la carpeta del proyecto:
   - Clic derecho en la carpeta `YAvoy_DEFINITIVO`
   - Seleccionar "Abrir en Terminal" o "PowerShell"

4. **Instalar dependencias** (solo la primera vez):
   ```powershell
   npm install
   ```

5. **Iniciar el servidor:**
   ```powershell
   node server.js
   ```

6. **Abrir en navegador:**
   - http://localhost:5501
   - http://localhost:5501/panel-repartidor.html
   - http://localhost:5501/panel-comercio.html

---

### Opción 2: 🚀 Usar script de inicio automático

Tu socio solo necesita hacer **DOBLE CLIC** en:

```
INICIAR_YAVOY_FINAL.bat
```

Este archivo:
- ✅ Verifica Node.js
- ✅ Instala dependencias automáticamente
- ✅ Inicia el servidor
- ✅ Abre el navegador

---

### Opción 3: 📤 GitHub (Para desarrolladores)

Si tu socio sabe usar Git:

1. **Crear repositorio en GitHub:**
   - Ir a: https://github.com/new
   - Nombre: `yavoy-sistema`
   - Privado (no público)

2. **Subir el proyecto:**
   ```powershell
   cd C:\Users\cdaim\OneDrive\Desktop\YAvoy_DEFINITIVO
   git init
   git add .
   git commit -m "Sistema YAvoy completo"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/yavoy-sistema.git
   git push -u origin main
   ```

3. **Tu socio descarga:**
   ```powershell
   git clone https://github.com/TU_USUARIO/yavoy-sistema.git
   cd yavoy-sistema
   npm install
   node server.js
   ```

---

## ⚠️ IMPORTANTE: Configuración de Email

El sistema de emails requiere configuración adicional:

### Para que funcionen los emails de verificación:

1. **Generar Contraseña de Aplicación de Gmail:**
   - Ve a: https://myaccount.google.com/apppasswords
   - Inicia sesión con: yavoyen5@gmail.com
   - Crea contraseña para "YaVoy Server"
   - Copia la contraseña de 16 caracteres

2. **Actualizar archivo `.env`:**
   - Abrir archivo `.env` en la carpeta del proyecto
   - Buscar la línea: `EMAIL_PASSWORD=temp1234567890ab`
   - Reemplazar con: `EMAIL_PASSWORD=tu_contraseña_de_16_caracteres`

3. **Reiniciar servidor:**
   - Detener el servidor (Ctrl+C)
   - Iniciarlo de nuevo: `node server.js`

### 📧 Credenciales del sistema:
- **Email oficial:** yavoyen5@gmail.com
- **Contraseña Gmail:** Braiancesar25!
- **Contraseña de App:** (Pendiente de generar en Google)

---

## 🧪 Probar el Sistema

### 1. Panel de Repartidor:
```
http://localhost:5501/panel-repartidor.html
```
- ID de prueba: `REP-01`

### 2. Panel de Comercio:
```
http://localhost:5501/panel-comercio.html
```

### 3. Test de Registro con Email:
```
http://localhost:5501/test-registro-repartidor.html
```
- Completa el formulario
- Verifica que llegue el email con código
- Ingresa el código para confirmar

---

## 📊 Estructura del Proyecto

```
YAvoy_DEFINITIVO/
├── server.js              # Servidor principal (puerto 5501)
├── index.html             # Página principal
├── panel-repartidor.html  # Panel para repartidores
├── panel-comercio.html    # Panel para comercios
├── .env                   # Configuración (EMAIL, VAPID, etc)
├── package.json           # Dependencias Node.js
├── js/                    # Scripts JavaScript
│   ├── db.js             # Base de datos
│   ├── ui.js             # Interfaz de usuario
│   ├── forms.js          # Formularios
│   └── notifications.js  # Notificaciones
├── styles/               # Hojas de estilo
├── registros/            # Datos guardados (JSON)
│   ├── comercios/
│   ├── repartidores/
│   └── pedidos/
└── docs/                 # Documentación
```

---

## 🔧 Solución de Problemas

### "Node.js no encontrado"
```powershell
# Verificar instalación
node --version
npm --version

# Si no funciona, reiniciar PowerShell o instalar desde:
# https://nodejs.org/
```

### "Puerto 5501 en uso"
```powershell
# Detener proceso en puerto 5501
Get-Process node | Stop-Process -Force
```

### "Error al instalar dependencias"
```powershell
# Limpiar caché y reinstalar
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### "Emails no se envían"
- Verifica que el archivo `.env` tenga la contraseña correcta
- Genera la Contraseña de Aplicación en Google
- Reinicia el servidor después de cambiar `.env`

---

## 📱 Acceso desde Celular

Para probar desde un celular en la misma red WiFi:

1. **Obtener IP de tu PC:**
   ```powershell
   ipconfig
   ```
   Busca "IPv4 Address" (ej: 192.168.1.10)

2. **En el celular, abrir:**
   ```
   http://192.168.1.10:5501
   ```

---

## 💡 Recomendaciones

1. **Para desarrollo:** Usar `node server.js` directamente
2. **Para producción:** Seguir guía en `docs/DEPLOY_HOSTINGER.md`
3. **Backup:** Guardar copia de la carpeta `registros/` regularmente
4. **Seguridad:** NUNCA subir el archivo `.env` a repositorios públicos

---

## 📞 Soporte

Si tu socio tiene problemas:

1. Verificar que Node.js esté instalado correctamente
2. Revisar que el puerto 5501 no esté ocupado
3. Comprobar que todas las dependencias se instalaron (`node_modules/` existe)
4. Ver logs del servidor en la terminal para identificar errores

---

## ✅ Checklist de Instalación

- [ ] Node.js instalado (versión 16 o superior)
- [ ] Carpeta descomprimida en ubicación fija (no temporal)
- [ ] Ejecutado `npm install` sin errores
- [ ] Servidor inicia con `node server.js`
- [ ] Se puede acceder a http://localhost:5501
- [ ] Archivo `.env` configurado con email correcto
- [ ] Contraseña de aplicación de Gmail generada (para emails)

---

**Fecha de actualización:** 12 de diciembre de 2025
**Versión del sistema:** YAvoy 2.0 (con sistema de emails)
