# 📧 GUÍA COMPLETA: SINCRONIZACIÓN DE EMAIL CON PLATAFORMA

**Fecha**: 1 de febrero de 2026  
**Versión**: YAvoy v3.1 Enterprise  
**Status**: Sincronización y Validación

---

## 🎯 OBJETIVO

Sincronizar el email profesional de Hostinger (yavoyen5@yavoy.space) con la plataforma YAvoy para que funcione correctamente en ambiente local y producción.

---

## 📋 PASO 1: VERIFICAR CREDENCIALES EN HOSTINGER

### 1.1 Acceder a Hostinger Panel
```
1. Ir a: https://hpanel.hostinger.com/
2. Login con tus credenciales
3. Seleccionar dominio: yavoy.space
4. Ir a: Email > Gestionar
```

### 1.2 Verificar que el email existe
```
Email: yavoyen5@yavoy.space
Estado: DEBE ESTAR ACTIVO ✅
Contraseña: BraianCesar26!
```

### 1.3 Datos SMTP Confirmados
```
Servidor SMTP: smtp.hostinger.com
Puerto: 465 (SSL - Seguro)
Usuario: yavoyen5@yavoy.space
Contraseña: BraianCesar26!
Encriptación: SSL/TLS
```

**IMPORTANTE**: No usar puerto 587, usar SIEMPRE puerto 465 con SSL

---

## 🔧 PASO 2: VERIFICAR CONFIGURACIÓN LOCAL

### 2.1 Revisar archivo .env

```bash
# Abrir archivo .env
cat .env | grep SMTP
```

**Debe mostrar:**
```
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=yavoyen5@yavoy.space
SMTP_PASS=BraianCesar26!
SMTP_SECURE=true
SMTP_TLS=false
```

### 2.2 Si no está correcto, actualizar:
```bash
# Editar el archivo .env
nano .env
```

Y asegurar que tenga:
```env
# 📧 EMAIL - HOSTINGER SMTP (PROFESIONAL)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=yavoyen5@yavoy.space
SMTP_PASS=BraianCesar26!
SMTP_SECURE=true
SMTP_TLS=false
```

Guardar: `Ctrl + O`, `Enter`, `Ctrl + X`

---

## 🧪 PASO 3: PRUEBA DE CONEXIÓN LOCAL

### 3.1 Crear script de prueba de conexión

```bash
# Crear archivo test-email-connection.js
cat > test-email-connection.js << 'EOF'
#!/usr/bin/env node
const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('\n🔌 PRUEBA DE CONEXIÓN SMTP\n');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE === 'true' || true,
  auth: {
    user: process.env.SMTP_USER || 'yavoyen5@yavoy.space',
    pass: process.env.SMTP_PASS || 'BraianCesar26!'
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.log('❌ ERROR DE CONEXIÓN:');
    console.log(error);
    console.log('\n💡 SOLUCIONES:');
    console.log('1. Verificar que el email está activo en Hostinger');
    console.log('2. Confirmar contraseña (sin caracteres especiales mal escapados)');
    console.log('3. Usar puerto 465 con SSL=true, NO 587');
    console.log('4. Revisar firewall/antivirus bloqueando puerto 465');
    process.exit(1);
  } else {
    console.log('✅ CONEXIÓN EXITOSA A SMTP\n');
    console.log('📊 DETALLES:');
    console.log(`   Host: ${process.env.SMTP_HOST}`);
    console.log(`   Puerto: ${process.env.SMTP_PORT}`);
    console.log(`   Usuario: ${process.env.SMTP_USER}`);
    console.log(`   Secure: ${process.env.SMTP_SECURE}`);
    console.log(`\n✨ El servidor SMTP está configurado correctamente`);
    process.exit(0);
  }
});
EOF
```

### 3.2 Ejecutar la prueba

```bash
node test-email-connection.js
```

**Resultado esperado:**
```
✅ CONEXIÓN EXITOSA A SMTP

📊 DETALLES:
   Host: smtp.hostinger.com
   Puerto: 465
   Usuario: yavoyen5@yavoy.space
   Secure: true

✨ El servidor SMTP está configurado correctamente
```

---

