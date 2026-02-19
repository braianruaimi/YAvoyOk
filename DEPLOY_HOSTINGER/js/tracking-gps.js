/**
 * 📍 SISTEMA DE TRACKING GPS EN TIEMPO REAL - YAvoy 2026
 * 
 * Tracking en vivo del repartidor con mapa interactivo
 * - Actualización cada 5 segundos
 * - Leaflet.js para mapas
 * - Cálculo de ETA (tiempo estimado de llegada)
 * - Notificaciones de proximidad
 * - Ruta optimizada
 * 
 * @version 2.0.0
 * @author YAvoy Team
 * @date 2025-12-11
 */

class TrackingGPS {
  constructor() {
    this.map = null;
    this.markers = new Map();
    this.watchId = null;
    this.trackingActivo = false;
    this.intervaloActualizacion = 5000; // 5 segundos
    this.pedidosEnSeguimiento = new Map();
    this.initialized = false;
  }

  /**
   * Inicializar sistema de tracking
   */
  async init() {
    try {
      console.log('📍 Inicializando Sistema de Tracking GPS...');
      
      // Verificar soporte de geolocalización
      if (!navigator.geolocation) {
        throw new Error('Geolocalización no soportada');
      }
      
      // Cargar Leaflet CSS si no está
      this.cargarLeafletCSS();
      
      // Configurar event listeners
      this.setupEventListeners();
      
      this.initialized = true;
      console.log('✅ Sistema de Tracking GPS inicializado');
      
      return true;
    } catch (error) {
      console.error('❌ Error inicializando tracking:', error);
      return false;
    }
  }

  /**
   * Cargar CSS de Leaflet
   */
  cargarLeafletCSS() {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
  }

