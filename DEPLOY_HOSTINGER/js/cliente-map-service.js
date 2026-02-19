// ========================================
// CLIENTE MAP SERVICE - YAvoy v3.2
// ========================================
// Vista de mapa para seguimiento de pedidos en tiempo real
// Muestra ubicación del Comercio (fija) y Repartidor (móvil)
// Detecta proximidad automáticamente y notifica al cliente
// Usa Map Engine v2.0 como motor base

class ClienteMapService {
  constructor() {
    this.mapEngine = null; // Motor base de mapa
    this.map = null; // Referencia al mapa de Leaflet
    this.comercioMarker = null;
    this.repartidorMarker = null;
    this.clienteMarker = null;
    this.ruta = null;
    this.socket = null;
    this.pedidoActivo = null;
    this.proximidadNotificada = false;
  }

  /**
   * Inicializar mapa con Map Engine v2.0
   * @param {string} containerId - ID del contenedor del mapa
   * @param {Object} pedidoData - Datos del pedido { comercioLat, comercioLng, clienteLat, clienteLng, pedidoId }
   */
  async init(containerId, pedidoData, socketInstance) {
    this.socket = socketInstance;
    this.pedidoActivo = pedidoData.pedidoId;
    this.proximidadNotificada = false;

    // Verificar que Map Engine esté cargado
    if (typeof MapEngine === 'undefined') {
      console.error('❌ Map Engine no está cargado');
      this.mostrarError('Error al cargar el mapa. Recarga la página.');
      return;
    }

    // Crear instancia del Map Engine v2.0
    this.mapEngine = new MapEngine();

    // Inicializar con el comercio como ubicación central
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
      this.mostrarError('Error al inicializar el mapa');
      return;
    }

    // Obtener referencia al mapa de Leaflet
    this.map = this.mapEngine.map;
    
    // El comercio ya fue agregado por MapEngine, obtener referencia
    this.comercioMarker = this.mapEngine.comercioMarker;

    // Actualizar popup del comercio
    if (this.comercioMarker) {
      this.comercioMarker.bindPopup(`
        <div class="map-popup">
          <h3>🏪 Comercio</h3>
          <p>${pedidoData.comercioNombre || 'Tu tienda favorita'}</p>
          <p class="map-popup-direccion">${pedidoData.comercioDireccion || ''}</p>
        </div>
      `);
    }

    // Agregar marcador del cliente (destino)
    if (pedidoData.clienteLat && pedidoData.clienteLng) {
      this.clienteMarker = L.marker(
        [pedidoData.clienteLat, pedidoData.clienteLng],
        {
          icon: this.crearIconoCliente(),
          title: 'Tu ubicación'
        }
      ).addTo(this.map);

      this.clienteMarker.bindPopup(`
        <div class="map-popup">
          <h3>📍 Tu ubicación</h3>
          <p>${pedidoData.clienteDireccion || 'Dirección de entrega'}</p>
        </div>
      `);
    }

    // Configurar eventos de Socket.IO
    this.configurarSocket();

    // Solicitar ubicación inicial del repartidor
    this.socket.emit('solicitarUbicacion', { 
      repartidorId: pedidoData.repartidorId 
    });

