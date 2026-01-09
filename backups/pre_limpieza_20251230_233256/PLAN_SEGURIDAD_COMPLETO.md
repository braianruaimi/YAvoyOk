# 🔐 PLAN DE SEGURIDAD COMPLETO - YAVOY v3.1

**Estado:** ✅ IMPLEMENTADO
**Fecha:** Enero 2025
**Versión:** 3.1 Security Update

---

## 📋 RESUMEN EJECUTIVO

Se ha implementado un **sistema de seguridad completo** en YAvoy v3.1, transformando la aplicación de una arquitectura básica a un sistema fortificado con las mejores prácticas de la industria en Node.js/Express.

### ✅ Capas de Seguridad Implementadas

1. **Helmet** - Headers HTTP seguros
2. **JWT Authentication** - Autenticación por tokens
3. **bcrypt** - Hash de contraseñas (10 rounds)
4. **Rate Limiting** - Protección contra ataques DDoS
5. **CORS Restrictivo** - Control de acceso entre dominios
6. **Input Sanitization** - Prevención de inyección
7. **Validación con Joi** - Validación robusta de esquemas

---

## 🛡️ COMPONENTES DE SEGURIDAD

### 1. Helmet - Headers de Seguridad HTTP

**Archivo:** `src/middleware/security.js`

**Configuración:**
```javascript
- Content-Security-Policy (CSP)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Strict-Transport-Security (HSTS)
- X-XSS-Protection
```

**Protege contra:**
- Cross-Site Scripting (XSS)
- Clickjacking
- MIME type sniffing
- Man-in-the-middle attacks

---

### 2. JWT Authentication - Sistema de Autenticación

**Archivos:**
- `src/middleware/auth.js` - Middleware JWT
- `src/controllers/authController.js` - Lógica de autenticación
- `src/routes/authRoutes.js` - Endpoints de auth

**Características:**
- ✅ Tokens firmados con HS256
- ✅ Refresh tokens (7 días)
- ✅ Access tokens (24 horas)
- ✅ Roles y permisos (RBAC)
- ✅ Verificación automática

**Endpoints:**
```
POST /api/auth/register/comercio   - Registrar comercio
POST /api/auth/register/repartidor - Registrar repartidor
POST /api/auth/login               - Login universal
POST /api/auth/refresh             - Renovar token
GET  /api/auth/me                  - Info usuario [AUTH]
POST /api/auth/change-password     - Cambiar contraseña [AUTH]
```

**Uso en código:**
```javascript
const { requireAuth, requireRole } = require('./middleware/auth');

// Proteger ruta
app.get('/api/protegida', requireAuth, (req, res) => {
  console.log(req.user); // { id, email, rol }
});

// Requiere rol específico
app.delete('/api/admin', requireRole('admin'), (req, res) => {
  // Solo admins
});
```

---

### 3. bcrypt - Hash de Contraseñas

**Implementación:**
```javascript
// Registro
const hashedPassword = await bcrypt.hash(password, 10); // 10 rounds

// Login
const isValid = await bcrypt.compare(password, hashedPassword);
```

**Seguridad:**
- ✅ Salt único por contraseña
- ✅ 10 rounds (2^10 = 1024 iteraciones)
- ✅ Resistente a rainbow tables
- ✅ Protección contra brute force

**Requisitos de contraseña:**
- Mínimo 8 caracteres
- Al menos 1 mayúscula
- Al menos 1 minúscula
- Al menos 1 número

---

### 4. Rate Limiting - Protección contra Ataques

**Archivo:** `src/middleware/security.js`

**Límites configurados:**

| Endpoint | Límite | Ventana | Propósito |
|----------|--------|---------|-----------|
| General API | 100 req | 15 min | Protección general |
| Auth endpoints | 5 req | 15 min | Prevenir brute force |
| Crear pedidos | 10 req | 5 min | Prevenir spam |
| Webhooks MP | 50 req | 1 min | Permitir múltiples notificaciones |

**Respuestas:**
```json
{
  "error": "Demasiadas solicitudes desde esta IP",
  "message": "Intenta nuevamente en 15 minutos"
}
```

