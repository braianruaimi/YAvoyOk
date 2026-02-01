# 🎯 GUÍA VISUAL: SINCRONIZAR EMAIL HOSTINGER CON YAVOY

```
╔════════════════════════════════════════════════════════════════════╗
║                    EMAIL SYNC - YAVOY PLATFORM                    ║
║                         v3.1 Enterprise                           ║
║                                                                    ║
║   Email: yavoyen5@yavoy.space                                      ║
║   Dominio: yavoy.space                                             ║
║   SMTP: smtp.hostinger.com:465 (SSL)                               ║
║                                                                    ║
║   Status: ⏳ POR VERIFICAR                                          ║
║   Última actualización: 1 de febrero de 2026                       ║
╚════════════════════════════════════════════════════════════════════╝
```

---

## 🚀 FLUJO DE SINCRONIZACIÓN

```
┌─────────────────────────────────────────────────────────────────┐
│                      PASO 1: VERIFICAR HOSTINGER                │
│                      Duración: 2-3 minutos                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Ir a: https://hpanel.hostinger.com/                        │
│  2. Email > Gestionar                                          │
│  3. Buscar: yavoyen5@yavoy.space                               │
│  4. Estado: ¿ACTIVO? ✅                                         │
│  5. Copiar: Contraseña exacta                                  │
│                                                                 │
│  ✅ Resultado: Credenciales verificadas                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                    (Copiar contraseña)
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                       PASO 2: ACTUALIZAR .env                   │
│                      Duración: 1 minuto                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  nano .env                                                      │
│                                                                 │
│  Buscar:                                                        │
│  SMTP_PASS=BraianCesar26!                                       │
│                                                                 │
│  Cambiar a:                                                     │
│  SMTP_PASS=[tu-contraseña-copiada]                              │
│                                                                 │
│  Guardar:                                                       │
│  Ctrl+O → Enter → Ctrl+X                                        │
│                                                                 │
│  ✅ Resultado: .env actualizado                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
               (Archivo .env con credenciales)
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                   PASO 3: VALIDAR SISTEMA                       │
│                      Duración: 1 minuto                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  $ node sincronizar-email.js                                    │
│                                                                 │
│  ✅ Verificaciones esperadas:                                   │
│     ✓ Archivo .env encontrado                                   │
│     ✓ SMTP_HOST configurado (Hostinger)                         │
│     ✓ SMTP_PORT = 465 (correcto)                                │
│     ✓ SMTP_USER = yavoyen5@yavoy.space                          │
│     ✓ SMTP_PASS configurado                                     │
│     ✓ Email Service encontrado                                  │
│     ✓ Auth Controller encontrado                                │
│     ✓ Directorios registros/ creados                            │
│     ✓ Comercios: 4 registros                                    │
│     ✓ Repartidores: 2 registros                                 │
│     ✓ Todas las dependencias instaladas                         │
│                                                                 │
│  Resultado Final:                                               │
│  ✅ SISTEMA LISTO PARA SINCRONIZACIÓN                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
               (Si muestra ✅ entonces continúa)
               (Si muestra ❌ revisar DIAGNOSTICO_ERROR_SMTP.md)
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│               PASO 4: PROBAR CONEXIÓN SMTP                      │
│                    Duración: 2-5 minutos                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  $ node test-email-connection.js                                │
│                                                                 │
│  ✅ Resultado esperado:                                          │
│                                                                 │
│  ✅ CONEXIÓN EXITOSA A HOSTINGER SMTP                           │
│                                                                 │
│  📊 INFORMACIÓN DE CONEXIÓN:                                    │
│     ✓ Host SMTP: smtp.hostinger.com                             │
│     ✓ Puerto: 465                                               │
│     ✓ Usuario: yavoyen5@yavoy.space                             │
│     ✓ Encriptación: SSL/TLS                                     │
│                                                                 │
│  ✨ El servidor SMTP está configurado correctamente             │
│  🎉 Listo para enviar emails desde YAvoy                        │
│                                                                 │
│  ❌ Si falla:                                                    │
│     • Error 535: Credenciales incorrectas                       │
│     • Error conexión: Firewall bloquea puerto 465               │
│     • Ver: DIAGNOSTICO_ERROR_SMTP.md                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                  (Si ✅ entonces continúa)
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                 PASO 5: PROBAR ENVÍO REAL                       │
│                    Duración: 2-5 minutos                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  $ node test-email-envio.js tu@email.com                        │
│                                                                 │
│  (Cambiar tu@email.com a tu email real)                         │
│                                                                 │
│  ✅ Resultado esperado:                                          │
│                                                                 │
│  ✅ EMAIL ENVIADO EXITOSAMENTE                                  │
│                                                                 │
│  📊 DETALLES DE ENVÍO:                                           │
│     ✓ ID del mensaje: <mensaje@yavoy.space>                     │
│     ✓ Destinatario: tu@email.com                                │
│     ✓ Tiempo de envío: XXXms                                    │
│                                                                 │
│  💡 PRÓXIMOS PASOS:                                              │
│     1. Revisa tu bandeja de entrada                             │
│     2. Si no lo ves, busca en SPAM                              │
│     3. Verifica que el email sea profesional                    │
│                                                                 │
│  ✨ Sistema de email está 100% operativo                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                  (Verificar email recibido)
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                   PASO 6: INICIAR SERVIDOR                      │
│                      Duración: 30 segundos                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  $ npm start                                                    │
│                                                                 │
│  ✅ Resultado esperado:                                          │
│                                                                 │
│  ✅ Servidor iniciado en puerto 5502                            │
│  ✅ Sistema de email configurado y funcionando                  │
│  ✅ Hostinger SMTP activo                                       │
│  ✅ Todas las rutas registradas                                 │
│                                                                 │
│  🌐 URL: http://localhost:5502                                  │
│                                                                 │
│  📍 El servidor está ahora listo para recibir usuarios           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                   (Servidor ejecutándose)
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│              PASO 7: REGISTRAR USUARIO DE PRUEBA                │
│                      Duración: 3-5 minutos                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Opción A: FORMULARIO WEB (MANUAL)                              │
│  ────────────────────────────────                               │
│  1. Abrir: http://localhost:5502/                               │
│  2. Registrar como COMERCIO                                     │
│     Email: prueba@example.com                                   │
│     Contraseña: Test1234!                                       │
│  3. Click: Registrar                                            │
│                                                                 │
│  ✅ Resultado esperado:                                          │
│  Status: 201 Created                                            │
│  ID generado: COM1234567890                                     │
│  Email enviado: ✅                                               │
│                                                                 │
│  📧 Deberías recibir email con:                                 │
│     - Código de verificación (6 dígitos)                        │
│     - ID de usuario asignado                                    │
│     - Instrucciones de verificación                             │
│                                                                 │
│                                                                 │
│  Opción B: SCRIPT AUTOMÁTICO                                    │
│  ───────────────────────────                                    │
│  $ node demo-completa.js                                        │
│                                                                 │
│  Ejecuta flujo completo:                                        │
│  ✓ Registra comercio                                            │
│  ✓ Verifica email recibido                                      │
│  ✓ Completa verificación                                        │
│  ✓ Genera tokens JWT                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                   (Usuario registrado)
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                   PASO 8: VERIFICAR EMAIL                       │
│                      Duración: 1-2 minutos                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Abrir: http://localhost:5502/verificar-email.html           │
│  2. Ingresar:                                                   │
│     Email: prueba@example.com                                   │
│     Código: [el que recibiste en el email]                      │
│  3. Click: Verificar                                            │
│                                                                 │
│  ✅ Resultado esperado:                                          │
│  ┌─────────────────────────────────────────────────┐           │
│  │ ✅ Email verificado exitosamente               │           │
│  │                                                 │           │
│  │ Tu cuenta está completamente activada.          │           │
│  │ Puedes acceder a todas las funciones.           │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
│  🎉 SINCRONIZACIÓN COMPLETADA                                  │
│                                                                 │
│  ✨ El sistema está 100% operativo                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ INDICADORES DE ÉXITO

Cuando veas estos mensajes, significa que todo está funcionando:

```
PASO 3  ┤ ✅ SISTEMA LISTO PARA SINCRONIZACIÓN
        │ 
