# 👑 Guía CEO - Sistema de Verificaciones

## 📋 Resumen del Sistema

El sistema de verificaciones garantiza que todos los repartidores estén completamente validados antes de recibir pagos.

### 🔐 Proceso de Verificación (3 Pasos)

1. **Datos Bancarios**: CBU/CVU, Alias, Banco, Titular
2. **Email Verificado**: Código de 6 dígitos enviado por email
3. **Identidad Verificada**: Foto DNI + Selfie con cámara

---

## 🌐 Acceso al Panel CEO

### URL del Panel
```
http://localhost:5501/panel-ceo-verificaciones.html
```

### Estadísticas Disponibles

El panel muestra 4 métricas principales:

- ⏳ **Pendientes**: Verificaciones esperando aprobación
- ✅ **Aprobadas**: Repartidores que ya pueden recibir pagos
- ❌ **Rechazadas**: Verificaciones rechazadas con motivo
- 💰 **Comisiones Acumuladas**: Total de comisiones retenidas

---

## 📊 Pestañas del Panel

### 1. ⏳ Pendientes
Muestra todos los repartidores que completaron los 3 pasos y esperan aprobación.

**Información mostrada:**
- Nombre y datos de contacto
- CBU/CVU y banco
- Foto del DNI
- Selfie
- Fecha de registro

**Acciones disponibles:**
- ✅ **Aprobar**: Permite al repartidor recibir pagos
- ❌ **Rechazar**: Solicita motivo del rechazo

### 2. ✅ Aprobadas
Lista de repartidores verificados y activos.

**Información adicional:**
- Fecha de aprobación
- Comisiones retenidas
- Pedidos completados

### 3. ❌ Rechazadas
Verificaciones rechazadas con motivo.

**Información adicional:**
- Motivo del rechazo
- Fecha de rechazo
- Opción de aprobar si corrige los datos

### 4. 📋 Todas
Vista completa de todos los repartidores con datos de verificación.

---

## 🔍 Revisar Verificación

### Imágenes
Cada verificación incluye 2 imágenes:

1. **📄 DNI (Frente)**
   - Verificar que sea legible
   - Comprobar que no esté vencido
   - Validar que los datos coincidan

2. **🤳 Selfie**
   - Verificar que coincida con foto del DNI
   - Comprobar que sea reciente
   - Validar que sea la misma persona

**💡 Tip**: Haz clic en las imágenes para verlas en tamaño completo (🔍 Zoom)

### Datos Bancarios
Verifica:
- ✓ CBU/CVU tenga 22 dígitos
- ✓ Alias sea correcto (formato: PALABRA.PALABRA.PALABRA)
- ✓ Banco seleccionado sea válido
- ✓ Nombre del titular coincida con el DNI

---

## ✅ Aprobar Verificación

### Paso 1: Revisar todos los datos
- Verificar DNI legible y válido
- Confirmar que selfie coincida con DNI
- Validar datos bancarios

### Paso 2: Hacer clic en "✓ Aprobar"
El sistema:
1. Marca la verificación como aprobada
2. Guarda fecha de aprobación
3. Permite que el repartidor reciba pagos
4. Mueve la verificación a "Aprobadas"

### Paso 3: Confirmación
El repartidor verá en su panel:
- ✅ Cuenta Verificada
- Tarjeta verde de éxito
- Información de su CBU/Alias
- Estadísticas de comisiones y pedidos

---

## ❌ Rechazar Verificación

### ¿Cuándo rechazar?
- DNI borroso o ilegible
- Selfie no coincide con DNI
- Datos bancarios incorrectos
- DNI vencido
- Foto de DNI no es original (captura de pantalla)
- CBU/CVU inválido

### Paso 1: Hacer clic en "✕ Rechazar"
Se abrirá un modal solicitando el motivo.

