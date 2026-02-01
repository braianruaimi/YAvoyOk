# 🔐 RECUPERACIÓN DE CONTRASEÑA - DOCUMENTACIÓN

## 📋 Descripción General

YAvoy v3.1 implementa un flujo seguro de recuperación de contraseña que permite a los usuarios resetear su contraseña en caso de olvido.

### Características de Seguridad:
- ✅ Token aleatorio de 40 caracteres (crypto.randomBytes(20).toString('hex'))
- ✅ Expiración de token: 1 hora
- ✅ Hashing bcrypt de contraseña nueva (10 rounds)
- ✅ Email seguro usando Nodemailer (Hostinger SMTP)
- ✅ Validación de contraseña mínima (8 caracteres)
- ✅ Rate limiting en endpoints (máx 5 intentos/15 min)

---

## 🔌 ENDPOINTS

### 1. **Solicitar Reset de Contraseña**

**Endpoint:** `POST /api/auth/forgot-password`

**Descripción:** Solicita la recuperación de contraseña. Genera un token y envía email.

**Body (JSON):**
```json
{
  "email": "usuario@example.com"
}
```

**Respuesta - Éxito (200):**
```json
{
  "success": true,
  "message": "Email de recuperación enviado exitosamente",
  "info": "Revisa tu correo para el enlace de reset (válido por 1 hora)"
}
```

**Respuesta - Error (404):**
```json
{
  "success": false,
  "error": "Usuario no encontrado",
  "message": "No existe una cuenta con este email"
}
```

**Respuesta - Error (500):**
```json
{
  "success": false,
  "error": "Error al enviar email",
  "message": "No se pudo enviar el email de recuperación"
}
```

**Nota:** Si hay error al enviar el email, el token se limpia automáticamente de la BD.

---

### 2. **Resetear Contraseña**

**Endpoint:** `POST /api/auth/reset-password`

**Descripción:** Utiliza el token válido para resetear la contraseña.

**Body (JSON):**
```json
{
  "token": "abc123def456ghi789jkl012mno345pqr678stu9",
  "newPassword": "MiNuevaPassword123"
}
```

**Respuesta - Éxito (200):**
```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente",
  "info": "Ya puedes iniciar sesión con tu nueva contraseña"
}
```

**Respuesta - Error (400) - Datos incompletos:**
```json
{
  "success": false,
  "error": "Datos incompletos",
  "message": "Token y nueva contraseña son obligatorios"
}
```

**Respuesta - Error (400) - Contraseña débil:**
```json
{
  "success": false,
  "error": "Contraseña débil",
  "message": "La contraseña debe tener al menos 8 caracteres"
}
```

**Respuesta - Error (404) - Token inválido:**
```json
{
  "success": false,
  "error": "Token inválido",
  "message": "El token de reset no es válido"
}
```

**Respuesta - Error (410) - Token expirado:**
```json
{
  "success": false,
  "error": "Token expirado",
  "message": "El enlace de reset ha expirado. Solicita uno nuevo"
}
```

---

## 📧 EMAIL ENVIADO AL USUARIO

Cuando se solicita el reset, se envía un email con:

- **Asunto:** `[YAvoy] Recupera tu contraseña`
- **Contenido HTML formateado** con:
  - Botón clickeable para resetear contraseña
  - Link alternativo como texto
  - Advertencia de expiración (1 hora)
  - Instrucciones de seguridad

**Ejemplo de URL en el email:**
```
https://yavoy.com.ar/reset-password/abc123def456ghi789jkl012mno345pqr678stu9
```

---

## 🗄️ BASE DE DATOS

### Campos agregados a tabla `usuarios`:

```sql
ALTER TABLE usuarios ADD COLUMN resetPasswordToken VARCHAR(255);
ALTER TABLE usuarios ADD COLUMN resetPasswordExpires TIMESTAMP;
```

### Valores almacenados:

- `resetPasswordToken`: STRING (40 caracteres hexadecimales)
- `resetPasswordExpires`: TIMESTAMP (1 hora desde creación)
- Se limpian automáticamente después de reset exitoso o expiración

---

## 🔄 FLUJO COMPLETO

