# ⚡ INSTRUCCIONES RÁPIDAS: SINCRONIZAR EMAIL

**Versión**: v1.0  
**Fecha**: 1 de febrero de 2026

---

## 📌 RESUMEN EN 7 PASOS

```
1. 🔗 Ir a Hostinger > Email > Buscar: yavoyen5@yavoy.space
   └─ Verificar estado ACTIVO ✅

2. 🔐 Copiar contraseña exacta (sin espacios)

3. 📝 Editar .env → SMTP_PASS = [contraseña copiada]

4. ✅ Ejecutar: node sincronizar-email.js
   └─ Debe mostrar: SISTEMA LISTO PARA SINCRONIZACIÓN

5. 🔌 Ejecutar: node test-email-connection.js
   └─ Debe mostrar: CONEXIÓN EXITOSA

6. 📧 Ejecutar: node test-email-envio.js tu@email.com
   └─ Revisar email recibido

7. 🚀 Ejecutar: npm start
   └─ Probar registro en http://localhost:5502
```

---

## 🎬 COMANDOS DIRECTOS

```bash
# 1. VALIDAR SISTEMA
node sincronizar-email.js

# 2. PROBAR CONEXIÓN SMTP
node test-email-connection.js

# 3. PROBAR ENVÍO REAL (reemplazar email)
node test-email-envio.js braian@example.com

# 4. INICIAR SERVIDOR
npm start

# 5. EJECUTAR DEMO COMPLETA
node demo-completa.js
```

---

## ⚠️ SI FALLA PASO 5

**Error**: `Error: authentication failed (535)`

**Solución**:
```
1. Ir a: https://hpanel.hostinger.com/
2. Verificar contraseña actual o cambiarla
3. Copiar contraseña exacta
4. Abrir .env y actualizar: SMTP_PASS=
5. Esperar 5-10 minutos
6. Reintentar: node test-email-connection.js
```

**Si sigue fallando**:
- Ver archivo: `DIAGNOSTICO_ERROR_SMTP.md`
- Contactar Hostinger: support@hostinger.es

---

## 📱 PARA HOSTINGER (PRODUCCIÓN)

Cuando todo funcione localmente:

```bash
1. Subir .env al servidor
2. Crear carpetas: registros/comercios, registros/repartidores, registros/clientes
3. Crear archivos JSON vacíos en cada carpeta: []
4. Hostinger Panel > Reiniciar Node.js
5. Probar en: https://yavoy.space/
```

---

## 📚 DOCUMENTACIÓN DISPONIBLE

```
├─ PLAN_SINCRONIZACION.md ........... Plan completo (7 pasos)
├─ SINCRONIZACION_EMAIL_GUIA.md .... Guía detallada
├─ DIAGNOSTICO_ERROR_SMTP.md ....... Si algo falla
└─ Este archivo .................... Referencia rápida
```

---

## ✅ INDICADORES DE ÉXITO

Cuando veas esto, significa que está funcionando:

```
✅ Paso 4: SISTEMA LISTO PARA SINCRONIZACIÓN
✅ Paso 5: CONEXIÓN EXITOSA A HOSTINGER SMTP
✅ Paso 6: EMAIL ENVIADO EXITOSAMENTE
✅ Paso 7: Servidor iniciado en puerto 5502
```

---

**Estado**: Listo para iniciar  
**Siguiente**: Ejecutar `node sincronizar-email.js`