## 📬 PASO 4: PRUEBA DE ENVÍO DE EMAIL

### 4.1 Crear script de envío de prueba

```bash
cat > test-email-envio.js << 'EOF'
#!/usr/bin/env node
const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('\n📧 PRUEBA DE ENVÍO DE EMAIL\n');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER || 'yavoyen5@yavoy.space',
    pass: process.env.SMTP_PASS || 'BraianCesar26!'
  }
});

const mailOptions = {
  from: 'YAvoy <yavoyen5@yavoy.space>',
  to: 'tu-email@example.com', // ⚠️ CAMBIAR A TU EMAIL
  subject: '✅ Prueba de Email YAvoy',
  html: `
    <h1>Hola! 👋</h1>
    <p>Este es un email de prueba de la plataforma YAvoy</p>
    <p><strong>Estado:</strong> ✅ Sistema de email funcionando correctamente</p>
    <hr>
    <p>Si recibes este email, significa que:</p>
    <ul>
      <li>✅ Hostinger SMTP está configurado</li>
      <li>✅ Credenciales son correctas</li>
      <li>✅ La plataforma puede enviar emails</li>
    </ul>
  `
};

console.log('📤 Enviando email de prueba...');
console.log(`Para: ${mailOptions.to}\n`);

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.log('❌ ERROR AL ENVIAR:');
    console.log(error);
    process.exit(1);
  } else {
    console.log('✅ EMAIL ENVIADO EXITOSAMENTE\n');
    console.log('📊 INFORMACIÓN:');
    console.log(`   ID: ${info.messageId}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);
    console.log(`\n💡 Revisa tu bandeja de entrada (o spam)`);
    process.exit(0);
  }
});
EOF
```

### 4.2 Editar email destino

```bash
# Cambiar 'tu-email@example.com' a tu email real
nano test-email-envio.js
```

Buscar línea:
```javascript
to: 'tu-email@example.com', // ⚠️ CAMBIAR A TU EMAIL
```

Reemplazar con tu email.

### 4.3 Ejecutar prueba de envío

```bash
node test-email-envio.js
```

**Resultado esperado:**
```
✅ EMAIL ENVIADO EXITOSAMENTE

📊 INFORMACIÓN:
   ID: <mensaje@yavoy.space>
   Timestamp: 2026-02-01T...

💡 Revisa tu bandeja de entrada (o spam)
```

---

## 🚀 PASO 5: INICIAR SERVIDOR CON EMAIL ACTIVO

### 5.1 Terminar procesos anteriores

```bash
# Matar procesos Node activos
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

### 5.2 Iniciar servidor limpio

```bash
cd "c:\Users\cdaim\OneDrive\Desktop\yavoyok\YAvoyOk"
npm start
```

**Debe mostrar:**
```
✅ Sistema de email configurado y funcionando (Hostinger SMTP)
💡 SMTP: smtp.hostinger.com:465
```

### 5.3 Registrar un usuario de prueba

```bash
node test-respuesta-registro.js
```

**Debe mostrar:**
```
Status: 201
"emailEnviado": true o false (dependiendo de conexión)
```

---

## 🌐 PASO 6: CONFIGURACIÓN EN HOSTINGER (PRODUCCIÓN)

### 6.1 Acceder al Panel de Hostinger

```
1. https://hpanel.hostinger.com/
2. Ir a: Hosting > Gestionar
3. Seleccionar YAvoy
4. Ir a: Configuración avanzada > Variables de entorno
```

### 6.2 Crear archivo .env en Hostinger

Crear archivo `.env` en la raíz del proyecto con:

```env
# 📧 EMAIL - HOSTINGER SMTP
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=yavoyen5@yavoy.space
SMTP_PASS=BraianCesar26!
SMTP_SECURE=true
SMTP_TLS=false

# 🔐 JWT
JWT_SECRET=yavoy_secret_key_2026_enterprise
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=yavoy_refresh_secret_2026
REFRESH_TOKEN_EXPIRES_IN=7d

# 🌐 SERVIDOR
NODE_ENV=production
PORT=5502
HOST=0.0.0.0

# 🌍 CORS
ALLOWED_ORIGINS=https://yavoy.com.ar,https://www.yavoy.com.ar

# 📊 BASE DE DATOS (Si usas PostgreSQL)
DB_HOST=localhost
DB_USER=yavoy_user
DB_PASS=Yavoy2026!
DB_NAME=yavoy_db
DB_PORT=5432
```

