# ⚠️ DIAGNÓSTICO: ERROR DE AUTENTICACIÓN SMTP

**Timestamp**: 1 de febrero de 2026  
**Error Code**: 535 - Authentication failed

---

## 🔍 PROBLEMA DETECTADO

```
Error: Invalid login: 535 5.7.8 Error: authentication failed
```

Esto significa que **las credenciales de Hostinger no son correctas**.

---

## ✅ CHECKLIST DE VERIFICACIÓN EN HOSTINGER

### Paso 1: Acceder a Hostinger Panel

```
1. Ir a: https://hpanel.hostinger.com/
2. Ingresa tu usuario y contraseña de Hostinger
3. Selecciona el dominio: yavoy.space
```

### Paso 2: Ir a Email > Gestionar

```
1. Panel izquierdo > Hosting > Gestionar
2. Selecciona: yavoy.space
3. Ir a: Email > Gestionar
4. O directamente: https://hpanel.hostinger.com/email
```

### Paso 3: Verificar Email yavoyen5@yavoy.space

```
Búsca en la lista el email: yavoyen5@yavoy.space

Debe mostrar:
├─ Email: yavoyen5@yavoy.space
├─ Estado: ACTIVO ✅
├─ Opción: Ver información
└─ Opción: Cambiar contraseña
```

### Paso 4: Revisar / Cambiar Contraseña

**Opción A - Ver contraseña actual:**
```
1. Click en: yavoyen5@yavoy.space
2. Click en: "Ver información" o "Detalles"
3. Nota la contraseña exacta (con mayúsculas, caracteres especiales)
```

**Opción B - Cambiar contraseña:**
```
1. Click en: yavoyen5@yavoy.space
2. Click en: "Cambiar contraseña"
3. Ingresa nueva contraseña (ej: YaVoy2026!Secure)
4. Guarda la contraseña
5. ESPERA 5-10 minutos a que se sincronice
```

### Paso 5: Verificar Configuración IMAP/SMTP

```
1. En el email > Click "Ver detalles"
2. Busca: "Configuración de servidor"
3. Debe mostrar:

   📨 IMAP/POP3:
   ├─ Server: mail.yavoy.space
   ├─ Puerto IMAP: 993 (SSL)
   └─ Puerto POP3: 110

   📬 SMTP:
   ├─ Server: smtp.hostinger.com
   ├─ Puerto: 465 (SSL)
   └─ Usuario: yavoyen5@yavoy.space
```

---

## 🔧 ACTUALIZAR CREDENCIALES EN .env

Una vez verifiques/cambies la contraseña en Hostinger:

### 1. Editar archivo .env

```bash
nano .env
```

### 2. Encontrar línea SMTP_PASS

```env
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=yavoyen5@yavoy.space
SMTP_PASS=BraianCesar26!  ← ⚠️ CAMBIAR AQUÍ SI ES DIFERENTE
SMTP_SECURE=true
SMTP_TLS=false
```

### 3. Si cambió la contraseña

```env
# EJEMPLO: Si cambias a YaVoy2026!Secure
SMTP_PASS=YaVoy2026!Secure
```

### 4. Guardar cambios

```
Ctrl + O
Enter
Ctrl + X
```

---

## 🧪 ESPERAR Y REINTENTAR

Después de cambiar la contraseña en Hostinger:

```bash
# Esperar 5-10 minutos para sincronización
# Luego ejecutar:

node test-email-connection.js
```

---

## ⚡ PROCEDIMIENTO COMPLETO

Si aún tienes problemas, sigue esto paso a paso:

### 1. Verificar estado del email en Hostinger

```
https://hpanel.hostinger.com/email
→ Buscar: yavoyen5@yavoy.space
→ Estado: ¿ACTIVO?
```

### 2. Copiar la contraseña exacta

```
Copia sin espacios al inicio/final
No copiar accidentalmente caracteres especiales
```

### 3. Reemplazar en .env

```bash
# Abrir .env
nano .env

# Buscar SMTP_PASS
# Reemplazar con la contraseña exacta
```

### 4. Guardar y reintentar

```bash
# Guardar cambios
# Ctrl + O, Enter, Ctrl + X

# Esperar 2 minutos
# Luego ejecutar:
node test-email-connection.js
```

---

## ❓ PREGUNTAS FRECUENTES

### ¿Qué significa error 535?

Error de autenticación SMTP. Las credenciales (usuario/contraseña) no son correctas o el email no existe.

### ¿Por qué falla si cambié la contraseña?

Hostinger puede tardar 5-10 minutos en sincronizar cambios de contraseña. Espera y reintenta.

### ¿Es diferente el servidor SMTP?

**NO**, siempre es:
```
smtp.hostinger.com puerto 465
```

### ¿Qué si no tengo el email creado?

Crea uno nuevo en Hostinger:
```
1. Email > Gestionar
2. Crear nuevo email
3. Nombre: yavoyen5
4. Dominio: yavoy.space
5. Contraseña: Genera una segura
6. Guarda la contraseña en .env
```

---

## 📞 CONTACTAR HOSTINGER SI PERSISTE

Si después de todo sigue sin funcionar:

```
1. Email: support@hostinger.es
2. Chat: https://support.hostinger.com/
3. Incluir:
   - Email: yavoyen5@yavoy.space
   - Dominio: yavoy.space
   - Problema: "SMTP autenticación falla con puerto 465"
   - Error: "535 authentication failed"
```

---

## ✅ CUANDO FUNCIONE

Una vez que `node test-email-connection.js` muestre:

```
✅ CONEXIÓN EXITOSA A HOSTINGER SMTP
```

Continúa con:

```bash
# 1. Probar envío real
node test-email-envio.js tu@email.com

# 2. Iniciar servidor
npm start

# 3. Registrar usuario
# Visita: http://localhost:5502
# Registra un comercio/repartidor
```

---

**Status**: Aguardando verificación de credenciales en Hostinger  
**Próximo paso**: Confirmar contraseña correcta y guardar en .env
