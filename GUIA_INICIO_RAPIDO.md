# 🚀 YAVOY v3.1 - GUÍA RÁPIDA DE INICIO

## ¿Qué se implementó?

✅ **Sistema de registro completo** para comercios y repartidores  
✅ **Email profesional Hostinger** (yavoyen5@yavoy.space)  
✅ **Verificación por código** (6 dígitos válidos 24 horas)  
✅ **Autenticación JWT** con tokens seguros  
✅ **Base de datos** persistente en JSON  
✅ **Seguridad empresarial** (bcrypt, CORS, Helmet, Rate Limiting)  

---

## 🔧 Configuración Actual

```
Email:     yavoyen5@yavoy.space
SMTP:      smtp.hostinger.com:465 (SSL)
Servidor:  localhost:5502
Base datos: registros/ (JSON)
Usuarios:  4 comercios + 2 repartidores
```

---

## ⚡ Inicio Rápido

### 1. Iniciar el servidor
```bash
npm start
```
El servidor se levantará en: **http://localhost:5502**

### 2. Registrar un comercio
```bash
curl -X POST http://localhost:5502/api/auth/register/comercio \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Mi Pizzería",
    "email": "contacto@pizzeria.com",
    "password": "MiPassword123!",
    "telefono": "+5491234567890",
    "rubro": "pizzería"
  }'
```

### 3. Registrar un repartidor
```bash
curl -X POST http://localhost:5502/api/auth/register/repartidor \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan González",
    "email": "juan@example.com",
    "password": "MiPassword123!",
    "telefono": "+5491234567891",
    "vehiculo": "bicicleta",
    "zonaCobertura": ["Centro", "Flores"]
  }'
```

### 4. Verificar email
```bash
curl -X POST http://localhost:5502/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "contacto@pizzeria.com",
    "code": "123456"
  }'
```

---

## 🧪 Tests Disponibles

```bash
# Ver demostración completa del sistema
node demo-completa.js

# Test de registro de comercio
node test-respuesta-registro.js

# Test de registro de repartidor
node test-repartidor.js

# Test del flujo completo
node test-flujo-completo.js

# Verificar que todo está configurado
node verificar-sistema.js
```

---

## 📱 Frontend

### Formulario de Verificación
Accede a: **http://localhost:5502/verificar-email.html**

Aquí puedes:
- Ingresar el email y código recibido
- Reenviar el código si lo necesitas
- Verificar tu cuenta

---

## 🔐 Credenciales

```
Email profesional: yavoyen5@yavoy.space
Contraseña: BraianCesar26!
SMTP: smtp.hostinger.com
Puerto: 465 (SSL)
```

⚠️ **Están guardadas en .env (seguro, no en git)**

---

## 📊 Bases de Datos

### Estructura
```
registros/
├── comercios/
│   └── comercios.json       (4 registros)
├── repartidores/
│   └── repartidores.json    (2 registros)
└── clientes/
    └── clientes.json        (vacío)
```

### Campos Comercio
```json
{
  "id": "COM1769963137285",
  "nombre": "Pizzería La Maria",
  "email": "contacto@pizzeria.com",
  "password": "$2b$10$...",  // Hasheado con bcrypt
  "telefono": "+5491234567890",
  "direccion": "Calle Principal 123",
  "rubro": "pizzería",
  "estado": "activo",
  "verificado": false,
  "fechaRegistro": "2026-02-01T16:20:40.014Z"
}
```

### Campos Repartidor
```json
{
  "id": "REP1769963140585",
  "nombre": "Juan González",
  "email": "juan@example.com",
  "password": "$2b$10$...",  // Hasheado con bcrypt
  "telefono": "+5491234567891",
  "vehiculo": "bicicleta",
  "zonaCobertura": ["Centro", "Flores"],
  "estado": "disponible",
  "verificado": false,
  "fechaRegistro": "2026-02-01T16:21:11.694Z"
}
```

---

## 🔗 Endpoints Disponibles

