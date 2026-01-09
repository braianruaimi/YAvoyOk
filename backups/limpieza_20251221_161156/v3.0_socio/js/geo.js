/**
 * 🗺️ Sistema de Geolocalización y Mapas en Tiempo Real - YaVoy
 * Integración con Google Maps API para rastreo de repartidores
 */

class GeoLocationManager {
  constructor(config = {}) {
    this.apiKey = config.apiKey || 'YOUR_GOOGLE_MAPS_API_KEY';
    this.map = null;
    this.markers = new Map();
    this.polylines = new Map();
    this.infoWindows = new Map();
    this.watchId = null;
    this.isTracking = false;
    this.updateInterval = config.updateInterval || 10000; // 10 segundos
    this.socket = config.socket || null;
    
    // Centro por defecto (Buenos Aires)
    this.defaultCenter = {
      lat: -34.6037,
      lng: -58.3816
    };
    
    // Almacenamiento local
    this.locationHistory = new Map();
    this.deliveryRoutes = new Map();
  }

  /**
   * Inicializa el mapa en un contenedor
   */
  initMap(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Contenedor ${containerId} no encontrado`);
      return;
    }

    this.map = new google.maps.Map(container, {
      zoom: 15,
      center: this.defaultCenter,
      mapTypeId: 'roadmap',
      zoomControl: true,
      mapTypeControl: false,
      fullscreenControl: true,
      streetViewControl: false,
      styles: this.getMapStyles()
    });

    // Listeners del mapa
    this.map.addListener('zoom_changed', () => this.onMapZoomChanged());
  }

  /**
   * Estilos del mapa adaptados al tema
   */
  getMapStyles() {
    const isDark = themeManager?.getCurrentTheme?.() === 'dark';
    
    if (isDark) {
      return [
        { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
        {
          featureType: 'administrative.locality',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#d59563' }]
        },
        {
          featureType: 'poi',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#d59563' }]
        },
        {
          featureType: 'poi.park',
          elementType: 'geometry',
          stylers: [{ color: '#263c3f' }]
        },
        {
          featureType: 'poi.park',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#6b9080' }]
        },
        {
          featureType: 'road',
          elementType: 'geometry',
          stylers: [{ color: '#38414e' }]
        },
        {
          featureType: 'road',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#212a37' }]
        },
        {
          featureType: 'road',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#9ca5b3' }]
        },
        {
          featureType: 'road.highway',
          elementType: 'geometry',
          stylers: [{ color: '#746855' }]
        },
        {
          featureType: 'road.highway',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#1f2835' }]
        },
        {
          featureType: 'road.highway',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#f3751ff' }]
        },
        {
          featureType: 'transit',
          elementType: 'geometry',
          stylers: [{ color: '#2f3948' }]
        },
        {
          featureType: 'transit.station',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#d59563' }]
        },
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{ color: '#17263c' }]
        },
        {
          featureType: 'water',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#515c6d' }]
        },
        {
          featureType: 'water',
          elementType: 'labels.text.stroke',
          stylers: [{ color: '#17263c' }]
        }
      ];
    }
    
    return [];
  }

  /**
   * Comienza a rastrear ubicación del usuario
   */
  startTracking(userId, userType = 'repartidor') {
    if (!navigator.geolocation) {
      console.error('Geolocation no soportada');
      return;
    }

    this.isTracking = true;
    console.log(`📍 Rastreo iniciado para ${userId} (${userType})`);

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.onLocationSuccess(position, userId, userType),
      (error) => this.onLocationError(error),
      options
    );
  }

  /**
   * Detiene el rastreo de ubicación
   */
  stopTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.isTracking = false;
      console.log('📍 Rastreo detenido');
    }
  }

  /**
   * Maneja actualización exitosa de ubicación
   */
  onLocationSuccess(position, userId, userType) {
    const { latitude, longitude, accuracy } = position.coords;
    const location = { lat: latitude, lng: longitude, accuracy, timestamp: Date.now() };

    // Guardar en historial
    if (!this.locationHistory.has(userId)) {
      this.locationHistory.set(userId, []);
    }
    this.locationHistory.get(userId).push(location);

    // Actualizar marcador en mapa
    this.updateMarker(userId, location, userType);

    // Emitir a servidor via Socket.IO
    if (this.socket) {
      this.socket.emit('ubicacionActualizada', {
        userId,
        userType,
        ubicacion: location
      });
    }

    // Mostrar en consola (desarrollo)
    console.log(`📍 ${userId}: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
  }

