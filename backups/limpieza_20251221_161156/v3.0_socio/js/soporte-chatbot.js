// Sistema de Soporte Técnico Automatizado 24/7
// Incluye: Chatbot IA con NLP, Sistema de Tickets, Análisis de Problemas

// Motor de Lenguaje Natural Mejorado
class NaturalLanguageProcessor {
  constructor() {
    // Palabras clave por intención con sinónimos y variaciones
    this.intents = {
      // Saludos
      'saludo': ['hola', 'buenos dias', 'buenas tardes', 'buenas noches', 'que tal', 'hey', 'saludos', 'holi'],
      
      // Hacer pedidos
      'hacer_pedido': ['hacer pedido', 'pedir', 'ordenar', 'comprar', 'solicitar', 'encargar', 'quiero pedir', 'como pido', 'realizar pedido', 'nuevo pedido'],
      
      // Rastrear pedidos
      'rastrear': ['rastrear', 'seguir', 'ubicacion', 'donde esta', 'estado pedido', 'tracking', 'ver pedido', 'mi pedido'],
      
      // Cancelar
      'cancelar': ['cancelar', 'anular', 'eliminar pedido', 'no quiero', 'deshacer'],
      
      // Tiempos
      'tiempo': ['cuanto tarda', 'demora', 'tiempo entrega', 'cuando llega', 'rapido', 'cuanto demora'],
      
      // Costos
      'costo': ['cuanto cuesta', 'precio', 'costo', 'tarifas', 'cuanto sale', 'cuanto pagar', 'valor'],
      
      // Pagos
      'pago': ['pagar', 'forma de pago', 'metodos pago', 'transferencia', 'efectivo', 'tarjeta', 'mercadopago'],
      
      // Registro comercio
      'registro_comercio': ['registrar comercio', 'dar de alta', 'nuevo comercio', 'sumar comercio', 'agregar negocio', 'como me registro'],
      
      // Comisiones
      'comision': ['comision', 'porcentaje', 'cobro', 'cuanto cobran', 'tarifa plataforma'],
      
      // Repartidor
      'ser_repartidor': ['ser repartidor', 'trabajar', 'repartir', 'delivery', 'reparto', 'unirme'],
      
      // Requisitos
      'requisitos': ['requisitos', 'necesito', 'condiciones', 'que necesito'],
      
      // Problemas técnicos
      'error_app': ['no funciona', 'error', 'falla', 'problema', 'bug', 'no carga', 'no abre'],
      
      // Notificaciones
      'notificaciones': ['notificaciones', 'alertas', 'avisos', 'push', 'activar notif', 'campana', 'web push'],
      
      // Chat
      'chat': ['chat', 'mensaje', 'hablar', 'comunicar', 'escribir', 'conversar'],
      
      // API y Técnico
      'api': ['api', 'endpoint', 'rest', 'servidor', 'backend'],
      
      // Offline
      'offline': ['offline', 'sin internet', 'sin conexion', 'indexeddb', 'guardar local'],
      
      // PWA
      'pwa': ['pwa', 'instalar app', 'aplicacion', 'service worker', 'cache', 'manifest'],
      
      // Dashboard y Admin
      'dashboard': ['dashboard', 'panel control', 'ceo', 'estadisticas', 'metricas', 'graficos'],
      
      'admin': ['admin', 'administrador', 'gestion', 'panel admin'],
      
      'mapa': ['mapa', 'ubicacion', 'gps', 'rastreo', 'tiempo real', 'entregas'],
      
      'informes': ['informes', 'reportes', 'analytics', 'datos', 'exportar'],
      
      // Contacto
      'contacto': ['contacto', 'telefono', 'whatsapp', 'email', 'comunicar'],
      
      // Agradecimiento
      'agradecimiento': ['gracias', 'muchas gracias', 'perfecto', 'excelente', 'ok', 'vale', 'genial']
    };
    
    // Negaciones
    this.negations = ['no', 'nunca', 'ninguno', 'nada'];
  }
  
  // Normalizar texto
  normalize(text) {
    return text.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Quitar tildes
      .replace(/[¿?¡!,.;]/g, '') // Quitar puntuación
      .trim();
  }
  
  // Detectar intención del usuario
  detectIntent(userMessage) {
    const normalized = this.normalize(userMessage);
    const words = normalized.split(' ');
    
    let bestMatch = null;
    let bestScore = 0;
    
    // Buscar coincidencias en cada intención
    for (const [intent, keywords] of Object.entries(this.intents)) {
      let score = 0;
      
      for (const keyword of keywords) {
        const keywordWords = keyword.split(' ');
        
        // Coincidencia exacta de frase
        if (normalized.includes(keyword)) {
          score += keywordWords.length * 2; // Mayor peso
        }
        
        // Coincidencia por palabras individuales
        for (const word of keywordWords) {
          if (words.includes(word)) {
            score += 1;
          }
        }
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = intent;
      }
    }
    
    return { intent: bestMatch, confidence: bestScore };
  }
  
  // Extraer contexto (números, fechas, montos, etc.)
  extractContext(text) {
    const context = {};
    
    // Números
    const numbers = text.match(/\d+/g);
    if (numbers) context.numbers = numbers.map(n => parseInt(n));
    
    // Montos de dinero
    const money = text.match(/\$\s*\d+/g);
    if (money) context.money = money;
    
    return context;
  }
}

