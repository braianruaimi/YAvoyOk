# 🚀 INICIO RÁPIDO - YAVOY v3.1 SEGURO

## ✅ Sistema de Seguridad Implementado

**NOTA:** El servidor YAvoy ahora cuenta con **autenticación JWT completa** y **7 capas de seguridad**.

---

## 📋 PASOS PARA INICIAR

### 1. Instalar dependencias de seguridad

```bash
npm install helmet express-rate-limit jsonwebtoken bcryptjs joi cors dotenv
```

### 2. Configurar variables de entorno

El archivo `.env` ya fue creado con claves seguras. **Verifica que exista:**

```bash
# Windows PowerShell
Get-Content .env

# Linux/Mac
cat .env
```

**Importante:** El `.env` contiene claves secretas generadas automáticamente. **NO lo subas a Git**.

### 3. Iniciar el servidor

```bash
node server.js
```

Deberías ver:

```
╔══════════════════════════════════════════════════════════════╗
║       🚀 YAVOY v3.1 - SERVIDOR SEGURO INICIADO              ║
╚══════════════════════════════════════════════════════════════╝

🌐 Servidor: http://localhost:5502
🔐 Modo: development

🛡️  SEGURIDAD ACTIVADA:
   ✅ Helmet - Headers HTTP seguros
   ✅ CORS - Control de acceso restrictivo
   ✅ Rate Limiting - Protección contra ataques DDoS
   ✅ JWT Authentication - Autenticación por tokens
   ✅ bcrypt - Hash seguro de contraseñas (10 rounds)
   ✅ Input Sanitization - Prevención de inyección
```

### 4. Verificar que funciona

Abre tu navegador en: **http://localhost:5502**

O prueba la API:

```bash
# PowerShell
Invoke-WebRequest http://localhost:5502/api/debug/security-status | ConvertFrom-Json

# Linux/Mac
curl http://localhost:5502/api/debug/security-status
```

---

## 🔐 PRUEBA DE AUTENTICACIÓN

### Registrar un comercio

```bash
# PowerShell
$body = @{
    nombre = "Pizzería Don Juan"
    email = "contacto@donjuan.com"
    password = "MiPassword123"
    telefono = "+54 221 456-7890"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:5502/api/auth/register/comercio `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

```bash
# Linux/Mac
curl -X POST http://localhost:5502/api/auth/register/comercio \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Pizzería Don Juan",
    "email": "contacto@donjuan.com",
    "password": "MiPassword123",
    "telefono": "+54 221 456-7890"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "comercio": {
    "id": "COM1737398765432",
    "nombre": "Pizzería Don Juan",
    "email": "contacto@donjuan.com",
    ...
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login

```bash
# PowerShell
$body = @{
    email = "contacto@donjuan.com"
    password = "MiPassword123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri http://localhost:5502/api/auth/login `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

# Guardar token
$token = $response.token
Write-Host "Token obtenido: $token"
```

### Usar token en request protegido

```bash
# PowerShell
Invoke-RestMethod -Uri http://localhost:5502/api/auth/me `
    -Headers @{Authorization = "Bearer $token"}
```

---

## 📊 ENDPOINTS DISPONIBLES

### 🔐 Autenticación (sin autenticación requerida)

```
POST /api/auth/register/comercio   - Registrar comercio
POST /api/auth/register/repartidor - Registrar repartidor
POST /api/auth/login               - Login universal
POST /api/auth/refresh             - Renovar token
GET  /api/auth/docs                - Documentación
```

### 👤 Usuario (requiere autenticación)

```
GET  /api/auth/me                  - Info del usuario
POST /api/auth/change-password     - Cambiar contraseña
```

### 📦 Pedidos

```
POST /api/pedidos                  - Crear pedido
GET  /api/pedidos                  - Listar pedidos
GET  /api/pedidos/:id              - Ver pedido específico
PATCH /api/pedidos/:id/estado      - Actualizar estado
```

### 🧪 Debug

```
GET /api/debug/test-router         - Test de conexión
GET /api/debug/security-status     - Estado de seguridad
```

---

## ⚠️ RATE LIMITS

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| Auth (login/register) | 5 requests | 15 minutos |
| Crear pedidos | 10 requests | 5 minutos |
| API general | 100 requests | 15 minutos |

Si excedes el límite, recibirás:

```json
{
  "error": "Demasiadas solicitudes desde esta IP",
  "message": "Intenta nuevamente en 15 minutos"
}
```

---

## 🔒 SEGURIDAD

### Contraseñas

- **Mínimo 8 caracteres**
- Al menos 1 mayúscula
- Al menos 1 minúscula
- Al menos 1 número

Ejemplo válido: `MiPassword123`

### Tokens JWT

- **Access Token:** Expira en 24 horas
- **Refresh Token:** Expira en 7 días
- Almacenar en localStorage o cookies seguras

### Headers de autenticación

```javascript
fetch('/api/auth/me', {
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  }
})
```

---

## 🛠️ COMANDOS ÚTILES

### Ver logs del servidor

```bash
node server.js 2>&1 | tee logs.txt
```

### Matar proceso en puerto 5502

```bash
# Windows PowerShell
Get-NetTCPConnection -LocalPort 5502 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }

# Linux/Mac
lsof -ti:5502 | xargs kill -9
```

### Generar nueva clave JWT

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 📚 DOCUMENTACIÓN COMPLETA

Lee **[PLAN_SEGURIDAD_COMPLETO.md](./PLAN_SEGURIDAD_COMPLETO.md)** para:

- Arquitectura detallada de seguridad
- Manejo de errores
- Migración de datos
- Producción (HTTPS)
- Troubleshooting

---

## ✅ CHECKLIST PRE-PRODUCCIÓN

- [ ] `.env` configurado con claves únicas
- [ ] MercadoPago credentials en `.env`
- [ ] HTTPS configurado (Let's Encrypt)
- [ ] `NODE_ENV=production` en `.env`
- [ ] Backups automáticos configurados
- [ ] Monitoreo de logs activo
- [ ] Rate limits ajustados para producción

---

## 🚨 PROBLEMAS COMUNES

### "Module not found: helmet"
**Solución:** `npm install helmet express-rate-limit jsonwebtoken bcryptjs joi cors dotenv`

### "Token inválido"
**Solución:** Hacer login nuevamente

### "EADDRINUSE: address already in use"
**Solución:** Matar proceso en puerto 5502 (comando arriba)

### "CORS error"
**Solución:** Agregar origen en `ALLOWED_ORIGINS` del `.env`

---

## 📞 SOPORTE

**Documentación:** `PLAN_SEGURIDAD_COMPLETO.md`  
**API Docs:** http://localhost:5502/api/auth/docs  
**Debug:** http://localhost:5502/api/debug/security-status

---

**¡YAvoy v3.1 está listo para usar de forma segura!** 🎉🔒
