# 📋 YAVOY v3.1 - GUÍA DE IMPLEMENTACIÓN COMPLETA
## Plataforma Multilateral con Arquitectura Enterprise

---

## 🎯 RESUMEN EJECUTIVO

Se ha transformado completamente YAvoy v3.1 en una **plataforma multilateral profesional** con:
- ✅ Interfaces dedicadas por tipo de usuario
- ✅ Sistema de enrutamiento automático por roles JWT
- ✅ Middleware de seguridad robusto
- ✅ Chatbot IA contextual universal
- ✅ Configuración optimizada para Hostinger VPS

---

## 📁 ESTRUCTURA DE CARPETAS CREADA

```
YAvoy_DEFINITIVO/
│
├── views/                          # 🆕 VISTAS POR ROL
│   ├── cliente/
│   │   └── dashboard.html          # Interfaz limpia de cliente
│   ├── repartidor/
│   │   └── dashboard.html          # Panel operativo de repartidor
│   ├── comercio/
│   │   └── dashboard.html          # Panel de gestión comercio
│   └── admin/
│       └── dashboard.html          # Centro de comando CEO
│
├── js/                             # 🆕 SCRIPTS CORE
│   ├── router.js                   # Sistema de enrutamiento por roles
│   └── chatbot-yavoy.js           # Chatbot IA universal
│
├── middleware/                     # 🆕 SEGURIDAD BACKEND
│   └── auth.js                     # Autenticación y autorización
│
├── .env.production.example         # 🆕 Configuración de producción
├── ecosystem.config.js             # ✨ Actualizado para PM2
└── server-enterprise.js            # Servidor principal (modificar)
```

---

## 🔧 1. SISTEMA DE ENRUTAMIENTO POR ROLES

### **Archivo:** `js/router.js`

### **Funcionalidades:**
- ✅ Redirección automática según rol JWT
- ✅ Validación de tokens expirados
- ✅ Caché de datos de usuario
- ✅ Protección de rutas

### **Rutas por Rol:**
```javascript
{
    cliente: '/views/cliente/dashboard.html',
    repartidor: '/views/repartidor/dashboard.html',
    comercio: '/views/comercio/dashboard.html',
    ceo: '/views/admin/dashboard.html'
}
```

### **Uso en HTML:**
```html
<!-- Agregar al final de <head> en todas las páginas -->
<script src="/js/router.js"></script>
```

### **API del Router:**
```javascript
// Manejar login
YAvoyRouter.handleLogin(token);

// Proteger ruta manualmente
YAvoyRouter.protectRoute(['ceo', 'admin']);

// Obtener datos del usuario
const userData = YAvoyRouter.getUserData();

// Verificar permisos
const canAccess = YAvoyRouter.hasPermission('admin');
```

---

## 🛡️ 2. MIDDLEWARE DE SEGURIDAD (BACKEND)

### **Archivo:** `middleware/auth.js`

### **Funciones Principales:**

#### **Autenticación:**
```javascript
const { authenticateToken } = require('./middleware/auth');

// Proteger ruta
app.get('/api/perfil', authenticateToken, (req, res) => {
    res.json({ user: req.user });
});
```

#### **Autorización por Roles:**
```javascript
const { authorizeRoles, requireAdmin } = require('./middleware/auth');

// Solo admin y CEO
app.get('/api/admin/usuarios', 
    authenticateToken, 
    requireAdmin, 
    (req, res) => { ... }
);

// Múltiples roles
app.get('/api/comercio/pedidos', 
    authenticateToken, 
    authorizeRoles('comercio', 'ceo'), 
    (req, res) => { ... }
);
```

#### **Protección de Recursos Propios:**
```javascript
const { requireOwnership } = require('./middleware/auth');

// Usuario solo puede acceder a sus datos
app.get('/api/usuario/:id/pedidos', 
    authenticateToken, 
    requireOwnership, 
    (req, res) => { ... }
);
```

#### **Rate Limiting:**
```javascript
const { rateLimit } = require('./middleware/auth');

// Limitar a 100 peticiones por minuto
app.use('/api/', rateLimit(100, 60000));
```

---