### Paso 1: Usuario solicita reset
```
POST /api/auth/forgot-password
Body: { email: "user@example.com" }
```
✓ Sistema busca usuario por email
✓ Genera token aleatorio (crypto)
✓ Guarda token y expiración en BD (1 hora)
✓ Envía email con link de reset
✓ Retorna mensaje de éxito

### Paso 2: Usuario recibe email
- Email contiene link con token
- Ejemplo: `https://yavoy.com.ar/reset-password/{token}`

### Paso 3: Usuario accede al link
- Frontend redirige a formulario de cambio de contraseña
- Usuario ingresa nueva contraseña
- Frontend llama al endpoint de reset con token

### Paso 4: Frontend envía reset
```
POST /api/auth/reset-password
Body: { 
  token: "{token-del-email}",
  newPassword: "NuevaPassword123"
}
```
✓ Sistema valida que token exista
✓ Sistema valida que token no haya expirado
✓ Sistema hashea nueva contraseña (bcrypt)
✓ Sistema limpia campos de token
✓ Sistema guarda cambios en BD

### Paso 5: Usuario puede loguear con nueva contraseña
```
POST /api/auth/login
Body: { 
  email: "user@example.com",
  password: "NuevaPassword123"
}
```

---

## 🛡️ VALIDACIONES DE SEGURIDAD

| Validación | Implementada | Ubicación |
|-----------|------------|-----------|
| Email existe en BD | ✅ | forgotPassword |
| Contraseña mínima 8 chars | ✅ | resetPassword |
| Token válido (existe en BD) | ✅ | resetPassword |
| Token no expirado | ✅ | resetPassword |
| Hashing bcrypt contraseña | ✅ | Model hooks |
| Rate limiting 5/15min | ✅ | Middleware |
| Email SMTP configurado | ✅ | emailService |

---

## 🧪 TESTING

### Test manual con curl:

**1. Solicitar reset:**
```bash
curl -X POST http://localhost:5502/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**2. Resetear contraseña (reemplaza TOKEN):**
```bash
curl -X POST http://localhost:5502/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"tu_token_aqui","newPassword":"NuevaPassword123"}'
```

### Test con archivo test-password-recovery.js:
```bash
node test-password-recovery.js
```

---

## ⚙️ VARIABLES DE ENTORNO REQUERIDAS

Asegúrate de tener estas variables en `.env`:

```env
# Email Configuration
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=yavoyen5@yavoy.space
SMTP_PASS=BrainCesar26!

# Frontend URL (para el link en el email)
FRONTEND_URL=http://localhost:3000
# O en producción:
FRONTEND_URL=https://yavoy.com.ar
```

---

## 📝 CÓDIGO IMPLEMENTADO

### Modelo Usuario.js
```javascript
resetPasswordToken: {
  type: DataTypes.STRING,
  allowNull: true
},
resetPasswordExpires: {
  type: DataTypes.DATE,
  allowNull: true
}
```

### Controllers: authController.js
- ✅ `forgotPassword(req, res)` - Línea ~520
- ✅ `resetPassword(req, res)` - Línea ~580

### Email Service: emailService.js
- ✅ `sendPasswordResetEmail(data)` - Método nuevo

### Routes: authRoutes.js
- ✅ `POST /api/auth/forgot-password`
- ✅ `POST /api/auth/reset-password`

---

## 🎯 PRÓXIMOS PASOS

1. **Frontend:**
   - Crear página `/forgot-password` con formulario de email
   - Crear página `/reset-password/:token` con formulario de contraseña
   - Mostrar mensajes de éxito/error

2. **Documentación:**
   - Agregar a OpenAPI/Swagger
   - Crear página de ayuda en frontend

3. **Mejoras (opcionales):**
   - 2FA como confirmación adicional
   - Historial de cambios de contraseña
   - Notificación de cambio por email

---

## 🔗 REFERENCIAS

- **Modelo Usuario:** [models/Usuario.js](../models/Usuario.js)
- **Controller Auth:** [src/controllers/authController.js](../src/controllers/authController.js)
- **Email Service:** [src/utils/emailService.js](../src/utils/emailService.js)
- **Routes Auth:** [src/routes/authRoutes.js](../src/routes/authRoutes.js)

---

**Última actualización:** 1 de febrero de 2026
**Versión:** YAvoy v3.1
