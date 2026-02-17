/**
 * ====================================
 * MAP ENGINE - YAvoy
 * ====================================
 * Motor de mapa optimizado para hosting compartido
 * Soluciona titileo, carga incompleta y consumo de memoria
 * 
 * Características:
 * - Inicialización robusta con invalidateSize()
 * - Zoom fijo para evitar carga de capas lejanas
 * - Capas de zonas estáticas y livianas
 * - Simulador de trayectoria sin refrescar mapa
 * - Gestión de memoria (destrucción antes de reinicializar)
 * 
 * @version 1.0
 * @author YAvoy Team
 */

// ========================================
// 📍 COORDENADAS Y CONFIGURACIÓN DE ENSENADA
// ========================================

const ENSENADA_CONFIG = {
  // Centro geográfico de Ensenada
  centro: {
    lat: -34.8667,
    lng: -57.9167
  },

  // Límites del Partido de Ensenada (ZONA OPERATIVA)
  limitesOperativos: {
    norte: -34.80,
    sur: -34.95,
    este: -57.90,
    oeste: -58.05
  },

  // Límites extendidos +10km (EXCEPTO HACIA EL MAR)
  limitesExtendidos: {
    norte: -34.71,  // +10km hacia el norte
    sur: -35.04,    // +10km hacia el sur
    este: -57.90,   // SIN CAMBIO (es el Río de la Plata)
    oeste: -58.14   // +10km hacia el oeste
  },

  // Configuración de zoom (más flexible para área extendida)
  zoom: {
    inicial: 13,
    minimo: 12,
    maximo: 17
  },

  // Radio de cobertura para buscar repartidores (metros)
  radioCobertura: 3000
};

// ========================================
// 🗺️ POLÍGONOS DE ZONAS DE COBERTURA
// ========================================