## 💬 3. CHATBOT IA UNIVERSAL

### **Archivo:** `js/chatbot-yavoy.js`

### **Características:**
- ✅ Respuestas contextuales según rol
- ✅ Integración con backend (opcional)
- ✅ Historial de conversación
- ✅ Sugerencias rápidas personalizadas
- ✅ UI/UX moderna y responsive

### **Inicialización:**
```html
<!-- En cada dashboard -->
<div id="chatbot-container"></div>
<script src="/js/chatbot-yavoy.js"></script>
<script>
    initChatbot('cliente'); // o 'repartidor', 'comercio', 'ceo'
</script>
```

### **Respuestas Contextuales:**

**CLIENTE:**
- Estado del pedido en tiempo real
- Comercios cercanos
- Soporte de cuenta

**REPARTIDOR:**
- Resumen de ganancias
- Pedidos disponibles
- Soporte técnico

**COMERCIO:**
- Pedidos pendientes
- Análisis de ventas
- Repartidores activos

**CEO:**
- Resumen de ventas del día
- Métricas de la plataforma
- Gestión de usuarios

### **Endpoint Backend (Opcional):**
```javascript
// En server-enterprise.js
app.post('/api/chatbot/query', authenticateToken, async (req, res) => {
    const { message, role, user_id } = req.body;
    
    // Integrar con OpenAI, Claude, etc.
    const response = await generarRespuesta(message, role, user_id);
    
    res.json({ response });
});
```

---

## 🚀 4. INTEGRACIÓN EN SERVER-ENTERPRISE.JS

### **Modificaciones Necesarias:**

#### **1. Importar Middleware:**
```javascript
const {
    authenticateToken,
    authorizeRoles,
    requireAdmin,
    requireComercio,
    requireRepartidor,
    generateToken,
    auditAccess
} = require('./middleware/auth');
```

#### **2. Modificar Login para incluir Role en JWT:**
```javascript
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const user = await db.query(
            'SELECT id, nombre, email, password, role FROM usuarios WHERE email = $1',
            [email]
        );
        
        if (user.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        
        const isValid = await bcrypt.compare(password, user.rows[0].password);
        
        if (!isValid) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        
        // Generar token con rol
        const token = generateToken({
            id: user.rows[0].id,
            email: user.rows[0].email,
            nombre: user.rows[0].nombre,
            role: user.rows[0].role // 🆕 IMPORTANTE
        });
        
        res.json({ 
            success: true, 
            token,
            user: {
                id: user.rows[0].id,
                nombre: user.rows[0].nombre,
                role: user.rows[0].role
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});
```

#### **3. Endpoint de Validación de Token:**
```javascript
app.post('/api/auth/validate', authenticateToken, (req, res) => {
    res.json({ 
        valid: true, 
        user: req.user 
    });
});
```

#### **4. Proteger Rutas de Admin:**
```javascript
// Todas las rutas admin
app.use('/api/admin/*', authenticateToken, requireAdmin, auditAccess);

// Métricas CEO
app.get('/api/admin/metricas', async (req, res) => {
    const metricas = await obtenerMetricas();
    res.json(metricas);
});

// Gestión de usuarios
app.get('/api/admin/usuarios', async (req, res) => {
    const { role } = req.query;
    const query = role 
        ? 'SELECT * FROM usuarios WHERE role = $1'
        : 'SELECT * FROM usuarios';
    const params = role ? [role] : [];
    const usuarios = await db.query(query, params);
    res.json(usuarios.rows);
});

// Suspender usuario
app.put('/api/admin/usuarios/:id/suspender', async (req, res) => {
    await db.query(
        'UPDATE usuarios SET estado = $1 WHERE id = $2',
        ['suspendido', req.params.id]
    );
    res.json({ success: true });
});
```

#### **5. Rutas de Comercio:**
```javascript
app.use('/api/comercio/*', authenticateToken, requireComercio);

app.get('/api/comercio/pedidos', async (req, res) => {
    const pedidos = await db.query(
        'SELECT * FROM orders WHERE comercio_id = $1 ORDER BY created_at DESC',
        [req.user.id]
    );
    res.json(pedidos.rows);
});

app.put('/api/comercio/pedidos/:id/estado', async (req, res) => {
    const { estado } = req.body;
    await db.query(
        'UPDATE orders SET estado = $1 WHERE id = $2 AND comercio_id = $3',
        [estado, req.params.id, req.user.id]
    );
    res.json({ success: true });
});
```

