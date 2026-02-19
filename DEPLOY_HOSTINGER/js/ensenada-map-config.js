/**
 * ====================================
 * CONFIGURACIÓN DEL MAPA DE ENSENADA
 * ====================================
 * Sistema de mapas nivel Enterprise para Ensenada, Buenos Aires
 * 
 * Coordenadas del Partido de Ensenada:
 * - Norte: -34.80° (límite con La Plata)
 * - Sur: -34.95° (Punta Lara)
 * - Oeste: -58.05° (interior)
 * - Este: -57.90° (costa del Río de la Plata)
 */

// ========================================
// 1️⃣ BOUNDING BOX DE ENSENADA
// ========================================
const ENSENADA_BOUNDS = {
  north: -34.80,
  south: -34.95,
  west: -58.05,
  east: -57.90
};

// Convertir a formato Leaflet [[latSur, lngOeste], [latNorte, lngEste]]
const ENSENADA_LEAFLET_BOUNDS = [
  [ENSENADA_BOUNDS.south, ENSENADA_BOUNDS.west],
  [ENSENADA_BOUNDS.north, ENSENADA_BOUNDS.east]
];

// ========================================
// 2️⃣ CENTRO GEOGRÁFICO DE ENSENADA
// ========================================
const ENSENADA_CENTER = {
  lat: -34.8667,
  lng: -57.9167
};

// ========================================
// 3️⃣ ZONAS OPERATIVAS (GeoJSON Polygons)
// ========================================

// 📍 ZONA 1: CENTRO DE ENSENADA
const ZONA_CENTRO = {
  type: 'Feature',
  properties: {
    nombre: 'Centro Ensenada',
    descripcion: 'Zona comercial principal',
    color: '#3B82F6', // Azul
    cobertura: 'alta',
    tiempoPromedio: '15-20 min'
  },
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [-57.9300, -34.8580], // Noroeste
      [-57.9100, -34.8580], // Noreste
      [-57.9100, -34.8750], // Sureste
      [-57.9300, -34.8750], // Suroeste
      [-57.9300, -34.8580]  // Cierre del polígono
    ]]
  }
};

// 📍 ZONA 2: EL DIQUE
const ZONA_DIQUE = {
  type: 'Feature',
  properties: {
    nombre: 'El Dique',
    descripcion: 'Zona portuaria e industrial',
    color: '#10B981', // Verde
    cobertura: 'media',
    tiempoPromedio: '20-25 min'
  },
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [-57.9200, -34.8400], // Noroeste
      [-57.9000, -34.8400], // Noreste
      [-57.9000, -34.8580], // Sureste
      [-57.9200, -34.8580], // Suroeste
      [-57.9200, -34.8400]  // Cierre
    ]]
  }
};

// 📍 ZONA 3: PUNTA LARA
const ZONA_PUNTA_LARA = {
  type: 'Feature',
  properties: {
    nombre: 'Punta Lara',
    descripcion: 'Zona costera y reserva natural',
    color: '#F59E0B', // Naranja
    cobertura: 'baja',
    tiempoPromedio: '25-35 min'
  },
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [-57.9300, -34.8750], // Noroeste
      [-57.9000, -34.8750], // Noreste
      [-57.9000, -34.9200], // Sureste
      [-57.9300, -34.9200], // Suroeste
      [-57.9300, -34.8750]  // Cierre
    ]]
  }
};

// Colección de todas las zonas
const ZONAS_OPERATIVAS = [ZONA_CENTRO, ZONA_DIQUE, ZONA_PUNTA_LARA];

// ========================================
// 4️⃣ CONFIGURACIÓN DE LEAFLET
// ========================================
const LEAFLET_CONFIG = {
  // Límites estrictos del mapa (no permite navegación fuera)
  maxBounds: ENSENADA_LEAFLET_BOUNDS,
  maxBoundsViscosity: 1.0, // No permite scroll fuera (totalmente bloqueado)
  
  // Nivel de zoom
  minZoom: 12,  // No se puede alejar más (vista general de Ensenada)
  maxZoom: 18,  // Zoom máximo (nivel de calle)
  zoom: 14,     // Zoom inicial (vista balanceada)
  
  // Centro del mapa
  center: [ENSENADA_CENTER.lat, ENSENADA_CENTER.lng],
  
  // Opciones de interacción
  scrollWheelZoom: true,
  doubleClickZoom: true,
  touchZoom: true,
  dragging: true,
  
  // Atribución
  attributionControl: true,
  attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> | YAvoy'
};