### Paso 2: Indicar motivo
Ejemplos de motivos:
```
- "DNI borroso, por favor sube una foto más clara"
- "La selfie no coincide con la foto del DNI"
- "CBU inválido, verifica los 22 dígitos"
- "DNI vencido, actualiza tu documento"
- "Foto de DNI es captura de pantalla, necesitamos foto del documento físico"
```

### Paso 3: Confirmar rechazo
El sistema:
1. Marca la verificación como rechazada
2. Guarda el motivo
3. Guarda fecha de rechazo
4. Notifica al repartidor (si tiene email configurado)

### Paso 4: Reaprobación
Si el repartidor corrige los datos, puedes:
- Ver la nueva solicitud en "Pendientes"
- Aprobarla directamente desde "Rechazadas"

---

## 🔄 Flujo de Pago con Verificación

### Antes de la Verificación
```
❌ Repartidor NO puede recibir pagos
❌ QR de pedido no se genera
⚠️  Sistema bloquea operación
```

### Después de Aprobación CEO
```
✅ Repartidor puede recibir pagos
✅ QR de pedido se genera correctamente
💰 Cliente paga → CEO recibe 100%
📤 Sistema retiene 15% automáticamente
💸 Sistema transfiere 85% al CBU del repartidor
```

### Flujo Completo
1. Cliente escanea QR → Paga a cuenta CEO
2. MercadoPago notifica pago recibido (webhook)
3. Sistema detecta pago exitoso
4. Sistema retiene 15% en cuenta CEO
5. Sistema transfiere 85% al CBU del repartidor
6. Ambos reciben notificación de pago
7. Pedido se marca como pagado

---

## 💰 Comisiones Retenidas

### ¿Dónde se guardan?
```
registros/comisiones-ceo/
  └── 2025-01-12_comisiones.json
```

### Estructura de Datos
```json
{
  "fecha": "2025-01-12T14:30:00.000Z",
  "pedidoId": "PED-123",
  "repartidorId": "REP-01",
  "montoTotal": 1000,
  "comisionCEO": 150,
  "montoRepartidor": 850,
  "transferId": "TR-XYZ789"
}
```

### Revisar Comisiones
Las comisiones se acumulan automáticamente y se muestran en:
- Panel CEO → Estadística "Comisiones Acumuladas"
- Tarjeta de repartidor verificado → "Comisiones Retenidas"

---

## 📧 Configuración de Email (Opcional)

### Paso 1: Crear App Password de Gmail

1. Ir a: https://myaccount.google.com/security
2. Activar "Verificación en 2 pasos"
3. Ir a "Contraseñas de aplicaciones"
4. Seleccionar "Correo" y "Windows"
5. Copiar la contraseña generada (16 caracteres)

### Paso 2: Configurar Variables de Entorno

Crear archivo `.env` en la raíz:
```env
EMAIL_USER=yavoyen5@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
```

### Paso 3: Reiniciar Servidor
```powershell
taskkill /F /IM node.exe
node server.js
```

### ¿Qué pasa si NO configuro email?
El sistema funciona en **modo desarrollo**:
- ✅ Verificaciones funcionan normalmente
- 📧 Código se muestra en **consola del servidor**
- ⚠️  Repartidor debe pedir código al CEO

---

## 🔒 Seguridad

### Almacenamiento de Imágenes
```
registros/verificaciones/
  └── REP-01/
      ├── dni.jpg
      └── selfie.jpg
```

**Protección:**
- ✓ Imágenes almacenadas localmente
- ✓ No se suben a servicios externos
- ✓ Solo accesibles desde servidor local
- ✓ Respaldo automático con registros

### Datos Sensibles
- CBU/CVU encriptado en tránsito (HTTPS en producción)
- Imágenes protegidas por autenticación
- MercadoPago tokens en variables de entorno

---

## 🚨 Solución de Problemas

### ❌ No se cargan las imágenes
**Causa**: Ruta incorrecta o permisos
**Solución**:
```powershell
# Verificar que existe la carpeta
Test-Path "registros/verificaciones/REP-01"

# Verificar permisos
icacls "registros/verificaciones"
```