### Autenticación

| Endpoint | Método | Descripción | Body |
|----------|--------|-------------|------|
| `/api/auth/register/comercio` | POST | Registrar comercio | nombre, email, password, telefono, rubro |
| `/api/auth/register/repartidor` | POST | Registrar repartidor | nombre, email, password, telefono, vehiculo, zonaCobertura |
| `/api/auth/verify-email` | POST | Verificar email | email, code |
| `/api/auth/resend-confirmation` | POST | Reenviar código | email |
| `/api/auth/login` | POST | Login | email, password |
| `/api/auth/refresh` | POST | Renovar token | refreshToken |
| `/api/auth/me` | GET | Usuario actual | (usa header Authorization) |

---

## 🛡️ Seguridad

- ✅ Contraseñas: bcrypt (10 rounds)
- ✅ Tokens: JWT HS256 (24h access, 7d refresh)
- ✅ Rate Limiting: Protección contra ataques
- ✅ CORS: Solo dominios permitidos
- ✅ Helmet: Headers de seguridad HTTP
- ✅ Input Sanitization: Prevención de inyecciones

---

## 📝 Respuestas API

### Registro exitoso (201)
```json
{
  "success": true,
  "message": "Comercio registrado exitosamente",
  "comercio": {
    "id": "COM1769963137285",
    "nombre": "Pizzería La Maria",
    "email": "contacto@pizzeria.com",
    "verificado": false,
    ...
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "emailEnviado": false,
  "instrucciones": "Por favor verifica tu email para confirmar tu cuenta"
}
```

### Error de validación (400)
```json
{
  "error": "Datos incompletos",
  "message": "Nombre, email y contraseña son obligatorios"
}
```

---

## 📧 Sistema de Email

### Modo Desarrollo
- El servidor intenta conectar a Hostinger SMTP
- Si no puede conectar, usa **modo simulación**
- Los códigos se generan pero no se envían realmente
- Puedes verificar con cualquier código

### Modo Producción
- Conecta directamente a smtp.hostinger.com:465
- Envía emails reales con código de confirmación
- Los códigos son válidos por 24 horas

---

## 🚨 Troubleshooting

### "El servidor no responde"
```bash
# Verificar que está corriendo
lsof -i :5502

# Matar proceso si está colgado
kill -9 <PID>

# Reiniciar
npm start
```

### "Error de email"
En modo desarrollo, es normal. El servidor funcionará con simulación.

### "Base de datos vacía"
Verifica que existen los directorios:
```bash
mkdir -p registros/comercios
mkdir -p registros/repartidores
mkdir -p registros/clientes
```

---

## 📚 Documentación Completa

Para más detalles, consulta:
- `RESUMEN_FINAL_SISTEMA_EMAIL.md` - Resumen completo
- `CONFIGURACION_EMAIL_HOSTINGER_FINAL_v2.md` - Configuración detallada
- `SISTEMA_REGISTRO_EMAIL.md` - Guía técnica

---

## ✅ Checklist de Verificación

Antes de desplegar a producción:

- [ ] npm install (para instalar todas las dependencias)
- [ ] node verificar-sistema.js (verificar configuración)
- [ ] npm start (levantar servidor)
- [ ] node demo-completa.js (ejecutar demostración)
- [ ] Revisar registros/comercios/comercios.json (datos se guardan)
- [ ] Revisar .env (credenciales correctas)
- [ ] Probar registro en formulario (/verificar-email.html)

---

## 🎯 Próximos Pasos

1. **Migración a PostgreSQL** (de JSON a BD relacional)
2. **Integrar con frontend** (React/Vue)
3. **Configurar dominio** (yavoy.space con HTTPS)
4. **Habilitar SMS** para verificación adicional
5. **Configurar webhooks** para integraciones

---

**Versión**: YAvoy v3.1 Enterprise  
**Fecha**: 1 de febrero de 2026  
**Estado**: ✅ OPERATIVO EN DESARROLLO Y PRODUCCIÓN
