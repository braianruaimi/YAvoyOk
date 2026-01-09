# 📋 YAvoy — Estado del Proyecto (Actualizado: 30 Nov 2025)

## 🎯 Tipo de Proyecto
**Web App Progresiva (PWA)** — Plataforma de reparto local que conecta comercios con repartidores.

## 🛠️ Stack Tecnológico
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js (servidor ligero para persistencia)
- **PWA**: Service Worker v8, Manifest.json, Cache API
- **Servidor Local**: http-server (puerto 5500)
- **Servidor API**: Node.js (puerto 5501)
- **Túnel Público**: LocalTunnel para pruebas móviles

---

## ✅ Funcionalidades Implementadas

### 📦 Módulo Pedidos (NUEVO v8)
- ✅ Sistema completo de gestión de pedidos
- ✅ Creación de pedidos con formulario validado
- ✅ 5 estados: Pendiente → Aceptado → En Camino → Entregado | Cancelado
- ✅ Badges visuales con colores por estado (Amber, Green, Blue, Indigo, Red)
- ✅ 3 vistas con tabs: Pedidos Activos, Historial, Disponibles (Repartidores)
- ✅ Modal crear pedido: comercio, producto, destino, teléfono, precio, notas
- ✅ Modal detalle con historial completo de estados
- ✅ Asignación automática de repartidor al aceptar pedido
- ✅ Validación de transiciones de estados
- ✅ Botones contextuales según estado actual
- ✅ Integración WhatsApp en detalles del pedido
- ✅ Grid responsive (3 col → 2 col → 1 col)
- ✅ Persistencia dual: localStorage + API (POST/GET)
- ✅ IDs únicos autogenerados (PED{timestamp}{random})
- ✅ Fechas formateadas (DD/MM/YYYY HH:MM)
- ✅ Precios formateados (ARS $)
- ✅ Actualización automática cada 30 segundos
- ✅ Filtros por estado (activos, completados, pendientes)
- ✅ Endpoints API: /api/guardar-pedidos, /api/listar-pedidos

### 🏪 Módulo Comercios
- ✅ Registro rápido con formulario (nombre, categoría, WhatsApp, email)
- ✅ Filtros por categoría: Empresas, Mayoristas, Indumentaria, Bazar, Kiosco, Restaurante, Farmacia, Otros
- ✅ Autocompletado de nombres (datalist desde localStorage)
- ✅ Categoría como select desplegable (no campo libre)
- ✅ Tarjetas con botón "Ver Detalles" y botón directo de WhatsApp
- ✅ Modal de detalles con información completa
- ✅ Búsqueda en tiempo real por nombre/producto
- ✅ Paginación ("Cargar más")
- ✅ Guardado dual: localStorage + archivos JSON por categoría

### 🛵 Módulo Repartidores
- ✅ Sección "Genera Ingresos Extras con tu Moto o Auto 🏍️🚗"
- ✅ Feature cards con popups informativos:
  - ⏰ Horarios Flexibles: "El tiempo lo manejas vos. Quien tiene más horas recibe beneficios."
  - 💰 Ganancias Claras: "El 80% es tuyo y si tenés entregas rápidas recibís beneficios."
  - 🗺️ Envíos Locales: "Rutas cortas, más entregas por hora y mejor puntaje."
- ✅ Flujo de pre-registro en 2 pasos:
  1. **Paso 1**: Nombre, email, teléfono, D.N.I, experiencia
  2. **Paso 2**: Datos del vehículo (marca, modelo, dominio, Nº motor, Nº chasis, fotos registro frente/dorso)
- ✅ Vinculación automática repartidor-vehículo mediante ID único
- ✅ Guardado en localStorage con arrays separados

### 📞 Módulo Contacto
- ✅ Información de contacto:
  - Tel: 2215047962 (enlace a WhatsApp)
  - Email: YAvoy5@gmail.com
  - WhatsApp: +54 221 504 7962
  - Oficina: Ensenada
- ✅ Formulario de contacto rápido (nombre, email, mensaje)
- ✅ Validación en cliente con mensajes inline
- ✅ Guardado en localStorage

