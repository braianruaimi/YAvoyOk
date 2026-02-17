// ========================================
// REPARTIDOR MAP SERVICE - YAvoy v3.2
// ========================================
// Servicio de geolocalización PASIVO para repartidores
// Envía ubicación cada 15 segundos solo cuando tiene pedido activo
// Ahora incluye vista de mapa con comercio y dirección de entrega
// PRIVACIDAD: NO muestra ubicación de clientes en el mapa
// Usa Map Engine v2.0 como motor base

class RepartidorMapService {
  constructor() {
    this.mapEngine = null; // Motor base de mapa
    this.map = null; // Referencia al mapa de Leaflet
    this.comercioMarker = null;
    this.entregaMarker = null; // Marcador de dirección de entrega
    this.miUbicacionMarker = null; // Marcador de mi ubicación actual
    this.rutaLinea = null; // Línea de ruta
    this.pedidoActivo = null;
    this.intervalId = null;
    this.watchId = null;
    this.socket = null;
    this.ultimaUbicacion = null;
    this.INTERVALO_ENVIO = 15000; // 15 segundos
    this.intentosReconexion = 0;
    this.MAX_INTENTOS = 5;
  }

  /**
   * Inicializar el servicio con Socket.IO
   * @param {Socket} socketInstance - Instancia de Socket.IO
   */
  init(socketInstance) {
    this.socket = socketInstance;
    console.log('🗺️ RepartidorMapService inicializado');
    
    // Escuchar confirmaciones del servidor
    this.socket.on('ubicacionActualizada', (data) => {
      console.log('✅ Ubicación actualizada:', data);
      if (!data.enZona) {
        console.warn('⚠️ Fuera de zona de cobertura:', data.zona);
      }
    });
    
    // Manejar errores
    this.socket.on('error', (data) => {
      console.error('❌ Error del servidor:', data.mensaje);
    });
  }

  /**
   * Inicializar mapa visual para navegación
   * PRIVACIDAD: Solo muestra comercio y dirección de entrega, NUNCA clientes
   * @param {string} containerId - ID del contenedor del mapa
   * @param {Object} pedidoData - { comercioLat, comercioLng, comercioNombre, entregaLat, entregaLng, entregaDireccion }
   */
  async inicializarMapa(containerId, pedidoData) {
    // Verificar que Map Engine esté cargado
    if (typeof MapEngine === 'undefined') {
      console.error('❌ Map Engine no está cargado');
      return false;
    }

    // Crear instancia del Map Engine v2.0
    this.mapEngine = new MapEngine();

    // Inicializar con el comercio como punto de partida
    const exito = await this.mapEngine.inicializar(containerId, {
      comercio: {
        lat: pedidoData.comercioLat,
        lng: pedidoData.comercioLng,
        nombre: pedidoData.comercioNombre || 'Comercio',
        id: pedidoData.comercioId || 'comercio-pedido'
      }
    });

    if (!exito) {
      console.error('❌ Error al inicializar Map Engine');
      return false;
    }

    // Obtener referencia al mapa de Leaflet
    this.map = this.mapEngine.map;
    this.comercioMarker = this.mapEngine.comercioMarker;

    // Actualizar popup del comercio
    if (this.comercioMarker) {
      this.comercioMarker.bindPopup(`
        <div class="map-popup">
          <h3>🏪 Recoger en:</h3>
          <p><strong>${pedidoData.comercioNombre || 'Comercio'}</strong></p>
          <p style="font-size: 0.85em; color: #666;">${pedidoData.comercioDireccion || ''}</p>
        </div>
      `);
    }

    // Agregar marcador de dirección de entrega (destino)
    if (pedidoData.entregaLat && pedidoData.entregaLng) {
      this.entregaMarker = L.marker(
        [pedidoData.entregaLat, pedidoData.entregaLng],
        {
          icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          }),
          title: 'Dirección de entrega'
        }
      ).addTo(this.map);

      this.entregaMarker.bindPopup(`
        <div class="map-popup">
          <h3>📍 Entregar en:</h3>
          <p><strong>${pedidoData.entregaDireccion || 'Dirección de entrega'}</strong></p>
          <p style="font-size: 0.85em; color: #666;">Destino final</p>
        </div>
      `);

      // Dibujar línea de ruta recomendada
      this.rutaLinea = L.polyline([
        [pedidoData.comercioLat, pedidoData.comercioLng],
        [pedidoData.entregaLat, pedidoData.entregaLng]
      ], {
        color: '#06b6d4',
        weight: 3,
        opacity: 0.6,
        dashArray: '10, 10'
      }).addTo(this.map);