#### **6. Rutas de Repartidor:**
```javascript
app.use('/api/repartidor/*', authenticateToken, requireRepartidor);

app.get('/api/pedidos/disponibles', async (req, res) => {
    const pedidos = await db.query(
        'SELECT * FROM orders WHERE estado = $1 AND repartidor_id IS NULL',
        ['listo']
    );
    res.json(pedidos.rows);
});

app.post('/api/pedidos/:id/aceptar', async (req, res) => {
    await db.query(
        'UPDATE orders SET repartidor_id = $1, estado = $2 WHERE id = $3',
        [req.user.id, 'en_camino', req.params.id]
    );
    res.json({ success: true });
});

app.get('/api/repartidor/billetera', async (req, res) => {
    const stats = await obtenerEstadisticasRepartidor(req.user.id);
    res.json(stats);
});
```

---

## ⚙️ 5. CONFIGURACIÓN PM2 PARA PRODUCCIÓN

### **Archivo:** `ecosystem.config.js`

### **Comandos PM2:**

```bash
# Iniciar en modo producción
pm2 start ecosystem.config.js --env production

# Ver logs
pm2 logs yavoy-enterprise-v3.1

# Monitorear
pm2 monit

# Reiniciar
pm2 restart yavoy-enterprise-v3.1

# Detener
pm2 stop yavoy-enterprise-v3.1

# Guardar configuración
pm2 save

# Auto-inicio en reboot
pm2 startup
```

---

## 🌐 6. CONFIGURACIÓN DE PRODUCCIÓN

### **Archivo:** `.env.production.example`

### **Pasos de Configuración:**

1. **Copiar archivo:**
```bash
cp .env.production.example .env
```

2. **Generar JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

3. **Configurar PostgreSQL:**
```env
DB_NAME=yavoy_production
DB_USER=yavoy_admin
DB_PASSWORD=tu_password_seguro
```

4. **Configurar CORS con tu dominio:**
```env
CORS_ORIGIN=https://tudominio.com,https://www.tudominio.com
```

5. **Mercadopago (Producción):**
```env
MERCADOPAGO_ACCESS_TOKEN=APP_USR-tu-token-produccion
MERCADOPAGO_PUBLIC_KEY=APP_USR-tu-public-key
```

---

## 📊 7. ENDPOINTS NECESARIOS (RESUMEN)

### **Autenticación:**
- `POST /api/login` - Login con generación de JWT
- `POST /api/registro` - Registro de usuarios
- `POST /api/auth/validate` - Validar token

### **Cliente:**
- `GET /api/comercios` - Listar comercios
- `GET /api/repartidores/activos` - Ver repartidores (anónimo)
- `GET /api/pedidos/activo` - Pedido activo del cliente

### **Repartidor:**
- `POST /api/repartidor/estado` - Conectar/desconectar
- `GET /api/pedidos/disponibles` - Pedidos por cercanía
- `POST /api/pedidos/:id/aceptar` - Aceptar pedido
- `GET /api/repartidor/billetera` - Ganancias

### **Comercio:**
- `GET /api/comercio/pedidos` - Pedidos del comercio
- `PUT /api/comercio/pedidos/:id/estado` - Cambiar estado
- `GET /api/comercio/productos` - Inventario
- `GET /api/comercio/estadisticas` - Stats de ventas
- `GET /api/comercio/repartidores` - Repartidores asignados

### **CEO/Admin:**
- `GET /api/admin/metricas` - Métricas globales
- `GET /api/admin/mapa-pedidos` - Mapa de calor
- `GET /api/admin/usuarios` - Gestión de usuarios
- `PUT /api/admin/usuarios/:id/suspender` - Suspender usuario
- `PUT /api/admin/usuarios/:id/activar` - Activar usuario
- `GET /api/admin/transacciones` - Transacciones recientes