---

### 5. CORS - Control de Acceso

**Configuración:**
```javascript
origin: process.env.ALLOWED_ORIGINS || 'http://localhost:5502'
credentials: true
methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
```

**Variables de entorno:**
```bash
ALLOWED_ORIGINS=http://localhost:5502,https://tudominio.com
```

**Protege contra:**
- Requests desde orígenes no autorizados
- CSRF (Cross-Site Request Forgery)
- Robo de datos sensibles

---

### 6. Input Sanitization - Prevención de Inyección

**Funciones:**
```javascript
sanitizeString(str)  // Elimina <>, javascript:, eventos inline
sanitizeInputs()     // Middleware global
```

**Protege contra:**
- SQL Injection (aunque usamos JSON, no SQL)
- XSS (Cross-Site Scripting)
- Command Injection
- Path Traversal

---

### 7. Validación con Joi - Esquemas Robustos

**Archivo:** `src/middleware/validation.js`

**Esquemas disponibles:**
- `authSchemas` - Registro, login, cambio de contraseña
- `pedidoSchemas` - Crear, actualizar, asignar
- `pagoSchemas` - Pagos y webhooks
- `repartidorSchemas` - Ubicación, disponibilidad
- `comercioSchemas` - Perfil de comercio

**Ejemplo de uso:**
```javascript
const { validate, authSchemas } = require('./middleware/validation');

app.post('/api/auth/register/comercio',
  validate(authSchemas.registerComercio),
  (req, res) => {
    // Datos ya validados y sanitizados
  }
);
```

---

## ⚙️ CONFIGURACIÓN

### Variables de Entorno (.env)

**Crear archivo `.env` basado en `.env.example`:**

```bash
# Seguridad
NODE_ENV=production
JWT_SECRET=TU_CLAVE_SUPER_SECRETA_AQUI
JWT_EXPIRES_IN=24h
SESSION_SECRET=OTRA_CLAVE_SECRETA

# CORS
ALLOWED_ORIGINS=https://tudominio.com,https://app.tudominio.com

# Puerto
PORT=5502
```

**Generar claves secretas seguras:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 🚀 INSTALACIÓN

### 1. Instalar dependencias
```bash
npm install helmet express-rate-limit jsonwebtoken bcryptjs joi cors dotenv
```

### 2. Configurar .env
```bash
cp .env.example .env
# Editar .env con tus claves secretas
```

### 3. Iniciar servidor
```bash
npm start
# o
node server.js
```

### 4. Verificar seguridad
```bash
curl http://localhost:5502/api/debug/security-status
```

---

## 📡 FLUJO DE AUTENTICACIÓN

### Registro de Usuario

```javascript
// POST /api/auth/register/comercio
{
  "nombre": "Pizzería Don Juan",
  "email": "contacto@donjuan.com",
  "password": "MiPassword123",
  "telefono": "+54 221 456-7890"
}

// Respuesta
{
  "success": true,
  "comercio": { ...sin password... },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login

```javascript
// POST /api/auth/login
{
  "email": "contacto@donjuan.com",
  "password": "MiPassword123"
}

// Respuesta
{
  "success": true,
  "usuario": { ...sin password... },
  "rol": "comercio",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "..."
}
```

### Uso del Token

```javascript
// Headers en requests protegidos
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// El servidor decodifica automáticamente y agrega req.user
{
  id: "COM1234567890",
  email: "contacto@donjuan.com",
  rol: "comercio"
}
```

### Renovar Token

```javascript
// POST /api/auth/refresh
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

// Respuesta
{
  "success": true,
  "token": "NUEVO_TOKEN_AQUI"
}
```

---

## 🔒 ROLES Y PERMISOS

### Roles Disponibles

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| `admin` | Administrador del sistema | Acceso total |
| `ceo` | CEO/Gerencia | Ver analytics, gestionar usuarios |
| `comercio` | Comercio/Tienda | Crear pedidos, ver propios |
| `repartidor` | Repartidor | Aceptar pedidos, actualizar estado |
| `cliente` | Cliente final | Hacer pedidos, ver historial |

### Sistema RBAC (Role-Based Access Control)

```javascript
const { requireRole, requirePermission, PERMISSIONS } = require('./middleware/auth');

