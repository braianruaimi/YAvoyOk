import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Simulador de movimiento del repartidor
 * Actualiza la ubicación en Firestore cada 5 segundos
 * moviéndose gradualmente desde el origen hacia el destino
 */
export class SimuladorRepartidor {
  constructor(pedidoId, ubicacionOrigen, ubicacionDestino) {
    this.pedidoId = pedidoId;
    this.origen = ubicacionOrigen;
    this.destino = ubicacionDestino;
    this.posicionActual = { ...ubicacionOrigen };
    this.intervalo = null;
    this.pasos = 0;
    this.totalPasos = 50; // Aproximadamente 4 minutos (50 * 5seg)
    this.enMovimiento = false;
  }

  /**
   * Calcula la siguiente posición interpolando entre origen y destino
   */
  calcularSiguientePosicion() {
    this.pasos++;
    const progreso = Math.min(this.pasos / this.totalPasos, 1);

    // Interpolación lineal con ligera variación aleatoria
    const latDelta = this.destino.lat - this.origen.lat;
    const lngDelta = this.destino.lng - this.origen.lng;

    // Variación aleatoria para simular rutas reales (±0.0005 grados ≈ ±50m)
    const ruido = () => (Math.random() - 0.5) * 0.0005;

    this.posicionActual = {
      lat: this.origen.lat + latDelta * progreso + ruido(),
      lng: this.origen.lng + lngDelta * progreso + ruido(),
    };

    return this.posicionActual;
  }

  /**
   * Actualiza la posición en Firestore
   */
  async actualizarUbicacion() {
    try {
      const nuevaPosicion = this.calcularSiguientePosicion();
      const pedidoRef = doc(db, 'pedidos', this.pedidoId);

      await updateDoc(pedidoRef, {
        ubicacionRepartidor: {
          lat: nuevaPosicion.lat,
          lng: nuevaPosicion.lng,
          timestamp: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      });

      console.log(`📍 Posición actualizada [${this.pasos}/${this.totalPasos}]:`, nuevaPosicion);

      // Si llegó al destino, marcar como entregado
      if (this.pasos >= this.totalPasos) {
        await this.marcarComoEntregado();
        this.detener();
      }
    } catch (error) {
      console.error('Error actualizando ubicación:', error);
    }
  }

  /**
   * Marca el pedido como entregado
   */
  async marcarComoEntregado() {
    try {
      const pedidoRef = doc(db, 'pedidos', this.pedidoId);
      await updateDoc(pedidoRef, {
        estado: 'Entregado',
        updatedAt: serverTimestamp(),
        horaEntrega: serverTimestamp(),
        historialEstados: [
          {
            estado: 'Entregado',
            timestamp: new Date(),
            nota: 'Pedido entregado exitosamente',
          },
        ],
      });
      console.log('✅ Pedido marcado como entregado');
    } catch (error) {
      console.error('Error marcando como entregado:', error);
    }
  }

  /**
   * Inicia la simulación de movimiento
   */
  iniciar() {
    if (this.enMovimiento) {
      console.warn('⚠️ El simulador ya está en movimiento');
      return;
    }

    console.log('🚀 Iniciando simulación de repartidor...');
    this.enMovimiento = true;

    // Actualizar inmediatamente y luego cada 5 segundos
    this.actualizarUbicacion();
    this.intervalo = setInterval(() => {
      this.actualizarUbicacion();
    }, 5000);
  }

  /**
   * Detiene la simulación
   */
  detener() {
    if (this.intervalo) {
      clearInterval(this.intervalo);
      this.intervalo = null;
      this.enMovimiento = false;
      console.log('🛑 Simulación detenida');
    }
  }

  /**
   * Acelera la simulación (útil para testing)
   */
  acelerar(factorVelocidad = 2) {
    this.detener();
    this.intervalo = setInterval(() => {
      this.actualizarUbicacion();
    }, 5000 / factorVelocidad);
    this.enMovimiento = true;
  }
}

/**
 * Helper para iniciar simulación desde un pedido
 */
export const iniciarSimulacion = (pedido) => {
  if (!pedido.ubicacionOrigen || !pedido.ubicacionDestino) {
    console.error('❌ El pedido debe tener ubicaciones de origen y destino');
    return null;
  }

  const simulador = new SimuladorRepartidor(
    pedido.id,
    pedido.ubicacionOrigen,
    pedido.ubicacionDestino
  );

  simulador.iniciar();
  return simulador;
};
