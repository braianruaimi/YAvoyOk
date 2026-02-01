# 📋 PLAN DE SINCRONIZACIÓN: EMAIL HOSTINGER + YAVOY PLATAFORMA

**Fecha**: 1 de febrero de 2026  
**Versión**: YAvoy v3.1 Enterprise  
**Objetivo**: Sincronizar email profesional con la plataforma

---

## 🚀 FLUJO DE SINCRONIZACIÓN (7 PASOS)

### PASO 1️⃣: VERIFICAR EMAIL EN HOSTINGER
**Duración**: 2-3 minutos

```bash
1. Ir a: https://hpanel.hostinger.com/
2. Login con credenciales Hostinger
3. Seleccionar dominio: yavoy.space
4. Ir a: Email > Gestionar
5. Buscar: yavoyen5@yavoy.space
6. Estado: ¿ACTIVO? ✅
7. Copiar contraseña exacta
```

**Salida esperada:**
```
✅ Email: yavoyen5@yavoy.space
✅ Estado: ACTIVO
✅ Contraseña: [guardada]
```

---

### PASO 2️⃣: ACTUALIZAR CREDENCIALES EN .env
**Duración**: 1 minuto

```bash
# Abrir archivo .env
nano .env
```

**Buscar estas líneas:**
```env
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=yavoyen5@yavoy.space
SMTP_PASS=BraianCesar26!  ← CAMBIAR SI ES DIFERENTE
SMTP_SECURE=true
SMTP_TLS=false
```

**Guardar:**
```
Ctrl + O
Enter
Ctrl + X
```

---

### PASO 3️⃣: EJECUTAR VALIDACIÓN DE SINCRONIZACIÓN
**Duración**: 1 minuto

```bash
node sincronizar-email.js
```

**Debe mostrar:**
```
✅ SISTEMA LISTO PARA SINCRONIZACIÓN

Configuración: ✅ .env
SMTP Host: ✅ Hostinger
SMTP Puerto: ✅ 465
SMTP Usuario: ✅ yavoyen5@yavoy.space
SMTP Contraseña: ✅ Configurada
```

---

### PASO 4️⃣: PROBAR CONEXIÓN SMTP
**Duración**: 2-5 minutos

```bash
node test-email-connection.js
```

**Debe mostrar:**
```
✅ CONEXIÓN EXITOSA A HOSTINGER SMTP

📊 INFORMACIÓN DE CONEXIÓN:
   ✓ Host SMTP: smtp.hostinger.com
   ✓ Puerto: 465
   ✓ Usuario: yavoyen5@yavoy.space
   ✓ Encriptación: SSL/TLS
```

**Si falla:**
- Ver: `DIAGNOSTICO_ERROR_SMTP.md`
- Verificar contraseña en Hostinger
- Esperar 5-10 minutos si cambió contraseña

---

### PASO 5️⃣: PROBAR ENVÍO DE EMAIL
**Duración**: 2-5 minutos

```bash
node test-email-envio.js tu@email.com
```

**Cambiar `tu@email.com` a tu email real**

**Debe mostrar:**
```
✅ EMAIL ENVIADO EXITOSAMENTE

📊 DETALLES DE ENVÍO:
   ID del mensaje: <mensaje@yavoy.space>
   Destinatario: tu@email.com
   Tiempo de envío: XXXms

💡 PRÓXIMOS PASOS:
   1. Revisa tu bandeja de entrada
   2. Si no lo ves, busca en SPAM
```

**Verificar:**
- Revisa tu email (bandeja de entrada o SPAM)
- Debes recibir un email de prueba
- Contiene código de verificación

---

### PASO 6️⃣: INICIAR SERVIDOR
**Duración**: 30 segundos

```bash
npm start
```

**Debe mostrar:**
```
✅ Servidor iniciado en puerto 5502
✅ Sistema de email configurado y funcionando (Hostinger SMTP)
✅ Todas las rutas registradas
```

**URL**: http://localhost:5502

---

### PASO 7️⃣: PRUEBA DE REGISTRO COMPLETA
**Duración**: 3-5 minutos

**Opción A: Vía script (automático)**
```bash
node demo-completa.js
```

**Opción B: Vía web (manual)**
```
1. Ir a: http://localhost:5502/
2. Registrar como Comercio
   - Email: test@example.com
   - Contraseña: Test1234!
3. Deberías recibir email con código
4. Ir a: http://localhost:5502/verificar-email.html
5. Ingresar código recibido
6. Confirmar que aparece "Verificado" ✅
```