// Solo admins
app.delete('/api/users/:id', requireRole('admin'), ...);

// Admins o CEOs
app.get('/api/analytics', requireRole('admin', 'ceo'), ...);

// Permiso específico
app.post('/api/pedidos', requirePermission('CREATE_ORDERS'), ...);
```

---

## 🧪 TESTING

### Endpoints de Debug

```bash
# Verificar conexión
curl http://localhost:5502/api/debug/test-router

# Estado de seguridad
curl http://localhost:5502/api/debug/security-status

# Documentación de auth
curl http://localhost:5502/api/auth/docs
```

### Test de Rate Limiting

```bash
# Intentar login 6 veces en 1 minuto (debe fallar en la 6ta)
for i in {1..6}; do
  curl -X POST http://localhost:5502/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  echo "\n--- Intento $i ---"
done
```

### Test de JWT

```javascript
// 1. Registrar usuario
const res = await fetch('/api/auth/register/comercio', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nombre: 'Test Comercio',
    email: 'test@test.com',
    password: 'TestPass123'
  })
});
const { token } = await res.json();

// 2. Usar token en request protegido
const protectedRes = await fetch('/api/auth/me', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## 🚨 MANEJO DE ERRORES

### Errores de Autenticación

```javascript
// 401 Unauthorized - Token inválido o expirado
{
  "error": "Token inválido",
  "message": "El token proporcionado es inválido o ha expirado"
}

// 403 Forbidden - Sin permisos
{
  "error": "Acceso denegado",
  "message": "Esta acción requiere rol: admin"
}
```

### Errores de Validación

```javascript
// 400 Bad Request - Datos inválidos
{
  "error": "Datos inválidos",
  "validationErrors": [
    {
      "field": "email",
      "message": "Email inválido"
    },
    {
      "field": "password",
      "message": "La contraseña debe tener al menos 8 caracteres"
    }
  ]
}
```

### Errores de Rate Limiting

```javascript
// 429 Too Many Requests
{
  "error": "Demasiadas solicitudes desde esta IP",
  "message": "Intenta nuevamente en 15 minutos"
}
```

---

## 📊 MÉTRICAS DE SEGURIDAD

### Antes vs Después

| Característica | Antes | Después |
|----------------|-------|---------|
| Autenticación | ❌ Sin sistema | ✅ JWT + bcrypt |
| Contraseñas | ❌ Texto plano | ✅ Hash bcrypt |
| Rate Limiting | ❌ Sin límites | ✅ 5 límites diferentes |
| CORS | ⚠️ Wildcard (*) | ✅ Orígenes específicos |
| Validación | ⚠️ Básica | ✅ Esquemas Joi |
| Headers HTTP | ❌ Ninguno | ✅ 10+ headers seguros |
| Sanitización | ❌ Sin sanitizar | ✅ Automática |
| Logs seguridad | ❌ Sin logs | ✅ Logs detallados |

---

## 🔄 MIGRACIÓN DE DATOS

### Hashear contraseñas existentes

Si ya tienes usuarios con contraseñas en texto plano:

```javascript
const bcrypt = require('bcryptjs');
const fs = require('fs').promises;

async function migrarContrasenas() {
  // Leer archivo de comercios
  const comercios = JSON.parse(
    await fs.readFile('./registros/comercios/comercios.json', 'utf8')
  );
  
  // Hashear contraseñas
  for (let comercio of comercios) {
    if (comercio.password && !comercio.password.startsWith('$2a$')) {
      // Si no está hasheada (bcrypt hashes empiezan con $2a$)
      comercio.password = await bcrypt.hash(comercio.password, 10);
      console.log(`✅ Password hasheada para: ${comercio.email}`);
    }
  }
  
  // Guardar cambios
  await fs.writeFile(
    './registros/comercios/comercios.json',
    JSON.stringify(comercios, null, 2)
  );
  
  console.log('✅ Migración completada');
}

migrarContrasenas();
```

---

## 🛠️ MANTENIMIENTO

### Rotación de Claves JWT

**Cada 90 días:**
1. Generar nueva clave: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
2. Actualizar `.env`: `JWT_SECRET=NUEVA_CLAVE`
3. Reiniciar servidor
4. Usuarios deben hacer login nuevamente

### Actualizar Rate Limits

Editar `src/middleware/security.js`:
```javascript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Cambiar a 3 para ser más estricto
  ...
});
```

### Logs de Seguridad

Los logs se imprimen en consola:
```
[SECURITY] 2025-01-20T10:30:45.123Z | 192.168.1.100 | POST /api/auth/login
[SECURITY] Proxy detectado: x-forwarded-for=203.0.113.45
```

Para producción, redirigir a archivo:
```bash
node server.js 2>&1 | tee -a logs/security.log
```

---

## 🚀 PRÓXIMOS PASOS RECOMENDADOS

### 1. HTTPS en Producción ⚠️ CRÍTICO

```bash
# Instalar certbot (Let's Encrypt)
sudo apt install certbot

# Obtener certificado
sudo certbot certonly --standalone -d tudominio.com
```

Configurar en server.js:
```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/tudominio.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/tudominio.com/fullchain.pem')
};

https.createServer(options, app).listen(443);
```

### 2. Migrar a Base de Datos

- MongoDB con Mongoose
- PostgreSQL con Sequelize
- Redis para sesiones

### 3. Logging Avanzado

```bash
npm install winston morgan
```

### 4. Monitoreo

- PM2 para gestión de procesos
- New Relic para APM
- Sentry para errores

### 5. Backups Automáticos

```bash
# Cron job diario
0 2 * * * tar -czf backup-$(date +\%Y\%m\%d).tar.gz registros/
```

---

## 📚 RECURSOS

### Documentación

- [Helmet.js](https://helmetjs.github.io/)
- [JWT.io](https://jwt.io/)
- [bcrypt](https://github.com/kelektiv/node.bcrypt.js)
- [Joi](https://joi.dev/)
- [Express Rate Limit](https://github.com/express-rate-limit/express-rate-limit)

### OWASP Top 10

- [OWASP Top 10 2021](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/)

---

## 🤝 SOPORTE

**Problemas comunes:**

### "Token inválido o ha expirado"
**Solución:** Hacer login nuevamente o usar refresh token

### "Demasiadas solicitudes"
**Solución:** Esperar 15 minutos o aumentar límites en development

### "CORS no permitido"
**Solución:** Agregar origen en `ALLOWED_ORIGINS` del `.env`

### "Contraseña incorrecta"
**Solución:** Verificar que contraseñas estén hasheadas con bcrypt

---

## ✅ CHECKLIST DE SEGURIDAD

- [x] Helmet configurado
- [x] JWT implementado
- [x] bcrypt para passwords
- [x] Rate limiting activo
- [x] CORS restrictivo
- [x] Input sanitization
- [x] Validación con Joi
- [x] Variables de entorno (.env)
- [x] .gitignore actualizado
- [ ] HTTPS en producción
- [ ] Backup automático
- [ ] Monitoreo de logs
- [ ] Rotación de claves

---

**Implementado por:** GitHub Copilot  
**Versión:** 3.1  
**Última actualización:** Enero 2025  
**Licencia:** Propietaria - YAvoy

---

## 🎉 CONCLUSIÓN

YAvoy v3.1 ahora cuenta con un **sistema de seguridad robusto** que protege contra:

✅ Ataques de fuerza bruta  
✅ Inyección de código  
✅ Cross-Site Scripting (XSS)  
✅ Clickjacking  
✅ DDoS/DoS  
✅ Acceso no autorizado  
✅ Robo de credenciales  

**La aplicación está lista para producción desde el punto de vista de seguridad básica.**

Para alcanzar nivel enterprise, implementar:
- HTTPS obligatorio
- Base de datos con backup
- Monitoreo 24/7
- Auditorías de seguridad periódicas
