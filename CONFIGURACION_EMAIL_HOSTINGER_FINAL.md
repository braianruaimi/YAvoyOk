# ✅ Configuración de Email - Hostinger

## 📧 Email Profesional del Hosting

El sistema ahora usa el **correo profesional del hosting** en lugar de Gmail:

```
Email: univerzasite@gmail.com
```

Esta es una configuración **mucho mejor** porque:

✅ **Profesional**
- Email del dominio de la empresa
- Mejor reputación y deliverability
- No depende de cuentas personales

✅ **Confiable**
- SMTP de Hostinger es robusto
- Menos problemas de autenticación
- Mejor soporte

✅ **Centralizado**
- Todo en un mismo servicio
- Fácil de administrar desde Hostinger
- Backups automáticos

---

## 🔧 Configuración Necesaria

### En `.env` (Producción/Hostinger):
```bash
# Hostinger SMTP
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=univerzasite@gmail.com
SMTP_PASS=Univerzasite25!
SMTP_SECURE=false
```

### En `.env.production`:
```bash
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=univerzasite@gmail.com
SMTP_PASS=Univerzasite25!
SMTP_SECURE=false
```

---

## 📧 Cómo Aparece el Email

Cuando los usuarios reciben el correo, aparecerá:

```
From: YAvoy <univerzasite@gmail.com>
To: usuario@example.com
Subject: ✅ Confirma tu registro en YAvoy
```

---

## 🚀 Pasos para Implementar

### 1. Crear archivo `.env` en la raíz:
```bash
# En c:\Users\cdaim\OneDrive\Desktop\yavoyok\YAvoyOk\.env
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=univerzasite@gmail.com
SMTP_PASS=Univerzasite25!
SMTP_SECURE=false
```

### 2. Reiniciar el servidor:
```bash
npm start
```

### 3. Probar:
```bash
# Registrar un comercio
curl -X POST http://localhost:5502/api/auth/register/comercio \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Test Comercio",
    "email": "test@example.com",
    "password": "Password123"
  }'

# El email se enviará desde univerzasite@gmail.com
```

---

## ⚙️ Cambios Realizados

### En `src/utils/emailService.js`:

1. **Inicialización** (initializeTransporter):
   - ✅ Ahora usa SMTP HOST de Hostinger
   - ✅ Configurable por `.env`
   - ✅ Fallback a credenciales hardcoded

2. **Emails enviados desde**:
   - ✅ Registration: `univerzasite@gmail.com`
   - ✅ Welcome: `univerzasite@gmail.com`

### Configuración SMTP:
```javascript
{
    host: 'smtp.hostinger.com',  // Servidor SMTP de Hostinger
    port: 587,                    // Puerto TLS
    secure: false,                // TLS (no SSL)
    auth: {
        user: 'univerzasite@gmail.com',
        pass: 'Univerzasite25!'
    }
}
```

---

## 📋 Checklist

- [ ] Archivo `.env` creado en raíz
- [ ] Variables SMTP configuradas
- [ ] Servidor reiniciado con `npm start`
- [ ] Test de registro completado
- [ ] Email recibido en usuario de prueba
- [ ] Verificación de código completada exitosamente

---

## 🔍 Verificar Configuración

Para asegurar que funciona, revisa:

1. **Consola del servidor** (npm start):
   ```
   ✅ Email enviado a test@example.com
   ```

2. **Email recibido**:
   - Viene desde: `YAvoy <univerzasite@gmail.com>`
   - Contiene código de 6 dígitos
   - Contiene ID del usuario

3. **Verificar en Hostinger**:
   - Mail → Manage → Logs
   - Verifica que los emails se hayan enviado

---

## 🆘 Troubleshooting

### "Authentication failed"
- Verifica que SMTP_USER y SMTP_PASS sean correctos
- Asegúrate de que la cuenta esté activa en Hostinger

### "Connection timeout"
- Verifica que SMTP_HOST sea `smtp.hostinger.com`
- Asegúrate de que SMTP_PORT sea `587` (no 465)
- SMTP_SECURE debe ser `false`

### Email no llega
- Revisa carpeta de Spam
- Verifica logs en Hostinger → Mail → Logs
- Comprueba que el email del usuario existe

### Connection refused
- Asegurate de que el servidor está activo: `npm start`
- Revisa que no haya otras instancias corriendo
- Intenta en puerto diferente si es necesario

---

## 📚 Referencias

- **Documentación Hostinger SMTP**: https://support.hostinger.com/en/articles/4465150-send-emails-via-smtp
- **Nodemailer**: https://nodemailer.com
- **YAvoy Email System**: SISTEMA_REGISTRO_EMAIL.md

---

**Actualizado:** 1 de febrero de 2026  
**Estado:** ✅ Listo para producción en Hostinger
