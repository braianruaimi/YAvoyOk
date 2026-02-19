// ========================================
// COMERCIO MAP SERVICE - YAvoy v3.2
// ========================================
// Vista de radar de repartidores cercanos para comercios
// Muestra repartidores activos y ETA de recogida en tiempo real
// Usa Map Engine v2.0 como motor base

class ComercioMapService {
  constructor() {
    this.mapEngine = null; // Motor base de mapa
    this.map = null; // Referencia al mapa de Leaflet
    this.comercioMarker = null;
    this.repartidoresMarkers = new Map();
    this.circuloCobertura = null;
    this.socket = null;
    this.comercioData = null;
    this.intervaloActualizacion = null;
    this.pedidoActivo = null;
    this.repartidorAsignado = null;
    this.overlayNoRepartidores = null; // Mensaje elegante cuando no hay repartidores
  }

  /**
   * Inicializar mapa del comercio
   * @param {string} containerId - ID del contenedor del mapa
   * @param {Object} comercioData - { lat, lng, nombre, id }
   * @param {Socket} socketInstance - Instancia de Socket.IO
   */
  async init(containerId, comercioData, socketInstance) {
    this.socket = socketInstance;
    this.comercioData = comercioData;

    // Verificar Map Engine
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
        lat: comercioData.lat,
        lng: comercioData.lng,
        nombre: comercioData.nombre,
        id: comercioData.id
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

    // Actualizar popup del comercio con diseño personalizado
    if (this.comercioMarker) {
      this.comercioMarker.bindPopup(`
        <div class="map-popup">
          <h3>🏪 Tu comercio</h3>
          <p>${comercioData.nombre}</p>
        </div>
      `);
    }

    // Agregar círculo de cobertura (3km de radio)
    this.circuloCobertura = L.circle(
      [comercioData.lat, comercioData.lng],
      {
        color: '#06b6d4',
        fillColor: '#06b6d4',
        fillOpacity: 0.1,
        radius: 3000 // 3km
      }
    ).addTo(this.map);

    // Configurar Socket
    this.configurarSocket();

    // Cargar repartidores cercanos
    await this.cargarRepartidoresCercanos();

    // Actualizar cada 30 segundos
    this.intervaloActualizacion = setInterval(() => {
      this.cargarRepartidoresCercanos();
    }, 30000);

    console.log('✅ Mapa del comercio inicializado con Map Engine v2.0');
  }

  /**
   * Configurar eventos de Socket.IO
   */
  configurarSocket() {
    // Actualización de ubicación de repartidor
    this.socket.on('ubicacionRepartidor', (data) => {
      this.actualizarRepartidor(data);
    });

    // Suscribirse al mapa general
    this.socket.emit('suscribirMapa', { tipo: 'comercio' });

    console.log('✅ Socket configurado para radar de repartidores');
  }

  /**
   * Cargar repartidores cercanos desde la API
   */
  async cargarRepartidoresCercanos() {
    try {
      const response = await fetch('/api/map/repartidores-cercanos', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Error al obtener repartidores');
      }

      const data = await response.json();
      
      if (data.success) {
        this.actualizarMarcadores(data.repartidores);
        this.actualizarResumen(data.repartidores);
      }
    } catch (error) {
      console.error('❌ Error cargando repartidores:', error);
    }
  }

  /**
   * Actualizar marcadores de repartidores en el mapa
   * @param {Array} repartidores - Lista de repartidores cercanos
   */
  actualizarMarcadores(repartidores) {
    // Manejar caso de cero repartidores
    if (repartidores.length === 0) {
      this.mostrarMensajeNoRepartidores();
      // Limpiar marcadores existentes
      this.repartidoresMarkers.forEach((marker, id) => {
        this.map.removeLayer(marker);
      });
      this.repartidoresMarkers.clear();
      console.log('📍 No hay repartidores cercanos en este momento');
      return;
    }

    // Si hay repartidores, ocultar el mensaje
    this.ocultarMensajeNoRepartidores();

    // IDs de repartidores actuales
    const repartidoresActuales = new Set(repartidores.map(r => r.repartidorId));

    // Eliminar repartidores que ya no están
    this.repartidoresMarkers.forEach((marker, id) => {
      if (!repartidoresActuales.has(id)) {
        this.map.removeLayer(marker);
        this.repartidoresMarkers.delete(id);
      }
    });

    // Agregar o actualizar repartidores
    repartidores.forEach(rep => {
      if (this.repartidoresMarkers.has(rep.repartidorId)) {
        // Actualizar posición
        const marker = this.repartidoresMarkers.get(rep.repartidorId);
        marker.setLatLng([rep.lat, rep.lng]);
        this.actualizarPopupRepartidor(marker, rep);
      } else {
        // Crear nuevo marcador
        this.agregarMarcadorRepartidor(rep);
      }
    });

    console.log(`📍 ${repartidores.length} repartidores en el radar`);
  }