// Base de conocimientos con respuestas automáticas
const knowledgeBase = {
  // Clientes
  'hacer-pedido': {
    categoria: 'clientes',
    pregunta: '¿Cómo hacer un pedido?',
    respuesta: `¡Es muy fácil hacer un pedido! 🎉

**Proceso actualizado:**

1️⃣ **Selecciona "Hacer Pedido"** en la página principal
2️⃣ **Elige el comercio** de tu preferencia
3️⃣ **Completa tus datos:**
   • Nombre completo
   • Teléfono de contacto
   • Dirección de entrega detallada
   • Email (opcional)
4️⃣ **Agrega productos:**
   • Descripción de lo que quieres
   • Cantidad
   • Puedes agregar varios productos
5️⃣ **Revisa el total** calculado automáticamente
6️⃣ **Confirma el pedido**

**Sistema mejorado:**
✅ Guardado automático en servidor
✅ Sincronización offline con IndexedDB
✅ Notificaciones push en cada estado
✅ Chat integrado con el comercio y repartidor

📱 **Estados del pedido:**
• 📦 Pendiente → Esperando repartidor
• ✅ Asignado → Repartidor confirmó
• 🚴 En Camino → Yendo a tu dirección
• 🎉 Entregado → ¡Disfruta!

¿Necesitas ayuda con algún paso específico?`
  },
  'rastrear-pedido': {
    categoria: 'clientes',
    pregunta: '¿Cómo rastrear mi pedido?',
    respuesta: `¡Rastreo en tiempo real disponible! 📍

**Cómo ver tu pedido:**

1️⃣ Ve a la página de **Pedidos** (pedidos.html)
2️⃣ Haz clic en la pestaña **"Lista de Pedidos"**
3️⃣ Busca tu pedido y haz clic en **"Ver detalles"**

**Estados actualizados automáticamente:**

📦 **PENDIENTE**
   ↓ Esperando que un repartidor acepte
   
✅ **ASIGNADO** 
   ↓ Ya hay repartidor confirmado
   ↓ Puedes chatear con él
   
🚴 **EN_CAMINO**
   ↓ El repartidor va hacia ti
   ↓ Ubicación en tiempo real (próximamente)
   
🎉 **ENTREGADO**
   ✓ ¡Pedido completado!

**Funciones adicionales:**
💬 **Chat integrado:** Habla directamente con el comercio y repartidor
🔔 **Notificaciones push:** Alertas automáticas en cada cambio
📊 **Panel de estadísticas:** Ve todos tus pedidos en un solo lugar

💡 **Tip:** Activa las notificaciones push para recibir actualizaciones instantáneas sin tener que recargar la página.

¿Tienes un pedido activo que quieras revisar?`
  },
  'cancelar-pedido': {
    categoria: 'clientes',
    pregunta: '¿Puedo cancelar un pedido?',
    respuesta: `Cancelaciones:

• Si está en estado "Pendiente": Contacta al comercio directamente
• Si ya fue aceptado: Habla con el repartidor o comercio
• En todos los casos: Comunícate lo antes posible

Recomendamos cancelar solo en casos necesarios para mantener la confianza en el sistema.`
  },
  'tiempo-entrega': {
    categoria: 'clientes',
    pregunta: 'Tiempos de entrega',
    respuesta: `Tiempos promedio de entrega:

🏠 Entregas locales: 20-40 minutos
🚗 Zonas cercanas: 30-60 minutos
📍 Zonas alejadas: 45-90 minutos

El tiempo exacto depende de:
• Distancia al comercio
• Disponibilidad del repartidor
• Tráfico actual
• Condiciones climáticas`
  },
  'costos-envio': {
    categoria: 'clientes',
    pregunta: 'Costos de envío',
    respuesta: `Los costos de envío dependen de:

💰 Rango general: $200 - $500
📏 Factor principal: Distancia
🏪 El comercio establece el precio

El costo se acuerda entre tú y el comercio antes de confirmar el pedido.`
  },

  // Comercios
  'registro-comercio': {
    categoria: 'comercios',
    pregunta: 'Proceso de registro de comercio',
    respuesta: `Registro de Comercio (100% GRATIS):

1. Haz clic en "Soy Comercio" → "Registrarme"
2. Completa el formulario con:
   • Nombre del comercio
   • Categoría (Restaurant, Farmacia, etc.)
   • WhatsApp de contacto
   • Email
   • Dirección
3. Envía el formulario
4. ¡Listo! Ya apareces en la plataforma

Sin costos de registro ni mensualidades. Solo pagas el envío cuando lo necesitas.`
  },
  'gestionar-pedidos': {
    categoria: 'comercios',
    pregunta: 'Gestionar pedidos',
    respuesta: `Panel de Comercio:

1. Accede con tu email en "Soy Comercio" → "Ingresar"
2. Verás todos tus pedidos en tiempo real
3. Puedes:
   • Ver detalles de cada pedido
   • Contactar al cliente
   • Coordinar con repartidores
   • Ver historial

El panel se actualiza automáticamente cada 30 segundos.`
  },
  'actualizar-datos': {
    categoria: 'comercios',
    pregunta: 'Actualizar información del comercio',
    respuesta: `Para actualizar tus datos:

📧 Envía un email a: YAvoy5@gmail.com
📱 O escríbenos por WhatsApp: +54 221 504 7962

Incluye:
• Nombre de tu comercio
• Datos a modificar
• Nuevos valores

Lo actualizamos en menos de 24 horas.`
  },

  // Repartidores
  'registro-repartidor': {
    categoria: 'repartidores',
    pregunta: 'Requisitos y registro de repartidor',
    respuesta: `Requisitos para Repartidores:

✅ Mayor de 18 años
✅ DNI argentino vigente
✅ Vehículo propio (moto, bici o auto)
✅ Documentación del vehículo vigente
✅ Celular con internet

Registro:
1. Haz clic en "Soy Repartidor" → "Registrarme"
2. Completa el formulario
3. Sube tu documentación
4. Espera aprobación (24-48hs)

¿Cumples con los requisitos?`
  },
  'ganancias': {
    categoria: 'repartidores',
    pregunta: '¿Cuánto puedo ganar como repartidor?',
    respuesta: `💰 Sistema de Ganancias:

Recibes el 80% del costo de envío:
• Envío de $300 → Ganas $240
• Envío de $500 → Ganas $400
• Envío de $800 → Ganas $640

📈 Beneficios adicionales:
• Propinas de clientes
• Bonos por entregas rápidas
• Sin límite de entregas diarias

Cuanto más trabajes, más ganas. Eres completamente independiente.`
  },
  'aceptar-pedidos': {
    categoria: 'repartidores',
    pregunta: 'Cómo aceptar pedidos',
    respuesta: `**Panel de Repartidor Actualizado:** 🚴

1️⃣ **Ingresa al panel** (panel-repartidor.html)
2️⃣ **Activa tu disponibilidad** con el toggle
3️⃣ **Verás pedidos disponibles** en tiempo real
4️⃣ **Revisa cada pedido:**
   • 📏 Distancia aproximada
   • 💰 Pago ofrecido
   • 📦 Detalles del pedido
   • 🏪 Comercio de origen
   • 📍 Dirección de entrega

5️⃣ **Haz clic en "Aceptar Pedido"**
6️⃣ **Usa el chat integrado** para coordinar
7️⃣ **Actualiza el estado** conforme avanzas:
   • "Asignado" → Confirmaste el pedido
   • "En Camino" → Vas hacia el cliente
   • "Entregado" → Completaste la entrega

**Funciones nuevas:**
✅ Sistema de ubicación en tiempo real
✅ Chat directo con cliente y comercio
✅ Historial de entregas
✅ Estadísticas de ganancias
✅ Notificaciones de nuevos pedidos

💡 **Tip:** Mantén tu ubicación actualizada para recibir pedidos más cercanos.

¿Quieres más info sobre cómo funciona el sistema de pagos?`
  },

  // Sistema de Chat
  'chat-pedido': {
    categoria: 'general',
    pregunta: 'Cómo usar el chat en pedidos',
    respuesta: `**Chat Integrado en Tiempo Real** 💬

Ahora puedes comunicarte directamente desde la plataforma:

**¿Quiénes pueden chatear?**
• 👤 Cliente ↔ 🏪 Comercio
• 👤 Cliente ↔ 🚴 Repartidor  
• 🏪 Comercio ↔ 🚴 Repartidor

**Cómo acceder al chat:**
1. Ve a la página de **Pedidos**
2. Busca tu pedido activo
3. Haz clic en el botón **"💬 Chat"**
4. ¡Escribe tu mensaje!

**Características:**
✅ Mensajes en tiempo real (sin recargar)
✅ Historial completo del pedido
✅ Indicadores de quién escribió
✅ Timestamps de cada mensaje
✅ Se guarda automáticamente en el servidor

**API Endpoint:**
• POST /api/pedidos/:id/chat → Enviar mensaje
• GET /api/pedidos/:id/chat → Ver mensajes

💡 **Tip:** Usa el chat para aclarar dudas sobre el pedido, dar indicaciones de la dirección o coordinar la entrega.

¿Necesitas ayuda para enviar un mensaje?`
  },

  // Notificaciones Push
  'notificaciones-push': {
    categoria: 'tecnico',
    pregunta: 'Sistema de notificaciones push',
    respuesta: `**Notificaciones Push Web Implementadas** 🔔

**¿Qué son?**
Alertas automáticas que recibes en tu navegador, incluso con la pestaña cerrada.

**¿Para qué sirven?**
📦 Nuevo pedido recibido
✅ Pedido asignado a repartidor
🚴 Repartidor en camino
🎉 Pedido entregado
💬 Nuevo mensaje en el chat

**Cómo activarlas:**
1. Haz clic en la campana 🔔 (arriba a la derecha)
2. Pasa el mouse sobre ella
3. Clic en **"Activar"**
4. Acepta el permiso en tu navegador

**Si las bloqueaste sin querer:**
1. Haz clic en el candado 🔒 (barra de dirección)
2. Busca "Notificaciones"
3. Cambia a **"Permitir"**
4. Recarga la página (F5)

**Tecnología implementada:**
• Web Push API
• Service Worker (sw.js v7)
• VAPID Keys configuradas
• Servidor Node.js con web-push

**Navegadores compatibles:**
✅ Chrome (escritorio y móvil)
✅ Edge
✅ Firefox
✅ Opera
⚠️ Safari (limitado)

¿Las notificaciones no funcionan? ¡Déjame ayudarte!`
  },

  // API REST
  'api-endpoints': {
    categoria: 'tecnico',
    pregunta: 'Endpoints de la API REST',
    respuesta: `**API REST Completa Implementada** 🚀

**PEDIDOS:**
• POST /api/pedidos → Crear pedido
• GET /api/pedidos → Listar pedidos (con filtros)
• GET /api/pedidos/:id → Obtener pedido específico
• PATCH /api/pedidos/:id/asignar → Asignar repartidor
• PATCH /api/pedidos/:id/estado → Actualizar estado
• PATCH /api/pedidos/:id → Actualizar pedido completo

**CHAT:**
• POST /api/pedidos/:id/chat → Enviar mensaje
• GET /api/pedidos/:id/chat → Obtener mensajes

**REPARTIDORES:**
• POST /api/repartidores → Registrar repartidor
• GET /api/repartidores → Listar repartidores
• PATCH /api/repartidores/:id/ubicacion → Actualizar ubicación
• PATCH /api/repartidores/:id/disponibilidad → Cambiar estado

**COMERCIOS:**
• POST /api/guardar-comercio → Guardar comercio
• GET /api/listar-comercios → Listar todos
• GET /api/comercio/:id → Obtener comercio
• PATCH /api/comercio/:id → Actualizar comercio

**NOTIFICACIONES:**
• GET /api/vapid-public-key → Clave pública VAPID
• POST /api/subscribe → Suscribir a notificaciones
• POST /api/send-notification → Enviar notificación

**INFORMES CEO:**
• GET /api/ceo/repartidores → Todos los informes
• GET /api/ceo/repartidores/:id → Informe específico
• GET /api/ceo/comercios → Todos los comercios
• GET /api/ceo/clientes → Todos los clientes

**Servidor:** http://localhost:5501
**Formato:** JSON
**CORS:** Habilitado

¿Necesitas ejemplos de uso de algún endpoint?`
  },

  // IndexedDB
  'indexeddb-offline': {
    categoria: 'tecnico',
    pregunta: 'Sincronización offline con IndexedDB',
    respuesta: `**Modo Offline Implementado** 📴

**¿Qué es IndexedDB?**
Base de datos local en tu navegador que permite guardar información aunque pierdas conexión.

**Funcionalidades offline:**
✅ Crear pedidos sin internet
✅ Guardar comercios localmente
✅ Sincronizar cuando vuelva la conexión
✅ Cache de recursos con Service Worker

**Cómo funciona:**
1. **Sin internet:** Los datos se guardan en IndexedDB
2. **Vuelve la conexión:** Se sincronizan automáticamente al servidor
3. **Transparente:** No notas la diferencia

**Base de datos:**
• Nombre: YAvoyDB
• Versión: 1
• Store: sync-comercios

**Funciones disponibles (js/db.js):**
• storeDataForSync() → Guardar para sincronizar
• getAllDataForSync() → Obtener datos pendientes
• clearSyncData() → Limpiar después de sync

**Service Worker (sw.js v7):**
• Cachea recursos esenciales
• Sirve página offline.html sin conexión
• Estrategia: Cache First, luego Network

💡 **Tip:** Puedes usar YAvoy sin internet y tus datos se guardarán automáticamente.

¿Quieres saber más sobre el Service Worker?`
  },

  // PWA v7
  'pwa-v7': {
    categoria: 'tecnico',
    pregunta: 'Progressive Web App versión 7',
    respuesta: `**YAvoy PWA v7 - Última Actualización** ✨

**Mejoras implementadas:**

🎨 **Visual:**
• Splash screen con animación suave
• Nuevos iconos PNG (192x192 y 512x512)
• Transiciones optimizadas
• Mejor compatibilidad CSS

⚡ **Performance:**
• Cache busting (?v=7 en recursos)
• Service Worker actualizado
• IndexedDB para datos offline
• Carga más rápida

📱 **Instalabilidad:**
• Manifest.json optimizado
• Iconos maskable para Android
• Apple touch icons para iOS
• Instalar como app nativa

🔧 **Técnico:**
• IIFE cerrada correctamente en script.js
• Smooth scroll mejorado
• IntersectionObserver para animaciones
• Validaciones de formulario

**Recursos en caché:**
• / (raíz)
• /index.html
• /styles.css
• /script.js
• /manifest.json
• /icons/*
• /offline.html

**Cómo actualizar:**
1. Ctrl + F5 (recarga forzada)
2. F12 → Application → Service Workers → Unregister
3. Clear site data
4. Reinstalar PWA

**Versión actual:** v7
**Última actualización:** 30/11/2025

¿Tienes problemas con el cache de la PWA?`
  },

  // Dashboard CEO
  'dashboard-ceo': {
    categoria: 'admin',
    pregunta: 'Dashboard CEO - Panel de Control Ejecutivo',
    respuesta: `**Dashboard CEO - YAvoy 2026** 📊

**¿Qué es?**
Panel de control ejecutivo completo para administradores con visualización de métricas en tiempo real.

**Acceso:**
🔐 Login dual CEO (CEO1 / CEO2)
📍 URL: http://localhost:5501/dashboard-ceo.html
🔑 Contraseña: Carlos1804 o David2925

**KPIs Principales:**
📈 **Comercios Activos** - Total registrados
👥 **Repartidores** - Disponibles y totales
📦 **Pedidos del Día** - Hoy, semanal, mensual
💰 **Ingresos** - Facturación en tiempo real

**Gráficos Disponibles:**

1️⃣ **Pedidos por Estado** (Dona)
   • Pendiente, Asignado, En Camino, Entregado

2️⃣ **Ingresos Mensuales** (Barras)
   • Últimos 6 meses comparativos

3️⃣ **Comercios por Categoría** (Barras horizontales)
   • Alimentación, Salud, Bazar, etc.

4️⃣ **Evolución de Pedidos** (Línea)
   • Tendencia diaria de los últimos 30 días

5️⃣ **Top Repartidores** (Radar)
   • Ranking por entregas completadas

6️⃣ **Satisfacción del Cliente** (Polaridad)
   • Ratings promedio por categoría

**Funcionalidades:**
✅ Actualización automática cada 30 segundos
✅ Botón de refresh manual
✅ Visualización con Chart.js
✅ Datos reales del servidor
✅ Combinación con datos simulados
✅ Responsive design

**API Utilizada:**
GET /api/dashboard/stats
• comercios: total y por categoría
• repartidores: activos y disponibles
• pedidos: por estado y período
• ingresos: totales y mensuales

**Tecnologías:**
• Chart.js para gráficos
• Fetch API para datos en tiempo real
• CSS Grid para layout responsivo
• Degradados modernos

¿Necesitas acceso al dashboard o ayuda para interpretarlo?`
  },

  // Panel Admin
  'panel-admin': {
    categoria: 'admin',
    pregunta: 'Panel de Administración',
    respuesta: `**Panel Admin - Gestión Completa** ⚙️

**Acceso:**
📍 URL: http://localhost:5501/panel-admin.html
🔐 Solo para administradores

**Funciones Principales:**

👥 **Gestión de Usuarios:**
• Ver todos los usuarios del sistema
• Editar permisos y roles
• Activar/desactivar cuentas
• Historial de actividad

🏪 **Gestión de Comercios:**
• Aprobar nuevos comercios
• Editar información
• Ver estadísticas por comercio
• Gestionar categorías

🚴 **Gestión de Repartidores:**
• Ver documentación enviada
• Aprobar/rechazar solicitudes
• Verificar documentos
• Actualizar estados

📦 **Gestión de Pedidos:**
• Vista global de todos los pedidos
• Filtros avanzados
• Resolución de conflictos
• Estadísticas detalladas

📊 **Informes y Reportes:**
• Exportar datos a CSV/Excel
• Generar informes personalizados
• Análisis de tendencias
• Métricas de rendimiento

🔧 **Configuración del Sistema:**
• Parámetros generales
• Notificaciones push
• Mantenimiento
• Logs del sistema

**Características:**
✅ Interfaz intuitiva
✅ Búsqueda y filtros avanzados
✅ Acciones en lote
✅ Historial de cambios
✅ Permisos granulares

¿Necesitas ayuda con alguna función específica del panel admin?`
  },

  // Mapa de Entregas
  'mapa-entregas': {
    categoria: 'general',
    pregunta: 'Mapa de Entregas en Tiempo Real',
    respuesta: `**Mapa de Entregas en Vivo** 🗺️

**Acceso:**
📍 URL: http://localhost:5501/mapa-entregas.html

**¿Qué muestra?**
Visualización en tiempo real de todas las entregas activas en la ciudad.

**Elementos del Mapa:**

📍 **Marcadores:**
• 🏪 Verde: Comercios
• 🚴 Azul: Repartidores activos
• 📦 Rojo: Destinos de entrega
• 🎯 Naranja: Pedidos pendientes

📏 **Rutas:**
• Líneas conectando comercio → repartidor → cliente
• Distancia estimada en km
• Tiempo estimado de llegada

⚡ **Actualización:**
• Cada 5 segundos
• Posición GPS de repartidores
• Estados de pedidos en tiempo real

**Funciones Interactivas:**

🔍 **Zoom y Pan:**
• Acercar/alejar
• Mover el mapa
• Vista satelital/mapa

ℹ️ **Info Cards:**
• Clic en marcador para ver detalles
• Nombre del comercio/repartidor
• Estado del pedido
• Tiempo restante

🎚️ **Filtros:**
• Solo pedidos activos
• Por zona geográfica
• Por estado de entrega
• Por repartidor

📊 **Estadísticas en Vivo:**
• Total de entregas activas
• Repartidores disponibles
• Tiempo promedio de entrega
• Zona más demandada

**Tecnología:**
• Google Maps API / Leaflet
• WebSocket para actualizaciones
• Geolocalización HTML5
• Clustering de marcadores

💡 **Tip:** Los clientes pueden ver solo SU entrega, los administradores ven TODAS.

¿Quieres saber cómo activar tu ubicación para rastreo?`
  },

  // Informes CEO
  'informes-ceo': {
    categoria: 'admin',
    pregunta: 'Sistema de Informes CEO',
    respuesta: `**Sistema de Informes CEO** 📑

**¿Qué son?**
Archivos JSON generados automáticamente con información detallada de repartidores, comercios y clientes.

**Ubicación:**
📂 registros/informes-ceo/
   ├── repartidores/
   ├── comercios/
   ├── clientes/
   ├── documentos-verificacion/
   └── configuraciones-comercios/

**Informes de Repartidores:**
Contienen: ID, nombre, documento, teléfono, email, fecha de registro, estado, verificación, estadísticas (pedidos completados, ganancia total, promedio calificación, disponibilidad), documentos de verificación (DNI, licencia, vehículo).

**Informes de Comercios:**
Contienen: ID, nombre del comercio, categoría, pedidos recibidos, ventas totales, estado activo, configuraciones (horario, días laborales, radio de entrega).

**Informes de Clientes:**
Contienen: ID, nombre, total de pedidos, gasto total, última compra, historial completo de pedidos.

**APIs de Acceso:**
• GET /api/ceo/repartidores → Todos los repartidores
• GET /api/ceo/repartidores/:id → Repartidor específico
• GET /api/ceo/comercios → Todos los comercios
• GET /api/ceo/clientes → Todos los clientes

**Generación Automática:**
✅ Al registrar nuevo usuario
✅ Al completar pedido
✅ Al actualizar datos
✅ Cada cambio de estado

**Uso:**
• Análisis de rendimiento
• Auditorías internas
• Decisiones estratégicas
• Reportes ejecutivos

¿Necesitas acceso a los informes?`
  },

  // Problemas Técnicos
  'no-carga': {
    categoria: 'tecnico',
    pregunta: 'La página no carga',
    respuesta: `Si la página no carga:

1️⃣ Verifica tu conexión a internet
2️⃣ Recarga la página (Ctrl + F5)
3️⃣ Limpia la caché del navegador
4️⃣ Prueba en modo incógnito
5️⃣ Usa otro navegador (Chrome, Edge, Firefox)
6️⃣ Verifica que no haya mantenimiento programado

Si el problema persiste, contáctanos con:
• Navegador que usas
• Sistema operativo
• Mensaje de error (si aparece)`
  },
  'errores-login': {
    categoria: 'tecnico',
    pregunta: 'Errores al iniciar sesión',
    respuesta: `Problemas de acceso:

🔐 Verifica que:
• Email esté escrito correctamente
• No haya espacios al inicio/final
• Estés usando el email de registro

🔄 Soluciones:
1. Limpia la caché del navegador
2. Intenta en modo incógnito
3. Verifica tu conexión a internet
4. Contacta a soporte si el error persiste

¿Qué mensaje de error ves exactamente?`
  },
  'notificaciones': {
    categoria: 'tecnico',
    pregunta: 'Problemas con notificaciones',
    respuesta: `**Sistema de Notificaciones Push Mejorado** 🔔

¡Lamento que tengas dificultades! Déjame ayudarte paso a paso:

**Para activar notificaciones:**
1️⃣ Haz clic en la campana 🔔 (esquina superior derecha)
2️⃣ Pasa el mouse sobre ella
3️⃣ Haz clic en **"Activar"**
4️⃣ Acepta en el navegador cuando aparezca el popup

**Si están bloqueadas:**
1. Haz clic en el candado 🔒 (barra de dirección)
2. Busca "Notificaciones"
3. Cambia a **"Permitir"**
4. Recarga la página (F5)

**Tecnología nueva implementada:**
✅ Web Push API con VAPID
✅ Service Worker v7
✅ Notificaciones persistentes
✅ Funciona con pestaña cerrada

**Navegadores compatibles:**
• ✅ Chrome (mejor experiencia)
• ✅ Edge
• ✅ Firefox
• ✅ Opera
• ⚠️ Safari (soporte limitado)

**Qué notificaciones recibirás:**
📦 Nuevo pedido creado
✅ Pedido asignado a repartidor
🚴 Repartidor en camino
🎉 Pedido entregado
💬 Nuevos mensajes en el chat

⚠️ **Importante:** Si estás en Edge o Safari, a veces los navegadores son más estrictos con los permisos. No te preocupes, es normal del navegador.

¿Sigues teniendo problemas? Dime qué navegador usas y te doy instrucciones específicas. 💙`
  },

  // Palabras clave para detección automática
  keywords: {
    'registro': ['registro-comercio', 'registro-repartidor'],
    'pedido': ['hacer-pedido', 'rastrear-pedido', 'cancelar-pedido'],
    'comercio': ['registro-comercio', 'gestionar-pedidos', 'actualizar-datos', 'app-comercio'],
    'repartidor': ['registro-repartidor', 'ganancias', 'aceptar-pedidos', 'app-repartidor'],
    'ganar': ['ganancias'],
    'pago': ['costos-envio', 'ganancias'],
    'login': ['errores-login'],
    'sesion': ['errores-login'],
    'carga': ['no-carga'],
    'notificacion': ['notificaciones', 'notificaciones-push', 'sistema-notificaciones'],
    'push': ['notificaciones-push', 'sistema-notificaciones'],
    'tiempo': ['tiempo-entrega'],
    'costo': ['costos-envio'],
    'precio': ['costos-envio'],
    'actualizar': ['actualizar-datos'],
    'modificar': ['actualizar-datos'],
    'rastrear': ['rastrear-pedido'],
    'seguir': ['rastrear-pedido'],
    'cancelar': ['cancelar-pedido'],
    'chat': ['chat-pedido', 'chat-sistema'],
    'mensaje': ['chat-pedido', 'chat-sistema'],
    'comunicar': ['chat-pedido', 'chat-sistema'],
    'api': ['api-endpoints'],
    'endpoint': ['api-endpoints'],
    'rest': ['api-endpoints'],
    'offline': ['indexeddb-offline'],
    'indexeddb': ['indexeddb-offline'],
    'sin internet': ['indexeddb-offline'],
    'pwa': ['pwa-v7', 'instalar-app'],
    'instalar': ['instalar-app', 'pwa-v7'],
    'app': ['app-comercio', 'app-repartidor', 'instalar-app'],
    'movil': ['app-comercio', 'app-repartidor'],
    'celular': ['app-comercio', 'app-repartidor'],
    'dashboard': ['dashboard-ceo', 'panel-admin', 'mapa-entregas', 'informes-ceo', 'portal-gestion'],
    'ceo': ['dashboard-ceo', 'informes-ceo'],
    'admin': ['panel-admin', 'dashboard-ceo', 'portal-gestion'],
    'mapa': ['mapa-entregas'],
    'informes': ['informes-ceo'],
    'reportes': ['informes-ceo'],
    'estadisticas': ['dashboard-ceo'],
    'portal': ['portal-gestion'],
    'gestion': ['portal-gestion'],
    'modulos': ['portal-gestion']
  },
  
  // Nuevos módulos implementados
  'chat-sistema': {
    categoria: 'general',
    pregunta: 'Sistema de Chat Completo',
    respuesta: `**Chat Sistema Profesional** 💬

**¡NUEVO! Interfaz completa tipo WhatsApp/Telegram**

🔗 **Acceso:** http://localhost:5501/chat-sistema.html

**Características:**

💬 **Conversaciones en Tiempo Real:**
• Lista de contactos con estado online/offline
• Mensajes instantáneos sin recargar
• Historial completo de conversación
• Indicador de "escribiendo..."
• Mensajes leídos/no leídos

👥 **¿Quiénes chatean?**
• 👤 Cliente ↔ 🏪 Comercio
• 👤 Cliente ↔ 🚴 Repartidor
• 🏪 Comercio ↔ 🚴 Repartidor

📱 **Funcionalidades:**
✅ Envío de mensajes de texto
✅ Emojis y reacciones
✅ Adjuntar archivos (próximamente)
✅ Notificaciones de nuevos mensajes
✅ Contador de no leídos
✅ Búsqueda en conversaciones
✅ Archivado de chats

🎨 **Interfaz Moderna:**
• Diseño oscuro elegante
• Animaciones suaves
• Responsive para móviles
• Avatares personalizados
• Timestamps de cada mensaje

**APIs Utilizadas:**
• GET /api/conversaciones → Lista de chats
• GET /api/chat/:id → Mensajes de conversación
• POST /api/chat/:id → Enviar mensaje
• PATCH /api/chat/:id/read → Marcar como leído

💡 **Tip:** El chat está integrado también en el módulo de pedidos, pero este sistema dedicado te da una experiencia más completa.

¿Necesitas ayuda para usar el chat?`
  },
  
  'app-comercio': {
    categoria: 'comercios',
    pregunta: 'App Móvil para Comercios',
    respuesta: `**YAvoy Comercio - App Móvil PWA** 🏪📱

**¡NUEVA APP EXCLUSIVA PARA COMERCIOS!**

🔗 **Acceso:** http://localhost:5501/comercio-app.html

**¿Qué es?**
Aplicación web progresiva (PWA) diseñada específicamente para que gestiones tu comercio desde el celular.

**Funcionalidades Principales:**

🔐 **Login Rápido:**
• Solo con tu WhatsApp
• Sin contraseñas complicadas
• Acceso inmediato

📦 **Gestión de Pedidos:**
• Crear pedidos para tus clientes
• Ver pedidos en tiempo real
• Actualizar estados
• Chat con clientes

📊 **Dashboard de Ventas:**
• Estadísticas del día
• Total de ventas
• Pedidos completados
• Ganancias mensuales

💬 **Chat Integrado:**
• Habla con tus clientes
• Coordina con repartidores
• Notificaciones instantáneas

📈 **Estadísticas en Vivo:**
• Pedidos activos
• Ventas del mes
• Clientes frecuentes
• Productos más vendidos

🔔 **Notificaciones Push:**
• Nuevo pedido recibido
• Cliente envió mensaje
• Repartidor asignado
• Pedido entregado

💡 **Características PWA:**
✅ Instalable como app nativa
✅ Funciona offline
✅ Pantalla completa
✅ Rápida y fluida
✅ Actualizaciones automáticas

**Diseño Mobile-First:**
• 100% optimizado para celular
• Interfaz táctil intuitiva
• Gestos naturales
• Botones grandes y fáciles
• Vista compacta y eficiente

**Cómo instalar la app:**
1. Abre comercio-app.html en tu celular
2. Menú del navegador → "Agregar a pantalla de inicio"
3. ¡Listo! Úsala como app nativa

💙 **Beneficio:** Gestiona tu negocio desde cualquier lugar, sin necesidad de estar en la PC.

¿Quieres que te guíe en el uso de la app?`
  },
  
  'app-repartidor': {
    categoria: 'repartidores',
    pregunta: 'App Móvil para Repartidores',
    respuesta: `**YAvoy Repartidor - App Móvil PWA** 🚴📱

**¡NUEVA APP EXCLUSIVA PARA REPARTIDORES!**

🔗 **Acceso:** http://localhost:5501/repartidor-app.html

**¿Qué es?**
Tu herramienta de trabajo en el bolsillo. App completa para gestionar entregas desde tu celular.

**Funcionalidades Core:**

🔐 **Login Simple:**
• WhatsApp + DNI
• Sin complicaciones
• Acceso rápido

🗺️ **Mapa de Entregas:**
• Pedidos disponibles cerca tuyo
• Ubicación en tiempo real
• Rutas optimizadas
• Distancia estimada
• Tiempo de llegada

📦 **Lista de Pedidos:**
• Pedidos activos
• Detalles completos
• Dirección del comercio
• Dirección de entrega
• Monto a ganar

✅ **Gestión de Estados:**
• "Aceptar Pedido" → Confirmas
• "En Camino" → Vas al cliente
• "Entregado" → Completaste

💰 **Panel de Ganancias:**
• Total ganado hoy
• Total del mes
• Promedio por entrega
• Pedidos completados
• Estadísticas diarias

📊 **Historial Completo:**
• Todas tus entregas
• Fechas y horarios
• Montos ganados
• Calificaciones recibidas
• Clientes atendidos

⏱️ **Métricas de Rendimiento:**
• Tiempo promedio de entrega
• Entregas por día
• Zonas más frecuentes
• Mejor horario de trabajo
• Calificación promedio

💬 **Chat Directo:**
• Con el cliente
• Con el comercio
• Notificaciones instantáneas
• Coordinar entregas fácilmente

🔔 **Notificaciones Push:**
• Nuevo pedido disponible
• Cliente cambió dirección
• Mensaje recibido
• Bonificación especial

**Características PWA:**
✅ Instalable como app
✅ Funciona offline (con caché)
✅ Actualización automática
✅ Notificaciones nativas
✅ Modo pantalla completa

**Optimización Móvil:**
• Botones grandes
• Gestos intuitivos
• Vista simplificada
• Carga rápida
• Bajo consumo de datos

**Modo Disponibilidad:**
🟢 **Online:** Recibes pedidos
🔴 **Offline:** No recibes pedidos

**Cómo instalar:**
1. Abre repartidor-app.html en tu celular
2. Menú → "Agregar a inicio"
3. ¡Ya tenés tu app de trabajo!

💙 **Ventaja:** Todo lo que necesitas para trabajar, en una app simple y rápida.

¿Tienes dudas sobre cómo usar la app?`
  },
  
  'sistema-notificaciones': {
    categoria: 'tecnico',
    pregunta: 'Sistema de Notificaciones Push Avanzado',
    respuesta: `**Sistema de Notificaciones Push Mejorado** 🔔✨

**¡NUEVO! Panel completo de gestión de notificaciones**

🔗 **Acceso:** http://localhost:5501/notificaciones-push.html

**¿Qué incluye este sistema?**

🎨 **6 Tipos de Notificaciones:**

1️⃣ **Nuevo Pedido** 📦
   • Para comercios
   • Sonido distintivo
   • Datos del pedido

2️⃣ **Pedido Asignado** ✅
   • Para clientes
   • Nombre del repartidor
   • Tiempo estimado

3️⃣ **Cambio de Estado** 🚴
   • Para todos
   • En camino / Entregado
   • Actualización en vivo

4️⃣ **Promociones** 🎉
   • Ofertas especiales
   • Descuentos
   • Novedades

5️⃣ **Alertas** ⚠️
   • Urgente
   • Requieren acción
   • Alta prioridad

6️⃣ **Mensajes de Chat** 💬
   • Nuevo mensaje
   • Desde cliente/comercio/repartidor
   • Vista previa

**Panel de Control:**

🔧 **Configuración Personalizada:**
• Activar/desactivar por tipo
• Volumen de sonido
• Vibración
• Vista previa
• No molestar (horarios)

📊 **Estadísticas:**
• Total notificaciones enviadas
• Tasa de apertura
• Notificaciones por tipo
• Horarios más activos
• Engagement del usuario

🎯 **Segmentación:**
• Por tipo de usuario (cliente/comercio/repartidor)
• Por ubicación geográfica
• Por comportamiento
• Por preferencias

🎨 **Personalización:**
• Iconos personalizados
• Colores por tipo
• Sonidos diferentes
• Badges numéricos
• Imágenes en notificaciones

**Tecnología Implementada:**

✅ **Web Push API**
• Estándar W3C
• Compatible con todos los navegadores modernos
• Funciona con app cerrada

✅ **VAPID Keys**
• Seguridad mejorada
• Autenticación servidor
• Prevención de spam

✅ **Service Worker v7**
• Manejo en segundo plano
• Cache inteligente
• Sincronización offline

✅ **Notification API**
• Nativas del sistema operativo
• Integradas con el SO
• Persistentes

**Compatibilidad:**

✅ Chrome (Desktop + Android) - Soporte completo
✅ Edge - Soporte completo
✅ Firefox - Soporte completo
✅ Opera - Soporte completo
⚠️ Safari - Soporte limitado (solo macOS 13+)
❌ Safari iOS - No soportado (limitación de Apple)

**Cómo activar:**

1️⃣ Abre notificaciones-push.html
2️⃣ Click en "Activar Notificaciones"
3️⃣ Acepta el permiso del navegador
4️⃣ Configura tus preferencias
5️⃣ ¡Listo! Ya recibirás alertas

**Ejemplo de Notificación:**

\`\`\`
[ICONO] YAvoy - Nuevo Pedido
Tienes un nuevo pedido de $1,500
Juan Pérez - Av. Colón 1234
[Botón: Ver Pedido] [Botón: Ignorar]
\`\`\`

**Ventajas:**

✨ No necesitas tener la página abierta
✨ Recibes alertas incluso en otros sitios
✨ Respuesta inmediata
✨ Mejor experiencia de usuario
✨ Mayor engagement

💡 **Importante:** En dispositivos móviles, instala la PWA para mejor experiencia de notificaciones.

¿Necesitas ayuda para configurar las notificaciones?`
  },
  
  'portal-gestion': {
    categoria: 'admin',
    pregunta: 'Portal de Gestión Centralizado',
    respuesta: `**Portal de Gestión YAvoy 2026** 🏠🎯

**¡NUEVO HUB CENTRAL DE NAVEGACIÓN!**

🔗 **Acceso:** http://localhost:5501/portal-gestion.html

**¿Qué es?**
Portal centralizado con acceso rápido a TODOS los módulos y sistemas de YAvoy.

**8 Módulos Principales:**

1️⃣ **Panel Admin** ⚙️
   • Gestión completa de usuarios
   • Comercios y repartidores
   • Aprobaciones y verificaciones
   • Acceso: panel-admin.html

2️⃣ **Dashboard CEO** 📊
   • Métricas ejecutivas
   • 6 KPIs en tiempo real
   • 6 gráficos Chart.js
   • Acceso: dashboard-ceo.html

3️⃣ **Mapa de Entregas** 🗺️
   • Visualización en vivo
   • Marcadores interactivos
   • Rutas y distancias
   • Acceso: mapa-entregas.html

4️⃣ **Chat Sistema** 💬
   • Interfaz tipo WhatsApp
   • Conversaciones completas
   • Mensajería en tiempo real
   • Acceso: chat-sistema.html

5️⃣ **Notificaciones Push** 🔔
   • Panel de control
   • 6 tipos de notificaciones
   • Configuración personalizada
   • Acceso: notificaciones-push.html

6️⃣ **Comercio App** 🏪
   • PWA para comercios
   • Gestión móvil
   • Dashboard de ventas
   • Acceso: comercio-app.html

7️⃣ **Repartidor App** 🚴
   • PWA para delivery
   • Mapa de pedidos
   • Panel de ganancias
   • Acceso: repartidor-app.html

8️⃣ **Sistema de Pedidos** 📦
   • CRUD completo
   • Chat integrado
   • Estadísticas
   • Acceso: pedidos.html

**Características del Portal:**

🎨 **Diseño Moderno:**
• Cards interactivas
• Gradientes elegantes
• Animaciones suaves
• Hover effects
• Responsive total

📱 **100% Responsive:**
• Adaptado a desktop
• Optimizado para tablet
• Funcional en móvil
• Grid adaptativo

🚀 **Navegación Rápida:**
• Un clic a cualquier módulo
• Descripción de cada sección
• Características resumidas
• Acceso directo

📋 **Información Clara:**
• Cada módulo muestra:
  - Título descriptivo
  - Emoji identificador
  - Breve descripción
  - Funcionalidades principales
  - Botón de acceso

**Beneficios:**

✅ Todo en un solo lugar
✅ Acceso organizado
✅ Visión general del sistema
✅ Navegación intuitiva
✅ Ahorro de tiempo
✅ Mejor UX para administradores

**Usuarios Recomendados:**

👨‍💼 **Administradores:** Acceso completo
👔 **CEO/Gerentes:** Dashboard y reportes
🛠️ **Staff Técnico:** Todos los módulos
📊 **Analistas:** Stats y reportes

💡 **Consejo:** Guarda este portal como favorito o página de inicio para acceder rápidamente a cualquier módulo.

**Próximamente en el Portal:**
🔜 Dashboard unificado
🔜 Widgets personalizables
🔜 Favoritos de módulos
🔜 Búsqueda global
🔜 Shortcuts de teclado

¿Quieres que te explique algún módulo en particular?`
  },
  
  'instalar-app': {
    categoria: 'tecnico',
    pregunta: 'Cómo instalar YAvoy como aplicación',
    respuesta: `**Instalar YAvoy como App Nativa** 📱✨

**¡Usa YAvoy como una app real en tu dispositivo!**

**¿Qué es una PWA?**
Progressive Web App: una web que se comporta como app nativa.

**Beneficios de Instalar:**

✅ Ícono en tu pantalla de inicio
✅ Funciona sin barra del navegador
✅ Más rápida y fluida
✅ Notificaciones nativas
✅ Funciona offline
✅ Usa menos batería
✅ Ocupa menos espacio que app nativa

**CÓMO INSTALAR:**

📱 **En Android (Chrome/Edge):**
1. Abre YAvoy en el navegador
2. Toca el menú (⋮) arriba a la derecha
3. Selecciona "Agregar a pantalla de inicio" o "Instalar app"
4. Confirma la instalación
5. ¡Listo! Aparecerá el ícono en tu pantalla

💻 **En Windows (Chrome/Edge):**
1. Abre YAvoy
2. Busca el ícono ➕ en la barra de direcciones
3. Click en "Instalar YAvoy"
4. Confirma
5. ¡Ya tienes la app en tu PC!

🍎 **En iPhone/iPad (Safari):**
1. Abre YAvoy en Safari
2. Toca el botón Compartir 📤
3. Selecciona "Agregar a pantalla de inicio"
4. Ponle un nombre
5. Toca "Agregar"

🖥️ **En Mac (Safari/Chrome):**
1. Abre YAvoy
2. En Chrome: Menú → Instalar YAvoy
3. En Safari: Archivo → Agregar a Dock
4. ¡Listo!

**Apps Específicas Instalables:**

🏪 **Comercio App:**
• comercio-app.html
• Para gestionar tu negocio

🚴 **Repartidor App:**
• repartidor-app.html
• Para tus entregas

💬 **Chat Sistema:**
• chat-sistema.html
• Para comunicaciones

📊 **Dashboard CEO:**
• dashboard-ceo.html
• Para métricas ejecutivas

**Características de la App Instalada:**

✨ Pantalla completa (sin barra del navegador)
✨ Splash screen con logo YAvoy
✨ Ícono personalizado
✨ Tema de color branded
✨ Gestos nativos
✨ Integración con el SO
✨ Notificaciones del sistema

**Versión Actual:** PWA v7
**Última Actualización:** 30/11/2025

**Si no aparece la opción de instalar:**
• Verifica que estés en HTTPS (o localhost)
• Asegúrate de usar un navegador compatible
• Revisa que el manifest.json esté cargado
• Limpia la caché del navegador

💡 **Tip:** Una vez instalada, puedes desinstalarla como cualquier app desde la configuración de tu dispositivo.

¿Tienes problemas al instalar? ¡Dime qué dispositivo usas!`
  }
};