      // Ajustar vista para mostrar ambos puntos
      const bounds = L.latLngBounds([
        [pedidoData.comercioLat, pedidoData.comercioLng],
        [pedidoData.entregaLat, pedidoData.entregaLng]
      ]);
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }

    console.log('✅ Mapa de repartidor inicializado - Solo comercio y entrega visible');
    console.log('🔒 PRIVACIDAD: No se muestran ubicaciones de clientes');
    
    return true;
  }

  /**
   * Actualizar mi ubicación en el mapa
   * @param {number} lat - Latitud
   * @param {number} lng - Longitud
   */
  actualizarMiUbicacionEnMapa(lat, lng) {
    if (!this.map) return;

    if (this.miUbicacionMarker) {
      // Actualizar posición existente
      this.miUbicacionMarker.setLatLng([lat, lng]);
    } else {
      // Crear nuevo marcador de mi ubicación
      this.miUbicacionMarker = L.marker([lat, lng], {
        icon: L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        }),
        title: 'Mi ubicación'
      }).addTo(this.map);

      this.miUbicacionMarker.bindPopup(`
        <div class="map-popup">
          <h3>📍 Mi ubicación</h3>
          <p style="font-size: 0.85em; color: #666;">Actualizando en tiempo real...</p>
        </div>
      `);
    }

    // Actualizar línea de ruta si existe
    if (this.rutaLinea && this.entregaMarker) {
      const entregaLatLng = this.entregaMarker.getLatLng();
      this.rutaLinea.setLatLngs([
        [lat, lng],
        [entregaLatLng.lat, entregaLatLng.lng]
      ]);
    }
  }

  /**
   * Activar tracking cuando se acepta un pedido
   * @param {string} pedidoId - ID del pedido aceptado
   */
  activarTracking(pedidoId) {
    if (this.intervalId) {
      console.warn('⚠️ Ya hay un tracking activo. Deteniendo el anterior...');
      this.detenerTracking();
    }
    
    this.pedidoActivo = pedidoId;
    console.log(`🚀 Tracking activado para pedido: ${pedidoId}`);
    
    // Verificar si el navegador soporta geolocalización
    if (!navigator.geolocation) {
      console.error('❌ El navegador no soporta geolocalización');
      this.mostrarNotificacion('Tu navegador no soporta geolocalización', 'error');
      return;
    }
    
    // Solicitar permiso y obtener ubicación inicial
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.enviarUbicacion(position);
        this.iniciarEnvioAutomatico();
      },
      (error) => {
        console.error('❌ Error obteniendo ubicación inicial:', error);
        this.manejarErrorGeolocation(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  /**
   * Iniciar envío automático cada 15 segundos
   */
  iniciarEnvioAutomatico() {
    // Usar watchPosition para seguimiento continuo
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.ultimaUbicacion = position;
      },
      (error) => {
        console.error('❌ Error en watchPosition:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000 // Aceptar ubicaciones de hasta 5 segundos
      }
    );
    
    // Enviar cada 15 segundos
    this.intervalId = setInterval(() => {
      if (this.ultimaUbicacion) {
        this.enviarUbicacion(this.ultimaUbicacion);
      }
    }, this.INTERVALO_ENVIO);
    
    console.log(`⏰ Envío automático iniciado (cada ${this.INTERVALO_ENVIO / 1000}s)`);
  }

  /**
   * Enviar ubicación al servidor vía Socket.IO
   * @param {Position} position - Objeto de geolocalización del navegador
   */
  enviarUbicacion(position) {
    if (!this.socket || !this.pedidoActivo) {
      console.warn('⚠️ Socket o pedido no disponible');
      return;
    }
    
    const { latitude, longitude, accuracy } = position.coords;
    
    // Validar precisión (no enviar si es muy imprecisa > 100m)
    if (accuracy > 100) {
      console.warn(`⚠️ Precisión baja (${Math.round(accuracy)}m), esperando mejor señal...`);
      return;
    }
    
    const data = {
      lat: latitude,
      lng: longitude,
      pedidoId: this.pedidoActivo,
      accuracy: Math.round(accuracy),
      timestamp: new Date().toISOString()
    };
    
    try {
      this.socket.emit('actualizarUbicacion', data);
      console.log(`📍 Ubicación enviada: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (±${Math.round(accuracy)}m)`);
      
      // Actualizar mapa visual si está disponible
      if (this.map) {
        this.actualizarMiUbicacionEnMapa(latitude, longitude);
      }
      
      this.intentosReconexion = 0; // Resetear intentos si funciona
    } catch (error) {
      console.error('❌ Error enviando ubicación:', error);
      this.intentarReconexion();
    }
  }

  /**
   * Detener tracking cuando se completa el pedido
   */
  detenerTracking() {
    console.log('🛑 Deteniendo tracking...');
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    
    this.pedidoActivo = null;
    this.ultimaUbicacion = null;
    this.intentosReconexion = 0;
    
    console.log('✅ Tracking detenido correctamente');
  }

  /**
   * Destruir instancia del mapa
   */
  destruirMapa() {
    // Usar destructor del Map Engine si está disponible
    if (this.mapEngine) {
      this.mapEngine.destruirMapa();
      this.mapEngine = null;
    } else if (this.map) {
      this.map.remove();
    }
    
    this.map = null;
    this.comercioMarker = null;
    this.entregaMarker = null;
    this.miUbicacionMarker = null;
    this.rutaLinea = null;
    
    console.log('🗑️ Mapa del repartidor destruido');
  }

  /**
   * Manejar errores de geolocalización
   * @param {PositionError} error - Error de geolocalización
   */
  manejarErrorGeolocation(error) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        console.error('❌ Permiso de ubicación denegado');
        this.mostrarNotificacion(
          'Debes activar la ubicación para aceptar pedidos', 
          'error'
        );
        break;
      case error.POSITION_UNAVAILABLE:
        console.error('❌ Ubicación no disponible');
        this.mostrarNotificacion(
          'No se pudo obtener tu ubicación. Verifica tu GPS', 
          'warning'
        );
        break;
      case error.TIMEOUT:
        console.error('❌ Timeout obteniendo ubicación');
        this.mostrarNotificacion(
          'La ubicación está tardando mucho. Verifica tu conexión', 
          'warning'
        );
        break;
      default:
        console.error('❌ Error desconocido:', error);
        break;
    }
  }

  /**
   * Intentar reconexión si falla el envío
   */
  intentarReconexion() {
    if (this.intentosReconexion >= this.MAX_INTENTOS) {
      console.error('❌ Máximo de intentos de reconexión alcanzado');
      this.mostrarNotificacion(
        'Perdiste la conexión. Revisa tu internet', 
        'error'
      );
      this.detenerTracking();
      return;
    }
    
    this.intentosReconexion++;
    console.log(`🔄 Intento de reconexión ${this.intentosReconexion}/${this.MAX_INTENTOS}`);
    
    setTimeout(() => {
      if (this.ultimaUbicacion) {
        this.enviarUbicacion(this.ultimaUbicacion);
      }
    }, 3000 * this.intentosReconexion); // Backoff exponencial
  }

  /**
   * Obtener estado actual del servicio
   * @returns {Object} - Estado del servicio
   */
  getEstado() {
    return {
      activo: this.intervalId !== null,
      pedidoId: this.pedidoActivo,
      ultimaUbicacion: this.ultimaUbicacion ? {
        lat: this.ultimaUbicacion.coords.latitude,
        lng: this.ultimaUbicacion.coords.longitude,
        accuracy: Math.round(this.ultimaUbicacion.coords.accuracy),
        timestamp: new Date(this.ultimaUbicacion.timestamp).toLocaleString('es-AR')
      } : null,
      intentosReconexion: this.intentosReconexion
    };
  }

  /**
   * Mostrar notificación al repartidor
   * @param {string} mensaje - Mensaje a mostrar
   * @param {string} tipo - Tipo de notificación (success, error, warning, info)
   */
  mostrarNotificacion(mensaje, tipo = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `map-notification map-notification-${tipo}`;
    notification.innerHTML = `
      <div class="map-notification-content">
        <span class="map-notification-icon">${this.getIconoTipo(tipo)}</span>
        <span class="map-notification-text">${mensaje}</span>
      </div>
    `;
    
    // Agregar al DOM
    document.body.appendChild(notification);
    
    // Mostrar con animación
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Ocultar después de 5 segundos
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 5000);
    
    // También usar notificación del sistema si tiene permiso
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`YAvoy - ${tipo}`, {
        body: mensaje,
        icon: '/img/logo-yavoy.png',
        badge: '/img/badge-icon.png',
        tag: 'yavoy-map'
      });
    }
  }

  /**
   * Obtener icono según tipo de notificación
   * @param {string} tipo - Tipo de notificación
   * @returns {string} - Emoji del icono
   */
  getIconoTipo(tipo) {
    const iconos = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return iconos[tipo] || iconos.info;
  }

  /**
   * Solicitar permiso de notificaciones
   */
  async solicitarPermisoNotificaciones() {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      console.log('🔔 Permiso de notificaciones:', permission);
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }
}

// ====================================
// EXPORTAR E INICIALIZAR
// ====================================

// Crear instancia global
window.repartidorMapService = new RepartidorMapService();

// Estilos CSS para notificaciones (inyectar en <head>)
const estilos = `
<style>
.map-notification {
  position: fixed;
  top: 80px;
  right: 20px;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 15px 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 10000;
  transform: translateX(400px);
  transition: transform 0.3s ease;
  max-width: 350px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.map-notification.show {
  transform: translateX(0);
}

.map-notification-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.map-notification-icon {
  font-size: 24px;
}

.map-notification-text {
  flex: 1;
  font-size: 14px;
  line-height: 1.4;
}

.map-notification-success {
  border-left: 4px solid #10b981;
}

.map-notification-error {
  border-left: 4px solid #ef4444;
}

.map-notification-warning {
  border-left: 4px solid #f59e0b;
}

.map-notification-info {
  border-left: 4px solid #06b6d4;
}
</style>
`;

// Inyectar estilos al cargar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    document.head.insertAdjacentHTML('beforeend', estilos);
  });
} else {
  document.head.insertAdjacentHTML('beforeend', estilos);
}

console.log('✅ RepartidorMapService cargado correctamente');