  /**
   * Inicializar mapa
   */
  async inicializarMapa(containerId, centerLat = -34.6037, centerLng = -58.3816) {
    try {
      // Cargar Leaflet si no está
      if (typeof L === 'undefined') {
        await this.cargarLeaflet();
      }

      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error('Container de mapa no encontrado');
      }

      // Crear mapa
      this.map = L.map(containerId).setView([centerLat, centerLng], 13);

      // Agregar capa de OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(this.map);

      console.log('🗺️ Mapa inicializado');
      return true;
    } catch (error) {
      console.error('Error inicializando mapa:', error);
      return false;
    }
  }

  /**
   * Cargar librería Leaflet
   */
  cargarLeaflet() {
    return new Promise((resolve, reject) => {
      if (typeof L !== 'undefined') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Iniciar tracking de repartidor
   */
  async iniciarTracking(pedidoId, repartidorId) {
    try {
      if (!this.map) {
        throw new Error('Mapa no inicializado');
      }

      // Obtener ubicación inicial del repartidor
      const ubicacion = await this.obtenerUbicacionRepartidor(repartidorId);
      
      if (!ubicacion) {
        throw new Error('No se pudo obtener ubicación del repartidor');
      }

      // Agregar marcador del repartidor
      const markerRepartidor = L.marker([ubicacion.lat, ubicacion.lng], {
        icon: this.crearIconoRepartidor()
      }).addTo(this.map);

      markerRepartidor.bindPopup(`
        <b>🚴 Repartidor</b><br>
        ${ubicacion.nombre || 'En camino'}<br>
        <small>Actualizado: ${new Date().toLocaleTimeString()}</small>
      `);

      this.markers.set(`repartidor-${repartidorId}`, markerRepartidor);

      // Guardar información del tracking
      this.pedidosEnSeguimiento.set(pedidoId, {
        repartidorId,
        ultimaActualizacion: Date.now(),
        ubicacionAnterior: ubicacion
      });

      // Centrar mapa en repartidor
      this.map.setView([ubicacion.lat, ubicacion.lng], 15);

      // Iniciar actualización periódica
      this.iniciarActualizacionPeriodica(pedidoId, repartidorId);

      console.log(`📍 Tracking iniciado para pedido ${pedidoId}`);
      return true;

    } catch (error) {
      console.error('Error iniciando tracking:', error);
      return false;
    }
  }

  /**
   * Actualización periódica de ubicación
   */
  iniciarActualizacionPeriodica(pedidoId, repartidorId) {
    const intervalo = setInterval(async () => {
      const tracking = this.pedidosEnSeguimiento.get(pedidoId);
      
      if (!tracking) {
        clearInterval(intervalo);
        return;
      }

      // Obtener nueva ubicación
      const nuevaUbicacion = await this.obtenerUbicacionRepartidor(repartidorId);
      
      if (!nuevaUbicacion) return;

      // Actualizar marcador
      const marker = this.markers.get(`repartidor-${repartidorId}`);
      if (marker) {
        marker.setLatLng([nuevaUbicacion.lat, nuevaUbicacion.lng]);
        marker.getPopup().setContent(`
          <b>🚴 Repartidor</b><br>
          ${nuevaUbicacion.nombre || 'En camino'}<br>
          <small>Actualizado: ${new Date().toLocaleTimeString()}</small>
        `);
      }

      // Calcular distancia y ETA
      if (tracking.ubicacionAnterior) {
        const distancia = this.calcularDistancia(
          tracking.ubicacionAnterior.lat,
          tracking.ubicacionAnterior.lng,
          nuevaUbicacion.lat,
          nuevaUbicacion.lng
        );

        // Si se movió significativamente
        if (distancia > 0.01) { // > 10 metros
          const velocidad = this.calcularVelocidad(
            distancia,
            (Date.now() - tracking.ultimaActualizacion) / 1000
          );

          tracking.velocidad = velocidad;
          
          // Emitir evento de actualización
          window.dispatchEvent(new CustomEvent('trackingActualizado', {
            detail: {
              pedidoId,
              ubicacion: nuevaUbicacion,
              velocidad,
              distancia
            }
          }));
        }
      }

      tracking.ubicacionAnterior = nuevaUbicacion;
      tracking.ultimaActualizacion = Date.now();

    }, this.intervaloActualizacion);

    // Guardar referencia del intervalo
    this.pedidosEnSeguimiento.get(pedidoId).intervalo = intervalo;
  }

  /**
   * Detener tracking
   */
  detenerTracking(pedidoId) {
    const tracking = this.pedidosEnSeguimiento.get(pedidoId);
    
    if (tracking && tracking.intervalo) {
      clearInterval(tracking.intervalo);
    }

    this.pedidosEnSeguimiento.delete(pedidoId);
    console.log(`🛑 Tracking detenido para pedido ${pedidoId}`);
  }

  /**
   * Agregar marcador de destino
   */
  agregarMarcadorDestino(lat, lng, direccion) {
    if (!this.map) return null;

    const marker = L.marker([lat, lng], {
      icon: this.crearIconoDestino()
    }).addTo(this.map);

    marker.bindPopup(`
      <b>📍 Destino</b><br>
      ${direccion}
    `);

    return marker;
  }

  /**
   * Dibujar ruta entre dos puntos
   */
  async dibujarRuta(origenLat, origenLng, destinoLat, destinoLng) {
    try {
      // Usar API de routing (OSRM)
      const url = `https://router.project-osrm.org/route/v1/driving/${origenLng},${origenLat};${destinoLng},${destinoLat}?overview=full&geometries=geojson`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.code !== 'Ok') {
        throw new Error('Error obteniendo ruta');
      }

      const route = data.routes[0];
      const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);

      // Dibujar ruta en el mapa
      const polyline = L.polyline(coordinates, {
        color: '#667eea',
        weight: 5,
        opacity: 0.7
      }).addTo(this.map);

      // Ajustar vista al recorrido
      this.map.fitBounds(polyline.getBounds(), { padding: [50, 50] });

      // Calcular ETA
      const distanciaKm = route.distance / 1000;
      const duracionMin = Math.ceil(route.duration / 60);

      return {
        distancia: distanciaKm,
        duracion: duracionMin,
        polyline
      };

    } catch (error) {
      console.error('Error dibujando ruta:', error);
      
      // Fallback: línea recta
      const line = L.polyline([[origenLat, origenLng], [destinoLat, destinoLng]], {
        color: '#667eea',
        weight: 3,
        opacity: 0.5,
        dashArray: '10, 10'
      }).addTo(this.map);

      const distancia = this.calcularDistancia(origenLat, origenLng, destinoLat, destinoLng);
      const duracion = Math.ceil((distancia / 20) * 60); // Asumiendo 20 km/h

      return {
        distancia,
        duracion,
        polyline: line
      };
    }
  }

  /**
   * Calcular ETA (tiempo estimado de llegada)
   */
  calcularETA(distanciaKm, velocidadKmh = 20) {
    const horas = distanciaKm / velocidadKmh;
    const minutos = Math.ceil(horas * 60);
    
    return {
      minutos,
      textoFormateado: minutos < 60 
        ? `${minutos} min` 
        : `${Math.floor(minutos / 60)}h ${minutos % 60}min`
    };
  }

  /**
   * Calcular distancia entre dos puntos (Haversine)
   */
  calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    
    return d;
  }

  /**
   * Calcular velocidad
   */
  calcularVelocidad(distanciaKm, tiempoSegundos) {
    const tiempoHoras = tiempoSegundos / 3600;
    return distanciaKm / tiempoHoras;
  }

  /**
   * Convertir a radianes
   */
  toRad(grados) {
    return grados * Math.PI / 180;
  }

  /**
   * Obtener ubicación del repartidor desde el servidor
   */
  async obtenerUbicacionRepartidor(repartidorId) {
    try {
      const response = await fetch(`/api/repartidor/${repartidorId}/ubicacion`);
      if (!response.ok) {
        throw new Error('Error obteniendo ubicación');
      }
      return await response.json();
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  }

  /**
   * Obtener ubicación actual del dispositivo
   */
  obtenerUbicacionActual() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            precision: position.coords.accuracy
          });
        },
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  /**
   * Iniciar tracking de repartidor (para app de repartidor)
   */
  iniciarTrackingRepartidor(repartidorId) {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
    }

    this.watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const ubicacion = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          precision: position.coords.accuracy,
          timestamp: Date.now()
        };

        // Enviar al servidor
        await this.enviarUbicacion(repartidorId, ubicacion);

        // Emitir evento
        window.dispatchEvent(new CustomEvent('ubicacionActualizada', {
          detail: { repartidorId, ubicacion }
        }));
      },
      (error) => {
        console.error('Error obteniendo ubicación:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    this.trackingActivo = true;
    console.log('📍 Tracking de repartidor iniciado');
  }

  /**
   * Detener tracking de repartidor
   */
  detenerTrackingRepartidor() {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.trackingActivo = false;
    console.log('🛑 Tracking de repartidor detenido');
  }

  /**
   * Enviar ubicación al servidor
   */
  async enviarUbicacion(repartidorId, ubicacion) {
    try {
      const response = await fetch(`/api/repartidor/${repartidorId}/ubicacion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ubicacion)
      });

      if (!response.ok) {
        throw new Error('Error enviando ubicación');
      }

      return true;
    } catch (error) {
      console.error('Error enviando ubicación:', error);
      return false;
    }
  }

  /**
   * Crear icono de repartidor
   */
  crearIconoRepartidor() {
    return L.divIcon({
      className: 'marker-repartidor',
      html: `
        <div style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        ">🚴</div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
  }

  /**
   * Crear icono de destino
   */
  crearIconoDestino() {
    return L.divIcon({
      className: 'marker-destino',
      html: `
        <div style="
          background: #10b981;
          width: 35px;
          height: 35px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        ">📍</div>
      `,
      iconSize: [35, 35],
      iconAnchor: [17.5, 17.5]
    });
  }

  /**
   * Verificar proximidad y notificar
   */
  verificarProximidad(pedidoId, ubicacionRepartidor, ubicacionDestino, umbralKm = 0.5) {
    const distancia = this.calcularDistancia(
      ubicacionRepartidor.lat,
      ubicacionRepartidor.lng,
      ubicacionDestino.lat,
      ubicacionDestino.lng
    );

    if (distancia <= umbralKm) {
      this.notificarProximidad(pedidoId, Math.ceil(distancia * 1000));
    }
  }

  /**
   * Notificar proximidad
   */
  async notificarProximidad(pedidoId, distanciaMetros) {
    const mensaje = distanciaMetros < 100
      ? '🎉 ¡Tu repartidor está llegando!'
      : `📍 Tu repartidor está a ${distanciaMetros}m`;

    // Notificación local
    if (window.mostrarNotificacion) {
      window.mostrarNotificacion(mensaje, 'info');
    }

    // Notificación push
    await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: 'Tu pedido está cerca',
        mensaje,
        icono: '/icons/icon-yavoy.png',
        urlAccion: `/tracking?pedido=${pedidoId}`
      })
    });
  }

  /**
   * Configurar event listeners
   */
  setupEventListeners() {
    // Escuchar cambios en pedidos
    window.addEventListener('pedidoAsignado', (e) => {
      const { pedidoId, repartidorId } = e.detail;
      console.log(`📍 Pedido ${pedidoId} asignado, preparando tracking...`);
    });

    window.addEventListener('pedidoEntregado', (e) => {
      const { pedidoId } = e.detail;
      this.detenerTracking(pedidoId);
    });
  }
}

// Crear instancia global
window.trackingGPS = new TrackingGPS();

// Auto-inicializar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.trackingGPS.init();
  });
} else {
  window.trackingGPS.init();
}
