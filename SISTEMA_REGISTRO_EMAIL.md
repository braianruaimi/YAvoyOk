# 📧 Sistema de Registro con Verificación de Email - YAvoy

## 🎯 Descripción General

Se ha implementado un **sistema completo de registro con verificación de email** para YAvoy. Cuando un usuario se registra, recibe automáticamente un correo con:

1. ✅ **Código de confirmación** (6 dígitos numéricos)
2. 🆔 **ID de usuario asignado** (ej: COM1704067200000)
3. 📝 **Instrucciones de verificación**

## 🚀 Características Implementadas

### 1. **Servicio de Email** (`src/utils/emailService.js`)
- ✅ Envío automático de emails de confirmación
- ✅ Generación segura de códigos de 6 dígitos
- ✅ Template HTML profesional y responsivo
- ✅ Fallback para modo desarrollo (simulación de emails)
- ✅ Soporte para Nodemailer con Gmail

### 2. **Endpoints de Registro Actualizados**
- **POST** `/api/auth/register/comercio` - Registra comercio + envía email
- **POST** `/api/auth/register/repartidor` - Registra repartidor + envía email
- Ambos endpoints ahora incluyen campos para:
  - `confirmacionCode` - Código temporal de 6 dígitos
  - `confirmacionExpira` - Expiración en 24 horas
  - `verificado` - Boolean para estado de verificación

### 3. **Nuevos Endpoints de Verificación**

#### **Verificar Email**
```
POST /api/auth/verify-email
Content-Type: application/json

{
  "userId": "COM1704067200000",
  "confirmationCode": "123456"
}

// Respuesta exitosa:
{
  "success": true,
  "message": "Email verificado exitosamente",
  "usuario": {
    "id": "COM1704067200000",
    "nombre": "Pizzería Don Carlos",
    "email": "doncarlos@email.com",
    "verificado": true
  }
}
```

#### **Reenviar Código**
```
POST /api/auth/resend-confirmation
Content-Type: application/json

{
  "userId": "COM1704067200000"
}

// Respuesta:
{
  "success": true,
  "message": "Nuevo código de confirmación enviado"
}
```

## 📋 Flujo Completo de Registro

```
1. Usuario se registra
   └─> POST /api/auth/register/comercio
   └─> Datos guardados en BD
   └─> ID asignado (ej: COM1704067200000)
   └─> Código generado (ej: 123456)
   └─> Email enviado automáticamente

2. Usuario recibe email con:
   ├─ Código: 123456
   ├─ ID: COM1704067200000
   └─ Link a verificar-email.html?userId=COM1704067200000

3. Usuario ingresa código en formulario
   └─> POST /api/auth/verify-email
   └─> Código validado
   └─> Usuario marcado como "verificado"
   └─> Email de bienvenida enviado

4. Cuenta activada ✅
   └─> Usuario puede usar la plataforma
```

## 🔧 Configuración de Email

### Opción 1: Gmail (Recomendado)
```bash
# Variables de entorno (.env)
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-contraseña-aplicacion  # Google App Password, no contraseña normal
SMTP_SECURE=true
SMTP_TLS=true
```