### **Chatbot (Opcional):**
- `POST /api/chatbot/query` - Consulta al chatbot

---

## 🚢 8. DESPLIEGUE EN HOSTINGER VPS

### **Pasos de Instalación:**

```bash
# 1. Conectar al VPS
ssh usuario@tu-vps-ip

# 2. Actualizar sistema
sudo apt update && sudo apt upgrade -y

# 3. Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 4. Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# 5. Configurar PostgreSQL
sudo -u postgres createdb yavoy_production
sudo -u postgres createuser yavoy_admin
sudo -u postgres psql -c "ALTER USER yavoy_admin PASSWORD 'tu_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE yavoy_production TO yavoy_admin;"

# 6. Clonar proyecto
git clone https://github.com/tu-usuario/yavoy.git
cd yavoy

# 7. Instalar dependencias
npm install

# 8. Configurar .env
cp .env.production.example .env
nano .env  # Editar valores

# 9. Migrar base de datos
psql -U yavoy_admin -d yavoy_production -f database-schema.sql

# 10. Instalar PM2
sudo npm install -g pm2

# 11. Iniciar aplicación
pm2 start ecosystem.config.js --env production

# 12. Configurar auto-inicio
pm2 startup
pm2 save

# 13. Configurar firewall
sudo ufw allow 3000/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# 14. Instalar Nginx (proxy inverso)
sudo apt install -y nginx

# 15. Configurar Nginx
sudo nano /etc/nginx/sites-available/yavoy
```

**Configuración Nginx:**
```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# 16. Activar configuración
sudo ln -s /etc/nginx/sites-available/yavoy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 17. Instalar SSL (Let's Encrypt)
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

---

## ✅ 9. CHECKLIST DE IMPLEMENTACIÓN

### **Antes de Producción:**
- [ ] Actualizar `server-enterprise.js` con middleware de auth
- [ ] Agregar campo `role` a tabla `usuarios` en PostgreSQL
- [ ] Implementar todos los endpoints necesarios
- [ ] Configurar CORS con dominio real
- [ ] Generar JWT_SECRET único y seguro
- [ ] Configurar credenciales de Mercadopago (producción)
- [ ] Probar chatbot con diferentes roles
- [ ] Verificar redirecciones automáticas
- [ ] Probar rate limiting
- [ ] Configurar backups automáticos de BD

### **En Producción:**
- [ ] Configurar DNS para apuntar a VPS
- [ ] Instalar certificado SSL
- [ ] Configurar firewall
- [ ] Habilitar PM2 auto-restart
- [ ] Configurar logs rotativos
- [ ] Monitorear errores con Sentry (opcional)
- [ ] Configurar alertas de caída
- [ ] Realizar pruebas de carga

---

## 🎨 10. CAPTURAS DE FUNCIONALIDADES

### **Vista Cliente:**
- Mapa con repartidores anónimos (puntos azules)
- Lista de comercios cercanos
- Estado de pedido activo
- Chatbot con soporte

### **Vista Repartidor:**
- Toggle "Conectarse/Desconectarse"
- Lista de pedidos por cercanía
- Billetera con ganancias acumuladas
- Mapa de ruta

### **Vista Comercio:**
- Tabs: Pedidos / Inventario
- Estados: Pendiente / Preparando / Listo
- Repartidores asignados
- Estadísticas de ventas

### **Vista CEO:**
- Métricas principales (4 cards)
- Mapa de calor de pedidos
- Tabla de transacciones
- Gestión de usuarios con filtros

---

## 📞 SOPORTE Y CONTACTO

**Documentación Técnica:** Este archivo  
**Repositorio:** GitHub (privado)  
**Autor:** YAvoy Development Team  
**Versión:** 3.1  
**Última actualización:** Diciembre 2025

---

## 🔄 PRÓXIMOS PASOS

1. **Integrar middleware en server-enterprise.js**
2. **Agregar campo `role` a BD**
3. **Implementar endpoints faltantes**
4. **Probar flujos de cada rol**
5. **Configurar dominio y SSL**
6. **Desplegar en Hostinger VPS**
7. **Monitorear y optimizar**

---

🚀 **YAvoy v3.1 está listo para transformar el delivery!**
