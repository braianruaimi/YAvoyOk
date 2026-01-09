# 🎯 GUÍA RÁPIDA - YAVOY DEFINITIVO

## 🚀 INICIO RÁPIDO

### 1️⃣ Iniciar el Sistema

**Opción A - Doble click:**
```
INICIAR_YAVOY.bat
```

**Opción B - PowerShell:**
```powershell
.\INICIAR_YAVOY.ps1
```

**Opción C - Manual:**
```bash
npm install  # Solo la primera vez
node server.js
```

### 2️⃣ Acceder a la Aplicación

Abre tu navegador en: **http://localhost:5501**

---

## 📋 FUNCIONALIDADES PRINCIPALES

### 👤 PARA CLIENTES

1. **Hacer un Pedido:**
   - Click en "Quiero Pedir" → "Hacer Pedido"
   - Completa tus datos (nombre, teléfono, dirección)
   - Describe qué necesitas
   - Indica el monto estimado
   - ¡Listo! Recibirás tu número de pedido

2. **Seguimiento:**
   - Guarda tu número de pedido (ej: `PED-001`)
   - Recibirás notificaciones del estado
   - Podrás chatear con tu repartidor

---

### 🏪 PARA COMERCIOS

1. **Registro:**
   - Click en "Soy Comercio" → "Registrarme"
   - Completa datos del comercio
   - Recibirás tu ID de Comercio (ej: `COM-001`)

2. **Acceso al Panel:**
   - http://localhost:5501/panel-comercio.html
   - Ingresa tu ID de Comercio
   - Gestiona pedidos, ventas y estadísticas

3. **Gestión de Pedidos:**
   - Ver pedidos pendientes
   - Aceptar/rechazar pedidos
   - Actualizar estado
   - Ver historial

---

### 🚴 PARA REPARTIDORES

1. **Registro:**
   - Click en "Soy Repartidor" → "Registrarme"
   - Completa datos personales
   - Sube DNI (frente y dorso)
   - Si usas moto/auto: sube cédula del vehículo
   - Acepta términos y condiciones
   - Recibirás tu ID de Repartidor (ej: `REP-001`)

2. **Acceso al Panel:**
   - http://localhost:5501/panel-repartidor.html
   - Ingresa tu ID de Repartidor
   - ¡Comienza a trabajar!

3. **Gestión de Entregas:**
   - Ver pedidos disponibles
   - Aceptar pedidos
   - Actualizar ubicación
   - Chatear con clientes
   - Ver ganancias (80% de cada envío)

---

## 🔔 NOTIFICACIONES PUSH

### Activar Notificaciones:

1. Al abrir la app, se te pedirá permiso
2. Click en "Permitir" en la notificación del navegador
3. ¡Listo! Recibirás notificaciones en tiempo real

### Notificaciones Disponibles:

- 📦 Nuevo pedido asignado
- 🚴 Repartidor aceptó tu pedido
- 📍 Repartidor cerca de tu ubicación
- ✅ Pedido entregado
- 💬 Nuevo mensaje en el chat

---

## 🛠️ RESOLUCIÓN DE PROBLEMAS

### ❌ El servidor no inicia

**Problema:** `Error: listen EADDRINUSE :::5501`
**Solución:** El puerto 5501 está ocupado

```bash
# Opción 1: Cerrar proceso que usa el puerto
netstat -ano | findstr :5501
taskkill /PID <número_proceso> /F

# Opción 2: Cambiar puerto en server.js
# Editar línea: const PORT = 5502;
```

---

### ❌ Error "npm no reconocido"

**Problema:** Node.js no instalado
**Solución:**
1. Descarga Node.js: https://nodejs.org/
2. Instala la versión LTS
3. Reinicia la terminal
4. Verifica: `node --version`

---

### ❌ Las notificaciones no funcionan

**Soluciones:**
1. Verifica estar en `localhost` o `HTTPS`
2. Acepta permisos en el navegador
3. Verifica en configuración del navegador:
   - Chrome: `chrome://settings/content/notifications`
   - Firefox: Preferencias → Privacidad → Notificaciones

---

### ❌ No puedo subir imágenes

**Soluciones:**
1. Verifica que sean JPG o PNG
2. Máximo 5MB por imagen
3. Asegúrate que sean fotos nítidas

