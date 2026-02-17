# 🗺️ Map Engine v1.0 - Documentación Técnica

## 📋 Resumen Ejecutivo

**Map Engine** es un motor de mapas optimizado para hosting compartido que soluciona los problemas de:
- ✅ Titileo y carga incompleta de capas
- ✅ Consumo excesivo de memoria
- ✅ Renderizado incorrecto en contenedores dinámicos
- ✅ Animaciones que causan refrescos innecesarios

---

## 🎯 Problemas Solucionados

### 1. **Titileo de Capas** ❌ → ✅
**Problema:** El mapa cargaba parcialmente y parpadeaba.

**Solución:** 
```javascript
// Agregado setTimeout con invalidateSize()
setTimeout(() => {
  if (this.map) {
    this.map.invalidateSize();
  }
}, 200);
```

### 2. **Zoom Descontrolado** ❌ → ✅
**Problema:** El mapa intentaba cargar tiles de zoom muy lejanos.

**Solución:**
```javascript
zoom: {
  inicial: 14,
  minimo: 13,
  maximo: 15  // Rango muy reducido
}
```

### 3. **Fugas de Memoria** ❌ → ✅
**Problema:** Al recrear el mapa, los marcadores anteriores quedaban en memoria.

**Solución:**
```javascript
destruirMapa() {
  // Limpiar TODOS los elementos antes de remove()
  this.repartidoresMarkers.forEach(marker => this.map.removeLayer(marker));
  this.map.remove();
  this.map = null;
}
```

### 4. **Animaciones Pesadas** ❌ → ✅
**Problema:** El simulador refrescaba todo el mapa en cada movimiento.

**Solución:**
```javascript
// En lugar de recrear el marcador:
marker.setLatLng([lat, lng]);  // Solo mueve el existente
```

---

## 🏗️ Arquitectura

```
map-engine.js
├── ENSENADA_CONFIG          // Coordenadas y límites
├── ZONAS_COBERTURA          // 3 polígonos (Centro, Dique, Punta Lara)
├── ICONOS                   // Iconos personalizados
└── MapEngine (clase)
    ├── inicializar()        // Crear mapa con config robusta
    ├── destruirMapa()       // Limpiar memoria
    ├── dibujarZonasCobertura()  // Capas fijas livianas
    ├── agregarComercio()    // Marcador + círculo 3km
    ├── agregarRepartidor()  // Marcador dinámico
    ├── simularRecorridoEnsenada()  // Animación optimizada
    └── obtenerInfo()        // Estado del motor
```

---

## 🚀 Guía de Integración

### Paso 1: Incluir Leaflet y Map Engine

```html
<!-- En el <head> de panel-comercio.html -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

<!-- Antes de cerrar </body> -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="js/map-engine.js"></script>
```

### Paso 2: Crear Contenedor del Mapa

```html
<div id="mapa-comercio" style="width: 100%; height: 600px;"></div>
```

### Paso 3: Inicializar el Motor

```javascript
// En el script de panel-comercio.html

let motorMapa = null;

function inicializarMapaComercio() {
  // Obtener datos del comercio desde localStorage
  const comercioData = JSON.parse(localStorage.getItem('comercioData'));
  
  if (!comercioData || !comercioData.direccion_latitud) {
    console.error('No hay coordenadas del comercio');
    return;
  }

  // Crear instancia del motor
  motorMapa = new MapEngine();

  // Inicializar
  const exito = motorMapa.inicializar('mapa-comercio', {
    comercio: {
      lat: comercioData.direccion_latitud,
      lng: comercioData.direccion_longitud,
      nombre: comercioData.nombre_comercio,
      id: comercioData.id
    }
  });

  if (exito) {
    console.log('✅ Mapa del comercio inicializado');
    
    // Cargar repartidores cercanos
    cargarRepartidoresCercanos();
  }
}

// Ejecutar cuando se abre la pestaña del mapa
document.querySelector('[data-tab="mapa"]').addEventListener('click', () => {
  setTimeout(() => {
    if (!motorMapa || !motorMapa.map) {
      inicializarMapaComercio();
    }
  }, 100);
});
```

### Paso 4: Integrar con Socket.IO

