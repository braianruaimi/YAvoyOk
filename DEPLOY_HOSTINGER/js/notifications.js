// js/notifications.js - Lógica para gestionar las notificaciones push

/**
 * Revisa si el navegador soporta las APIs necesarias para notificaciones push
 * y si el usuario ya ha concedido el permiso.
 */
function checkNotificationSupport() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Notificaciones Push no soportadas: Service Worker no disponible.');
    return false;
  }
  if (!('PushManager' in window)) {
    console.warn('Notificaciones Push no soportadas: Push API no disponible.');
    return false;
  }
  return true;
}

/**
 * Convierte una clave VAPID de formato base64url a un Uint8Array.
 * @param {string} base64String - La clave en formato base64url.
 * @returns {Uint8Array} - La clave convertida.
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Solicita permiso al usuario para mostrar notificaciones.
 * Si el permiso es concedido, procede a suscribir al usuario.
 */
async function requestNotificationPermission() {
  if (!checkNotificationSupport()) return;

  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    console.log('✅ Permiso para notificaciones concedido.');
    await subscribeUserToPush();
  } else {
    console.warn('❌ Permiso para notificaciones denegado.');
  }
}

/**
 * Suscribe al usuario a las notificaciones push y envía la suscripción al servidor.
 */
async function subscribeUserToPush() {
  try {
    const serviceWorkerRegistration = await navigator.serviceWorker.ready;
    const apiBase = `${location.protocol}//${location.hostname}:5501`;

    // Obtener la clave pública VAPID del servidor
    const response = await fetch(`${apiBase}/api/vapid-public-key`);
    if (!response.ok) {
      throw new Error('No se pudo obtener la clave pública VAPID del servidor.');
    }
    const vapidPublicKey = await response.text();
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

    // Suscribir al usuario
    const subscription = await serviceWorkerRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    console.log('✓ Usuario suscrito a notificaciones push:', subscription);

    // Enviar la suscripción al backend
    await sendSubscriptionToServer(subscription);
  } catch (error) {
    console.error('Error al suscribir al usuario a las notificaciones push:', error);
  }
}

/**
 * Envía el objeto de suscripción al endpoint del servidor.
 * @param {PushSubscription} subscription - El objeto de suscripción.
 */
async function sendSubscriptionToServer(subscription) {
  try {
    const apiBase = `${location.protocol}//${location.hostname}:5501`;
    const response = await fetch(`${apiBase}/api/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });

    if (response.ok) {
      console.log('✓ Suscripción enviada y registrada en el servidor.');
    } else {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al registrar la suscripción en el servidor.');
    }
  } catch (error) {
    console.error('Error al enviar la suscripción al servidor:', error);
  }
}

/**
 * Inicializa el proceso de suscripción a notificaciones.
 * Se puede llamar desde un botón o un evento específico en la UI.
 */
export function initializePushNotifications() {
  // No hacer nada si el permiso ya fue concedido o denegado explícitamente.
  // Solo actuar si está en 'default' (el usuario no ha elegido).
  if (checkNotificationSupport() && Notification.permission === 'default') {
    // Podríamos mostrar un botón o un modal para que el usuario inicie la suscripción.
    // Por ahora, lo dejamos listo para ser llamado manualmente.
    console.log('Listo para solicitar permiso de notificaciones.');
  } else if (Notification.permission === 'granted') {
    console.log('El permiso para notificaciones ya fue concedido previamente.');
    // Opcional: Re-sincronizar la suscripción por si algo cambió.
    // subscribeUserToPush();
  }
}

// Exportamos la función principal para que pueda ser llamada desde la UI.
export { requestNotificationPermission };