**Resultado esperado:**
```
✅ Comercio registrado (ID: COM1234567890)
✅ Email de confirmación enviado
✅ Código de 6 dígitos en email
✅ Verificación completada
```

---

## 🎯 PARA PRODUCCIÓN EN HOSTINGER

Después de que todo funcione localmente:

### 1. Subir archivo .env

```bash
# Asegúrate que .env NO está en .gitignore
# Si está, agregarlo DESPUÉS de subir

# Subir a Hostinger SFTP:
sftp> put .env
```

### 2. Configurar permisos

```bash
# En Hostinger File Manager:
1. Click derecho en .env
2. Propiedades > Permisos
3. Establecer: 644 o 640
```

### 3. Crear carpetas en Hostinger

```bash
# En Hostinger File Manager, crear:
/registros
/registros/comercios
/registros/repartidores
/registros/clientes
```

### 4. Crear archivos JSON vacíos

```bash
# En cada carpeta, crear archivo:

registros/comercios/comercios.json
[]

registros/repartidores/repartidores.json
[]

registros/clientes/clientes.json
[]
```

### 5. Reiniciar aplicación Node.js

```
Hostinger Panel > Hosting > Gestionar > Reiniciar
Seleccionar: Aplicación Node.js
Click: Reiniciar
Esperar: 2-3 minutos
```

### 6. Probar en producción

```
1. Ir a: https://yavoy.space/
2. Registrar usuario
3. Verificar que llega email
4. Completar verificación
```

---

## 📊 CHECKLIST FINAL

Antes de considerar completado:

### Local (Desarrollo)
- [ ] `sincronizar-email.js` muestra ✅
- [ ] `test-email-connection.js` muestra ✅
- [ ] `test-email-envio.js` muestra ✅
- [ ] Recibes email de prueba
- [ ] `npm start` inicia sin errores
- [ ] Puedes registrar usuario
- [ ] Recibes código de verificación
- [ ] Verificación completa ✅

### Producción (Hostinger)
- [ ] .env subido a servidor
- [ ] Permisos correctos en .env
- [ ] Carpetas registros/ creadas
- [ ] Archivos JSON inicializados
- [ ] App Node.js reiniciada
- [ ] Sitio accesible https://yavoy.space
- [ ] Puedes registrar usuario
- [ ] Email de verificación llega
- [ ] Verificación completa ✅

---

## 🆘 PROBLEMAS COMUNES

| Problema | Solución |
|----------|----------|
| Error 535 autenticación | Verificar contraseña en Hostinger, esperar sincronización |
| Email no llega | Revisar SPAM, agregar a contactos, esperar 2-5 min |
| Conexión rechazada | Firewall/antivirus bloquea puerto 465, usar VPN |
| Código inválido | Copiar sin espacios, 6 dígitos exactos |
| Base de datos vacía | Crear archivos JSON en registros/ |

---

## 📞 REFERENCIAS

**Documentación creada:**
- `SINCRONIZACION_EMAIL_GUIA.md` - Guía detallada paso a paso
- `DIAGNOSTICO_ERROR_SMTP.md` - Troubleshooting de SMTP
- `PLAN_SINCRONIZACION.md` - Este documento

**Scripts creados:**
- `sincronizar-email.js` - Validar todo el sistema
- `test-email-connection.js` - Probar conexión SMTP
- `test-email-envio.js` - Probar envío real
- `demo-completa.js` - Demostración completa

**URLs útiles:**
- Hostinger Panel: https://hpanel.hostinger.com/
- Hostinger Support: https://support.hostinger.com/
- Nodemailer Docs: https://nodemailer.com/

---

## ✅ PRÓXIMOS PASOS

**INMEDIATAMENTE:**
1. Verificar email en Hostinger ⬅️ **AQUÍ ESTÁS**
2. Confirmar contraseña correcta
3. Ejecutar `sincronizar-email.js`

**LUEGO:**
4. Ejecutar `test-email-connection.js`
5. Ejecutar `test-email-envio.js`
6. Iniciar servidor con `npm start`
7. Registrar usuario de prueba
8. Subir a Hostinger (producción)

---

**Status**: Listo para sincronización  
**Fecha**: 1 de febrero de 2026  
**Versión**: YAvoy v3.1 Enterprise

⏭️ **SIGUIENTE**: Ir a Hostinger y verificar email yavoyen5@yavoy.space
