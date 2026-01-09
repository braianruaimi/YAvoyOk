# 📧 CONFIGURACIÓN DE EMAIL GMAIL PARA YAVOY

## 🎯 OBJETIVO
Configurar el email yavoyen5@gmail.com para que:
1. Envíe códigos de verificación a repartidores/comercios
2. Reciba notificaciones de nuevos registros

---

## 🔐 PASO 1: ACTIVAR VERIFICACIÓN EN 2 PASOS

1. Ve a: https://myaccount.google.com/security
2. Inicia sesión con: **yavoyen5@gmail.com**
3. Contraseña: **Braiancesar25!**
4. Busca la sección **"Verificación en 2 pasos"**
5. Haz clic en **"Empezar"** o **"Activar"**
6. Sigue el asistente (te pedirá tu número de teléfono)
7. Confirma la activación

---

## 🔑 PASO 2: GENERAR CONTRASEÑA DE APLICACIÓN

1. Ve a: https://myaccount.google.com/apppasswords
2. Inicia sesión si es necesario
3. En **"Seleccionar app"**, elige: **Correo**
4. En **"Seleccionar dispositivo"**, elige: **Otro (nombre personalizado)**
5. Escribe el nombre: **YaVoy Server**
6. Haz clic en **"Generar"**
7. Aparecerá una contraseña de 16 caracteres (ejemplo: `abcd efgh ijkl mnop`)
8. **¡COPIA ESTA CONTRASEÑA!** (sin espacios)

---

## ⚙️ PASO 3: CONFIGURAR EN YAVOY

### Opción A: Editar archivo .env

1. Abre el archivo: `C:\Users\cdaim\OneDrive\Desktop\YAvoy_DEFINITIVO\.env`
2. Busca la línea que dice:
   ```
   EMAIL_PASSWORD=Braiancesar25!
   ```
3. Reemplázala con:
   ```
   EMAIL_PASSWORD=abcdefghijklmnop
   ```
   (donde `abcdefghijklmnop` es tu contraseña de aplicación SIN ESPACIOS)

### Opción B: Usar PowerShell (Rápido)

Ejecuta este comando reemplazando `TU_CONTRASEÑA_AQUI`:

```powershell
(Get-Content .env) -replace 'EMAIL_PASSWORD=.*', 'EMAIL_PASSWORD=TU_CONTRASEÑA_AQUI' | Set-Content .env
```

---

## 🚀 PASO 4: REINICIAR SERVIDOR

```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
node server.js
```

---

## ✅ VERIFICACIÓN

Si todo está correcto, verás:
```
✅ Servidor de email listo para enviar mensajes
```

Si hay error, verás:
```
⚠️ Error configurando email: Invalid login
📧 Emails se mostrarán solo en consola (modo desarrollo)
```

---

## 🧪 PROBAR EL SISTEMA

1. Ve a: http://localhost:5501/test-registro-repartidor.html
2. Cambia el email de prueba por uno real tuyo
3. Haz clic en "Registrarse y Enviar Email"
4. **Revisa tu bandeja de entrada** (y spam)
5. Copia el código de 6 dígitos
6. Pégalo en el formulario
7. ¡Listo! ✅

---

## 📨 QUÉ EMAILS SE ENVÍAN

### 1. Al Repartidor/Comercio (SU EMAIL)
- **Asunto:** 🔐 Código de Verificación - YAvoy
- **Contenido:** 
  - Código de 6 dígitos
  - Válido por 10 minutos
  - Advertencias de seguridad

### 2. A yavoyen5@gmail.com (TU EMAIL)
- **Asunto:** 📋 Nuevo Registro de Repartidor - YAvoy
- **Contenido:**
  - Nombre completo
  - Email registrado
  - Teléfono
  - Vehículo
  - Fecha y hora
  - ID asignado

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### Error: "Invalid login"
- La contraseña de aplicación está mal
- Verifica que NO tenga espacios
- Debe ser de 16 caracteres
- Distingue mayúsculas/minúsculas

### Error: "Username and Password not accepted"
- No activaste la verificación en 2 pasos
- La cuenta está bloqueada temporalmente
- Espera 15 minutos y vuelve a intentar

### No llegan los emails
- Revisa la carpeta de SPAM
- Verifica que el email del destinatario sea correcto
- Comprueba los logs del servidor

---

## 📞 SOPORTE

Si necesitas ayuda adicional:
- Documentación Gmail: https://support.google.com/mail/answer/185833
- Video tutorial: https://www.youtube.com/results?search_query=gmail+app+password

---

## 🎯 RESUMEN RÁPIDO

```
1. Activar verificación en 2 pasos → https://myaccount.google.com/security
2. Generar contraseña de app → https://myaccount.google.com/apppasswords
3. Copiar contraseña (16 caracteres sin espacios)
4. Actualizar .env: EMAIL_PASSWORD=tu_contraseña
5. Reiniciar servidor: node server.js
6. Probar: http://localhost:5501/test-registro-repartidor.html
```

¡Listo! 🚀