```javascript
// Escuchar actualizaciones de repartidores en tiempo real
socket.on('ubicacionRepartidor', (data) => {
  if (motorMapa && motorMapa.map) {
    motorMapa.agregarRepartidor({
      id: data.repartidorId,
      lat: data.lat,
      lng: data.lng,
      nombre: data.nombre || 'Repartidor',
      disponible: !data.pedidoId,
      vehiculo: data.tipoVehiculo || 'Bicicleta',
      rating: data.rating || 4.5
    });
  }
});

// Cargar repartidores cercanos desde la API
async function cargarRepartidoresCercanos() {
  try {
    const response = await fetch('/api/map/repartidores-cercanos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        lat: motorMapa.comercioMarker.getLatLng().lat,
        lng: motorMapa.comercioMarker.getLatLng().lng,
        radio: 3000
      })
    });

    const data = await response.json();

    if (data.success && data.repartidores) {
      // Si no hay repartidores, mostrar mensaje
      if (data.repartidores.length === 0) {
        motorMapa.mostrarMensajeNoRepartidores();
      } else {
        motorMapa.ocultarMensajeNoRepartidores();
        
        // Agregar cada repartidor
        data.repartidores.forEach(rep => {
          motorMapa.agregarRepartidor({
            id: rep.repartidorId,
            lat: rep.lat,
            lng: rep.lng,
            nombre: rep.nombre,
            disponible: !rep.pedidoId,
            vehiculo: rep.tipoVehiculo,
            rating: rep.rating
          });
        });
      }
    }
  } catch (error) {
    console.error('Error cargando repartidores:', error);
  }
}

// Actualizar cada 30 segundos
setInterval(() => {
  if (motorMapa && motorMapa.map) {
    cargarRepartidoresCercanos();
  }
}, 30000);
```

---

## 🧪 Testing

### Prueba 1: Demo Standalone
```bash
# Abrir en navegador
http://localhost:3000/demo-map-engine.html

# Verificar:
✅ Mapa carga completamente sin titileo
✅ Zonas de cobertura visibles (azul, verde, naranja)
✅ Simulador mueve el marcador suavemente
✅ No hay errores en consola
```

### Prueba 2: Simulador de Repartidor
```bash
# Terminal 1: Servidor
node server.js

# Terminal 2: Simulador
node simulador-repartidor.js

# Navegador
http://localhost:3000/panel-comercio.html
# Click en "🗺️ Mapa de Repartidores"
# Verificar que aparece el repartidor moviéndose
```

### Prueba 3: Sin Repartidores
```bash
# NO ejecutar simulador-repartidor.js
# Abrir mapa en panel-comercio.html
# Verificar mensaje: "🔍 Buscando repartidores cercanos en Ensenada"
```

---

## 📊 Configuración de Zonas

### Centro Ensenada (Zona 1)
```javascript
{
  nombre: 'Centro Ensenada',
  color: '#3B82F6',        // Azul
  fillOpacity: 0.2,
  tiempoPromedio: '15-20 min',
  cobertura: 'alta',
  coordenadas: [
    [-34.8580, -57.9300],  // Noroeste
    [-34.8580, -57.9100],  // Noreste
    [-34.8750, -57.9100],  // Sureste
    [-34.8750, -57.9300],  // Suroeste
    [-34.8580, -57.9300]   // Cerrar polígono
  ]
}
```

### El Dique (Zona 2)
```javascript
{
  nombre: 'El Dique',
  color: '#10B981',        // Verde
  fillOpacity: 0.2,
  tiempoPromedio: '20-25 min',
  cobertura: 'media',
  coordenadas: [
    [-34.8400, -57.9350],
    [-34.8400, -57.9100],
    [-34.8570, -57.9100],
    [-34.8570, -57.9350],
    [-34.8400, -57.9350]
  ]
}
```

### Punta Lara (Zona 3)
```javascript
{
  nombre: 'Punta Lara',
  color: '#F59E0B',        // Naranja
  fillOpacity: 0.2,
  tiempoPromedio: '25-35 min',
  cobertura: 'baja',
  coordenadas: [
    [-34.8760, -57.9200],
    [-34.8760, -57.8950],
    [-34.9400, -57.8950],
    [-34.9400, -57.9200],
    [-34.8760, -57.9200]
  ]
}
```

---

## 🎨 Personalización de Iconos

```javascript
// Cambiar el ícono del comercio
ICONOS.comercio = L.divIcon({
  html: '<div style="font-size: 32px;">🏪</div>',
  className: 'map-icon-comercio',
  iconSize: [40, 40],
  iconAnchor: [20, 40]
});

// Cambiar el ícono del repartidor disponible
ICONOS.repartidorDisponible = L.divIcon({
  html: '<div style="font-size: 28px;">🚴</div>',
  className: 'map-icon-repartidor-disponible',
  iconSize: [36, 36],
  iconAnchor: [18, 36]
});
```

---

## ⚙️ Configuración Avanzada

### Ajustar Velocidad del Simulador
```javascript
motorMapa.simularRecorridoEnsenada('REP-001', {
  velocidad: 2000,   // 2 segundos entre puntos (más rápido)
  repetir: false     // No reiniciar al terminar
});
```

### Cambiar Radio de Cobertura
```javascript
// En map-engine.js, línea ~78
radioCobertura: 5000  // Cambiar de 3km a 5km
```