// Sistema de tickets para problemas no resueltos
class TicketSystem {
  constructor() {
    this.tickets = this.loadTickets();
    this.analytics = this.loadAnalytics();
  }

  loadTickets() {
    try {
      return JSON.parse(localStorage.getItem('yavoy_tickets') || '[]');
    } catch {
      return [];
    }
  }

  loadAnalytics() {
    try {
      return JSON.parse(localStorage.getItem('yavoy_analytics') || '{}');
    } catch {
      return {
        totalConsultas: 0,
        categorias: {},
        problemasComunes: {},
        satisfaccion: []
      };
    }
  }

  saveTickets() {
    localStorage.setItem('yavoy_tickets', JSON.stringify(this.tickets));
  }

  saveAnalytics() {
    localStorage.setItem('yavoy_analytics', JSON.stringify(this.analytics));
  }

  createTicket(userMessage, categoria, resuelto = false) {
    const ticket = {
      id: `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fecha: new Date().toISOString(),
      mensaje: userMessage,
      categoria: categoria,
      resuelto: resuelto,
      timestamp: Date.now()
    };

    this.tickets.push(ticket);
    this.saveTickets();

    // Actualizar analíticas
    this.analytics.totalConsultas++;
    this.analytics.categorias[categoria] = (this.analytics.categorias[categoria] || 0) + 1;
    
    // Registrar problema común
    const palabrasClave = userMessage.toLowerCase().split(' ').filter(p => p.length > 3);
    palabrasClave.forEach(palabra => {
      this.analytics.problemasComunes[palabra] = (this.analytics.problemasComunes[palabra] || 0) + 1;
    });

    this.saveAnalytics();

    return ticket;
  }

  getTopProblems(limit = 10) {
    const sorted = Object.entries(this.analytics.problemasComunes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
    
    return sorted.map(([palabra, count]) => ({ palabra, count }));
  }

  getCategoryStats() {
    return this.analytics.categorias;
  }

  getTotalConsultas() {
    return this.analytics.totalConsultas;
  }

  registerSatisfaction(rating) {
    this.analytics.satisfaccion.push({
      rating,
      fecha: new Date().toISOString()
    });
    this.saveAnalytics();
  }
}

// Chatbot IA con procesamiento de lenguaje natural
class SoporteChatbot {
  constructor(options = {}) {
    this.messages = [];
    this.ticketSystem = new TicketSystem();
    this.nlp = new NaturalLanguageProcessor();
    this.conversationContext = [];
    this.conversationHistory = this.loadHistory();
    this.ratings = this.loadRatings();
    this.currentLanguage = 'es';
    this.voiceEnabled = 'speechSynthesis' in window;
    this.recognition = null;
    this.userProfile = this.loadUserProfile();
    this.autoGreeting = options.autoGreeting !== false; // Por defecto: true
    this.init();
  }
  
  loadUserProfile() {
    try {
      const saved = localStorage.getItem('yavoy_user_profile');
      return saved ? JSON.parse(saved) : {
        type: null, // 'cliente', 'comercio', 'repartidor'
        name: null,
        detectedFrom: [],
        confidence: 0,
        interactions: 0
      };
    } catch {
      return {
        type: null,
        name: null,
        detectedFrom: [],
        confidence: 0,
        interactions: 0
      };
    }
  }
  
  saveUserProfile() {
    localStorage.setItem('yavoy_user_profile', JSON.stringify(this.userProfile));
  }
  
  detectUserType(message) {
    const messageLower = message.toLowerCase();
    
    // Palabras clave por tipo de usuario
    const clienteKeywords = ['pedir', 'pedido', 'comprar', 'ordenar', 'recibir', 'entregar a mi', 'mi direccion', 'cuanto tarda', 'rastrear', 'donde esta'];
    const comercioKeywords = ['mi comercio', 'mi negocio', 'mi local', 'registrar comercio', 'vendo', 'mi tienda', 'mis productos', 'gestionar pedidos', 'mis ventas'];
    const repartidorKeywords = ['repartir', 'delivery', 'envios', 'mi moto', 'mi bici', 'ser repartidor', 'cuanto gano', 'aceptar pedidos', 'rutas'];
    
    let clienteScore = clienteKeywords.filter(k => messageLower.includes(k)).length;
    let comercioScore = comercioKeywords.filter(k => messageLower.includes(k)).length;
    let repartidorScore = repartidorKeywords.filter(k => messageLower.includes(k)).length;
    
    // Determinar tipo con mayor puntuación
    if (clienteScore > comercioScore && clienteScore > repartidorScore && clienteScore > 0) {
      this.updateUserProfile('cliente', messageLower);
    } else if (comercioScore > clienteScore && comercioScore > repartidorScore && comercioScore > 0) {
      this.updateUserProfile('comercio', messageLower);
    } else if (repartidorScore > clienteScore && repartidorScore > comercioScore && repartidorScore > 0) {
      this.updateUserProfile('repartidor', messageLower);
    }
  }
  
  updateUserProfile(type, context) {
    if (this.userProfile.type !== type) {
      this.userProfile.type = type;
      this.userProfile.confidence = 1;
      this.userProfile.detectedFrom.push(context.substring(0, 50));
      
      // Mensaje de bienvenida personalizado
      const welcomeMessages = {
        'cliente': '¡Hola! 👋 Veo que eres cliente de YAvoy. Perfecto, te ayudaré con tus pedidos y consultas.',
        'comercio': '¡Hola! 🏪 Veo que tienes un comercio. Genial, te ayudaré con tu negocio en YAvoy.',
        'repartidor': '¡Hola! 🚴 Veo que eres repartidor. Excelente, te ayudaré con tus entregas y consultas.'
      };
      
      if (!this.userProfile.interactions) {
        setTimeout(() => {
          this.addMessage(welcomeMessages[type], 'bot', false);
        }, 500);
      }
    }
    
    this.userProfile.interactions++;
    this.userProfile.confidence = Math.min(this.userProfile.confidence + 0.1, 1);
    this.saveUserProfile();
  }
  
  askUserType() {
    const message = `Para brindarte la mejor ayuda posible, ¿podrías decirme quién eres? 😊

<div style="display: flex; flex-direction: column; gap: 8px; margin-top: 12px;">
  <button class="rating-btn" style="width: 100%; padding: 12px;" onclick="window.chatbot.setUserType('cliente')">
    👤 Soy Cliente
  </button>
  <button class="rating-btn" style="width: 100%; padding: 12px;" onclick="window.chatbot.setUserType('comercio')">
    🏪 Tengo un Comercio
  </button>
  <button class="rating-btn" style="width: 100%; padding: 12px;" onclick="window.chatbot.setUserType('repartidor')">
    🚴 Soy Repartidor
  </button>
</div>`;

    this.addMessage(message, 'bot', false);
  }
  
  setUserType(type) {
    this.userProfile.type = type;
    this.userProfile.confidence = 1;
    this.userProfile.interactions = 1;
    this.saveUserProfile();
    
    const responses = {
      'cliente': '¡Perfecto! 👤 Como cliente, puedo ayudarte con pedidos, rastreo, tiempos de entrega y más. ¿Qué necesitas?',
      'comercio': '¡Genial! 🏪 Como comercio, puedo ayudarte con registro, gestión de pedidos, actualizaciones y más. ¿En qué te ayudo?',
      'repartidor': '¡Excelente! 🚴 Como repartidor, puedo ayudarte con requisitos, ganancias, cómo aceptar pedidos y más. ¿Qué consulta tienes?'
    };
    
    this.addMessage(responses[type], 'bot', false);
    this.showPersonalizedOptions();
  }
  
  showPersonalizedOptions() {
    if (!this.userProfile.type) return;
    
    const options = {
      'cliente': [
        { emoji: '📦', text: '¿Cómo hacer un pedido?', query: 'como hago un pedido' },
        { emoji: '🔍', text: '¿Cómo rastrear mi pedido?', query: 'rastrear pedido' },
        { emoji: '⏰', text: '¿Cuánto tarda la entrega?', query: 'cuanto tarda' },
        { emoji: '💰', text: '¿Cuánto cuesta el envío?', query: 'costo envio' }
      ],
      'comercio': [
        { emoji: '📝', text: '¿Cómo registro mi comercio?', query: 'registrar comercio' },
        { emoji: '💵', text: '¿Cuánto cobran de comisión?', query: 'comision' },
        { emoji: '📊', text: '¿Cómo gestiono pedidos?', query: 'gestionar pedidos' },
        { emoji: '✏️', text: '¿Cómo actualizo mis datos?', query: 'actualizar datos' }
      ],
      'repartidor': [
        { emoji: '🚴', text: '¿Cómo ser repartidor?', query: 'ser repartidor' },
        { emoji: '📋', text: '¿Qué requisitos necesito?', query: 'requisitos repartidor' },
        { emoji: '💰', text: '¿Cuánto puedo ganar?', query: 'cuanto gano' },
        { emoji: '✅', text: '¿Cómo acepto pedidos?', query: 'aceptar pedidos' }
      ]
    };
    
    const userOptions = options[this.userProfile.type] || [];
    
    if (userOptions.length > 0) {
      let optionsHTML = '<div style="margin-top: 12px;"><strong>Preguntas frecuentes para ti:</strong><br><br>';
      
      userOptions.forEach(opt => {
        optionsHTML += `<button class="suggestion-chip" style="margin: 4px;" onclick="window.chatbot.chatInput.value='${opt.query}'; window.chatbot.sendMessage();">
          ${opt.emoji} ${opt.text}
        </button>`;
      });
      
      optionsHTML += '</div>';
      
      setTimeout(() => {
        this.addMessage(optionsHTML, 'bot', false);
      }, 800);
    }
  }
  
  loadHistory() {
    try {
      return JSON.parse(localStorage.getItem('yavoy_chat_history') || '[]');
    } catch {
      return [];
    }
  }
  
  saveHistory() {
    // Guardar últimas 10 conversaciones
    if (this.conversationContext.length > 0) {
      const conversation = {
        id: Date.now(),
        date: new Date().toISOString(),
        messages: this.conversationContext.slice(),
        summary: this.conversationContext[0]?.message.substring(0, 50) + '...'
      };
      
      this.conversationHistory.unshift(conversation);
      this.conversationHistory = this.conversationHistory.slice(0, 10);
      localStorage.setItem('yavoy_chat_history', JSON.stringify(this.conversationHistory));
    }
  }
  
  loadRatings() {
    try {
      return JSON.parse(localStorage.getItem('yavoy_ratings') || '{}');
    } catch {
      return {};
    }
  }
  
  saveRating(messageId, rating) {
    this.ratings[messageId] = rating;
    localStorage.setItem('yavoy_ratings', JSON.stringify(this.ratings));
  }

  init() {
    this.chatMessages = document.getElementById('chatbotMessages');
    this.chatInput = document.getElementById('chatbotInput');
    this.chatSendBtn = document.getElementById('btnEnviarChatbot');
    this.suggestionsContainer = document.getElementById('chatbotSuggestions');
    this.suggestionChips = document.getElementById('chatbotSuggestions'); // Usar el mismo contenedor

    // Verificar que los elementos existan antes de agregar event listeners
    if (!this.chatMessages || !this.chatInput || !this.chatSendBtn) {
      console.error('❌ Chatbot: Elementos del DOM no encontrados');
      return;
    }

    // Event listeners principales
    this.chatSendBtn.addEventListener('click', () => this.sendMessage());
    this.chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    
    // Ctrl + Enter para enviar
    this.chatInput.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        this.sendMessage();
      }
      // Flecha arriba para historial de mensajes
      if (e.key === 'ArrowUp' && this.chatInput.value === '') {
        this.showPreviousMessage();
      }
    });

    // Sugerencias mientras escribe
    this.chatInput.addEventListener('input', () => this.showSuggestions());
    
    // Detectar comandos
    this.chatInput.addEventListener('input', (e) => {
      if (e.target.value.startsWith('/')) {
        this.handleCommand(e.target.value);
      }
    });

    // Inicializar controles
    this.initControls();
    
    // Inicializar reconocimiento de voz
    this.initVoiceRecognition();
    
    // Quick actions (solo si existen en la página)
    const actionCards = document.querySelectorAll('.action-card');
    if (actionCards.length > 0) {
      actionCards.forEach(card => {
        card.addEventListener('click', () => {
          const question = card.dataset.question;
          this.chatInput.value = question;
          this.sendMessage();
        });
      });
    }

    // Knowledge base items (solo si existen en la página)
    const kbItems = document.querySelectorAll('.kb-item');
    if (kbItems.length > 0) {
      kbItems.forEach(item => {
        item.addEventListener('click', () => {
          const topic = item.dataset.topic;
          if (knowledgeBase[topic]) {
            this.showKBAnswer(knowledgeBase[topic]);
          }
        });
      });
    }

    // Set initial time (solo si el elemento existe)
    const initialTimeEl = document.getElementById('initialTime');
    if (initialTimeEl) {
      initialTimeEl.textContent = this.getTime();
    }
    
    // Mostrar mensajes automáticos solo si está habilitado
    if (this.autoGreeting) {
      // Mostrar mensaje según hora del día
      this.showTimeBasedGreeting();
      
      // Preguntar tipo de usuario si no está definido
      setTimeout(() => {
        if (!this.userProfile.type) {
          this.askUserType();
        } else {
          // Saludar según el perfil guardado
          const greetings = {
            'cliente': '¡Hola de nuevo! 👤 Estoy aquí para ayudarte con tus pedidos.',
            'comercio': '¡Bienvenido! 🏪 ¿Cómo va tu comercio? ¿En qué puedo ayudarte hoy?',
            'repartidor': '¡Hola! 🚴 ¿Listo para más entregas? ¿Alguna consulta?'
          };
          this.addMessage(greetings[this.userProfile.type], 'bot', false);
        }
      }, 2000);
    }
  }
  
  initControls() {
    // Botón de voz
    const btnVoice = document.getElementById('btnVoice');
    if (btnVoice) {
      btnVoice.addEventListener('click', () => this.toggleVoice());
    }
    
    // Botón de historial
    const btnHistory = document.getElementById('btnHistory');
    if (btnHistory) {
      btnHistory.addEventListener('click', () => this.showHistory());
    }
    
    // Botón de exportar
    const btnExport = document.getElementById('btnExport');
    if (btnExport) {
      btnExport.addEventListener('click', () => this.exportConversation());
    }
    
    // Botón de limpiar
    const btnClear = document.getElementById('btnClear');
    if (btnClear) {
      btnClear.addEventListener('click', () => this.clearChat());
    }
    
    // Botón de WhatsApp
    const btnWhatsApp = document.getElementById('btnWhatsApp');
    if (btnWhatsApp) {
      btnWhatsApp.addEventListener('click', () => this.shareToWhatsApp());
    }
    
    // Botón de cambiar perfil
    const btnProfile = document.getElementById('btnProfile');
    if (btnProfile) {
      btnProfile.addEventListener('click', () => this.changeProfile());
    }
    
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.toggleTheme());
      this.loadTheme();
    }
  }
  
  changeProfile() {
    const currentType = this.userProfile.type;
    const typeNames = {
      'cliente': 'Cliente',
      'comercio': 'Comercio',
      'repartidor': 'Repartidor'
    };
    
    const message = currentType 
      ? `Actualmente estás configurado como: **${typeNames[currentType]}**\n\n¿Quieres cambiar tu perfil?`
      : '¿Quién eres?';
    
    this.addMessage(message, 'bot', false);
    setTimeout(() => this.askUserType(), 500);
  }
  
  initVoiceRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'es-AR';
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      
      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        this.chatInput.value = transcript;
        this.sendMessage();
      };
      
      this.recognition.onerror = (event) => {
        this.addMessage('❌ Error al capturar voz. Por favor, intenta de nuevo.', 'bot');
      };
    }
  }
  
  showTimeBasedGreeting() {
    const hour = new Date().getHours();
    let greeting = '';
    
    if (hour >= 0 && hour < 6) {
      greeting = '🌙 ¡Qué madrugada! No te preocupes, estoy despierto para ayudarte.';
    } else if (hour >= 6 && hour < 12) {
      greeting = '☀️ ¡Buenos días! Empecemos el día resolviendo tus dudas.';
    } else if (hour >= 12 && hour < 20) {
      greeting = '🌤️ ¡Buenas tardes! ¿En qué puedo ayudarte?';
    } else {
      greeting = '🌜 ¡Buenas noches! Estoy aquí para lo que necesites.';
    }
    
    setTimeout(() => {
      this.addMessage(greeting, 'bot');
    }, 1000);
  }
  
  handleCommand(command) {
    const commands = {
      '/pedido': '¿Cómo hago un pedido?',
      '/comercio': 'Quiero registrar mi comercio',
      '/repartidor': '¿Cómo ser repartidor?',
      '/costo': '¿Cuánto cuesta el envío?',
      '/tiempo': '¿Cuánto tarda la entrega?',
      '/ayuda': 'Mostrar comandos disponibles'
    };
    
    if (commands[command.trim()]) {
      this.chatInput.value = commands[command.trim()];
    }
  }
  
  showSuggestions() {
    const input = this.chatInput.value.toLowerCase();
    
    if (input.length < 3) {
      this.suggestionsContainer.classList.remove('show');
      return;
    }
    
    const suggestions = [
      'Cómo hacer un pedido',
      'Registrar mi comercio',
      'Ser repartidor',
      'Costos de envío',
      'Tiempos de entrega',
      'Métodos de pago',
      'Rastrear pedido',
      'Cancelar pedido',
      'Activar notificaciones',
      'Problemas técnicos'
    ];
    
    const matches = suggestions.filter(s => 
      s.toLowerCase().includes(input) || 
      input.split(' ').some(word => s.toLowerCase().includes(word))
    ).slice(0, 5);
    
    if (matches.length > 0) {
      this.suggestionChips.innerHTML = matches.map(s => 
        `<span class="suggestion-chip">${s}</span>`
      ).join('');
      
      this.suggestionChips.querySelectorAll('.suggestion-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          this.chatInput.value = chip.textContent;
          this.sendMessage();
        });
      });
      
      this.suggestionsContainer.classList.add('show');
    } else {
      this.suggestionsContainer.classList.remove('show');
    }
  }
  
  toggleVoice() {
    if (!this.recognition) {
      this.addMessage('❌ Tu navegador no soporta reconocimiento de voz. Intenta con Chrome o Edge.', 'bot');
      return;
    }
    
    const btnVoice = document.getElementById('btnVoice');
    
    if (btnVoice.classList.contains('recording')) {
      this.recognition.stop();
      btnVoice.classList.remove('recording');
      btnVoice.innerHTML = '🎤 Voz';
    } else {
      this.recognition.start();
      btnVoice.classList.add('recording');
      btnVoice.innerHTML = '⏹️ Detener';
      this.addMessage('🎤 Escuchando... Habla ahora.', 'bot');
    }
  }
  
  showHistory() {
    if (this.conversationHistory.length === 0) {
      this.addMessage('📜 No tienes conversaciones guardadas aún.', 'bot');
      return;
    }
    
    let historyHTML = '<div class="message bot"><div class="message-avatar">🤖</div><div class="message-content"><div class="message-bubble">';
    historyHTML += '<strong>📜 Historial de Conversaciones:</strong><br><br>';
    
    this.conversationHistory.forEach((conv, index) => {
      const date = new Date(conv.date).toLocaleDateString('es-AR');
      historyHTML += `<div style="margin-bottom: 10px; padding: 8px; background: var(--color-fondo); border-radius: 6px; cursor: pointer;" onclick="window.chatbot.loadConversation(${index})"`;
      historyHTML += `>${index + 1}. ${date} - ${conv.summary}</div>`;
    });
    
    historyHTML += '</div></div></div>';
    this.chatMessages.innerHTML += historyHTML;
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }
  
  loadConversation(index) {
    const conv = this.conversationHistory[index];
    if (!conv) return;
    
    this.clearChat(false);
    
    conv.messages.forEach(msg => {
      this.addMessage(msg.message, msg.role === 'user' ? 'user' : 'bot', false);
    });
  }
  
  exportConversation() {
    if (this.conversationContext.length === 0) {
      this.addMessage('❌ No hay conversación para exportar.', 'bot');
      return;
    }
    
    const options = [
      { text: '📧 Enviar por Email', value: 'email' },
      { text: '💾 Descargar TXT', value: 'txt' },
      { text: '📋 Copiar al portapapeles', value: 'copy' }
    ];
    
    let optionsHTML = '<div class="message bot"><div class="message-avatar">🤖</div><div class="message-content"><div class="message-bubble">';
    optionsHTML += '<strong>¿Cómo quieres exportar?</strong><br><br>';
    
    options.forEach(opt => {
      optionsHTML += `<button class="rating-btn" style="display: block; width: 100%; margin: 5px 0;" onclick="window.chatbot.doExport('${opt.value}')">${opt.text}</button>`;
    });
    
    optionsHTML += '</div></div></div>';
    this.chatMessages.innerHTML += optionsHTML;
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }
  
  doExport(type) {
    const conversation = this.conversationContext.map(msg => 
      `[${msg.role === 'user' ? 'Tú' : 'Bot'}]: ${msg.message}`
    ).join('\n\n');
    
    if (type === 'email') {
      const subject = encodeURIComponent('Conversación YAvoy Soporte');
      const body = encodeURIComponent(conversation);
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    } else if (type === 'txt') {
      const blob = new Blob([conversation], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `yavoy-chat-${Date.now()}.txt`;
      a.click();
    } else if (type === 'copy') {
      navigator.clipboard.writeText(conversation).then(() => {
        this.addMessage('✅ Conversación copiada al portapapeles.', 'bot');
      });
    }
  }
  
  clearChat(showConfirm = true) {
    if (showConfirm && !confirm('¿Limpiar toda la conversación?')) return;
    
    // Guardar en historial antes de limpiar
    this.saveHistory();
    
    // Limpiar
    this.conversationContext = [];
    
    const welcomeMessage = this.userProfile.type 
      ? `✨ Chat limpiado. ¿En qué más puedo ayudarte?`
      : `✨ Chat limpiado. ¿En qué puedo ayudarte ahora?`;
    
    this.chatMessages.innerHTML = `
      <div class="message bot">
        <div class="message-avatar">🤖</div>
        <div class="message-content">
          <div class="message-bubble">${welcomeMessage}</div>
          <div class="message-time">${this.getTime()}</div>
        </div>
      </div>
    `;
    
    // Mostrar opciones personalizadas si tiene perfil
    if (this.userProfile.type) {
      setTimeout(() => this.showPersonalizedOptions(), 500);
    }
  }
  
  shareToWhatsApp() {
    const phone = '5492215047962'; // Número de YAvoy
    const lastMessages = this.conversationContext.slice(-3).map(msg => 
      `${msg.role === 'user' ? 'Yo' : 'Bot'}: ${msg.message}`
    ).join('\n\n');
    
    const text = encodeURIComponent(`Hola, vengo del chatbot de soporte.\n\nÚltimas consultas:\n${lastMessages}`);
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  }
  
  toggleTheme() {
    document.body.classList.toggle('light-mode');
    const isDark = !document.body.classList.contains('light-mode');
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.textContent = isDark ? '🌙' : '☀️';
    localStorage.setItem('yavoy_theme', isDark ? 'dark' : 'light');
  }
  
  loadTheme() {
    const savedTheme = localStorage.getItem('yavoy_theme');
    const themeToggle = document.getElementById('themeToggle');
    
    if (savedTheme === 'light') {
      document.body.classList.add('light-mode');
      if (themeToggle) themeToggle.textContent = '☀️';
    }
  }
  
  showPreviousMessage() {
    const userMessages = this.conversationContext.filter(m => m.role === 'user');
    if (userMessages.length > 0) {
      this.chatInput.value = userMessages[userMessages.length - 1].message;
    }
  }
  
  detectLanguage(text) {
    const englishWords = ['hello', 'how', 'what', 'when', 'where', 'why', 'please', 'help', 'thanks', 'order', 'delivery', 'cost', 'time'];
    const spanishWords = ['hola', 'como', 'que', 'cuando', 'donde', 'porque', 'por favor', 'ayuda', 'gracias', 'pedido', 'entrega', 'costo', 'tiempo'];
    
    const textLower = text.toLowerCase();
    const englishScore = englishWords.filter(word => textLower.includes(word)).length;
    const spanishScore = spanishWords.filter(word => textLower.includes(word)).length;
    
    if (englishScore > spanishScore && englishScore > 0) {
      if (this.currentLanguage !== 'en') {
        this.currentLanguage = 'en';
        this.addMessage('🌍 I detected English. I\'ll respond in English!', 'bot', false);
      }
    } else if (this.currentLanguage === 'en' && spanishScore > 0) {
      this.currentLanguage = 'es';
      this.addMessage('🌍 Detecté español. ¡Responderé en español!', 'bot', false);
    }
  }

  getTime() {
    return new Date().toLocaleTimeString('es-AR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  async sendMessage() {
    const message = this.chatInput.value.trim();
    if (!message) return;

    // Add user message
    this.addMessage(message, 'user');
    this.chatInput.value = '';
    this.chatInput.style.height = 'auto';

    // Show typing indicator
    this.showTyping();

    // Process message
    await this.processMessage(message);
  }

  addMessage(text, type = 'bot', addRating = true) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    messageDiv.id = messageId;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = type === 'bot' ? '🤖' : '👤';

    const content = document.createElement('div');
    content.className = 'message-content';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.innerHTML = text.replace(/\n/g, '<br>');

    const time = document.createElement('div');
    time.className = 'message-time';
    time.textContent = this.getTime();

    content.appendChild(bubble);
    content.appendChild(time);
    
    // Agregar botones de calificación solo a mensajes del bot con respuestas largas
    if (type === 'bot' && addRating && text.length > 50 && !text.includes('¿') && !text.includes('Escuchando')) {
      const ratingDiv = document.createElement('div');
      ratingDiv.className = 'message-rating';
      ratingDiv.innerHTML = `
        <button class="rating-btn" onclick="window.chatbot.rateMessage('${messageId}', 'positive')">👍 Útil</button>
        <button class="rating-btn" onclick="window.chatbot.rateMessage('${messageId}', 'negative')">👎 No ayuda</button>
      `;
      content.appendChild(ratingDiv);
    }

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);

    this.chatMessages.appendChild(messageDiv);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    
    // Leer en voz alta si está habilitado
    if (type === 'bot' && this.voiceEnabled && text.length < 200) {
      this.speak(text);
    }
  }
  
  rateMessage(messageId, rating) {
    const messageDiv = document.getElementById(messageId);
    if (!messageDiv) return;
    
    const ratingDiv = messageDiv.querySelector('.message-rating');
    const buttons = ratingDiv.querySelectorAll('.rating-btn');
    
    buttons.forEach(btn => {
      btn.classList.remove('rated');
      btn.disabled = true;
    });
    
    const selectedBtn = Array.from(buttons).find(btn => 
      btn.textContent.includes(rating === 'positive' ? '👍' : '👎')
    );
    
    if (selectedBtn) {
      selectedBtn.classList.add('rated');
    }
    
    this.saveRating(messageId, rating);
    
    // Agradecer feedback
    setTimeout(() => {
      if (rating === 'positive') {
        this.addMessage('¡Gracias por tu feedback! 😊 Me alegra haberte ayudado.', 'bot', false);
      } else {
        this.addMessage('Gracias por tu feedback. Lamento no haber sido de ayuda. ¿Puedo intentar explicarlo de otra manera? 💙', 'bot', false);
      }
    }, 500);
  }
  
  speak(text) {
    if (!this.voiceEnabled) return;
    
    // Limpiar texto de HTML y emojis
    const cleanText = text.replace(/<[^>]*>/g, '').replace(/[🎉😊💙✨🔔📧📱👋🤔❌✅💰🏪🚴📋💡⚠️🌙☀️🌤️🌜]/g, '');
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-AR';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    
    window.speechSynthesis.speak(utterance);
  }

  showTyping() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot';
    typingDiv.id = 'typing-indicator';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = '🤖';

    const content = document.createElement('div');
    content.className = 'message-content';

    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';

    content.appendChild(indicator);
    typingDiv.appendChild(avatar);
    typingDiv.appendChild(content);

    this.chatMessages.appendChild(typingDiv);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  removeTyping() {
    const typing = document.getElementById('typing-indicator');
    if (typing) typing.remove();
  }

  async processMessage(message) {
    // Simulate processing time (más realista)
    await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 800));

    this.removeTyping();
    
    // Guardar en contexto de conversación
    this.conversationContext.push({ role: 'user', message, timestamp: Date.now() });
    
    // Detectar tipo de usuario basado en el mensaje
    this.detectUserType(message);
    
    // Detectar idioma
    this.detectLanguage(message);

    // Detectar emociones negativas o frustración
    const frustrationWords = ['no funciona', 'no sirve', 'mal', 'error', 'problema', 'falla', 
                              'pesimo', 'horrible', 'mala', 'malo', 'porqueria', 'basura',
                              'no puedo', 'imposible', 'dificil', 'complicado',
                              'doesnt work', 'not working', 'broken', 'bad', 'terrible'];
    const messageLower = message.toLowerCase();
    const isFrustrated = frustrationWords.some(word => messageLower.includes(word));
    
    // Mensaje empático inicial si detecta frustración
    if (isFrustrated) {
      const empathyMessages = this.currentLanguage === 'en' 
        ? '😔 I\'m so sorry you\'re experiencing this. Let me see how I can help you resolve it...'
        : '😔 Lamento mucho que estés teniendo esta experiencia. Déjame ver cómo puedo ayudarte a resolverlo...';
      
      this.addMessage(empathyMessages, 'bot', false);
      await new Promise(resolve => setTimeout(resolve, 800));
      this.showTyping();
      await new Promise(resolve => setTimeout(resolve, 600));
      this.removeTyping();
    }

    // Usar el motor de lenguaje natural
    const { intent, confidence } = this.nlp.detectIntent(message);
    const context = this.nlp.extractContext(message);
    
    let response = '';
    let categoria = 'general';
    let answered = false;

    // Mapeo de intenciones a respuestas
    const intentMap = {
      'saludo': () => {
        const baseGreetings = [
          '¡Hola! 👋 Soy el asistente virtual de YAvoy.',
          '¡Bienvenido a YAvoy! 😊 Estoy aquí para hacer tu experiencia más fácil.',
          '¡Hola! Soy tu asistente personal de YAvoy.',
          '¡Hola! 😊 Me alegra que estés aquí.'
        ];
        
        let greeting = baseGreetings[Math.floor(Math.random() * baseGreetings.length)];
        
        // Personalizar según tipo de usuario
        if (this.userProfile.type === 'cliente') {
          greeting += ' Como cliente, puedo ayudarte con tus pedidos. ¿Qué necesitas?';
        } else if (this.userProfile.type === 'comercio') {
          greeting += ' Como comercio, puedo ayudarte con tu negocio. ¿En qué te ayudo?';
        } else if (this.userProfile.type === 'repartidor') {
          greeting += ' Como repartidor, puedo ayudarte con tus entregas. ¿Qué consultas tienes?';
        } else {
          greeting += ' Es un placer atenderte. ¿En qué puedo ayudarte hoy?';
        }
        
        return greeting;
      },
      
      'hacer_pedido': () => {
        categoria = 'clientes';
        
        // Respuesta personalizada según tipo de usuario
        if (this.userProfile.type === 'comercio') {
          return `Veo que tienes un comercio. 🏪 Los pedidos los hacen tus clientes, pero te explico cómo funciona para que lo sepas:

**Proceso del cliente:**
1. Hace clic en "Hacer Pedido" en la página principal
2. Completa sus datos y detalles del pedido
3. Un repartidor recibe la solicitud
4. ¡Tú recibes la notificación del pedido!

**Desde tu panel de comercio:**
• Verás todos los pedidos en tiempo real
• Podrás coordinar con el repartidor
• Gestionarás las entregas

¿Necesitas ayuda con tu panel de comercio?`;
        } else if (this.userProfile.type === 'repartidor') {
          return `Como repartidor, no haces pedidos, ¡los entregas! 🚴

Pero te explico el flujo:
1. Un cliente hace un pedido
2. El comercio lo confirma
3. **Tú recibes la notificación** en tu panel
4. Aceptas el pedido
5. Retiras y entregas

¿Tienes dudas sobre cómo aceptar o gestionar entregas?`;
        } else {
          return `¡Me encanta que quieras hacer un pedido! 🎉 Es muy simple, te explico paso a paso:

1. Haz clic en "Hacer Pedido" en la página principal
2. Completa el formulario con:
   • Tu dirección de entrega
   • Detalles de lo que necesitas
   • Tu método de pago preferido
3. Un repartidor cercano recibirá tu solicitud inmediatamente
4. Recibirás actualizaciones en tiempo real sobre tu pedido

💡 **Tip:** Si tienes alguna duda durante el proceso, no dudes en escribirme. ¡Estoy aquí para ayudarte!

¿Te gustaría que te explique algo en particular?`;
        }
      },
      
      'rastrear': () => {
        categoria = 'clientes';
        return knowledgeBase['rastrear-pedido'].respuesta;
      },
      
      'cancelar': () => {
        categoria = 'clientes';
        return knowledgeBase['cancelar-pedido'].respuesta;
      },
      
      'tiempo': () => {
        categoria = 'clientes';
        return `¡Buena pregunta! ⏰ Entiendo que tu tiempo es valioso.

**Tiempos promedio de entrega:**

🏠 **Entregas locales:** 20-40 minutos
🚗 **Zonas cercanas:** 30-60 minutos  
📍 **Zonas alejadas:** 45-90 minutos

**¿De qué depende el tiempo exacto?**
• 📏 Distancia entre el comercio y tu ubicación
• 🚴 Disponibilidad de repartidores en ese momento
• 🚦 Tráfico y condiciones del momento
• 🌦️ Clima (lluvia puede demorar un poco)

💡 **Tip:** Activando las notificaciones push (campana arriba 🔔) recibirás alertas en tiempo real del estado de tu pedido.

¿Necesitas que tu pedido llegue en un horario específico? ¡Coméntalo en los detalles!`;
      },
      
      'costo': () => {
        categoria = 'clientes';
        
        if (this.userProfile.type === 'comercio') {
          return `Como comercio, **tú defines** el costo del envío. 🏪

**Lo que debes saber:**

📊 **Rango general:** $200 - $500 (aproximado)
📏 **Tú decides:** Basado en la distancia y tu criterio
💰 **Tú pagas:** Directamente al repartidor

✨ **Importante:**
• Sin comisiones de YAvoy
• El cliente ve el costo antes de confirmar
• Puedes negociar con el repartidor
• Transparencia total

💙 Tienes control total sobre los costos. ¿Alguna duda sobre cómo cobrar a tus clientes?`;
        } else if (this.userProfile.type === 'repartidor') {
          return `¡Importante para ti como repartidor! 🚴

**Costos que recibirás:**

💰 **Rango:** $200 - $500 por entrega
📏 **Depende de:** Distancia recorrida
🤝 **Acordado entre:** Comercio y tú

✨ **Tu ganancia:**
• Todo el costo del envío es tuyo
• Sin comisiones de YAvoy
• Pago directo del comercio
• Puedes negociar según distancia

💡 **Consejo:** Sé justo con los precios para tener más pedidos recurrentes.

¿Quieres saber más sobre ganancias?`;
        } else {
          return `💰 ¡Entiendo que quieras saber los costos antes! Es súper importante tener claridad.

**Costos de envío en YAvoy:**

📊 **Rango general:** $200 - $500 (aproximado)
📏 **Factor principal:** La distancia que debe recorrer el repartidor
🏪 **Quién define:** El comercio establece el precio

✨ **Lo importante:**
• El costo se acuerda ANTES de confirmar
• Sin sorpresas ni cargos ocultos
• Tú decides si aceptas o no
• Total transparencia

💙 Queremos que siempre sepas exactamente qué pagarás antes de confirmar tu pedido.

¿Hay algo más sobre costos que te gustaría saber?`;
        }
      },
      
      'rastrear': () => {
        categoria = 'clientes';
        return `¡Genial que quieras hacer seguimiento! 🔍 Es natural querer saber dónde está tu pedido.

**Estados de tu pedido:**

📦 **Pendiente** → Esperando que un repartidor lo acepte
✅ **Aceptado** → ¡Ya hay un repartidor asignado!
🚴 **En Camino** → Va rumbo a tu dirección
🎉 **Entregado** → ¡Disfruta tu pedido!

**Para estar siempre informado:**
🔔 Activa las notificaciones push (ícono campana arriba)
📱 Recibirás un aviso cada vez que cambie el estado

💡 **Consejo:** El repartidor puede contactarte por WhatsApp si necesita indicaciones extras.

¿Tienes un pedido en curso ahora? ¿Necesitas ayuda con algo específico?`;
      },
      
      'cancelar': () => {
        categoria = 'clientes';
        return `Entiendo que a veces las cosas cambian. 😔 No hay problema.

**Para cancelar un pedido:**

📦 **Si está "Pendiente":**
• Contacta directamente al comercio
• Es más rápido y evitas complicaciones

✅ **Si ya fue "Aceptado":**
• Habla con el comercio o el repartidor
• Comunícate lo antes posible

💙 **Recomendación:** Si cancelas, por favor hazlo pronto para no afectar al repartidor que ya tomó tu pedido. Valoramos la comunidad que formamos juntos.

**¿Tuviste algún problema con tu pedido?** Si es así, cuéntame para ayudarte mejor. Estamos para mejorar tu experiencia.`;
      },
      
      'pago': () => {
        categoria = 'clientes';
        return `¡Excelente pregunta! 💳 Entendemos que la flexibilidad en los pagos es importante para ti.

**Métodos de pago disponibles en YAvoy:**

💵 **Efectivo** - Al recibir tu pedido (el clásico y confiable)
🏦 **Transferencia bancaria** - Rápido y seguro
💳 **MercadoPago** - Con todas tus tarjetas
💰 **Tarjeta de crédito/débito** - Paga como prefieras

✨ **Importante:** El comercio te indicará qué métodos acepta cuando confirmes tu pedido. Así tienes toda la información antes de decidir.

¿Tienes preferencia por algún método? ¡Déjame saber si necesitas ayuda con el proceso de pago!`;
      },
      
      'registro_comercio': () => {
        categoria = 'comercios';
        return `¡Qué bueno que quieras sumarte a YAvoy! 🎉 Nos encanta ayudar a los comercios a crecer.

**Registro súper simple y 100% GRATIS:**

1️⃣ Haz clic en "Soy Comercio" → "Registrarme"
2️⃣ Completa el formulario con:
   • Nombre de tu comercio
   • Categoría (Restaurante, Farmacia, Kiosco, etc.)
   • Tu WhatsApp de contacto
   • Email
   • Dirección donde están ubicados

3️⃣ Envía el formulario
4️⃣ ¡Listo! Ya estás en la plataforma ✨

🎁 **Lo mejor:** 
• Sin costo de registro
• Sin mensualidades
• Sin letra chica
• Solo pagas el envío cuando lo necesitas

💙 Estamos felices de que quieras formar parte de nuestra comunidad. ¿Alguna duda sobre el proceso?`;
      },
      
      'comision': () => {
        categoria = 'comercios';
        return `¡Me alegra que preguntes esto! 😊 Queremos ser 100% transparentes contigo.

**La verdad sobre los costos en YAvoy:**

✅ **Registro: GRATIS** (sí, completamente gratis)
✅ **Mensualidades: $0** (cero pesos, nada)
✅ **Comisiones por venta: 0%** (todo lo que vendas es tuyo)
💰 **Solo pagas el envío** cuando lo necesitas

**¿Cómo funciona?**
• El costo del envío lo defines TÚ
• Lo pagas directamente al repartidor
• Sin intermediarios que se queden con porcentajes
• Transparencia total

💙 **Nuestra filosofía:** Creemos que los comercios locales merecen crecer sin barreras económicas. Por eso YAvoy es gratis.

¿Esto responde tu duda? ¡Cuéntame si tienes más preguntas sobre costos!`;
      },
      
      'ser_repartidor': () => {
        categoria = 'repartidores';
        return `¡Qué bueno que quieras unirte a nuestro equipo de repartidores! 🚴 Nos encantaría tenerte.

**Requisitos para ser repartidor:**

✅ Ser mayor de 18 años
✅ DNI argentino vigente
✅ Tener vehículo propio (moto, bici o auto)
✅ Documentación del vehículo al día
✅ Celular con internet activo

**¿Cómo te registras?**

1️⃣ Haz clic en "Soy Repartidor" → "Registrarme"
2️⃣ Completa tus datos personales
3️⃣ Sube la documentación requerida
4️⃣ Espera la verificación (24-48 hs)
5️⃣ ¡Listo para empezar a ganar! 💰

💙 **Trabajá cuando quieras, como quieras.** Sin horarios fijos, sin jefes. Vos decidís.

¿Tenés dudas sobre algún requisito en particular?`;
      },
      
      'requisitos': () => {
        // Detectar contexto: ¿es para repartidor o comercio?
        const isRepartidor = message.toLowerCase().includes('repartidor') || 
                           message.toLowerCase().includes('repartir') ||
                           message.toLowerCase().includes('delivery');
        
        if (isRepartidor) {
          categoria = 'repartidores';
          return `¡Me alegra tu interés en ser repartidor! 🚴💙

**Lo que necesitás:**

✅ Mayor de 18 años (por temas legales)
✅ DNI argentino vigente
✅ Vehículo propio (puede ser moto, bici o auto - lo que tengas)
✅ Documentación del vehículo vigente
✅ Celular con internet (para recibir pedidos)

💡 **¿No tenés moto?** ¡No hay problema! Podés repartir en bici o a pie en tu zona.

**Próximos pasos:**
1. Registrate en "Soy Repartidor"
2. Subí tu documentación
3. Esperá 24-48 hs la verificación
4. ¡A ganar! 💰

¿Cumplís con los requisitos? ¡Te esperamos en el equipo!`;
        } else {
          categoria = 'comercios';
          return `¡Excelente! 🏪 Me alegra que quieras sumarte.

**Requisitos para Comercios:**

✨ **La buena noticia:** ¡Prácticamente ninguno!

✅ Podés ser cualquier tipo de negocio
✅ No importa el tamaño de tu comercio
✅ Solo necesitás:
   • Nombre del comercio
   • WhatsApp activo (para que te contacten)
   • Email
   • Dirección física donde estás

💙 **Sin costos, sin complicaciones, sin letra chica.**

¿Listo para dar el paso? ¡El registro toma menos de 3 minutos!`;
        }
      },
      
      'error_app': () => {
        categoria = 'tecnico';
        return `¡Oh no! 😔 Lamento mucho que estés teniendo problemas. Entiendo lo frustrante que puede ser cuando algo no funciona como esperamos.

Vamos a solucionarlo juntos. Por favor, intenta estos pasos:

1️⃣ **Recarga la página** (presiona Ctrl + F5 o Cmd + R)
2️⃣ **Limpia la caché** de tu navegador
3️⃣ **Prueba en modo incógnito** (a veces los plugins interfieren)
4️⃣ **Intenta con otro navegador** (Chrome, Edge o Firefox)
5️⃣ **Verifica tu conexión** a internet

🔧 **Dato técnico:** Nuestro sistema funciona mejor con navegadores actualizados.

Si ninguno de estos pasos funciona, me gustaría ayudarte personalmente:
📧 Email: YAvoy5@gmail.com
📱 WhatsApp: +54 221 504 7962

¿Qué mensaje de error específico estás viendo? Cuéntame más detalles para poder ayudarte mejor. 💙`;
      },
      
      'notificaciones': () => {
        categoria = 'tecnico';
        return knowledgeBase['notificaciones-push'].respuesta;
      },
      
      'chat': () => {
        categoria = 'general';
        return knowledgeBase['chat-pedido'].respuesta;
      },
      
      'api': () => {
        categoria = 'tecnico';
        return knowledgeBase['api-endpoints'].respuesta;
      },
      
      'offline': () => {
        categoria = 'tecnico';
        return knowledgeBase['indexeddb-offline'].respuesta;
      },
      
      'pwa': () => {
        categoria = 'tecnico';
        return knowledgeBase['pwa-v7'].respuesta;
      },
      
      'dashboard': () => {
        categoria = 'admin';
        return knowledgeBase['dashboard-ceo'].respuesta;
      },
      
      'admin': () => {
        categoria = 'admin';
        return knowledgeBase['panel-admin'].respuesta;
      },
      
      'mapa': () => {
        categoria = 'general';
        return knowledgeBase['mapa-entregas'].respuesta;
      },
      
      'informes': () => {
        categoria = 'admin';
        return knowledgeBase['informes-ceo'].respuesta;
      },
      
      'contacto': () => {
        return `¡Me encantaría que te comuniques directamente con el equipo! 💙

**📞 Canales de Contacto YAvoy:**

📧 **Email:** YAvoy5@gmail.com
   _(Respondemos en menos de 24 hs)_

📱 **WhatsApp:** +54 221 504 7962
   _(Respuesta rápida en horario laboral)_

🌐 **Web:** yavoy.com.ar
   _(Toda la info actualizada)_

**⏰ Horarios de atención humana:**
• Lunes a Viernes: 9:00 - 20:00 hs
• Sábados: 10:00 - 18:00 hs

🤖 **Chatbot (yo):** Disponible 24/7 para ayudarte al instante

💡 Si tenés una consulta urgente, WhatsApp es tu mejor opción. El equipo es súper atento y responde rápido.

¿Te ayudo con algo más mientras tanto?`;
      },
      
      'agradecimiento': () => {
        const thanks = [
          '¡De nada! 😊 Es un placer ayudarte. Si necesitas algo más, aquí estaré.',
          '¡Para eso estamos! 💙 Me alegra haber podido ayudarte. ¿Algo más que necesites?',
          '¡Un placer asistirte! 😊 No dudes en escribirme cuando lo necesites.',
          '¡Siempre a tu servicio! ✨ Si tienes más dudas, aquí estoy para ti.'
        ];
        return thanks[Math.floor(Math.random() * thanks.length)];
      }
    };

    // Generar respuesta basada en la intención detectada
    if (intent && intentMap[intent] && confidence > 2) {
      response = intentMap[intent]();
      answered = true;
    } else {
      // Búsqueda semántica en la base de conocimientos
      let maxRelevance = 0;
      let bestTopic = null;
      
      for (const [key, data] of Object.entries(knowledgeBase)) {
        if (key === 'keywords') continue;
        
        const relevance = this.calculateRelevance(message, data);
        if (relevance > maxRelevance) {
          maxRelevance = relevance;
          bestTopic = { key, data };
        }
      }
      
      if (maxRelevance > 0.3) {
        response = bestTopic.data.respuesta;
        categoria = bestTopic.data.categoria;
        answered = true;
      } else {
        // Respuesta genérica inteligente
        response = this.generateSmartFallback(message);
        categoria = 'general';
      }
    }

    // Mostrar respuesta
    this.addMessage(response, 'bot');
    
    // Agregar mensaje de seguimiento empático después de respuestas técnicas
    if (categoria === 'tecnico' || isFrustrated) {
      setTimeout(() => {
        const followUps = [
          '¿Pudiste solucionarlo? Si no, estoy aquí para intentar de otra manera. 💙',
          '¿Funcionó? Si seguís con problemas, escribime y busco otra solución para vos.',
          'Espero que esto te ayude. Si no es así, no dudes en decirme. ¡Vamos a resolverlo juntos! 😊'
        ];
        this.addMessage(followUps[Math.floor(Math.random() * followUps.length)], 'bot');
      }, 2000);
    }
    
    // Mensaje de seguimiento positivo para consultas generales
    if (!isFrustrated && categoria !== 'tecnico' && confidence > 3) {
      setTimeout(() => {
        const positiveFollowUps = [
          '¿Te quedó claro? Si tenés más dudas, preguntá sin problema. 😊',
          '¿Hay algo más que quieras saber sobre esto?',
          'Espero haber resuelto tu duda. ¿Necesitás ayuda con algo más?'
        ];
        this.addMessage(positiveFollowUps[Math.floor(Math.random() * positiveFollowUps.length)], 'bot');
      }, 1800);
    }
    
    // Crear ticket si es necesario
    this.ticketSystem.createTicket(message, categoria, answered);
    
    // Guardar respuesta en contexto
    this.conversationContext.push({ role: 'bot', message: response, timestamp: Date.now() });
    
    // Limitar contexto a últimas 10 interacciones
    if (this.conversationContext.length > 20) {
      this.conversationContext = this.conversationContext.slice(-20);
    }
  }
  
  // Calcular relevancia entre mensaje y tema
  calculateRelevance(message, topicData) {
    const messageLower = this.nlp.normalize(message);
    const questionLower = this.nlp.normalize(topicData.pregunta);
    const answerLower = this.nlp.normalize(topicData.respuesta);
    
    let score = 0;
    const messageWords = messageLower.split(' ');
    const questionWords = questionLower.split(' ');
    const answerWords = answerLower.split(' ').slice(0, 50); // Primeras 50 palabras
    
    // Coincidencias en pregunta (más peso)
    messageWords.forEach(word => {
      if (word.length < 3) return;
      if (questionWords.includes(word)) score += 2;
      if (answerWords.includes(word)) score += 0.5;
    });
    
    return score / messageWords.length;
  }
  
  // Generar respuesta inteligente cuando no hay coincidencia exacta
  generateSmartFallback(message) {
    const hasQuestion = message.includes('?') || 
                       message.toLowerCase().includes('como') ||
                       message.toLowerCase().includes('que') ||
                       message.toLowerCase().includes('donde') ||
                       message.toLowerCase().includes('cuando') ||
                       message.toLowerCase().includes('cuanto');
    
    if (hasQuestion) {
      return `Mmm... 🤔 Entiendo tu pregunta pero no estoy 100% seguro de cómo responderte de la mejor manera.

**Déjame ayudarte igualmente:** Te puedo orientar sobre estos temas en los que soy experto:

👥 **Para Clientes:**
• Cómo hacer y rastrear pedidos
• Tiempos y costos de entrega
• Métodos de pago disponibles

🏪 **Para Comercios:**
• Registro gratis (sin costos ocultos)
• Gestión de pedidos en tiempo real
• Actualización de información

🚴 **Para Repartidores:**
• Requisitos para unirte
• Cuánto puedes ganar
• Cómo funciona el sistema

**Si ninguno de estos temas es lo que buscas:**
📧 Email: YAvoy5@gmail.com
📱 WhatsApp: +54 221 504 7962

Lamento no haber entendido bien tu consulta. ¿Podrías reformularla? Me gustaría ayudarte mejor. 💙`;
    } else {
      return `¡Hola! 👋 Recibí tu mensaje: "${message}"

Disculpa, pero necesito un poquito más de información para poder ayudarte de la mejor manera posible. 😊

**¿Me podrías contar:**
• ¿Eres cliente, tienes un comercio o quieres ser repartidor?
• ¿Qué es exactamente lo que necesitas?
• ¿Tienes algún problema específico que te gustaría resolver?

No te preocupes, estoy aquí para ayudarte en lo que necesites. Tómate tu tiempo para explicarme y yo te responderé lo más claro posible. 💙`;
    }
  }

  showKBAnswer(data) {
    this.addMessage(data.respuesta, 'bot');
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    
    // Registrar consulta
    this.ticketSystem.createTicket(data.pregunta, data.categoria, true);
  }
}

// Initialize chatbot when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.chatbot = new SoporteChatbot();
});

// Export para acceso desde consola (debugging)
window.SoporteDebug = {
  getAnalytics: () => {
    const ticketSystem = new TicketSystem();
    return {
      totalConsultas: ticketSystem.getTotalConsultas(),
      categorias: ticketSystem.getCategoryStats(),
      problemasComunes: ticketSystem.getTopProblems(10),
      tickets: ticketSystem.tickets,
      ratings: window.chatbot?.ratings || {}
    };
  },
  resetAnalytics: () => {
    localStorage.removeItem('yavoy_tickets');
    localStorage.removeItem('yavoy_analytics');
    localStorage.removeItem('yavoy_ratings');
    localStorage.removeItem('yavoy_chat_history');
  },
  showStats: () => {
    const ratings = window.chatbot?.ratings || {};
    const positive = Object.values(ratings).filter(r => r === 'positive').length;
    const negative = Object.values(ratings).filter(r => r === 'negative').length;
    const total = positive + negative;
    const satisfaction = total > 0 ? (positive / total * 100).toFixed(1) : 0;
    
    return {
      totalRatings: total,
      positive,
      negative,
      satisfactionRate: `${satisfaction}%`,
      conversationsInHistory: window.chatbot?.conversationHistory.length || 0
    };
  }
};
