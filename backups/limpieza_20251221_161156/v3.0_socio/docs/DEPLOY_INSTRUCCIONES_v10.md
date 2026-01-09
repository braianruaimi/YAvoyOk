# 🚀 Deploy a Hostinger - YAvoy v10

## 📦 Archivos Incluidos en este Deploy

### Versión: v10.0
### Fecha: 30 de noviembre de 2025

---

## ✨ Nuevas Funcionalidades (v8 → v10)

### v9: Notificaciones Push
- ✅ Sistema completo de notificaciones
- ✅ Push notifications al cambiar estado
- ✅ Toggle ON/OFF en header
- ✅ Service Worker con event listeners
- ✅ Mensajes personalizados por estado

### v10: Geolocalización + Chat
- ✅ **Mapa interactivo** con Leaflet.js
- ✅ **Tracking en tiempo real** del repartidor
- ✅ **Chat en vivo** comercio ↔ repartidor
- ✅ Ubicación GPS actualizada cada 5 segundos
- ✅ Historial de mensajes persistente

---

## 📁 Estructura del Proyecto

```
YAvoy_v10/
├── index.html               (v10 - Leaflet CSS/JS, modal chat)
├── styles.css               (v10 - estilos mapa + chat)
├── script.js                (v10 - geolocalización + chat)
├── sw.js                    (v10 - notificaciones push)
├── server.js                (API - comercios, pedidos, chats)
├── manifest.json
├── offline.html
├── LIMPIAR_CACHE.html
├── COMO_ABRIR_YAVOY.md
├── NOTIFICACIONES_PUSH.md
├── icons/
│   ├── icon.svg
│   └── icon-*x*.png
└── registros/
    ├── comercios/
    ├── pedidos/
    │   └── pedidos.json
    └── chats/
        └── [pedidoId].json
```

---

## 🔧 Pasos para Deploy en Hostinger

### 1. Preparar Archivos

```powershell
# Crear carpeta temporal
New-Item -ItemType Directory -Force -Path "YAvoy_Hostinger_v10"

# Copiar archivos esenciales
$archivos = @(
    "index.html",
    "styles.css",
    "script.js",
    "sw.js",
    "server.js",
    "manifest.json",
    "offline.html",
    "LIMPIAR_CACHE.html",
    "package.json"
)

foreach ($archivo in $archivos) {
    Copy-Item $archivo "YAvoy_Hostinger_v10\" -Force
}

# Copiar carpeta icons
Copy-Item -Recurse "icons" "YAvoy_Hostinger_v10\icons"

# Crear carpeta registros vacía
New-Item -ItemType Directory -Force -Path "YAvoy_Hostinger_v10\registros\comercios"
New-Item -ItemType Directory -Force -Path "YAvoy_Hostinger_v10\registros\pedidos"
New-Item -ItemType Directory -Force -Path "YAvoy_Hostinger_v10\registros\chats"

# Comprimir
Compress-Archive -Path "YAvoy_Hostinger_v10\*" -DestinationPath "YAvoy_Hostinger_v10.zip" -Force
```

### 2. Subir a Hostinger

1. **Acceder a hPanel** → https://hpanel.hostinger.com
2. **File Manager** → public_html
3. **Upload** → Subir `YAvoy_Hostinger_v10.zip`
4. **Extract** → Extraer archivos
5. **Eliminar** el .zip después de extraer

### 3. Configurar Node.js en Hostinger

1. **Setup Node.js Application**
   - Application root: `/home/u123456789/public_html`
   - Application URL: `https://tudominio.com`
   - Application startup file: `server.js`
   - Node.js version: `18.x` o superior

2. **Instalar dependencias** (si las hay):
   ```bash
   npm install
   ```

3. **Iniciar aplicación**:
   ```bash
   node server.js
   ```

### 4. Configurar Base de Datos MySQL (Opcional)

Si quieres migrar de JSON a MySQL:

```sql
CREATE DATABASE yavoy_db;
USE yavoy_db;

CREATE TABLE comercios (
    id VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    categoria VARCHAR(50),
    telefono VARCHAR(20),
    direccion TEXT,
    horario VARCHAR(100),
    datos_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pedidos (
    id VARCHAR(50) PRIMARY KEY,
    comercio_id VARCHAR(50),
    comercio_nombre VARCHAR(100),
    repartidor_id VARCHAR(50),
    repartidor_nombre VARCHAR(100),
    producto TEXT,
    destino TEXT,
    telefono VARCHAR(20),
    precio DECIMAL(10,2),
    estado ENUM('pendiente', 'aceptado', 'en_camino', 'entregado', 'cancelado'),
    notas TEXT,
    fecha_creacion BIGINT,
    fecha_actualizacion BIGINT,
    historial_json TEXT,
    FOREIGN KEY (comercio_id) REFERENCES comercios(id)
);

CREATE TABLE chats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id VARCHAR(50),
    autor VARCHAR(100),
    texto TEXT,
    timestamp BIGINT,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
);

CREATE TABLE ubicaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    repartidor_id VARCHAR(50),
    lat DECIMAL(10, 7),
    lng DECIMAL(10, 7),
    timestamp BIGINT,
    INDEX idx_repartidor (repartidor_id, timestamp)
);
```

