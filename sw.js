// Versión del Service Worker y nombres de caché
const VERSION = 'v13';
const CACHE_STATIC = `yavoy-static-${VERSION}`;
const CACHE_DYNAMIC = `yavoy-dynamic-${VERSION}`;

// Archivos a pre-cachear durante la instalación
const PRE_CACHE = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/styles.css',
  '/script.js',
  '/js/ui.js',
  '/js/forms.js',
  '/js/db.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-yavoy.png',
];

// Importar la librería idb para IndexedDB
self.importScripts('https://cdn.jsdelivr.net/npm/idb@7/build/umd.js');
const { openDB } = idb;

// Evento de instalación: Pre-cachea los archivos estáticos
self.addEventListener('install', (event) => {
  console.log(`[SW ${VERSION}] Instalando...`);
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => {
      console.log(`[SW ${VERSION}] Pre-caching de archivos estáticos.`);
      return cache.addAll(PRE_CACHE);
    })
  );
  self.skipWaiting();
});

// Evento de activación: Limpia cachés antiguos
self.addEventListener('activate', (event) => {
  console.log(`[SW ${VERSION}] Activado.`);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_STATIC && key !== CACHE_DYNAMIC) {
            console.log(`[SW ${VERSION}] Eliminando caché antigua: ${key}`);
            return caches.delete(key);
          }
        })
      )
    )
  );
  return self.clients.claim();
});

// Evento fetch: Decide cómo manejar cada petición
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar peticiones que no son GET
  if (request.method !== 'GET') {
    return;
  }

  // Estrategia para la API: Stale-While-Revalidate
  if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Estrategia para archivos pre-cacheados: Cache First
  if (PRE_CACHE.some(path => url.pathname === path)) {
    event.respondWith(caches.match(request));
    return;
  }

  // Estrategia para otras peticiones (imágenes, fuentes, etc.): Cache First con fallback a red
  event.respondWith(cacheFirstWithNetworkFallback(request));
});

// Función para la estrategia Stale-While-Revalidate
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_DYNAMIC);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    cache.put(request, networkResponse.clone());
    return networkResponse;
  });

  return cachedResponse || fetchPromise;
}

// Función para la estrategia Cache First con fallback a red
async function cacheFirstWithNetworkFallback(request) {
    const cache = await caches.open(CACHE_DYNAMIC);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    try {
        const networkResponse = await fetch(request);
        // Solo cachear respuestas válidas
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        // Fallback para navegación si todo falla
        if (request.mode === 'navigate') {
            return caches.match('/offline.html');
        }
        return new Response("Contenido no disponible sin conexión.", {
            status: 404,
            statusText: "Offline"
        });
    }
}


// Evento de sincronización en segundo plano
self.addEventListener('sync', (event) => {
  console.log(`[SW ${VERSION}] Evento de sincronización recibido: ${event.tag}`);
  if (event.tag === 'sync-new-commerce') {
    console.log(`[SW ${VERSION}] Sincronizando nuevos comercios...`);
    event.waitUntil(syncNewCommerces());
  }
});

// Función para sincronizar los comercios guardados en IndexedDB
async function syncNewCommerces() {
  try {
    const db = await openDB('YAvoyDB', 1);
    const allData = await db.getAll('sync-comercios');

    for (const payload of allData) {
      try {
        const response = await fetch('http://localhost:5501/api/guardar-comercio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          console.log(`✓ Comercio con ID ${payload.id || '(sin id)'} sincronizado.`);
          await db.delete('sync-comercios', payload.id);
        } else {
          console.error(`Error al sincronizar comercio ID ${payload.id}:`, await response.json());
        }
      } catch (error) {
        console.error(`Fallo de red al sincronizar comercio ID ${payload.id}:`, error);
        // Se reintentará en la próxima sincronización
        throw error; // Lanza el error para que waitUntil sepa que la sincronización falló
      }
    }
    console.log('[SW] Sincronización de comercios completada.');
  } catch (dbError) {
    console.error('Error al abrir IndexedDB durante la sincronización:', dbError);
  }
}

// Evento push: Se dispara cuando se recibe una notificación push
self.addEventListener('push', (event) => {
  console.log(`[SW ${VERSION}] Notificación Push recibida.`);
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.error('Error al parsear los datos de la notificación:', e);
      data = { title: 'YAvoy', body: event.data.text() };
    }
  }

  const title = data.title || 'YAvoy';
  const options = {
    body: data.body || 'Tienes una nueva notificación.',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-yavoy.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.data ? data.data.url : '/', // URL a abrir al hacer clic
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Evento notificationclick: Se dispara cuando el usuario hace clic en una notificación
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const urlToOpen = notification.data.url || '/';

  console.log(`[SW ${VERSION}] Clic en notificación. URL: ${urlToOpen}`);
  
  notification.close(); // Cierra la notificación

  // Abre la URL asociada en una nueva pestaña o enfoca una existente
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Revisa si ya hay una ventana abierta con la misma URL
      const matchingClient = windowClients.find(client => new URL(client.url).pathname === new URL(urlToOpen, self.location.origin).pathname);

      if (matchingClient) {
        return matchingClient.focus(); // Si la encuentra, la enfoca
      }
      // Si no, abre una nueva ventana
      return clients.openWindow(urlToOpen);
    })
  );
});
