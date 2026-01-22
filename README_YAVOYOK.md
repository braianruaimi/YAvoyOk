# 🚀 YAvoyOk - Plataforma de Entregas Express

![YAvoy Logo](icons/icon-192x192.png)

**YAvoy** es una plataforma moderna de gestión de entregas que conecta comercios, repartidores y clientes de manera eficiente y profesional.

---

## 🌐 Demo en Vivo

**🔗 [https://yavoy.space](https://yavoy.space)**

---

## ✨ Características Principales

### 📦 Para Clientes

- ✅ Crear pedidos con calculadora de costos en tiempo real
- ✅ Timeline visual del estado del pedido
- ✅ Búsqueda de pedidos por nombre, ID o dirección
- ✅ Interfaz moderna y responsive
- ✅ Auto-guardado para prevenir pérdida de datos

### 🏪 Para Comercios

- ✅ Panel de gestión completo
- ✅ Catálogo de productos (hasta 5 gratis, ilimitado en Premium)
- ✅ Gestión de pedidos con filtros por estado
- ✅ Búsqueda de pedidos en tiempo real
- ✅ Horario automático configurable (ON/OFF por día)
- ✅ Notificaciones push para nuevos pedidos
- ✅ Estadísticas con gráficas (Chart.js)
- ✅ Modal Premium para upgrade
- ✅ Sistema de toasts para notificaciones

### 🚴 Para Repartidores

- ✅ Panel modernizado con glassmorphism
- ✅ Visualización de pedidos asignados
- ✅ Timeline de estado de entregas
- ✅ Interfaz intuitiva y rápida

### 👔 Para Administradores (CEO)

- ✅ Dashboard centralizado
- ✅ Gestión de comercios y repartidores
- ✅ Verificaciones de seguridad
- ✅ Logs detallados
- ✅ Analytics completos

---

## 🎨 Diseño

### Tema Visual

- **Colores principales:** Cyan (#06b6d4) y Gold (#fbbf24)
- **Estilo:** Glassmorphism con backdrop-blur
- **Efectos:** Gradientes, glow effects, animaciones suaves
- **Responsive:** Optimizado para móviles, tablets y desktop

### Tecnologías Frontend

- HTML5 semántico
- CSS3 con variables personalizadas
- JavaScript vanilla (sin frameworks)
- Chart.js para gráficas
- SVG para iconos
- PWA (Progressive Web App)

---

## 📱 Redes Sociales

- **WhatsApp:** [+52 221 504 7962](https://wa.me/2215047962)
- **Facebook:** [YAvoy en Facebook](https://www.facebook.com/profile.php?id=61584920256289)
- **Instagram:** [@yavoyen5](https://www.instagram.com/yavoyen5/)
- **Email:** yavoyen5@gmail.com

---

## 🚀 Instalación

### Requisitos

- Node.js 16+ (para servidor local opcional)
- Git
- Navegador moderno (Chrome, Firefox, Edge, Safari)

### Instalación Local

```bash
# Clonar repositorio
git clone https://github.com/TU_USUARIO/YAvoyOk.git
cd YAvoyOk

# Instalar dependencias (opcional, para servidor Node.js)
npm install

# Iniciar servidor local
npm start
# O simplemente abrir index.html en el navegador
```

### Deploy en Hostinger

1. **Descarga el código:**
   - Opción A: Download ZIP desde GitHub
   - Opción B: `git clone` en terminal SSH de Hostinger

2. **Sube a public_html:**

   ```bash
   # En Hostinger SSH
   cd public_html
   git clone https://github.com/TU_USUARIO/YAvoyOk.git .
   ```

3. **Configura permisos:**
   - Carpetas: 755
   - Archivos: 644

4. **Verifica el dominio:**
   - Asegúrate que yavoy.space apunta a tu hosting

---

## 🔐 Acceso a Paneles

### Panel de Comercio

- **URL:** `/panel-comercio.html`
- **Contraseña:** `2215047962`

### Panel de Repartidor

- **URL:** `/panel-repartidor.html`
- **ID:** `braian_demo_2025` (o cualquier ID)
- **Contraseña:** `2215047962`

### Panel CEO

- **URL:** `/panel-ceo-master.html`
- **Usuario:** `ceo_yavoy`
- **Contraseña:** Configurada en el panel

---

## 📂 Estructura del Proyecto

```
YAvoyOk/
├── index.html                    # Landing page principal
├── panel-comercio.html           # Panel de gestión para comercios
├── panel-repartidor.html         # Panel para repartidores
├── panel-ceo-master.html         # Dashboard administrativo
├── pedidos.html                  # Gestión de pedidos
├── css/                          # Estilos CSS
│   ├── index-styles.css
│   ├── premium-system.css
│   └── theme-enhancement.css
├── js/                           # Scripts JavaScript
│   ├── calcular-distancia.js
│   ├── maps-integration.js
│   └── ...
├── icons/                        # Iconos PWA
├── components/                   # Componentes reutilizables
├── docs/                         # Documentación
├── middleware/                   # Middlewares de servidor
├── utils/                        # Utilidades
├── manifest.json                 # PWA manifest
├── sw.js                         # Service Worker
├── package.json                  # Dependencias Node.js
└── README.md                     # Este archivo
```

---

## 🛠️ Funcionalidades Técnicas

### Sistema de Notificaciones

- Push notifications del navegador
- Toast notifications estilizadas
- Sonido de alerta
- Vibración en móviles

### Gestión de Estado

- localStorage para persistencia
- Auto-guardado de borradores
- Sincronización en tiempo real (demo)

### Calculadora de Costos

- Precio base: $1000
- Adicional: $100 por cada 100m
- Cálculo automático en tiempo real

### Catálogo de Productos

- CRUD completo
- Límite de 5 productos (plan gratuito)
- Modal Premium para expansión
- Indicadores de stock

### Horario Automático

- Configuración por día de la semana
- Toggle ON/OFF
- Verificación cada minuto
- Cambio automático de estado

---

## 📊 Gráficas y Estadísticas

Utilizamos **Chart.js** para visualizaciones:

- Gráfica de ventas (línea)
- Estados de pedidos (dona)
- Horarios de atención (barras)

---

## 🔄 Actualizaciones Recientes

### v3.2 (Enero 2026)

- ✅ Actualizado número de WhatsApp a 2215047962
- ✅ Agregado botón de WhatsApp en index.html
- ✅ Implementado sistema de catálogo con límite de 5 productos
- ✅ Modal Premium con integración WhatsApp
- ✅ Búsqueda de pedidos en tiempo real
- ✅ Horario automático configurable
- ✅ Notificaciones push con simulador

### v3.1 (Enero 2026)

- ✅ Modernización visual completa (cyan-gold theme)
- ✅ Sistema de toasts reemplazando alerts
- ✅ Timeline visual para estados de pedidos
- ✅ Calculadora de costos con modal de ayuda
- ✅ Auto-guardado en localStorage
- ✅ Glassmorphism en todos los paneles

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Para cambios importantes:

1. Fork el proyecto
2. Crea tu rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto es privado y pertenece a YAvoy.

---

## 📞 Soporte

¿Necesitas ayuda? Contáctanos:

- **WhatsApp:** [+52 221 504 7962](https://wa.me/2215047962)
- **Email:** yavoyen5@gmail.com
- **Facebook Messenger:** [YAvoy](https://www.facebook.com/profile.php?id=61584920256289)

---

## 🙏 Agradecimientos

- Chart.js por las gráficas
- Comunidad de GitHub
- Todos los usuarios de YAvoy

---

<div align="center">
  <strong>Hecho con ❤️ para YAvoy</strong>
  <br>
  <sub>© 2026 YAvoy. Todos los derechos reservados.</sub>
</div>