---

## 📁 ESTRUCTURA DE ARCHIVOS

```
YAvoy_DEFINITIVO/
│
├── 🚀 INICIAR_YAVOY.bat         # Launcher principal (CMD)
├── 🚀 INICIAR_YAVOY.ps1         # Launcher principal (PowerShell)
│
├── 🌐 index.html                # Página principal
├── 🏪 panel-comercio.html       # Panel de comercios
├── 🚴 panel-repartidor.html     # Panel de repartidores
│
├── ⚙️  server.js                 # Servidor Node.js + API
├── 🔧 sw.js                     # Service Worker (PWA)
├── 📜 script.js                 # JavaScript principal
├── 🎨 styles.css                # Estilos principales
│
├── 📦 package.json              # Dependencias
├── 📝 README.md                 # Documentación completa
├── 📋 PROCESO_UNIFICACION.md    # Proceso de unificación
└── 🗑️  ELIMINAR_CARPETAS_ANTIGUAS.ps1  # Script de limpieza
```

---

## 🔐 SEGURIDAD

### Datos Protegidos:
- ✅ DNI y documentos en carpeta segura
- ✅ Validación de formularios
- ✅ Sanitización de inputs
- ✅ CORS configurado

### Responsabilidades:
- 🔒 No compartir tu ID de acceso
- 🔒 Usar contraseñas seguras (cuando aplique)
- 🔒 No modificar archivos en `registros/`

---

## 💰 MODELO DE GANANCIAS

### Para Repartidores:
```
Costo de envío: $1000
Tu ganancia:     $800 (80%)
Comisión YAvoy:  $200 (20%)
```

### Pagos:
- Los pagos se gestionan directamente entre cliente y repartidor
- La plataforma solo facilita la conexión

---

## 📊 REPORTES Y ESTADÍSTICAS

### Panel Comercio:
- 📈 Ventas totales
- 📦 Pedidos procesados
- ⭐ Calificación promedio
- 💵 Facturación mensual

### Panel Repartidor:
- 🚴 Entregas completadas
- 💰 Ganancias totales
- ⏱️ Tiempo promedio de entrega
- ⭐ Calificación de clientes

---

## 🗑️ ELIMINAR CARPETAS ANTIGUAS

### ⚠️ IMPORTANTE

Una vez que verifiques que YAvoy_DEFINITIVO funciona correctamente:

```powershell
# Ejecutar script de limpieza
.\ELIMINAR_CARPETAS_ANTIGUAS.ps1
```

Esto eliminará:
- ❌ C:\Users\cdaim\OneDrive\Desktop\YAvoy
- ❌ C:\Users\cdaim\OneDrive\Desktop\YAvoy_UNIFICADO
- ❌ C:\Users\cdaim\OneDrive\Desktop\YaVOY_UNIFICADO_FINAL - copia

**Liberarás aproximadamente:** ~500MB - 2GB de espacio

---

## 🆘 SOPORTE

### Problemas Técnicos:
- 📧 Email: yavoyen5@gmail.com
- 📱 WhatsApp: +54 221 504 7962

### Documentación:
- 📖 README.md - Documentación completa
- 📋 PROCESO_UNIFICACION.md - Detalles técnicos
- 📁 docs/ - Documentación adicional

---

## ✅ CHECKLIST DE VERIFICACIÓN

Antes de eliminar carpetas antiguas, verifica:

- [ ] Servidor inicia correctamente
- [ ] Página principal carga en http://localhost:5501
- [ ] Puedes registrar un comercio
- [ ] Puedes registrar un repartidor
- [ ] Puedes crear un pedido
- [ ] Panel de comercio accesible
- [ ] Panel de repartidor accesible
- [ ] Notificaciones funcionan
- [ ] Archivos se guardan en `registros/`

---

## 🎯 PRÓXIMOS PASOS

1. ✅ Verificar que todo funcione
2. 📦 Hacer backup (opcional)
3. 🗑️ Eliminar carpetas antiguas
4. 🚀 ¡Usar el sistema!

---

**¡Bienvenido a YAvoy Definitivo! 🚀**

_Última actualización: 9 de diciembre de 2025_