### ❌ No se puede aprobar verificación
**Causa**: Repartidor no completó todos los pasos
**Solución**: Verificar que tenga:
- ✓ CBU configurado (22 dígitos)
- ✓ Email verificado (checkmark ✓)
- ✓ Identidad verificada (DNI + Selfie)

### ❌ Error al rechazar
**Causa**: Motivo vacío
**Solución**: Siempre escribir motivo del rechazo

### ⚠️ Emails no se envían
**Causa**: Gmail App Password no configurado
**Solución**:
1. Configurar EMAIL_PASSWORD en `.env`
2. Reiniciar servidor
3. Mientras tanto, revisar código en consola

---

## 📱 Acceso desde Celular

### En la misma red WiFi
```
http://192.168.X.X:5501/panel-ceo-verificaciones.html
```

**Para obtener IP:**
```powershell
ipconfig
# Buscar "Dirección IPv4"
```

### Desde Internet (Producción)
Configurar:
1. Dominio con Hostinger/otro proveedor
2. SSL con Let's Encrypt
3. Webhook público en MercadoPago
4. Variables de entorno en servidor

---

## 📊 Reportes y Auditoría

### Archivos de Registro
```
registros/
  ├── repartidores/
  │   └── repartidores.json (incluye estado verificación)
  ├── verificaciones/
  │   └── REP-01/
  │       ├── dni.jpg
  │       └── selfie.jpg
  └── comisiones-ceo/
      └── 2025-01-12_comisiones.json
```

### Consultar Historial
```javascript
// Ver repartidor específico
fetch('/api/repartidores/REP-01')
  .then(r => r.json())
  .then(data => console.log(data.configPago));

// Ver todos
fetch('/api/repartidores')
  .then(r => r.json())
  .then(data => console.log(data.repartidores));
```

---

## 🎯 Mejores Prácticas

### ✅ DO (Hacer)
- Revisar cada verificación cuidadosamente
- Dar motivos claros al rechazar
- Aprobar rápidamente verificaciones correctas
- Revisar panel diariamente
- Mantener registros actualizados

### ❌ DON'T (No Hacer)
- Aprobar sin revisar imágenes
- Rechazar sin motivo claro
- Demorar aprobaciones (repartidor no puede trabajar)
- Compartir credenciales de acceso
- Borrar archivos de verificación manualmente

---

## 📞 Soporte

### En caso de problemas técnicos:
1. Revisar consola del servidor (errores en rojo)
2. Verificar que puerto 5501 esté libre
3. Comprobar que existen carpetas de registros
4. Revisar logs en `registros/`

### Comandos útiles:
```powershell
# Ver procesos Node.js
Get-Process node

# Reiniciar servidor
taskkill /F /IM node.exe; node server.js

# Ver logs en tiempo real
Get-Content server-logs.txt -Wait -Tail 50
```

---

## 🚀 Próximas Funcionalidades

- [ ] Reconocimiento facial automático (face-api.js)
- [ ] Notificaciones push al aprobar/rechazar
- [ ] Dashboard con gráficos de verificaciones
- [ ] Exportar reportes a PDF
- [ ] Historial de cambios en verificaciones
- [ ] Múltiples niveles de aprobación

---

## 📝 Notas Importantes

⚠️ **IMPORTANTE**: Cada vez que apruebes una verificación:
- El repartidor podrá comenzar a recibir pagos inmediatamente
- Su CBU/CVU quedará registrado en el sistema
- Las transferencias serán automáticas (no requieren intervención manual)

✅ **RECOMENDACIÓN**: Aprobar verificaciones en horario laboral para poder asistir al repartidor en caso de dudas.

💡 **TIP**: Usa el botón "🔄 Actualizar" para ver nuevas verificaciones sin recargar la página.

---

**Última actualización**: 12 de Enero 2025
**Versión del sistema**: 2.0 - Sistema de Verificación CEO