PASO 4  ┤ ✅ CONEXIÓN EXITOSA A HOSTINGER SMTP
        │
PASO 5  ┤ ✅ EMAIL ENVIADO EXITOSAMENTE
        │    (Recibes email de prueba)
        │
PASO 6  ┤ ✅ Servidor iniciado en puerto 5502
        │
PASO 7  ┤ ✅ Comercio registrado exitosamente
        │    Status: 201 Created
        │    (Recibes email de confirmación)
        │
PASO 8  ┤ ✅ Email verificado exitosamente
        │    Cuenta completamente activada
        │
        └─→ 🎉 SINCRONIZACIÓN 100% COMPLETA
```

---

## ⚠️ SI ALGO FALLA

```
┌─────────────────────────────────────────────────────────────┐
│                    TROUBLESHOOTING RÁPIDO                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ❌ PASO 3: "SMTP_PASS no configurado"                       │
│ ─────────────────────────────────────────────              │
│ Solución:                                                   │
│ 1. Editar .env                                              │
│ 2. Verificar SMTP_PASS está presente                        │
│ 3. Sin espacios al inicio/final                             │
│                                                             │
│                                                             │
│ ❌ PASO 4: "Error 535 authentication failed"                │
│ ──────────────────────────────────────────────             │
│ Solución:                                                   │
│ 1. Ir a https://hpanel.hostinger.com/                       │
│ 2. Verificar email yavoyen5@yavoy.space ACTIVO              │
│ 3. Copiar contraseña exacta (sin espacios)                  │
│ 4. Actualizar SMTP_PASS en .env                             │
│ 5. Esperar 5-10 minutos si cambió contraseña                │
│ 6. Reintentar                                               │
│                                                             │
│                                                             │
│ ❌ PASO 5: "Email no llega"                                  │
│ ──────────────────────────────────                          │
│ Solución:                                                   │
│ 1. Revisar carpeta SPAM                                     │
│ 2. Esperar 2-5 minutos (puede tardar)                       │
│ 3. Verificar email en Hostinger existe                      │
│ 4. Revisar logs: npm start en terminal                      │
│                                                             │
│                                                             │
│ ❌ PASO 6: "Puerto 5502 ya en uso"                           │
│ ──────────────────────────────────────                      │
│ Solución:                                                   │
│ $ Get-Process node | Stop-Process -Force                    │
│ $ npm start                                                 │
│                                                             │
│                                                             │
│ ❌ PASO 7: "Email no coincide"                               │
│ ──────────────────────────────                              │
│ Solución:                                                   │
│ 1. Usar formato valido: usuario@dominio.com                 │
│ 2. Sin espacios                                             │
│ 3. Sin caracteres especiales                                │
│                                                             │
│                                                             │
│ 📚 Para problemas complejos:                                │
│    Ver archivo: DIAGNOSTICO_ERROR_SMTP.md                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📱 CUANDO TODO FUNCIONE: PRODUCCIÓN EN HOSTINGER