const ZONAS_COBERTURA = {
  // ZONA 1: Centro de Ensenada (Zona Urbana Principal)
  centro: {
    nombre: 'Centro Ensenada',
    color: '#3B82F6', // Azul
    fillOpacity: 0.2,
    tiempoPromedio: '15-20 min',
    cobertura: 'alta',
    coordenadas: [
      [-34.8580, -57.9300],
      [-34.8580, -57.9100],
      [-34.8750, -57.9100],
      [-34.8750, -57.9300],
      [-34.8580, -57.9300] // Cerrar polígono
    ]
  },

  // ZONA 2: El Dique (Zona Portuaria e Industrial)
  elDique: {
    nombre: 'El Dique',
    color: '#10B981', // Verde
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
  },

  // ZONA 3: Punta Lara (Zona Costera)
  puntaLara: {
    nombre: 'Punta Lara',
    color: '#F59E0B', // Naranja
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
};

// ========================================
// 🎨 ICONOS PERSONALIZADOS
// ========================================

const ICONOS = {
  comercio: L.divIcon({
    html: '<div style="font-size: 32px;">🏪</div>',
    className: 'map-icon-comercio',
    iconSize: [40, 40],
    iconAnchor: [20, 40]
  }),

  repartidorDisponible: L.divIcon({
    html: '<div style="font-size: 28px;">🚴</div>',
    className: 'map-icon-repartidor-disponible',
    iconSize: [36, 36],
    iconAnchor: [18, 36]
  }),

  repartidorOcupado: L.divIcon({
    html: '<div style="font-size: 28px;">🚴💼</div>',
    className: 'map-icon-repartidor-ocupado',
    iconSize: [36, 36],
    iconAnchor: [18, 36]
  }),

  cliente: L.divIcon({
    html: '<div style="font-size: 24px;">📍</div>',
    className: 'map-icon-cliente',
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  })
};

// ========================================
// 🏗️ CLASE MAP ENGINE
// ========================================

class MapEngine {
  constructor() {
    this.map = null;
    this.mapContainer = null;
    this.comercioMarker = null;
    this.repartidoresMarkers = new Map();
    this.zonasLayers = [];
    this.circuloCobertura = null;
    this.overlayNoRepartidores = null;
    this.overlayNieblaExpansion = null;  // Niebla para zonas de expansión
    this.simuladorActivo = false;
    this.simuladorInterval = null;
  }

  /**
   * Inicializar el mapa con configuración robusta
   * @param {string} containerId - ID del contenedor HTML del mapa
   * @param {Object} opciones - { comercio: { lat, lng, nombre, id } o { direccion, nombre, id } }
   */
  async inicializar(containerId, opciones = {}) {
    console.log('🗺️ Iniciando Map Engine v2.0...');

    // 1. OPTIMIZACIÓN DE MEMORIA: Destruir mapa existente
    this.destruirMapa();

    // 2. VALIDAR CONTENEDOR
    this.mapContainer = document.getElementById(containerId);
    if (!this.mapContainer) {
      console.error(`❌ Contenedor "${containerId}" no encontrado`);
      return false;
    }

    // 3. VALIDAR LEAFLET
    if (typeof L === 'undefined') {
      console.error('❌ Leaflet no está cargado');
      return false;
    }

    // 4. CREAR MAPA CON CONFIGURACIÓN ROBUSTA
    try {
      this.map = L.map(containerId, {
        center: [ENSENADA_CONFIG.centro.lat, ENSENADA_CONFIG.centro.lng],
        zoom: ENSENADA_CONFIG.zoom.inicial,
        minZoom: ENSENADA_CONFIG.zoom.minimo,
        maxZoom: ENSENADA_CONFIG.zoom.maximo,
        zoomControl: true,
        dragging: true,
        scrollWheelZoom: true,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: true,
        attributionControl: true,
        // Configuración para evitar problemas de renderizado
        fadeAnimation: false,
        zoomAnimation: true,
        markerZoomAnimation: true
      });

      console.log('✅ Mapa creado correctamente');

    } catch (error) {
      console.error('❌ Error al crear el mapa:', error);
      return false;
    }

    // 5. AGREGAR CAPA DE TILES (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: ENSENADA_CONFIG.zoom.maximo,
      minZoom: ENSENADA_CONFIG.zoom.minimo,
      // Optimización: Limitar carga de tiles a área extendida
      bounds: [
        [ENSENADA_CONFIG.limitesExtendidos.sur, ENSENADA_CONFIG.limitesExtendidos.oeste],
        [ENSENADA_CONFIG.limitesExtendidos.norte, ENSENADA_CONFIG.limitesExtendidos.este]
      ],
      // Reducir parpadeo
      updateWhenIdle: false,
      updateWhenZooming: false,
      keepBuffer: 2
    }).addTo(this.map);

    // 6. SOLUCIÓN AL TITILEO: invalidateSize con setTimeout
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
        console.log('✅ Mapa redimensionado (invalidateSize)');
      }
    }, 200);

    // 7. DIBUJAR ZONAS DE COBERTURA FIJAS
    this.dibujarZonasCobertura();

    // 8. DIBUJAR OVERLAY DE NIEBLA EN ZONAS NO OPERATIVAS
    this.crearOverlayExpansion();

    // 9. AGREGAR MARCADOR DEL COMERCIO (si se proporciona)
    if (opciones.comercio) {
      await this.agregarComercio(opciones.comercio);
    }

    console.log('✅ Map Engine inicializado correctamente');
    return true;
  }

  /**
   * Destruir mapa existente para evitar fugas de memoria
   */
  destruirMapa() {
    if (this.map) {
      console.log('🗑️ Destruyendo mapa anterior...');

      // Detener simulador si está activo
      this.detenerSimulador();

      // Limpiar marcadores
      this.repartidoresMarkers.forEach(marker => {
        this.map.removeLayer(marker);
      });
      this.repartidoresMarkers.clear();

      if (this.comercioMarker) {
        this.map.removeLayer(this.comercioMarker);
        this.comercioMarker = null;
      }

      if (this.circuloCobertura) {
        this.map.removeLayer(this.circuloCobertura);
        this.circuloCobertura = null;
      }

      if (this.overlayNoRepartidores) {
        this.map.removeLayer(this.overlayNoRepartidores);
        this.overlayNoRepartidores = null;
      }

      // Limpiar overlay de niebla de expansión
      if (this.overlayNieblaExpansion && Array.isArray(this.overlayNieblaExpansion)) {
        this.overlayNieblaExpansion.forEach(layer => {
          this.map.removeLayer(layer);
        });
        this.overlayNieblaExpansion = null;
      }

      // Limpiar zonas
      this.zonasLayers.forEach(layer => {
        this.map.removeLayer(layer);
      });
      this.zonasLayers = [];

      // Destruir mapa
      this.map.remove();
      this.map = null;

      console.log('✅ Mapa destruido correctamente');
    }
  }

  /**
   * Dibujar las zonas de cobertura como capas fijas y livianas
   */
  dibujarZonasCobertura() {
    if (!this.map) return;

    console.log('🎨 Dibujando zonas de cobertura...');

    // Dibujar cada zona
    Object.values(ZONAS_COBERTURA).forEach(zona => {
      const poligono = L.polygon(zona.coordenadas, {
        color: zona.color,
        fillColor: zona.color,
        fillOpacity: zona.fillOpacity,
        weight: 2,
        opacity: 0.6
      }).addTo(this.map);

      // Agregar popup informativo
      poligono.bindPopup(`
        <div style="text-align: center; padding: 8px;">
          <h4 style="margin: 0 0 8px 0; color: ${zona.color};">
            ${zona.nombre}
          </h4>
          <p style="margin: 4px 0; font-size: 13px;">
            <strong>Tiempo:</strong> ${zona.tiempoPromedio}
          </p>
          <p style="margin: 4px 0; font-size: 13px;">
            <strong>Cobertura:</strong> ${zona.cobertura}
          </p>
        </div>
      `);

      this.zonasLayers.push(poligono);
    });

    console.log(`✅ ${this.zonasLayers.length} zonas dibujadas`);
  }

  /**
   * Crear overlay de niebla para zonas de expansión futura
   * Muestra áreas extendidas con efecto de niebla y leyenda "Muy pronto disponible"
   */
  crearOverlayExpansion() {
    if (!this.map) return;

    console.log('🌫️ Creando overlay de expansión...');

    // Crear 4 rectángulos de niebla alrededor de la zona operativa
    
    // NIEBLA NORTE
    const nieblaNorte = L.rectangle([
      [ENSENADA_CONFIG.limitesExtendidos.norte, ENSENADA_CONFIG.limitesExtendidos.oeste],
      [ENSENADA_CONFIG.limitesOperativos.norte, ENSENADA_CONFIG.limitesExtendidos.este]
    ], {
      color: '#6b7280',
      fillColor: '#f3f4f6',
      fillOpacity: 0.7,
      weight: 1,
      opacity: 0.3,
      interactive: true
    }).addTo(this.map);

    nieblaNorte.bindPopup(`
      <div style="text-align: center; padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px;">
        <div style="font-size: 32px; margin-bottom: 8px;">🚀</div>
        <h3 style="margin: 0 0 8px 0; font-size: 16px;">Muy Pronto Disponible</h3>
        <p style="margin: 0; font-size: 13px; opacity: 0.9;">Estamos expandiendo nuestra cobertura a esta zona</p>
      </div>
    `);

    // NIEBLA SUR
    const nieblaSur = L.rectangle([
      [ENSENADA_CONFIG.limitesOperativos.sur, ENSENADA_CONFIG.limitesExtendidos.oeste],
      [ENSENADA_CONFIG.limitesExtendidos.sur, ENSENADA_CONFIG.limitesExtendidos.este]
    ], {
      color: '#6b7280',
      fillColor: '#f3f4f6',
      fillOpacity: 0.7,
      weight: 1,
      opacity: 0.3,
      interactive: true
    }).addTo(this.map);

    nieblaSur.bindPopup(`
      <div style="text-align: center; padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px;">
        <div style="font-size: 32px; margin-bottom: 8px;">🚀</div>
        <h3 style="margin: 0 0 8px 0; font-size: 16px;">Muy Pronto Disponible</h3>
        <p style="margin: 0; font-size: 13px; opacity: 0.9;">Estamos expandiendo nuestra cobertura a esta zona</p>
      </div>
    `);

    // NIEBLA OESTE
    const nieblaOeste = L.rectangle([
      [ENSENADA_CONFIG.limitesExtendidos.norte, ENSENADA_CONFIG.limitesExtendidos.oeste],
      [ENSENADA_CONFIG.limitesExtendidos.sur, ENSENADA_CONFIG.limitesOperativos.oeste]
    ], {
      color: '#6b7280',
      fillColor: '#f3f4f6',
      fillOpacity: 0.7,
      weight: 1,
      opacity: 0.3,
      interactive: true
    }).addTo(this.map);

    nieblaOeste.bindPopup(`
      <div style="text-align: center; padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px;">
        <div style="font-size: 32px; margin-bottom: 8px;">🚀</div>
        <h3 style="margin: 0 0 8px 0; font-size: 16px;">Muy Pronto Disponible</h3>
        <p style="margin: 0; font-size: 13px; opacity: 0.9;">Estamos expandiendo nuestra cobertura a esta zona</p>
      </div>
    `);

    // Guardar referencia para destrucción
    this.overlayNieblaExpansion = [nieblaNorte, nieblaSur, nieblaOeste];

    // Agregar leyenda flotante
    this.agregarLeyendaExpansion();

    console.log('✅ Overlay de expansión creado');
  }

  /**
   * Agregar leyenda flotante para zonas de expansión
   */
  agregarLeyendaExpansion() {
    if (!this.map) return;

    const leyenda = L.control({ position: 'bottomright' });

    leyenda.onAdd = function() {
      const div = L.DomUtil.create('div', 'legend-expansion');
      div.innerHTML = `
        <div style="
          background: white;
          padding: 12px 16px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          font-size: 13px;
          line-height: 1.6;
        ">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <div style="width: 20px; height: 20px; background: #f3f4f6; border: 1px solid #6b7280; border-radius: 4px; opacity: 0.7;"></div>
            <span style="font-weight: 600; color: #374151;">Zona de Expansión</span>
          </div>
          <div style="font-size: 11px; color: #6b7280;">
            🚀 Próximamente disponible
          </div>
        </div>
      `;
      return div;
    };

    leyenda.addTo(this.map);
  }

  /**
   * Geocodificar dirección a coordenadas usando Nominatim (OpenStreetMap)
   * @param {string} direccion - Dirección completa (ej: "Calle 50 123, Ensenada")
   * @returns {Promise<{lat: number, lng: number}>}
   */
  async geocodificarDireccion(direccion) {
    try {
      console.log(`🔍 Geocodificando: ${direccion}`);

      // Agregar "Ensenada, Buenos Aires" si no está en la dirección
      let direccionCompleta = direccion;
      if (!direccion.toLowerCase().includes('ensenada')) {
        direccionCompleta += ', Ensenada, Buenos Aires, Argentina';
      }

      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(direccionCompleta)}&limit=1&countrycodes=ar`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'YAvoy-MapEngine/1.0'
        }
      });

      if (!response.ok) {
        throw new Error('Error en la API de geocodificación');
      }

      const data = await response.json();

      if (data && data.length > 0) {
        const resultado = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          displayName: data[0].display_name
        };

        console.log(`✅ Dirección geocodificada: ${resultado.lat}, ${resultado.lng}`);
        return resultado;
      } else {
        console.warn('⚠️ No se encontraron resultados para la dirección');
        return null;
      }

    } catch (error) {
      console.error('❌ Error en geocodificación:', error);
      return null;
    }
  }

  /**
   * Agregar marcador del comercio y círculo de cobertura
   * Soporta geocodificación automática si se proporciona dirección
   * @param {Object} comercio - { lat, lng, nombre, id } o { direccion, nombre, id }
   */
  async agregarComercio(comercio) {
    if (!this.map) return;

    console.log('🏪 Agregando comercio al mapa...');

    let lat, lng;

    // OPCIÓN 1: Coordenadas directas
    if (comercio.lat && comercio.lng) {
      lat = comercio.lat;
      lng = comercio.lng;
    }
    // OPCIÓN 2: Geocodificar dirección
    else if (comercio.direccion) {
      const resultado = await this.geocodificarDireccion(comercio.direccion);
      
      if (resultado) {
        lat = resultado.lat;
        lng = resultado.lng;
        console.log(`✅ Comercio ubicado en: ${resultado.displayName}`);
      } else {
        console.error('❌ No se pudo geocodificar la dirección del comercio');
        // Usar centro de Ensenada por defecto
        lat = ENSENADA_CONFIG.centro.lat;
        lng = ENSENADA_CONFIG.centro.lng;
        console.warn('⚠️ Usando centro de Ensenada como posición por defecto');
      }
    }
    // OPCIÓN 3: Sin ubicación, usar centro
    else {
      lat = ENSENADA_CONFIG.centro.lat;
      lng = ENSENADA_CONFIG.centro.lng;
      console.warn('⚠️ Sin coordenadas ni dirección, usando centro de Ensenada');
    }

    // Marcador del comercio
    this.comercioMarker = L.marker(
      [lat, lng],
      { icon: ICONOS.comercio }
    ).addTo(this.map);

    const popupContent = `
      <div style="text-align: center; padding: 8px;">
        <h3 style="margin: 0 0 8px 0;">🏪 ${comercio.nombre}</h3>
        <p style="margin: 4px 0; font-size: 13px;">
          📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}
        </p>
        ${comercio.direccion ? `<p style="margin: 4px 0; font-size: 12px; color: #6b7280;">${comercio.direccion}</p>` : ''}
      </div>
    `;

    this.comercioMarker.bindPopup(popupContent).openPopup();

    // Círculo de cobertura (3 km)
    this.circuloCobertura = L.circle(
      [lat, lng],
      {
        color: '#06b6d4',
        fillColor: '#06b6d4',
        fillOpacity: 0.1,
        radius: ENSENADA_CONFIG.radioCobertura,
        weight: 2
      }
    ).addTo(this.map);

    // Centrar mapa en el comercio
    this.map.setView([lat, lng], ENSENADA_CONFIG.zoom.inicial);

    console.log('✅ Comercio agregado al mapa');
  }

  /**
   * Agregar o actualizar marcador de repartidor
   * @param {Object} repartidor - { id, lat, lng, nombre, disponible, vehiculo, rating }
   */
  agregarRepartidor(repartidor) {
    if (!this.map) return;

    const { id, lat, lng, nombre, disponible, vehiculo, rating } = repartidor;

    // Si ya existe, actualizar posición (sin refrescar mapa)
    if (this.repartidoresMarkers.has(id)) {
      const marker = this.repartidoresMarkers.get(id);
      marker.setLatLng([lat, lng]);
      return;
    }

    // Crear nuevo marcador
    const icono = disponible ? ICONOS.repartidorDisponible : ICONOS.repartidorOcupado;
    const marker = L.marker([lat, lng], { icon: icono }).addTo(this.map);

    marker.bindPopup(`
      <div style="text-align: center; padding: 8px;">
        <h4 style="margin: 0 0 8px 0;">🚴 ${nombre}</h4>
        <p style="margin: 4px 0; font-size: 13px;">
          <strong>Estado:</strong> ${disponible ? '🟢 Disponible' : '🔴 Ocupado'}
        </p>
        <p style="margin: 4px 0; font-size: 13px;">
          <strong>Vehículo:</strong> ${vehiculo || 'Bicicleta'}
        </p>
        <p style="margin: 4px 0; font-size: 13px;">
          <strong>Rating:</strong> ${rating || '4.5'} ⭐
        </p>
      </div>
    `);

    this.repartidoresMarkers.set(id, marker);
    console.log(`✅ Repartidor ${id} agregado al mapa`);
  }

  /**
   * Eliminar marcador de repartidor
   * @param {string} id - ID del repartidor
   */
  eliminarRepartidor(id) {
    if (this.repartidoresMarkers.has(id)) {
      const marker = this.repartidoresMarkers.get(id);
      this.map.removeLayer(marker);
      this.repartidoresMarkers.delete(id);
      console.log(`✅ Repartidor ${id} eliminado del mapa`);
    }
  }

  /**
   * Limpiar todos los marcadores de repartidores
   */
  limpiarRepartidores() {
    this.repartidoresMarkers.forEach((marker, id) => {
      this.map.removeLayer(marker);
    });
    this.repartidoresMarkers.clear();
    console.log('✅ Todos los repartidores eliminados');
  }

  /**
   * Mostrar mensaje cuando no hay repartidores
   */
  mostrarMensajeNoRepartidores() {
    if (this.overlayNoRepartidores || !this.map) return;

    const center = this.map.getCenter();

    this.overlayNoRepartidores = L.marker(center, {
      icon: L.divIcon({
        className: 'no-repartidores-overlay',
        html: `
          <div style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 16px;
            padding: 24px 32px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            text-align: center;
            color: white;
            min-width: 300px;
          ">
            <div style="font-size: 48px; margin-bottom: 12px; animation: pulse 2s infinite;">
              🔍
            </div>
            <h3 style="margin: 0 0 8px 0; font-size: 18px;">
              Buscando repartidores cercanos
            </h3>
            <p style="margin: 0; font-size: 14px; opacity: 0.9;">
              En este momento no hay repartidores disponibles en Ensenada
            </p>
            <p style="margin: 12px 0 0 0; font-size: 13px; opacity: 0.8; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 12px;">
              📍 Radio: <strong>3 km</strong> | 🔄 Actualización: <strong>30s</strong>
            </p>
          </div>
        `,
        iconSize: [350, 200],
        iconAnchor: [175, 100]
      }),
      interactive: false
    }).addTo(this.map);

    console.log('✅ Mensaje de no repartidores mostrado');
  }

  /**
   * Ocultar mensaje de no repartidores
   */
  ocultarMensajeNoRepartidores() {
    if (this.overlayNoRepartidores) {
      this.map.removeLayer(this.overlayNoRepartidores);
      this.overlayNoRepartidores = null;
      console.log('✅ Mensaje de no repartidores ocultado');
    }
  }

  /**
   * ========================================
   * SIMULADOR DE TRAYECTORIA OPTIMIZADO
   * ========================================
   * Mueve el marcador sin refrescar el mapa
   */

  /**
   * Iniciar simulación de recorrido de repartidor
   * @param {string} repartidorId - ID del repartidor a simular
   * @param {Object} opciones - { velocidad: ms entre puntos, repetir: boolean }
   */
  simularRecorridoEnsenada(repartidorId = 'SIM-REPARTIDOR-001', opciones = {}) {
    if (this.simuladorActivo) {
      console.warn('⚠️ Ya hay una simulación activa');
      return;
    }

    const velocidad = opciones.velocidad || 3000; // 3 segundos por defecto
    const repetir = opciones.repetir !== false; // true por defecto

    console.log('🚀 Iniciando simulación de recorrido...');

    // Ruta simulada: Centro → Punta Lara (15 puntos)
    const rutaSimulada = [
      { lat: -34.8667, lng: -57.9167, zona: 'Centro Ensenada' },
      { lat: -34.8700, lng: -57.9155, zona: 'Centro Ensenada' },
      { lat: -34.8740, lng: -57.9145, zona: 'Centro Ensenada' },
      { lat: -34.8780, lng: -57.9135, zona: 'Entre zonas' },
      { lat: -34.8820, lng: -57.9125, zona: 'Punta Lara' },
      { lat: -34.8860, lng: -57.9115, zona: 'Punta Lara' },
      { lat: -34.8900, lng: -57.9105, zona: 'Punta Lara' },
      { lat: -34.8940, lng: -57.9095, zona: 'Punta Lara' },
      { lat: -34.8980, lng: -57.9085, zona: 'Punta Lara' },
      { lat: -34.9020, lng: -57.9075, zona: 'Punta Lara' },
      { lat: -34.9060, lng: -57.9065, zona: 'Punta Lara' },
      { lat: -34.9100, lng: -57.9055, zona: 'Punta Lara' },
      { lat: -34.9140, lng: -57.9045, zona: 'Punta Lara' }
    ];

    let puntoActual = 0;

    // Agregar repartidor simulado si no existe
    if (!this.repartidoresMarkers.has(repartidorId)) {
      this.agregarRepartidor({
        id: repartidorId,
        lat: rutaSimulada[0].lat,
        lng: rutaSimulada[0].lng,
        nombre: 'Simulador Test',
        disponible: true,
        vehiculo: 'Bicicleta',
        rating: 4.8
      });
    }

    // Ocultar mensaje de no repartidores si está visible
    this.ocultarMensajeNoRepartidores();

    this.simuladorActivo = true;

    // Función de animación
    const animar = () => {
      if (!this.simuladorActivo) return;

      const punto = rutaSimulada[puntoActual];
      const marker = this.repartidoresMarkers.get(repartidorId);

      if (marker) {
        // OPTIMIZACIÓN: Usar setLatLng en lugar de recrear el marcador
        marker.setLatLng([punto.lat, punto.lng]);
        
        // Actualizar popup
        marker.setPopupContent(`
          <div style="text-align: center; padding: 8px;">
            <h4 style="margin: 0 0 8px 0;">🚴 Simulador Test</h4>
            <p style="margin: 4px 0; font-size: 13px;">
              <strong>Estado:</strong> 🟢 En movimiento
            </p>
            <p style="margin: 4px 0; font-size: 13px;">
              <strong>Zona:</strong> ${punto.zona}
            </p>
            <p style="margin: 4px 0; font-size: 13px;">
              <strong>Punto:</strong> ${puntoActual + 1}/${rutaSimulada.length}
            </p>
          </div>
        `);

        console.log(`📍 Simulador: ${punto.zona} [${puntoActual + 1}/${rutaSimulada.length}]`);
      }

      puntoActual++;

      // Si llegó al final
      if (puntoActual >= rutaSimulada.length) {
        if (repetir) {
          puntoActual = 0; // Volver al inicio
          console.log('🔄 Simulación: volviendo al inicio...');
        } else {
          this.detenerSimulador();
          console.log('✅ Simulación completada');
          return;
        }
      }

      // Programar siguiente punto
      this.simuladorInterval = setTimeout(animar, velocidad);
    };

    // Iniciar animación
    animar();

    console.log('✅ Simulación iniciada');
  }

  /**
   * Detener el simulador de recorrido
   */
  detenerSimulador() {
    if (this.simuladorInterval) {
      clearTimeout(this.simuladorInterval);
      this.simuladorInterval = null;
    }
    this.simuladorActivo = false;
    console.log('⏹️ Simulador detenido');
  }

  /**
   * Verificar si el simulador está activo
   */
  get simuladorEstaActivo() {
    return this.simuladorActivo;
  }

  /**
   * Obtener información del mapa
   */
  obtenerInfo() {
    return {
      inicializado: this.map !== null,
      centroActual: this.map ? this.map.getCenter() : null,
      zoomActual: this.map ? this.map.getZoom() : null,
      cantidadRepartidores: this.repartidoresMarkers.size,
      zonasActivas: this.zonasLayers.length,
      simuladorActivo: this.simuladorActivo
    };
  }
}

// ========================================
// 📤 EXPORTAR
// ========================================

// Crear instancia global (singleton)
if (typeof window !== 'undefined') {
  window.MapEngine = MapEngine;
  window.ENSENADA_CONFIG = ENSENADA_CONFIG;
  window.ZONAS_COBERTURA = ZONAS_COBERTURA;
  
  console.log('✅ Map Engine v1.0 cargado correctamente');
}

// Para Node.js (si se usa con módulos)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MapEngine, ENSENADA_CONFIG, ZONAS_COBERTURA };
}
