# 🚀 Guía Rápida de Implementación - Sistema de Email

## ⚡ Inicio Rápido (5 minutos)

### 1️⃣ Verificar instalación de dependencias
```bash
npm ls nodemailer
# Debería mostrar: nodemailer@6.x.x o superior
```

Si no está instalado:
```bash
npm install nodemailer
```

### 2️⃣ Configurar credenciales (Opcional)
Si quieres enviar emails reales a través de Gmail:

**Crear archivo `.env` en la raíz del proyecto:**
```bash
# Email de YAvoy en Hostinger
SMTP_USER=yavoyen5@gmail.com
SMTP_PASS=cpsq fpld azby wdkt
SMTP_SECURE=true
SMTP_TLS=true
```

**O usar credenciales de tu email:**
1. Habilitar autenticación en 2 pasos en Google Account
2. Generar "Contraseña de aplicación" para Gmail
3. Copiar la contraseña en `SMTP_PASS`

### 3️⃣ Iniciar el servidor
```bash
npm start
# o para desarrollo con nodemon:
npm run dev
```

### 4️⃣ Probar registro
Abre en el navegador o usa curl:

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
```

Respuesta esperada:
```json
{
  "success": true,
  "message": "Comercio registrado exitosamente. Se envió un email de confirmación.",
  "comercio": {
    "id": "COM1704067200000",
    "email": "comercio@example.com",
    "verificado": false
  },
  "emailStatus": "enviado"
}
```

### 5️⃣ Verificar email
- **Modo real:** El usuario recibe email → entra en `verificar-email.html` → ingresa código
- **Modo desarrollo:** Revisa consola del servidor para ver el código simulado

```bash
curl -X POST http://localhost:5502/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "COM1704067200000",
    "confirmationCode": "123456"
  }'
```

---

## 📋 Checklist de Implementación

- [ ] `npm install nodemailer` ejecutado
- [ ] Dependencias verificadas con `npm ls nodemailer`
- [ ] Archivo `.env` configurado (opcional, funciona sin él)
- [ ] Servidor inicia sin errores: `npm start`
- [ ] Registro de comercio funciona: `POST /api/auth/register/comercio`
- [ ] Email se envía o simula correctamente
- [ ] Verificación funciona: `POST /api/auth/verify-email`
- [ ] Frontend `verificar-email.html` carga en navegador
- [ ] Usuario queda verificado en BD

---

## 🔧 Troubleshooting

### Error: "nodemailer is not defined"
```bash
npm install nodemailer --save
```

### Error: "SMTP connection failed"
- Verifica que `SMTP_USER` y `SMTP_PASS` sean correctos
- Usa la **contraseña de aplicación** de Google, no la contraseña normal
- Activa autenticación en 2 pasos en Google Account

### En modo desarrollo no veo el código
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

Revisa la **consola del servidor** (donde corriste `npm start`)

### Email no llega en Gmail
1. Revisa carpeta de Spam
2. Verifica que sea la contraseña de aplicación, no la contraseña de cuenta
3. Habilita acceso de "aplicaciones menos seguras" si es necesario

---

## 📁 Archivos Clave

```
src/
├── utils/
│   └── emailService.js          ← Servicio de email
├── controllers/
│   └── authController.js        ← Lógica de registro + verificación
└── routes/
    └── authRoutes.js            ← Endpoints HTTP

verificar-email.html             ← Frontend de verificación
SISTEMA_REGISTRO_EMAIL.md        ← Documentación completa
test-email-registration.js       ← Script de prueba
test-curl-examples.sh            ← Ejemplos CURL
```

---

## 🎯 Flujo de Uso Final

```
Usuario llena formulario de registro
         ↓
POST /api/auth/register/comercio
         ↓
Sistema genera ID único (COM1704067200000)
         ↓
Sistema genera código (123456)
         ↓
Email enviado automáticamente ✉️
         ↓
Usuario recibe email
         ↓
Usuario ingresa código en verificar-email.html
         ↓
POST /api/auth/verify-email
         ↓
Sistema verifica código y marca usuario como "verificado"
         ↓
Email de bienvenida enviado
         ↓
✅ Cuenta lista para usar
```

---

## 📞 Soporte

Para dudas o problemas:
- 📖 Lee [SISTEMA_REGISTRO_EMAIL.md](./SISTEMA_REGISTRO_EMAIL.md)
- 🧪 Ejecuta `node test-email-registration.js`
- 🔍 Revisa logs en consola del servidor

---

**Última actualización:** 1 de febrero de 2026  
**Versión:** v3.1 Enterprise