    console.log('✅ Mapa del cliente inicializado con Map Engine v2.0');
  }

  /**
   * Configurar eventos de Socket.IO para actualizaciones en tiempo real
   */
  configurarSocket() {
    // Recibir ubicación del repartidor
    this.socket.on('ubicacionRepartidor', (data) => {
      if (data.pedidoId === this.pedidoActivo) {
        this.actualizarUbicacionRepartidor(data);
      }
    });

    // Recibir notificación de proximidad (< 500m)
    this.socket.on('order-nearby', (data) => {
      if (data.pedidoId === this.pedidoActivo && !this.proximidadNotificada) {
        this.proximidadNotificada = true;
        this.mostrarAlertaProximidad(data);
      }
    });

    // Respuesta a solicitud de ubicación
    this.socket.on('ubicacionRecibida', (data) => {
      this.actualizarUbicacionRepartidor(data);
    });

    // Si no hay ubicación disponible
    this.socket.on('ubicacionNoDisponible', (data) => {
      console.warn('⚠️ Ubicación del repartidor no disponible');
      this.mostrarMensaje(
        'El repartidor aún no ha iniciado el recorrido', 
        'info'
      );
    });

    console.log('✅ Socket configurado para seguimiento');
  }

  /**
   * Actualizar ubicación del repartidor en el mapa
   * @param {Object} data - { lat, lng, zona, timestamp }
   */
  actualizarUbicacionRepartidor(data) {
    const { lat, lng, zona, timestamp } = data;

    // Si ya existe el marcador, actualizar posición
    if (this.repartidorMarker) {
      this.repartidorMarker.setLatLng([lat, lng]);
    } else {
      // Crear marcador del repartidor
      this.repartidorMarker = L.marker(
        [lat, lng],
        {
          icon: this.crearIconoRepartidor(),
          title: 'Repartidor'
        }
      ).addTo(this.map);
    }

    // Actualizar popup
    const horaActualizacion = new Date(timestamp).toLocaleTimeString('es-AR');
    this.repartidorMarker.bindPopup(`
      <div class="map-popup">
        <h3>🛵 Tu repartidor</h3>
        <p><strong>Zona:</strong> ${zona || 'Calculando...'}</p>
        <p><strong>Actualizado:</strong> ${horaActualizacion}</p>
      </div>
    `);

    // Dibujar/actualizar ruta
    this.dibujarRuta();

    // Ajustar vista del mapa para mostrar todos los marcadores
    this.ajustarVista();

    console.log(`📍 Repartidor actualizado: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
  }

  /**
   * Dibujar ruta entre repartidor y cliente
   */
  dibujarRuta() {
    // Eliminar ruta anterior
    if (this.ruta) {
      this.map.removeLayer(this.ruta);
    }

    // Verificar que existan ambos marcadores
    if (!this.repartidorMarker || !this.clienteMarker) {
      return;
    }

    const repartidorPos = this.repartidorMarker.getLatLng();
    const clientePos = this.clienteMarker.getLatLng();

    // Dibujar línea entre repartidor y cliente
    this.ruta = L.polyline(
      [
        [repartidorPos.lat, repartidorPos.lng],
        [clientePos.lat, clientePos.lng]
      ],
      {
        color: '#06b6d4',
        weight: 4,
        opacity: 0.7,
        dashArray: '10, 10'
      }
    ).addTo(this.map);
  }

  /**
   * Ajustar vista del mapa para mostrar todos los marcadores
   */
  ajustarVista() {
    const bounds = [];

    if (this.comercioMarker) {
      bounds.push(this.comercioMarker.getLatLng());
    }
    if (this.repartidorMarker) {
      bounds.push(this.repartidorMarker.getLatLng());
    }
    if (this.clienteMarker) {
      bounds.push(this.clienteMarker.getLatLng());
    }

    if (bounds.length > 0) {
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  /**
   * Mostrar alerta de proximidad visual y sonora
   * @param {Object} data - { distancia, eta, mensaje }
   */
  mostrarAlertaProximidad(data) {
    const { distancia, eta, mensaje } = data;

    // Reproducir sonido de notificación
    this.reproducirSonido();

    // Mostrar notificación visual grande
    const alertaHTML = `
      <div class="proximidad-alert">
        <div class="proximidad-icon">🎯</div>
        <h2>¡Tu pedido está cerca!</h2>
        <p class="proximidad-mensaje">${mensaje}</p>
        <div class="proximidad-detalles">
          <div class="proximidad-detalle">
            <span class="detalle-label">Distancia</span>
            <span class="detalle-valor">${distancia}m</span>
          </div>
          <div class="proximidad-detalle">
            <span class="detalle-label">Tiempo estimado</span>
            <span class="detalle-valor">~${eta} min</span>
          </div>
        </div>
        <button class="proximidad-btn" onclick="this.parentElement.remove()">
          ¡Entendido!
        </button>
      </div>
      <div class="proximidad-overlay" onclick="this.nextElementSibling.remove(); this.remove()"></div>
    `;

    document.body.insertAdjacentHTML('beforeend', alertaHTML);

    // Vibrar el dispositivo si es compatible
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }

    // Notificación del sistema
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('¡Prepara la mesa!', {
        body: mensaje,
        icon: '/img/logo-yavoy.png',
        badge: '/img/badge-icon.png',
        tag: 'yavoy-proximity',
        requireInteraction: true
      });
    }

    console.log('🎯 Alerta de proximidad mostrada');
  }

  /**
   * Reproducir sonido de notificación
   */
  reproducirSonido() {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch(e => {
      console.warn('⚠️ No se pudo reproducir el sonido:', e);
    });
  }

  /**
   * Crear icono personalizado para el comercio
   * @returns {L.Icon} - Icono de Leaflet
   */
  crearIconoComercio() {
    return L.divIcon({
      className: 'custom-marker-comercio',
      html: '🏪',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40]
    });
  }

  /**
   * Crear icono personalizado para el repartidor
   * @returns {L.Icon} - Icono de Leaflet
   */
  crearIconoRepartidor() {
    return L.divIcon({
      className: 'custom-marker-repartidor',
      html: '🛵',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40]
    });
  }

  /**
   * Crear icono personalizado para el cliente
   * @returns {L.Icon} - Icono de Leaflet
   */
  crearIconoCliente() {
    return L.divIcon({
      className: 'custom-marker-cliente',
      html: '📍',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40]
    });
  }

  /**
   * Mostrar mensaje informativo
   * @param {string} mensaje - Mensaje a mostrar
   * @param {string} tipo - Tipo (info, warning, error)
   */
  mostrarMensaje(mensaje, tipo = 'info') {
    const notification = document.createElement('div');
    notification.className = `map-notification map-notification-${tipo}`;
    notification.textContent = mensaje;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  /**
   * Mostrar error crítico
   * @param {string} mensaje - Mensaje de error
   */
  mostrarError(mensaje) {
    console.error('❌', mensaje);
    this.mostrarMensaje(mensaje, 'error');
  }

  /**
   * Destruir instancia del mapa
   */
  destroy() {
    // Usar destructor del Map Engine si está disponible
    if (this.mapEngine) {
      this.mapEngine.destruirMapa();
      this.mapEngine = null;
    } else if (this.map) {
      this.map.remove();
    }
    
    this.map = null;
    this.comercioMarker = null;
    this.repartidorMarker = null;
    this.clienteMarker = null;
    this.ruta = null;
    this.proximidadNotificada = false;
    console.log('🗑️ Mapa del cliente destruido');
  }
}

// ====================================
// ESTILOS CSS
// ====================================

const estilos = `
<style>
/* Contenedor del mapa */
#cliente-map {
  width: 100%;
  height: 500px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Marcadores personalizados */
.custom-marker-comercio,
.custom-marker-repartidor,
.custom-marker-cliente {
  font-size: 32px;
  text-align: center;
  line-height: 40px;
  animation: bounce 1s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* Popups del mapa */
.map-popup h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #0891b2;
}

.map-popup p {
  margin: 5px 0;
  font-size: 14px;
  color: #666;
}

.map-popup-direccion {
  font-style: italic;
  color: #999;
}

/* Alerta de proximidad */
.proximidad-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  z-index: 9998;
  animation: fadeIn 0.3s ease;
}

.proximidad-alert {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px 30px;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  z-index: 9999;
  max-width: 400px;
  text-align: center;
  animation: slideDown 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translate(-50%, -60%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}

.proximidad-icon {
  font-size: 80px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.proximidad-alert h2 {
  margin: 20px 0 10px 0;
  font-size: 28px;
  font-weight: bold;
}

.proximidad-mensaje {
  font-size: 18px;
  margin: 15px 0 25px 0;
  opacity: 0.9;
}

.proximidad-detalles {
  display: flex;
  justify-content: space-around;
  gap: 20px;
  margin: 25px 0;
}

.proximidad-detalle {
  flex: 1;
  background: rgba(255, 255, 255, 0.2);
  padding: 15px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.detalle-label {
  display: block;
  font-size: 12px;
  text-transform: uppercase;
  opacity: 0.8;
  margin-bottom: 5px;
}

.detalle-valor {
  display: block;
  font-size: 24px;
  font-weight: bold;
}

.proximidad-btn {
  background: white;
  color: #667eea;
  border: none;
  padding: 15px 40px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s ease;
  margin-top: 20px;
}

.proximidad-btn:hover {
  transform: scale(1.05);
}

.proximidad-btn:active {
  transform: scale(0.95);
}

/* Notificaciones pequeñas */
.map-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 15px 20px;
  border-radius: 8px;
  z-index: 9000;
  transform: translateX(400px);
  transition: transform 0.3s ease;
}

.map-notification.show {
  transform: translateX(0);
}

.map-notification-info {
  border-left: 4px solid #06b6d4;
}

.map-notification-error {
  border-left: 4px solid #ef4444;
}

.map-notification-warning {
  border-left: 4px solid #f59e0b;
}

/* Responsive */
@media (max-width: 768px) {
  #cliente-map {
    height: 400px;
  }

  .proximidad-alert {
    max-width: 90%;
    padding: 30px 20px;
  }

  .proximidad-alert h2 {
    font-size: 24px;
  }

  .proximidad-mensaje {
    font-size: 16px;
  }

  .proximidad-detalles {
    flex-direction: column;
    gap: 10px;
  }
}
</style>
`;

// Inyectar estilos
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    document.head.insertAdjacentHTML('beforeend', estilos);
  });
} else {
  document.head.insertAdjacentHTML('beforeend', estilos);
}

// Exportar
window.ClienteMapService = ClienteMapService;

console.log('✅ ClienteMapService cargado correctamente');