  /**
   * Agregar marcador de repartidor al mapa
   * @param {Object} rep - Datos del repartidor
   */
  agregarMarcadorRepartidor(rep) {
    const icono = rep.pedidoId 
      ? this.crearIconoRepartidorOcupado() 
      : this.crearIconoRepartidorDisponible();

    const marker = L.marker(
      [rep.lat, rep.lng],
      {
        icon: icono,
        title: rep.nombre
      }
    ).addTo(this.map);

    this.actualizarPopupRepartidor(marker, rep);

    this.repartidoresMarkers.set(rep.repartidorId, marker);
  }

  /**
   * Actualizar popup de un repartidor
   * @param {L.Marker} marker - Marcador de Leaflet
   * @param {Object} rep - Datos del repartidor
   */
  actualizarPopupRepartidor(marker, rep) {
    const estado = rep.pedidoId ? '🔴 Ocupado' : '🟢 Disponible';
    const distanciaKm = (rep.distancia / 1000).toFixed(1);

    marker.bindPopup(`
      <div class="map-popup">
        <h3>🛵 ${rep.nombre}</h3>
        <p><strong>Estado:</strong> ${estado}</p>
        <p><strong>Vehículo:</strong> ${rep.tipoVehiculo}</p>
        <p><strong>Rating:</strong> ${rep.rating} ⭐</p>
        <p><strong>Distancia:</strong> ${distanciaKm} km</p>
        <p><strong>ETA:</strong> ~${rep.eta} min</p>
        ${rep.zona ? `<p><strong>Zona:</strong> ${rep.zona}</p>` : ''}
      </div>
    `);
  }

  /**
   * Actualizar resumen de repartidores
   * @param {Array} repartidores - Lista de repartidores
   */
  actualizarResumen(repartidores) {
    const resumen = document.getElementById('repartidores-resumen');
    if (!resumen) return;

    if (repartidores.length === 0) {
      resumen.innerHTML = `
        <div class="resumen-item resumen-vacio">
          <span class="resumen-label">Estado</span>
          <span class="resumen-valor" style="color: #f59e0b;">Sin repartidores</span>
        </div>
      `;
      return;
    }

    const disponibles = repartidores.filter(r => !r.pedidoId).length;
    const ocupados = repartidores.filter(r => r.pedidoId).length;

    resumen.innerHTML = `
      <div class="resumen-item">
        <span class="resumen-label">Total</span>
        <span class="resumen-valor">${repartidores.length}</span>
      </div>
      <div class="resumen-item">
        <span class="resumen-label">Disponibles</span>
        <span class="resumen-valor resumen-disponible">${disponibles}</span>
      </div>
      <div class="resumen-item">
        <span class="resumen-label">Ocupados</span>
        <span class="resumen-valor resumen-ocupado">${ocupados}</span>
      </div>
    `;
  }