**Generar Google App Password:**
1. Ve a [Google Account Security](https://myaccount.google.com/security)
2. Activa "Verificación en dos pasos"
3. Genera "Contraseña de aplicación" para Mail
4. Usa esa contraseña en `SMTP_PASS`

### Opción 2: Modo Desarrollo (Sin Email Real)
Si no tienes credenciales configuradas, el sistema simula los emails en consola:
```
┌─────────────────────────────────────────┐
│  📧 SIMULACIÓN DE EMAIL (MODO DESARROLLO)
├─────────────────────────────────────────┤
│  Para: usuario@example.com
│  Nombre: Juan Pérez
│  Tipo: comercio
│  ID Usuario: COM1704067200000
│  Código: 456789
└─────────────────────────────────────────┘
```

## 📁 Archivos Creados/Modificados

### Nuevos Archivos
- ✅ `src/utils/emailService.js` - Servicio de envío de emails
- ✅ `verificar-email.html` - Formulario de verificación frontend

### Archivos Modificados
- ✅ `src/controllers/authController.js` - Métodos de registro + verificación
- ✅ `src/routes/authRoutes.js` - Nuevos endpoints

## 🧪 Pruebas

### 1. Test de Registro (cURL)
```bash
curl -X POST http://localhost:5502/api/auth/register/comercio \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Mi Comercio",
    "email": "comercio@example.com",
    "password": "Password123",
    "telefono": "+5491234567890",
    "rubro": "restaurant"
  }'

# Respuesta:
{
  "success": true,
  "message": "Comercio registrado exitosamente. Se envió un email de confirmación.",
  "comercio": {
    "id": "COM1704067200000",
    "nombre": "Mi Comercio",
    "email": "comercio@example.com",
    "verificado": false
  },
  "emailStatus": "enviado",
  "nextStep": "Verifica tu email para confirmar el registro"
}
```

### 2. Test de Verificación (cURL)
```bash
curl -X POST http://localhost:5502/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "COM1704067200000",
    "confirmationCode": "123456"
  }'

# Respuesta exitosa:
{
  "success": true,
  "message": "Email verificado exitosamente",
  "usuario": {
    "id": "COM1704067200000",
    "nombre": "Mi Comercio",
    "email": "comercio@example.com",
    "verificado": true
  }
}
```

### 3. Test de Reenvío (cURL)
```bash
curl -X POST http://localhost:5502/api/auth/resend-confirmation \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "COM1704067200000"
  }'
```

## 🌐 Página de Verificación Frontend

Se incluye `verificar-email.html` con:
- ✅ Interfaz moderna y responsiva
- ✅ Validación de entrada (6 dígitos)
- ✅ Botón "Reenviar código" para códigos expirados
- ✅ Mensajes de éxito/error claros
- ✅ Autocompletar ID si viene en URL params: `verificar-email.html?userId=COM123`

**Acceso:**
```
http://localhost:5502/verificar-email.html
```

## 📧 Plantilla de Email Enviada

El email contiene:
- 🎨 Diseño profesional con branding YAvoy
- 📱 Responsive para móviles
- 🔐 Código de confirmación destacado
- ⏰ Aviso de expiración (24 horas)
- 🔒 Nota de seguridad
- 🔗 Link a plataforma

Ejemplo visual:
```
┌─ YAvoy ─────────────────────────────┐
│                                      │
│  ¡Hola Juan Pérez! 👋               │
│                                      │
│  Tu número de usuario (ID):          │
│  COM1704067200000                    │
│                                      │
│  CÓDIGO DE CONFIRMACIÓN              │
│  123456                              │
│                                      │
│  ⏰ Expira en 24 horas               │
│  🔒 No lo compartas con nadie        │
│                                      │
└──────────────────────────────────────┘
```

## ⚙️ Configuración en Base de Datos

Se agregaron campos a los usuarios registrados:
```json
{
  "id": "COM1704067200000",
  "nombre": "Mi Comercio",
  "email": "comercio@example.com",
  "verificado": false,
  "confirmacionCode": "123456",
  "confirmacionExpira": "2025-02-02T18:50:00Z",
  ...
}
```

## 🔐 Seguridad

- ✅ Códigos de 6 dígitos (1 millón combinaciones)
- ✅ Expiración en 24 horas
- ✅ Hash seguro de contraseñas (bcrypt)
- ✅ Validación de email
- ✅ Rate limiting en registros
- ✅ Sanitización de inputs

## 📞 Soporte

Si tienes preguntas o necesitas ajustes:
- 📧 Email: support@yavoy.com.ar
- 💬 WhatsApp: [Tu número]
- 🐛 Issues: Reporta en GitHub

## 🎓 Próximos Pasos (Opcional)

Pueden implementarse luego:
1. **2FA con TOTP** - Autenticación de dos factores
2. **Recuperación de contraseña** - Reset por email
3. **Confirmación de cambios de email** - Verificación adicional
4. **Códigos de invitación** - Beta testing
5. **Integración de SMS** - Código por SMS como backup

---

**Implementado:** 1 de febrero de 2026  
**Estado:** ✅ Completo y listo para producción  
**Versión:** v3.1 Enterprise