// ========================================
// 5️⃣ TILES DE MAPA (OpenStreetMap)
// ========================================
const TILE_LAYER_OPTIONS = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
  maxZoom: 19,
  subdomains: ['a', 'b', 'c']
};

// ========================================
// 6️⃣ ESTILOS DE POLÍGONOS (Zonas)
// ========================================
function getZoneStyle(zona) {
  return {
    color: zona.properties.color,       // Color del borde
    fillColor: zona.properties.color,   // Color de relleno
    fillOpacity: 0.2,                   // Transparencia (20%)
    weight: 2,                          // Grosor del borde
    opacity: 0.6,                       // Opacidad del borde
    dashArray: '5, 5'                   // Línea punteada
  };
}

// ========================================
// 7️⃣ MARCADORES PERSONALIZADOS
// ========================================
const ICONOS = {
  comercio: {
    html: '🏪',
    className: 'marker-comercio',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  },
  repartidor_disponible: {
    html: '🚴',
    className: 'marker-repartidor-disponible',
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35]
  },
  repartidor_ocupado: {
    html: '🚴💼',
    className: 'marker-repartidor-ocupado',
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35]
  },
  cliente: {
    html: '📍',
    className: 'marker-cliente',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  }
};

// ========================================
// 8️⃣ VALIDACIÓN DE COORDENADAS
// ========================================
function coordenadasDentroDeEnsenada(lat, lng) {
  return lat >= ENSENADA_BOUNDS.south &&
         lat <= ENSENADA_BOUNDS.north &&
         lng >= ENSENADA_BOUNDS.west &&
         lng <= ENSENADA_BOUNDS.east;
}

function obtenerZonaPorCoordenadas(lat, lng) {
  // Verificar en qué zona operativa está el punto
  for (const zona of ZONAS_OPERATIVAS) {
    if (puntoEnPoligono([lat, lng], zona.geometry.coordinates[0])) {
      return zona.properties.nombre;
    }
  }
  return 'Fuera de zona de servicio';
}

// Algoritmo Ray Casting para detectar punto en polígono
function puntoEnPoligono(punto, poligono) {
  const [lat, lng] = punto;
  let dentro = false;
  
  for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i++) {
    const [lngI, latI] = poligono[i];
    const [lngJ, latJ] = poligono[j];
    
    const intersecta = ((latI > lat) !== (latJ > lat)) &&
                       (lng < (lngJ - lngI) * (lat - latI) / (latJ - latI) + lngI);
    
    if (intersecta) dentro = !dentro;
  }
  
  return dentro;
}

// ========================================
// 9️⃣ RADIO DE COBERTURA POR ZONA
// ========================================
const RADIO_COBERTURA = {
  'Centro Ensenada': 3000,    // 3 km
  'El Dique': 2500,            // 2.5 km
  'Punta Lara': 4000,          // 4 km (zona más extensa)
  default: 3000
};

// ========================================
// 🔟 EXPORTAR CONFIGURACIÓN
// ========================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ENSENADA_BOUNDS,
    ENSENADA_LEAFLET_BOUNDS,
    ENSENADA_CENTER,
    ZONA_CENTRO,
    ZONA_DIQUE,
    ZONA_PUNTA_LARA,
    ZONAS_OPERATIVAS,
    LEAFLET_CONFIG,
    TILE_LAYER_OPTIONS,
    ICONOS,
    RADIO_COBERTURA,
    getZoneStyle,
    coordenadasDentroDeEnsenada,
    obtenerZonaPorCoordenadas,
    puntoEnPoligono
  };
}