  /**
   * Mostrar mensaje elegante cuando no hay repartidores cercanos
   */
  mostrarMensajeNoRepartidores() {
    // Si ya existe el overlay, no crear otro
    if (this.overlayNoRepartidores) {
      return;
    }

    // Crear overlay en el centro del mapa
    const bounds = this.map.getBounds();
    const center = bounds.getCenter();

    // Crear un DivIcon personalizado con animación
    this.overlayNoRepartidores = L.marker(center, {
      icon: L.divIcon({
        className: 'no-repartidores-overlay',
        html: `
          <div class="no-repartidores-content">
            <div class="no-repartidores-icon">
              <div class="search-circle"></div>
              <div class="search-pulse"></div>
              <span class="search-emoji">🔍</span>
            </div>
            <h3>Buscando repartidores cercanos</h3>
            <p>En este momento no hay repartidores disponibles en Ensenada</p>
            <p class="no-repartidores-info">
              📍 Radio de búsqueda: <strong>3 km</strong><br>
              🔄 Actualizando cada 30 segundos
            </p>
          </div>
        `,
        iconSize: [400, 250],
        iconAnchor: [200, 125]
      }),
      interactive: false
    }).addTo(this.map);

    // Agregar estilos dinámicamente si no existen
    if (!document.getElementById('no-repartidores-styles')) {
      const style = document.createElement('style');
      style.id = 'no-repartidores-styles';
      style.textContent = `
        .no-repartidores-overlay {
          z-index: 1000 !important;
        }

        .no-repartidores-content {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          text-align: center;
          color: white;
          backdrop-filter: blur(10px);
          animation: fadeInScale 0.5s ease-out;
        }

        .no-repartidores-icon {
          position: relative;
          width: 80px;
          height: 80px;
          margin: 0 auto 20px;
        }

        .search-circle {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 60px;
          height: 60px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }

        .search-pulse {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 60px;
          height: 60px;
          border: 4px solid rgba(255, 255, 255, 0.6);
          border-radius: 50%;
          animation: pulseExpand 2s ease-in-out infinite;
        }

        .search-emoji {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 32px;
          animation: bounce 1s ease-in-out infinite;
        }

        .no-repartidores-content h3 {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 12px 0;
          color: white;
        }

        .no-repartidores-content p {
          font-size: 16px;
          line-height: 1.6;
          margin: 8px 0;
          color: rgba(255, 255, 255, 0.9);
        }

        .no-repartidores-info {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          font-size: 14px;
        }

        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 0.5;
            transform: translate(-50%, -50%) scale(1.1);
          }
        }

        @keyframes pulseExpand {
          0% {
            opacity: 0.6;
            transform: translate(-50%, -50%) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(2);
          }
        }

        @keyframes bounce {
          0%, 100% {
            transform: translate(-50%, -50%) translateY(0);
          }
          50% {
            transform: translate(-50%, -50%) translateY(-8px);
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Ocultar mensaje de no repartidores cuando aparecen repartidores
   */
  ocultarMensajeNoRepartidores() {
    if (this.overlayNoRepartidores) {
      this.map.removeLayer(this.overlayNoRepartidores);
      this.overlayNoRepartidores = null;
    }
  }

  /**
   * Actualizar repartidor específico (desde Socket)
   * @param {Object} data - Datos de ubicación
   */
  actualizarRepartidor(data) {
    const { repartidorId, lat, lng } = data;

    if (this.repartidoresMarkers.has(repartidorId)) {
      const marker = this.repartidoresMarkers.get(repartidorId);
      marker.setLatLng([lat, lng]);
    } else {
      // Si es un repartidor nuevo, recargar todos
      this.cargarRepartidoresCercanos();
    }
  }

  /**
   * Mostrar ETA de recogida cuando se asigna un pedido
   * @param {string} pedidoId - ID del pedido
   * @param {string} repartidorId - ID del repartidor asignado
   */
  async mostrarETARecogida(pedidoId, repartidorId) {
    this.pedidoActivo = pedidoId;
    this.repartidorAsignado = repartidorId;

    try {
      const response = await fetch(`/api/map/eta-comercio/${pedidoId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Error al calcular ETA');
      }

      const data = await response.json();

      if (data.success && data.distancia) {
        this.mostrarNotificacionETA(data);
        this.resaltarRepartidorAsignado(repartidorId);
      }
    } catch (error) {
      console.error('❌ Error obteniendo ETA:', error);
    }
  }

  /**
   * Mostrar notificación de ETA de recogida
   * @param {Object} data - { distancia, eta, nombreComercio }
   */
  mostrarNotificacionETA(data) {
    const { distancia, eta } = data;
    const distanciaKm = (distancia / 1000).toFixed(1);

    const notificacion = document.createElement('div');
    notificacion.className = 'eta-notification';
    notificacion.innerHTML = `
      <div class="eta-icon">🛵</div>
      <div class="eta-content">
        <h3>Repartidor en camino</h3>
        <p>Llegará en <strong>~${eta} minutos</strong></p>
        <p class="eta-distancia">${distanciaKm} km de distancia</p>
      </div>
      <button class="eta-close" onclick="this.parentElement.remove()">×</button>
    `;

    document.body.appendChild(notificacion);

    setTimeout(() => notificacion.classList.add('show'), 100);

    // Auto-cerrar después de 10 segundos
    setTimeout(() => {
      notificacion.classList.remove('show');
      setTimeout(() => notificacion.remove(), 300);
    }, 10000);
  }

  /**
   * Resaltar repartidor asignado en el mapa
   * @param {string} repartidorId - ID del repartidor
   */
  resaltarRepartidorAsignado(repartidorId) {
    const marker = this.repartidoresMarkers.get(repartidorId);
    if (marker) {
      marker.setIcon(this.crearIconoRepartidorAsignado());
      marker.openPopup();

      // Centrar mapa en el repartidor
      this.map.setView(marker.getLatLng(), 15, { animate: true });

      // Dibujar línea al comercio
      L.polyline(
        [marker.getLatLng(), this.comercioMarker.getLatLng()],
        {
          color: '#10b981',
          weight: 3,
          dashArray: '10, 5',
          opacity: 0.7
        }
      ).addTo(this.map);
    }
  }

  /**
   * Crear iconos personalizados
   */
  crearIconoComercio() {
    return L.divIcon({
      className: 'custom-marker-comercio',
      html: '<div class="marker-pulse">🏪</div>',
      iconSize: [50, 50],
      iconAnchor: [25, 50],
      popupAnchor: [0, -50]
    });
  }

