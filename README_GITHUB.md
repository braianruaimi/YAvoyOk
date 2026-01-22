# 🚀 YAvoy - Sistema de Reparto Local

![YAvoy Logo](icons/icon-yavoy.png)

Sistema completo de gestión de pedidos y entregas que conecta **clientes**, **comercios** y **repartidores**.

## ✨ Características Principales

### 👥 Para Clientes

- 🛍️ Realizar pedidos desde comercios locales
- 📍 Seguimiento en tiempo real
- 💬 Chat con repartidor
- ⭐ Sistema de calificaciones

### 🏪 Para Comercios

- 📊 Panel de administración completo
- 💰 Gestión de pedidos
- 📈 Estadísticas y reportes
- 🔔 Notificaciones en tiempo real

### 🚴 Para Repartidores

- 📱 App móvil optimizada
- 💵 Control de ganancias (80% por envío)
- 🗺️ Rutas optimizadas
- 📊 Historial de entregas

---

## 🚀 Inicio Rápido

### Requisitos Previos

- **Node.js** v16 o superior
- **npm** o **yarn**

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/TU_USUARIO/yavoy.git
cd yavoy

# Instalar dependencias
npm install

# Iniciar servidor
node server.js
```

El servidor estará disponible en: `http://localhost:5502`

---

## 📁 Estructura del Proyecto

```
YAvoy_DEFINITIVO/
├── server.js                 # Servidor principal Node.js
├── package.json             # Dependencias del proyecto
├── .env                     # Variables de entorno (no incluido)
├── index.html               # Página principal
├── panel-comercio.html      # Panel para comercios
├── panel-repartidor.html    # Panel para repartidores
├── js/                      # Módulos JavaScript
├── css/                     # Estilos
├── docs/                    # Documentación
├── icons/                   # Iconos PWA
└── registros/               # Base de datos local
```

---

## 🔐 Credenciales de Acceso

### Panel de Comercio

- **URL:** `http://localhost:5502/panel-comercio.html`
- **Contraseña:** `2215047962`

### Panel de Repartidor

- **URL:** `http://localhost:5502/panel-repartidor.html`
- **ID:** `braian_demo_2025`
- **Contraseña:** `2215047962`

### Panel CEO Master

- **URL:** `http://localhost:5502/panel-ceo-master.html`
- **Usuario:** `ceo_yavoy`
- **Contraseña:** `YaVoy2025Master!CEO`

---

## 🛡️ Seguridad

El sistema incluye:

- ✅ Helmet - Headers HTTP seguros
- ✅ CORS configurado
- ✅ Rate Limiting
- ✅ JWT Authentication
- ✅ bcrypt para contraseñas
- ✅ Sanitización de inputs

---

## 📡 API Endpoints

### Autenticación

- `POST /api/auth/register/comercio` - Registrar comercio
- `POST /api/auth/register/repartidor` - Registrar repartidor
- `POST /api/auth/login` - Login universal

### Pedidos

- `POST /api/pedidos` - Crear pedido
- `GET /api/pedidos` - Listar pedidos
- `GET /api/pedidos/:id` - Ver pedido
- `PATCH /api/pedidos/:id/estado` - Actualizar estado

### Comercios

- `GET /api/comercios` - Listar comercios
- `POST /api/comercios` - Crear comercio

### Repartidores

- `GET /api/repartidores` - Listar repartidores
- `POST /api/repartidores` - Registrar repartidor

---

## 🌐 Tecnologías Utilizadas

- **Backend:** Node.js + Express
- **Base de Datos:** Sistema de archivos JSON
- **Frontend:** HTML5, CSS3, JavaScript vanilla
- **Real-time:** Socket.IO
- **PWA:** Service Workers, Manifest
- **Pagos:** MercadoPago (integración lista)

---

## 📱 Progressive Web App (PWA)

YAvoy es una PWA instalable que funciona:

- ✅ En navegadores desktop
- ✅ En dispositivos móviles
- ✅ Modo offline (caché)
- ✅ Notificaciones push

---

## 🚧 Desarrollo

### Servidor de Desarrollo

```bash
node server.js
```

### Variables de Entorno

Crea un archivo `.env` con:

```env
PORT=5502
NODE_ENV=development
JWT_SECRET=tu_secreto_aqui
MERCADOPAGO_ACCESS_TOKEN=tu_token_aqui
```

---

## 📄 Licencia

Este proyecto es privado y propietario.

---

## 👨‍💻 Autor

**YAvoy Team**

- Email: yavoyen5@gmail.com
- Fecha: Enero 2026

---

## 🆘 Soporte

Si encuentras algún problema:

1. Verifica que el servidor esté corriendo
2. Limpia el caché del navegador
3. Consulta la documentación en `/docs`

---

**Versión:** 3.1 Enterprise  
**Última actualización:** Enero 2026