```
┌─────────────────────────────────────────────────────────────┐
│                  DESPLEGAR EN HOSTINGER                     │
│                 (Cuando todo esté listo)                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. SUBIR ARCHIVOS                                          │
│     $ git push origin main                                  │
│     (Hostinger se actualiza automáticamente)                │
│                                                             │
│  2. CREAR CARPETAS EN SERVIDOR                              │
│     Hostinger File Manager:                                 │
│     ├─ registros/                                           │
│     ├─ registros/comercios/                                 │
│     ├─ registros/repartidores/                              │
│     └─ registros/clientes/                                  │
│                                                             │
│  3. CREAR ARCHIVOS JSON VACÍOS                              │
│     En cada carpeta, crear archivo:                         │
│     comercios.json      → []                                │
│     repartidores.json   → []                                │
│     clientes.json       → []                                │
│                                                             │
│  4. REINICIAR NODE.JS                                       │
│     Hostinger Panel > Hosting > Gestionar > Reiniciar       │
│     Seleccionar: Aplicación Node.js                         │
│     Esperar: 2-3 minutos                                    │
│                                                             │
│  5. PROBAR EN PRODUCCIÓN                                    │
│     URL: https://yavoy.space/                               │
│     Registrar usuario                                       │
│     Verificar que llega email                               │
│     Completar verificación                                  │
│                                                             │
│  ✅ PRODUCTION READY!                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📚 DOCUMENTACIÓN DISPONIBLE

```
📋 Documentos de Sincronización:
├─ PLAN_SINCRONIZACION.md .............. Plan completo (7 pasos)
├─ SINCRONIZACION_EMAIL_GUIA.md ....... Guía muy detallada
├─ DIAGNOSTICO_ERROR_SMTP.md .......... Solucionar problemas
├─ INSTRUCCIONES_RAPIDAS.md ........... Referencia rápida
├─ RESUMEN_EJECUTIVO_SINCRONIZACION.md  Resumen completo
└─ GUIA_VISUAL_SINCRONIZACION.md ...... Este archivo

🔧 Scripts de Validación:
├─ sincronizar-email.js .... Valida todo el sistema
├─ test-email-connection.js  Prueba conexión SMTP
├─ test-email-envio.js ...... Prueba envío real
└─ demo-completa.js ........ Demostración completa

💻 Código Principal:
├─ server.js .......................... Servidor principal
├─ src/utils/emailService.js ......... Servicio de email
├─ src/controllers/authController.js  Lógica de registro
├─ src/routes/authRoutes.js ......... Rutas de auth
└─ verificar-email.html ............. Formulario verificación
```

---

## 🎯 PRÓXIMO PASO

```
┌────────────────────────────────────────────────┐
│  ⏭️  SIGUIENTE ACCIÓN:                         │
│                                                │
│  Ir a Hostinger y verificar que el email     │
│  yavoyen5@yavoy.space está ACTIVO            │
│                                                │
│  Luego ejecutar:                              │
│  $ node sincronizar-email.js                  │
│                                                │
│  Link: https://hpanel.hostinger.com/         │
└────────────────────────────────────────────────┘
```

---

**Generado**: 1 de febrero de 2026  
**Versión**: YAvoy v3.1 Enterprise  
**Status**: Listo para sincronización

```
═══════════════════════════════════════════════════════════════
              ✨ SISTEMA PREPARADO PARA SINCRONIZAR ✨
═══════════════════════════════════════════════════════════════
```