  /**
   * Maneja errores de geolocation
   */
  onLocationError(error) {
    const errors = {
      1: 'Permiso denegado para acceder a ubicación',
      2: 'Ubicación no disponible',
      3: 'Tiempo de espera agotado'
    };
    console.error('❌ Error de geolocation:', errors[error.code] || error.message);
  }

  /**
   * Actualiza o crea marcador en el mapa
   */
  updateMarker(userId, location, userType = 'repartidor') {
    const { lat, lng } = location;

    if (this.markers.has(userId)) {
      // Actualizar marcador existente
      const marker = this.markers.get(userId);
      marker.setPosition({ lat, lng });
    } else {
      // Crear nuevo marcador
      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: this.map,
        title: userId,
        icon: this.getMarkerIcon(userType)
      });

      // Listener para información
      marker.addListener('click', () => this.showMarkerInfo(userId, userType));
      this.markers.set(userId, marker);
    }

    // Centrar mapa en usuario si es necesario
    if (navigator.geolocation && this.isTracking) {
      this.map.panTo({ lat, lng });
    }
  }

  /**
   * Obtiene icono personalizado según tipo de usuario
   */
  getMarkerIcon(userType) {
    const colors = {
      repartidor: '#667eea',
      cliente: '#10b981',
      comercio: '#f59e0b',
      ceo: '#ef4444'
    };

    const color = colors[userType] || '#667eea';

    return {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: color,
      fillOpacity: 0.9,
      strokeColor: '#ffffff',
      strokeWeight: 2
    };
  }

  /**
   * Muestra información del marcador
   */
  showMarkerInfo(userId, userType) {
    if (this.infoWindows.has(userId)) {
      const infoWindow = this.infoWindows.get(userId);
      infoWindow.close();
      this.infoWindows.delete(userId);
      return;
    }

    const location = this.locationHistory.get(userId)?.[0];
    if (!location) return;

    const content = `
      <div style="padding: 10px; min-width: 200px;">
        <h3 style="margin: 0 0 10px 0;">${userId}</h3>
        <p><strong>Tipo:</strong> ${userType}</p>
        <p><strong>Lat:</strong> ${location.lat.toFixed(4)}</p>
        <p><strong>Lng:</strong> ${location.lng.toFixed(4)}</p>
        <p><strong>Precisión:</strong> ±${Math.round(location.accuracy)}m</p>
        <button onclick="geoManager.trazeRuta('${userId}')" 
                style="width: 100%; padding: 8px; margin-top: 10px; 
                       background: #667eea; color: white; border: none; 
                       border-radius: 4px; cursor: pointer;">
          Trazar Ruta
        </button>
      </div>
    `;

    const infoWindow = new google.maps.InfoWindow({ content });
    const marker = this.markers.get(userId);
    
    if (marker) {
      infoWindow.open(this.map, marker);
      this.infoWindows.set(userId, infoWindow);
    }
  }

  /**
   * Traza ruta entre dos puntos
   */
  trazeRuta(repartidorId, destinoId = null) {
    const service = new google.maps.DirectionsService();
    const renderer = new google.maps.DirectionsRenderer({
      map: this.map,
      polylineOptions: {
        strokeColor: '#667eea',
        strokeWeight: 4,
        strokeOpacity: 0.8
      }
    });

    const origen = this.markers.get(repartidorId)?.getPosition();
    if (!origen) return;

    const destino = destinoId 
      ? this.markers.get(destinoId)?.getPosition()
      : new google.maps.LatLng(-34.6158, -58.4336); // Centro CABA por defecto

    service.route(
      {
        origin: origen,
        destination: destino,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
          renderer.setDirections(result);
          
          // Guardar ruta
          this.deliveryRoutes.set(repartidorId, {
            ruta: result,
            distancia: result.routes[0].legs[0].distance.text,
            duracion: result.routes[0].legs[0].duration.text
          });

          // Emitir información
          if (this.socket) {
            this.socket.emit('rutaTrazada', {
              repartidorId,
              distancia: result.routes[0].legs[0].distance.value,
              duracion: result.routes[0].legs[0].duration.value
            });
          }
        } else {
          console.error('Error al trazar ruta:', status);
        }
      }
    );
  }

  /**
   * Calcula ETA dinámico para entrega
   */
  calcularETA(repartidorId, destinoLatLng) {
    if (!this.deliveryRoutes.has(repartidorId)) {
      return null;
    }

    const ruta = this.deliveryRoutes.get(repartidorId);
    const duracion = ruta.ruta.routes[0].legs[0].duration.value; // en segundos
    const ahora = new Date();
    const eta = new Date(ahora.getTime() + duracion * 1000);

    return {
      segundos: duracion,
      minutos: Math.ceil(duracion / 60),
      eta: eta.toLocaleTimeString('es-AR'),
      distancia: ruta.distancia
    };
  }

  /**
   * Obtiene distancia entre dos puntos
   */
  async obtenerDistancia(lat1, lng1, lat2, lng2) {
    const service = new google.maps.DistanceMatrixService();
    
    const response = await service.getDistanceMatrix({
      origins: [new google.maps.LatLng(lat1, lng1)],
      destinations: [new google.maps.LatLng(lat2, lng2)],
      travelMode: 'DRIVING'
    });

    if (response.rows[0].elements[0].status === 'OK') {
      const element = response.rows[0].elements[0];
      return {
        distancia: element.distance.text,
        distanciaMetros: element.distance.value,
        duracion: element.duration.text,
        duracionSegundos: element.duration.value
      };
    }

    return null;
  }

  /**
   * Obtiene dirección desde coordenadas (Geocoding inverso)
   */
  async obtenerDireccion(lat, lng) {
    const geocoder = new google.maps.Geocoder();
    
    return new Promise((resolve, reject) => {
      geocoder.geocode(
        { location: { lat, lng } },
        (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results[0]) {
            resolve(results[0].formatted_address);
          } else {
            reject(new Error('No se pudo obtener dirección'));
          }
        }
      );
    });
  }

  /**
   * Obtiene coordenadas desde dirección
   */
  async obtenerCoordenadas(direccion) {
    const geocoder = new google.maps.Geocoder();
    
    return new Promise((resolve, reject) => {
      geocoder.geocode({ address: direccion }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results[0]) {
          const location = results[0].geometry.location;
          resolve({
            lat: location.lat(),
            lng: location.lng()
          });
        } else {
          reject(new Error('No se encontró dirección'));
        }
      });
    });
  }

  /**
   * Limpia todos los marcadores
   */
  limpiarMarcadores() {
    this.markers.forEach(marker => marker.setMap(null));
    this.markers.clear();
    this.infoWindows.forEach(window => window.close());
    this.infoWindows.clear();
  }

  /**
   * Handler para cambios de zoom en el mapa
   */
  onMapZoomChanged() {
    const zoomLevel = this.map.getZoom();
    console.log(`🔍 Nivel de zoom: ${zoomLevel}`);
  }

  /**
   * Exporta historial de ubicaciones
   */
  exportarHistorial(userId) {
    const historial = this.locationHistory.get(userId) || [];
    return {
      userId,
      ubicaciones: historial,
      duracion: historial.length > 0
        ? historial[historial.length - 1].timestamp - historial[0].timestamp
        : 0
    };
  }
}

// Crear instancia global
let geoManager = null;

function initGeoManager(config = {}) {
  geoManager = new GeoLocationManager(config);
  return geoManager;
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GeoLocationManager;
}