### Ajustar Límites de Zoom
```javascript
// En map-engine.js, línea ~73-77
zoom: {
  inicial: 15,    // Más cercano
  minimo: 14,
  maximo: 16
}
```

---

## 🐛 Troubleshooting

### Problema: Mapa no carga completamente
**Solución:**
```javascript
// Aumentar el delay de invalidateSize
setTimeout(() => {
  if (this.map) {
    this.map.invalidateSize();
  }
}, 300);  // Cambiar de 200ms a 300ms
```

### Problema: Marcadores no se actualizan
**Solución:**
```javascript
// Verificar que el ID del repartidor sea único y consistente
console.log('Repartidor ID:', repartidor.id);

// Forzar actualización
motorMapa.eliminarRepartidor(id);
motorMapa.agregarRepartidor(repartidor);
```

### Problema: Simulador no se detiene
**Solución:**
```javascript
// Forzar detención
motorMapa.simuladorActivo = false;
if (motorMapa.simuladorInterval) {
  clearTimeout(motorMapa.simuladorInterval);
  motorMapa.simuladorInterval = null;
}
```

### Problema: Fugas de memoria
**Solución:**
```javascript
// Destruir mapa antes de salir del tab
document.querySelector('[data-tab="otro"]').addEventListener('click', () => {
  if (motorMapa) {
    motorMapa.destruirMapa();
    motorMapa = null;
  }
});
```

---

## 📈 Optimizaciones para Producción

### 1. Minificar Tiles (CDN)
```javascript
// Cambiar a CDN más rápido
L.tileLayer('https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; Stadia Maps'
});
```

### 2. Reducir Frecuencia de Actualización
```javascript
// En lugar de 30 segundos, usar 60 segundos
setInterval(cargarRepartidoresCercanos, 60000);
```

### 3. Lazy Loading del Mapa
```javascript
// Solo inicializar cuando el usuario abre el tab
let mapaInicializado = false;

document.querySelector('[data-tab="mapa"]').addEventListener('click', () => {
  if (!mapaInicializado) {
    setTimeout(() => {
      inicializarMapaComercio();
      mapaInicializado = true;
    }, 100);
  }
});
```

---

## 📚 API Reference

### MapEngine.inicializar(containerId, opciones)
Crea e inicializa el mapa.

**Parámetros:**
- `containerId` (string): ID del elemento HTML
- `opciones.comercio` (object): `{ lat, lng, nombre, id }`

**Retorna:** `boolean` - true si fue exitoso

---

### MapEngine.agregarRepartidor(repartidor)
Agrega o actualiza un marcador de repartidor.

**Parámetros:**
- `repartidor` (object): `{ id, lat, lng, nombre, disponible, vehiculo, rating }`

---

### MapEngine.simularRecorridoEnsenada(repartidorId, opciones)
Inicia una simulación de trayectoria.

**Parámetros:**
- `repartidorId` (string): ID del repartidor
- `opciones.velocidad` (number): Milisegundos entre puntos (default: 3000)
- `opciones.repetir` (boolean): Reiniciar al terminar (default: true)

---

### MapEngine.destruirMapa()
Limpia memoria y destruye el mapa.

---

### MapEngine.obtenerInfo()
Retorna información del estado actual.

**Retorna:**
```javascript
{
  inicializado: boolean,
  centroActual: { lat, lng },
  zoomActual: number,
  cantidadRepartidores: number,
  zonasActivas: number,
  simuladorActivo: boolean
}
```

---

## 🎯 Checklist de Implementación

- [ ] Incluir Leaflet CSS y JS en el HTML
- [ ] Incluir map-engine.js
- [ ] Crear contenedor `<div id="mapa-comercio">`
- [ ] Inicializar el motor al abrir el tab del mapa
- [ ] Integrar con Socket.IO para actualizaciones en tiempo real
- [ ] Agregar función para cargar repartidores cercanos
- [ ] Implementar actualización periódica (30-60s)
- [ ] Manejar destrucción del mapa al cambiar de tab
- [ ] Probar con simulador-repartidor.js
- [ ] Verificar que no hay errores en consola
- [ ] Validar que no hay fugas de memoria (F12 → Memory)

---

## 📞 Soporte

Para reportar bugs o sugerir mejoras, contacta al equipo de desarrollo de YAvoy.

**Versión:** 1.0  
**Fecha:** 16 de febrero de 2026  
**Autor:** YAvoy Team

---

## 🔗 Archivos Relacionados

- `js/map-engine.js` - Motor principal
- `demo-map-engine.html` - Demo standalone
- `simulador-repartidor.js` - Simulador de trayectoria (backend)
- `panel-comercio.html` - Panel del comercio (integración)
- `src/services/locationService.js` - Servicio backend de geolocalización