---

## 🌐 URLs Importantes

### Producción
- **App Principal**: https://tudominio.com
- **API Comercios**: https://tudominio.com/api/guardar-comercio
- **API Pedidos**: https://tudominio.com/api/guardar-pedidos
- **API Chats**: https://tudominio.com/api/guardar-chat
- **Limpiar Caché**: https://tudominio.com/LIMPIAR_CACHE.html

### Desarrollo Local
- **HTTP**: http://localhost:5500
- **API**: http://localhost:5501

---

## 🔄 Cambios en el Código para Producción

### 1. Actualizar URLs del servidor en `script.js`

Buscar y reemplazar:

```javascript
// ANTES (desarrollo)
fetch('http://localhost:5501/api/guardar-chat', { ... })
fetch('http://localhost:5501/api/guardar-pedidos', { ... })

// DESPUÉS (producción)
fetch('/api/guardar-chat', { ... })
fetch('/api/guardar-pedidos', { ... })
```

### 2. Actualizar Service Worker (`sw.js`)

Verificar que esté en v10:

```javascript
const VERSION = 'v10';
const CACHE_NAME = 'yavoy-v10';
```

### 3. Configurar HTTPS

Asegurarse que todas las rutas usen HTTPS en producción:

```javascript
// En manifest.json
"start_url": "https://tudominio.com/",
"scope": "https://tudominio.com/"
```

---

## ✅ Checklist Pre-Deploy

- [ ] Archivos comprimidos en .zip
- [ ] Service Worker en v10
- [ ] URLs del servidor actualizadas (localhost → producción)
- [ ] Manifest.json con dominio correcto
- [ ] Icons PNG generados (72, 96, 128, 144, 192, 384, 512)
- [ ] offline.html existe
- [ ] Carpetas registros/ creadas
- [ ] .htaccess configurado (si es necesario)

---

## 🧪 Testing Post-Deploy

### 1. Verificar PWA
```javascript
// En consola del navegador
navigator.serviceWorker.getRegistrations().then(regs => {
    console.log('Service Workers:', regs.length);
    regs.forEach(r => console.log('Scope:', r.scope));
});
```

### 2. Probar Notificaciones
1. Click en botón 🔔
2. Permitir notificaciones
3. Crear pedido → Aceptar → Verificar notificación

### 3. Probar Geolocalización
1. Crear pedido → Aceptar
2. Marcar "En Camino"
3. Ver Detalle → Click "🗺️ Ver Ubicación"
4. Debe mostrar mapa con ubicación

### 4. Probar Chat
1. Abrir pedido con repartidor asignado
2. Click "💬 Chat"
3. Enviar mensaje
4. Verificar que se guarda

---

## 🐛 Troubleshooting

### Error: Service Worker no registra
**Solución**: Limpiar caché → https://tudominio.com/LIMPIAR_CACHE.html

### Error: Mapa no carga
**Verificar**: Conexión a CDN de Leaflet
```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
```

### Error: API no responde
**Verificar**: Que `server.js` esté corriendo en Hostinger
```bash
pm2 list  # Ver procesos activos
pm2 restart server  # Reiniciar servidor
```

### Error: Geolocalización no funciona
**Causa**: Requiere HTTPS en producción
**Solución**: Asegurar que el sitio use certificado SSL

---

## 📊 Comparativa de Versiones

| Funcionalidad | v7 | v8 | v9 | v10 |
|---------------|----|----|----|----|
| Comercios | ✅ | ✅ | ✅ | ✅ |
| Repartidores | ✅ | ✅ | ✅ | ✅ |
| Pedidos | ❌ | ✅ | ✅ | ✅ |
| Notificaciones | ❌ | ❌ | ✅ | ✅ |
| Geolocalización | ❌ | ❌ | ❌ | ✅ |
| Chat | ❌ | ❌ | ❌ | ✅ |
| PWA | ✅ | ✅ | ✅ | ✅ |

---

## 🎯 Roadmap Futuro

### v11 - Autenticación
- [ ] Login con Google/Facebook
- [ ] Roles (Comercio, Repartidor, Admin)
- [ ] Sesiones persistentes

### v12 - Pagos
- [ ] Integración Mercado Pago
- [ ] Gestión de comisiones
- [ ] Historial de transacciones

### v13 - Analytics
- [ ] Dashboard de estadísticas
- [ ] Reportes por comercio/repartidor
- [ ] Métricas de performance

---

## 📞 Soporte

**Última actualización**: 30 de noviembre de 2025  
**Versión**: v10.0  
**Autor**: GitHub Copilot

---

## 🔗 Links Útiles

- [Hostinger hPanel](https://hpanel.hostinger.com)
- [Leaflet Docs](https://leafletjs.com/)
- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