### 🎨 UI/UX
- ✅ Hero con imagen personalizada (https://i.postimg.cc/BbQHF76y/Designer-6.jpg)
- ✅ Botón CTA "Comercios Locales" (antes "Soy Comercio")
- ✅ Botón CTA "Quiero ser Repartidor" → scroll a #repartidores
- ✅ Estadísticas animadas: 5 comercios, 2 repartidores, 33 envíos, 97% satisfacción
- ✅ Barra de categorías con filtros visuales
- ✅ Modo oscuro/claro con toggle (☀️/🌙)
- ✅ Botón "scroll to top" (↑)
- ✅ Menú móvil responsive con cierre automático
- ✅ Notificaciones toast (success/info/error)
- ✅ Animaciones con IntersectionObserver (respeta prefers-reduced-motion)
- ✅ Atajos de teclado (i/1→Inicio, c/2→Comercios, r/3→Repartidores)

### 💬 WhatsApp Integration
- ✅ Enlace de teléfono abre WhatsApp (wa.me)
- ✅ Botón verde de WhatsApp en cada tarjeta de comercio
- ✅ Modal "Contactar" cambia a "WhatsApp" cuando hay número
- ✅ Uso de número individual del comercio (no global)

### 💾 Persistencia de Datos
- ✅ **localStorage**: Arrays de comercios, repartidores, vehículos, contactos
- ✅ **Archivos JSON**: Guardado por categoría en carpetas:
  - `registros/servicios-prioridad/`
  - `registros/servicios-alimentacion/`
  - `registros/servicios-salud/`
  - `registros/servicios-bazar/`
  - `registros/servicios-indumentaria/`
  - `registros/servicios-kiosco/`
  - `registros/servicios-otros/`
- ✅ API REST simple (Node.js puerto 5501):
  - POST `/api/guardar-comercio`
  - GET `/api/listar-comercios`

### 🔐 Panel de Administración
- ✅ Acceso con atajo `Alt + A`
- ✅ Vista de todos los datos en ventana emergente
- ✅ Exportación JSON/CSV por entidad:
  - Comercios
  - Repartidores (con vehículos vinculados)
  - Vehículos
  - Contactos
- ✅ Botón para borrar todos los datos locales
- ✅ Descarga individual o combinada

### 📱 PWA (Progressive Web App)
- ✅ **Icono personalizado**: PNG optimizado sin contorno negro
- ✅ **Manifest.json**: configurado con iconos 192×192 y 512×512
- ✅ **Service Worker v8**: cachea HTML, CSS, JS, imágenes
- ✅ **Cache busting**: todos los assets con `?v=8`
- ✅ **Instalable**: funciona en Edge, Chrome, Android
- ✅ **Offline básico**: muestra `offline.html` cuando no hay red
- ✅ **Botón "Instalar App"**: aparece automáticamente cuando es instalable
- ✅ Iconos en:
  - Favicon del navegador
  - Menú inicio (Windows/Android)
  - Barra de tareas
  - Pantalla de inicio móvil (iOS/Android)

### 🌐 Acceso Móvil
- ✅ Servidor estático HTTP en puerto 5500
- ✅ Túnel público con LocalTunnel para pruebas desde cualquier red
- ✅ Script automático `INICIAR_SERVIDOR.bat` que levanta:
  1. Servidor de registros (5501)
  2. Servidor estático (5500)
  3. Túnel público con URL `https://xxxxx.loca.lt`
- ✅ Regla de firewall para puerto 5500
- ✅ Solución a AP isolation de routers

---

## 📁 Estructura de Archivos

```
YAvoy/
├── index.html              # Estructura principal, secciones, modales pedidos
├── styles.css              # Estilos globales + módulo pedidos
├── styles/                 # Estilos por componente
├── script.js               # Lógica UI, formularios, admin, pedidos, persistencia
├── sw.js                   # Service Worker v8
├── manifest.json           # PWA manifest
├── server.js               # API Node.js para comercios y pedidos
├── offline.html            # Página de fallback sin conexión
├── package.json            # Dependencias (http-server)
├── package-lock.json       # Lock de dependencias
├── INICIAR_SERVIDOR.bat    # Script automático (Windows)
├── INICIAR_SERVIDOR.ps1    # Script PowerShell alternativo
├── README.md               # Documentación completa
├── COMPARTIR_CON_SOCIO.md  # Guía rápida para compartir
├── ESTADO_PROYECTO.md      # Este archivo (estado completo)
├── DEPLOY_HOSTINGER.md     # Guía de subida a Hostinger Premium
├── MODULO_PEDIDOS.md       # Documentación sistema de pedidos (NUEVO)
├── README_NOTIFICACIONES.md # Sistema de notificaciones (referencia)
├── GUIA_VISUAL.md          # Tutorial paso a paso con capturas
├── FIRESTORE_SCHEMA.md     # Esquema de datos (referencia)
├── icons/                  # PNG del logo (72-512px)
├── components/             # Componentes reutilizables (futuro)
├── hooks/                  # Hooks personalizados (futuro)
├── utils/                  # Utilidades compartidas (futuro)
└── registros/              # JSON guardados por categoría
    ├── servicios-prioridad/
    ├── servicios-alimentacion/
    ├── servicios-salud/
    ├── servicios-bazar/
    ├── servicios-indumentaria/
    ├── servicios-kiosco/
    ├── servicios-otros/
    └── pedidos/            # Archivos JSON de pedidos (NUEVO)
        └── pedidos.json
```

---

## 🧪 Pruebas Realizadas

### ✅ PWA
- [x] Instalación/desinstalación en Edge y Chrome
- [x] Verificación de icono en menú inicio y barra de tareas
- [x] Limpieza de caché y Service Worker
- [x] Cache busting con `?v=8` funciona correctamente
- [x] Modo offline muestra `offline.html`

### ✅ Sistema de Pedidos
- [x] Crear pedido con todos los campos requeridos
- [x] Validación de formulario (campos vacíos)
- [x] Aceptar pedido → asignar repartidor
- [x] Cambiar estado: Pendiente → Aceptado → En Camino → Entregado
- [x] Intentar saltar estados (rechazado correctamente)
- [x] Ver detalle con historial completo
- [x] Filtrar por tabs (Activos/Historial/Disponibles)
- [x] Persistencia tras recargar página
- [x] Guardado en servidor (registros/pedidos/pedidos.json)
- [x] Responsive en móvil (320px - 768px)

### ✅ Formularios
- [x] Validación inline de campos obligatorios
- [x] Mensajes de error específicos
- [x] Guardado en localStorage
- [x] Guardado en archivos (server.js)
- [x] Autocompletado de comercios
- [x] Select de categorías

### ✅ WhatsApp
- [x] Enlaces wa.me abren correctamente
- [x] Botón verde en tarjetas
- [x] Modal adapta label a "WhatsApp"
- [x] Redirección desde teléfono de contacto

### ✅ Modales
- [x] Cierre con botón X
- [x] Cierre con clic fuera
- [x] Cierre con tecla Escape
- [x] Focus trap y accesibilidad
- [x] Popups informativos en feature cards

### ✅ Móvil
- [x] Túnel público funciona en 4G/5G
- [x] UI responsive en pantallas 320px-768px
- [x] Touch targets de 44px mínimo
- [x] Menú móvil con hamburguesa
- [x] Categorías scrolleables horizontal

### ✅ Admin
- [x] Panel abre con Alt+A
- [x] Exportación JSON correcta
- [x] Exportación CSV correcta
- [x] Vinculación repartidor-vehículo

---

## 🚀 Listo Para

### Hosting
- [ ] **Vercel**: subir repositorio y deploy automático
- [ ] **Netlify**: drag & drop o git integration
- [ ] **Firebase Hosting**: `firebase init` + `firebase deploy`
- [ ] **GitHub Pages**: servir desde rama `gh-pages`

### Dominio
- [ ] Asociar dominio personalizado (ej: `yavoy.com.ar`)
- [ ] Configurar HTTPS automático
- [ ] Actualizar manifest con URL real

### Integraciones Futuras
- [ ] **Notificaciones Push**: Firebase Cloud Messaging
- [ ] **Chat en vivo**: Socket.io o Firebase Realtime Database
- [ ] **Pagos**: MercadoPago API o Stripe
- [ ] **Geolocalización**: Google Maps API o Mapbox
- [ ] **Auth**: Firebase Auth o Auth0
- [ ] **Backend completo**: Migrar a Express + MongoDB/Firestore
- [ ] **Analytics**: Google Analytics 4
- [ ] **SEO**: meta tags dinámicos, sitemap.xml, robots.txt

---

## 📦 Entregables

### Para tu Socio
- ✅ **ZIP completo**: `YAvoy_entrega_2025-11-29_16-52.zip`
  - Incluye todo el código fuente
  - Excluye `node_modules` (se instala con `npm install`)
  - Listo para ejecutar con `INICIAR_SERVIDOR.bat`

### Documentación
- ✅ `README.md`: guía completa de features y ejecución
- ✅ `COMPARTIR_CON_SOCIO.md`: pasos ultra breves para arrancar
- ✅ `ESTADO_PROYECTO.md`: este archivo (resumen técnico)

---

## 🔧 Cómo Ejecutar

### Opción 1 — Automática (recomendada)
```batch
# Doble clic en:
INICIAR_SERVIDOR.bat

# Se abrirán:
# - http://localhost:5500 (web)
# - http://localhost:5501 (API)
# - https://xxxxx.loca.lt (túnel público)
```

### Opción 2 — Manual (PowerShell)
```powershell
cd "C:\Users\estudiante\Desktop\Nueva carpeta"

# Instalar dependencias
npm install

# Terminal 1: servidor de registros
node server.js

# Terminal 2: servidor estático
npx http-server -p 5500 --cors

# Terminal 3 (opcional): túnel público
npx localtunnel --port 5500
```

### Opción 3 — Con npm scripts
```powershell
npm install
npm run start    # servidor en puerto 8000
npm run dev      # sin caché
```

---

## 📊 Datos de Prueba

### Comercios Activos: 5
- Sabor Express 🍔 (Restaurante)
- Farmacia Bienestar 💊 (Salud)
- El Detalle Perfecto 🎁 (Regalos)
- Pizzería Napolitana 🍕 (Comida Rápida)
- SuperMercado del Barrio 🛒 (Mayorista)

### Repartidores: 2
- Registros de prueba con vehículos vinculados

### Estadísticas
- 33 envíos realizados (simulado)
- 97% satisfacción (simulado)

---

## 🐛 Problemas Conocidos y Soluciones

| Problema | Solución Implementada |
|----------|----------------------|
| IP local no funciona en móvil | Túnel público con LocalTunnel |
| Caché de Service Worker no actualiza | Cache busting con `?v=3` en todos los assets |
| Router bloquea puerto 5500 | Regla de firewall + túnel alternativo |
| Iconos no se ven en PWA | PNG optimizados 192×192 y 512×512 |
| Modal no cierra con X | Scoping correcto de `.modal-close` dentro del modal |
| Categorías no filtran | Normalización de categoría con `toLowerCase()` |

---

## 📝 Próximos Pasos Sugeridos

1. **Deploy a producción**: Subir a Vercel/Netlify con dominio propio
2. **Backend robusto**: Migrar de localStorage a base de datos (MongoDB/Firestore)
3. **Auth de usuarios**: Login para comercios y repartidores
4. **Notificaciones**: Push cuando hay nuevo pedido
5. **Geolocalización**: Mapa en vivo de repartidores
6. **Pasarela de pago**: Integrar MercadoPago
7. **Chat interno**: Comercio ↔ Repartidor
8. **Dashboard**: Métricas en tiempo real (ingresos, entregas, ratings)

---

## 👥 Información de Contacto del Proyecto

- **Tel/WhatsApp**: 2215047962
- **Email**: YAvoy5@gmail.com
- **Oficina**: Ensenada
- **Versión**: 8.0 (PWA + Sistema de Pedidos + Persistencia + WhatsApp)
- **Última actualización**: 30 Nov 2025

---

**Estado General**: ✅ **SISTEMA DE PEDIDOS COMPLETO - LISTO PARA PRODUCCIÓN**

El proyecto incluye ahora un **sistema completo de gestión de pedidos** que conecta comercios con repartidores. Todos los flujos principales (comercios, repartidores, pedidos, contacto, admin) están implementados y testeados en desktop y móvil.

**Nuevo en v8.0:**
- 📦 Sistema de pedidos con 5 estados
- 🔄 Flujo completo: Crear → Aceptar → En Camino → Entregar
- 📊 3 vistas organizadas por tabs
- 💾 Persistencia dual (localStorage + API)
- 🎨 UI moderna con badges de colores
- 📱 100% responsive y accesible
