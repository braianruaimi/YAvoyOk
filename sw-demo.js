// Service Worker para YAvoy Demo - Accesibilidad PWA
const CACHE_NAME = 'yavoy-accessibility-v1.0';
const urlsToCache = [
  '/demo-accesibilidad.html',
  '/js/yavoy-ai-advanced.js',
  '/js/yavoy-ai-integration.js',
  '/chatbot-ia-config.html',
  '/manifest-demo.json'
];

// Instalación del Service Worker
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('📦 Cache abierto');
        return cache.addAll(urlsToCache);
      })
      .catch(function(error) {
        console.log('❌ Error al cachear archivos:', error);
      })
  );
});

// Interceptar peticiones de red
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          function(response) {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone response for cache
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
      .catch(function() {
        // Fallback para modo offline
        if (event.request.destination === 'document') {
          return caches.match('/demo-accesibilidad.html');
        }
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Eliminando cache antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Manejo de mensajes desde la app principal
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Notificaciones push (para futuras características)
self.addEventListener('push', function(event) {
  const options = {
    body: 'Nueva actualización de accesibilidad disponible',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: 'accessibility-update',
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'view',
        title: 'Ver cambios',
        icon: '/icons/view.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('YAvoy Accesibilidad', options)
  );
});

// Manejo de clics en notificaciones
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/demo-accesibilidad.html')
    );
  }
});

console.log('🔧 Service Worker YAvoy Accesibilidad registrado');