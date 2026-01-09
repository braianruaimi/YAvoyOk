import React, { useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../hooks/useAuth'; // Tu hook de autenticación

/**
 * Centro de Notificaciones en Tiempo Real
 * Muestra notificaciones tipo "toast" con animaciones
 */
const NotificationCenter = () => {
  const { user } = useAuth(); // Obtener usuario autenticado
  const { notificaciones, clearNotification, clearAllNotifications, toggleSonido, sonidoActivo } =
    useNotifications(user?.uid);

  /**
   * Auto-dismiss de notificaciones después de 8 segundos
   */
  useEffect(() => {
    notificaciones.forEach((notif) => {
      // Solo auto-dismiss para ciertos tipos
      if (notif.tipo !== 'ENTREGA_EXITOSA') {
        setTimeout(() => {
          clearNotification(notif.pedidoId, notif.tipo);
        }, 8000);
      }
    });
  }, [notificaciones]);

  /**
   * Mapeo de colores según tipo
   */
  const getColorClasses = (color) => {
    const colores = {
      success: 'bg-green-500 border-green-600',
      warning: 'bg-yellow-500 border-yellow-600',
      info: 'bg-blue-500 border-blue-600',
      error: 'bg-red-500 border-red-600',
    };
    return colores[color] || colores.info;
  };

  if (notificaciones.length === 0) return null;

  return (
    <>
      {/* Contenedor de notificaciones (posición fija) */}
      <div className="fixed top-20 right-4 z-50 space-y-3 max-w-md">
        {notificaciones.map((notif, index) => (
          <div
            key={`${notif.pedidoId}-${notif.tipo}-${index}`}
            className={`
              ${getColorClasses(notif.color)}
              text-white rounded-lg shadow-2xl border-l-4
              p-4 pr-12 relative
              animate-slide-in-right
              backdrop-blur-sm bg-opacity-95
              transform transition-all duration-300 hover:scale-105
            `}
            role="alert"
          >
            {/* Icono */}
            <div className="flex items-start gap-3">
              <span className="text-3xl flex-shrink-0" role="img" aria-label="icono">
                {notif.icono}
              </span>

              <div className="flex-1 min-w-0">
                {/* Mensaje principal */}
                <p className="font-bold text-base leading-tight mb-1">{notif.mensaje}</p>

                {/* Descripción */}
                {notif.descripcion && (
                  <p className="text-sm opacity-90 leading-tight">{notif.descripcion}</p>
                )}

                {/* Metadata adicional */}
                {notif.metadata?.distancia !== undefined && (
                  <div className="mt-2 flex items-center gap-2 text-xs opacity-80">
                    <span className="bg-white bg-opacity-20 px-2 py-1 rounded">
                      📏 {notif.metadata.distancia}m
                    </span>
                    <span className="bg-white bg-opacity-20 px-2 py-1 rounded">
                      ⏱️{' '}
                      {new Date(notif.timestamp).toLocaleTimeString('es-AR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Botón cerrar */}
            <button
              onClick={() => clearNotification(notif.pedidoId, notif.tipo)}
              className="
                absolute top-2 right-2
                text-white hover:bg-white hover:bg-opacity-20
                rounded-full w-8 h-8 flex items-center justify-center
                transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50
              "
              aria-label="Cerrar notificación"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* Barra de progreso (auto-dismiss) */}
            {notif.tipo !== 'ENTREGA_EXITOSA' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white bg-opacity-30 rounded-b-lg overflow-hidden">
                <div className="h-full bg-white animate-progress-bar" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Botón control de sonido (opcional) */}
      {notificaciones.length > 0 && (
        <button
          onClick={toggleSonido}
          className="
            fixed bottom-24 right-4 z-50
            bg-gray-800 text-white rounded-full
            w-12 h-12 flex items-center justify-center
            shadow-lg hover:bg-gray-700
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-cyan-500
          "
          aria-label={sonidoActivo ? 'Silenciar notificaciones' : 'Activar sonido'}
          title={sonidoActivo ? 'Silenciar' : 'Activar sonido'}
        >
          {sonidoActivo ? '🔔' : '🔕'}
        </button>
      )}

      {/* Botón limpiar todas (si hay más de 2) */}
      {notificaciones.length > 2 && (
        <button
          onClick={clearAllNotifications}
          className="
            fixed bottom-8 right-4 z-50
            bg-red-500 text-white text-xs font-semibold
            px-3 py-2 rounded-full shadow-lg
            hover:bg-red-600 transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-red-400
          "
        >
          Limpiar todo ({notificaciones.length})
        </button>
      )}
    </>
  );
};

export default NotificationCenter;