### 6.3 Validar permisos en Hostinger

```
1. Ir a: Archivo > Permisos
2. Asegurar que el archivo .env tiene permisos:
   - Propietario: Lectura/Escritura
   - Grupo: Lectura
   - Otros: Sin acceso
3. Permisos: 644 o 640
```

### 6.4 Reiniciar aplicación en Hostinger

```
1. Ir a: Hosting > Gestionar > Reiniciar
2. Seleccionar aplicación Node.js
3. Hacer clic en "Reiniciar"
4. Esperar 2-3 minutos
```

---

## ✅ PASO 7: VALIDACIÓN FINAL

### 7.1 Pruebas Locales (Antes de subir)

```bash
# 1. Verificar conexión
node test-email-connection.js

# 2. Enviar email de prueba
node test-email-envio.js

# 3. Ejecutar demostración
node demo-completa.js

# 4. Verificar sistema
node verificar-sistema.js
```

### 7.2 Pruebas en Producción (Después de subir)

```
1. Acceder a: https://yavoy.com.ar
2. Ir a: /verificar-email.html
3. Registrar un comercio/repartidor
4. Verificar que recibas email real
5. Completar verificación con código
```

### 7.3 Revisar Logs en Hostinger

```
1. Hosting > Gestionar > Logs
2. Revisar: error.log, access.log
3. Buscar errores de SMTP
```

---

## 🔍 TROUBLESHOOTING

### Problema: "Email no disponible"

**Solución 1:** Verificar credenciales
```bash
node test-email-connection.js
```

**Solución 2:** Verificar puerto
```
❌ NO USAR: 587
✅ USAR: 465 con SMTP_SECURE=true
```

**Solución 3:** Verificar firewall
```
- Desactivar antivirus temporalmente
- Verificar puerto 465 no bloqueado
- Contactar ISP si sigue bloqueado
```

### Problema: "Email enviado pero no llega"

**Solución:**
1. Revisar carpeta SPAM
2. Agregar remitente a contactos
3. Verificar lista negra en Hostinger
4. Revisar logs SMTP en Hostinger panel

### Problema: "Error de autenticación"

**Solución:**
1. Verificar contraseña exacta (sin espacios)
2. Revisar si email está activo en Hostinger
3. No mezclar caracteres especiales sin escape

---

## 📞 CONTACTO HOSTINGER SUPPORT

Si tienes problemas:

```
1. Email: support@hostinger.es
2. Chat: https://support.hostinger.com/
3. Teléfono: +34 911 059 309
4. Ticket: Panel > Soporte > Crear ticket
```

**Proporcionar:**
- Email: yavoyen5@yavoy.space
- Dominio: yavoy.space
- Error exacto
- Captura de pantalla

---

## 📊 CHECKLIST DE SINCRONIZACIÓN

Antes de considerarlo completo:

- [ ] Email verificado en Hostinger panel
- [ ] Credenciales en .env local
- [ ] `node test-email-connection.js` ✅
- [ ] `node test-email-envio.js` ✅
- [ ] `npm start` muestra "Email configurado"
- [ ] Registro de usuario genera email
- [ ] Código de verificación válido
- [ ] .env subido a Hostinger
- [ ] Aplicación reiniciada en Hostinger
- [ ] Prueba de registro en producción ✅
- [ ] Email recibido en producción ✅

---

## 🎯 PRÓXIMOS PASOS

Una vez sincronizado y funcionando:

1. **Migrar a PostgreSQL** (de JSON a BD)
2. **Configurar dominio SSL** (https://yavoy.space)
3. **Habilitar backups automáticos**
4. **Configurar monitoreo de errores**
5. **Implementar recuperación de contraseña**
6. **Agregar SMS como backup**

---

**Estado**: Listo para sincronización  
**Fecha**: 1 de febrero de 2026  
**Versión**: YAvoy v3.1 Enterprise