  crearIconoRepartidorDisponible() {
    return L.divIcon({
      className: 'custom-marker-repartidor-disponible',
      html: '🛵',
      iconSize: [35, 35],
      iconAnchor: [17, 35],
      popupAnchor: [0, -35]
    });
  }

  crearIconoRepartidorOcupado() {
    return L.divIcon({
      className: 'custom-marker-repartidor-ocupado',
      html: '🛵',
      iconSize: [35, 35],
      iconAnchor: [17, 35],
      popupAnchor: [0, -35]
    });
  }

  crearIconoRepartidorAsignado() {
    return L.divIcon({
      className: 'custom-marker-repartidor-asignado',
      html: '🛵',
      iconSize: [45, 45],
      iconAnchor: [22, 45],
      popupAnchor: [0, -45]
    });
  }

  /**
   * Mostrar mensaje de error
   */
  mostrarError(mensaje) {
    console.error('❌', mensaje);
    alert(mensaje);
  }

  /**
   * Destruir instancia del mapa
   */
  destroy() {
    if (this.intervaloActualizacion) {
      clearInterval(this.intervaloActualizacion);
      this.intervaloActualizacion = null;
    }

    // Usar destructor del Map Engine si está disponible
    if (this.mapEngine) {
      this.mapEngine.destruirMapa();
      this.mapEngine = null;
    } else if (this.map) {
      this.map.remove();
    }
    
    this.map = null;
    this.comercioMarker = null;
    this.repartidoresMarkers.clear();
    this.pedidoActivo = null;
    this.repartidorAsignado = null;

    console.log('🗑️ Mapa del comercio destruido');
  }
}

// ====================================
// ESTILOS CSS
// ====================================

const estilos = `
<style>
/* Contenedor del mapa */
#comercio-map {
  width: 100%;
  height: 600px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Marcadores personalizados */
.custom-marker-comercio {
  font-size: 40px;
  text-align: center;
  line-height: 50px;
}

.marker-pulse {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { 
    transform: scale(1); 
    opacity: 1;
  }
  50% { 
    transform: scale(1.2); 
    opacity: 0.8;
  }
}

.custom-marker-repartidor-disponible {
  font-size: 28px;
  text-align: center;
  line-height: 35px;
  filter: grayscale(0%) brightness(1.2);
}

.custom-marker-repartidor-ocupado {
  font-size: 28px;
  text-align: center;
  line-height: 35px;
  filter: grayscale(50%) brightness(0.8);
}

.custom-marker-repartidor-asignado {
  font-size: 36px;
  text-align: center;
  line-height: 45px;
  filter: drop-shadow(0 0 10px #10b981);
  animation: bounce 1s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* Resumen de repartidores */
#repartidores-resumen {
  display: flex;
  justify-content: space-around;
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background: rgba(6, 182, 212, 0.1);
  border-radius: 12px;
}

.resumen-item {
  flex: 1;
  text-align: center;
}

.resumen-label {
  display: block;
  font-size: 12px;
  text-transform: uppercase;
  color: #666;
  margin-bottom: 5px;
}

.resumen-valor {
  display: block;
  font-size: 28px;
  font-weight: bold;
  color: #0891b2;
}

.resumen-disponible {
  color: #10b981;
}

.resumen-ocupado {
  color: #f59e0b;
}

/* Notificación de ETA */
.eta-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  z-index: 9000;
  transform: translateX(400px);
  transition: transform 0.3s ease;
  max-width: 350px;
}

.eta-notification.show {
  transform: translateX(0);
}

.eta-icon {
  font-size: 48px;
  animation: slideHorizontal 2s infinite;
}

@keyframes slideHorizontal {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(10px); }
}

.eta-content h3 {
  margin: 0 0 5px 0;
  font-size: 18px;
  color: #0891b2;
}

.eta-content p {
  margin: 5px 0;
  font-size: 14px;
  color: #666;
}

.eta-distancia {
  font-size: 12px !important;
  color: #999 !important;
}

.eta-close {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  transition: color 0.2s ease;
}

.eta-close:hover {
  color: #333;
}

/* Popups del mapa */
.map-popup h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #0891b2;
}

.map-popup p {
  margin: 5px 0;
  font-size: 13px;
  color: #666;
}

/* Responsive */
@media (max-width: 768px) {
  #comercio-map {
    height: 400px;
  }

  #repartidores-resumen {
    flex-direction: column;
    gap: 10px;
  }

  .eta-notification {
    max-width: 90%;
    right: 5%;
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
window.ComercioMapService = ComercioMapService;

console.log('✅ ComercioMapService cargado correctamente');
