# ⚡ INICIO RÁPIDO - YAVOY v3.1
## 5 minutos para tener la plataforma funcionando

---

## 🚀 INSTALACIÓN RÁPIDA

### 1️⃣ **Base de Datos (2 min)**

```bash
# Ejecutar migración
psql -U postgres -d yavoy_db -f migracion_v3.1.sql

# Verificar
psql -U postgres -d yavoy_db -c "SELECT role, COUNT(*) FROM usuarios GROUP BY role;"
```

---

### 2️⃣ **Backend (2 min)**

Abrir `server-enterprise.js` y agregar al inicio:

```javascript
// Importar middleware
const {
    authenticateToken,
    requireAdmin,
    requireComercio,
    requireRepartidor,
    generateToken
} = require('./middleware/auth');

// Modificar login existente para incluir role
app.post('/api/login', async (req, res) => {
    // Tu código existente de validación...
    
    // CAMBIAR ESTO:
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    
    // POR ESTO:
    const token = generateToken({
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        role: user.role  // 🔥 AGREGAR
    });
    
    res.json({ success: true, token });
});

// Agregar endpoint de validación
app.post('/api/auth/validate', authenticateToken, (req, res) => {
    res.json({ valid: true, user: req.user });
});

// Proteger rutas admin
app.use('/api/admin/*', authenticateToken, requireAdmin);
```

**Ver código completo en:** `EJEMPLOS_INTEGRACION_MIDDLEWARE.js`

---

### 3️⃣ **Frontend (1 min)**

Agregar en `index.html` (o tu página de login):

```html
<head>
    <!-- Tus scripts existentes... -->
    
    <!-- AGREGAR ESTO: -->
    <script src="/js/router.js"></script>
</head>

<script>
// En tu función de login, reemplazar:
localStorage.setItem('token', token);
window.location.href = '/panel.html';

// POR:
YAvoyRouter.handleLogin(token);  // ✅ Redirige automáticamente
</script>
```

---

## 🧪 PROBAR

### **Crear Usuario de Prueba:**

```sql
-- Usuario Admin
INSERT INTO usuarios (nombre, email, password, role, estado) 
VALUES ('Admin', 'admin@test.com', '$2b$10$hashedPassword', 'ceo', 'activo');

-- Usuario Cliente
INSERT INTO usuarios (nombre, email, password, role, estado) 
VALUES ('Cliente Test', 'cliente@test.com', '$2b$10$hashedPassword', 'cliente', 'activo');

-- Usuario Repartidor
INSERT INTO usuarios (nombre, email, password, role, estado) 
VALUES ('Repartidor Test', 'repartidor@test.com', '$2b$10$hashedPassword', 'repartidor', 'activo');

-- Usuario Comercio
INSERT INTO usuarios (nombre, email, password, role, estado) 
VALUES ('Comercio Test', 'comercio@test.com', '$2b$10$hashedPassword', 'comercio', 'activo');
```

### **Probar Login:**

1. Iniciar servidor: `node server-enterprise.js`
2. Abrir: `http://localhost:3000`
3. Login con cada usuario de prueba
4. Verificar redirección automática

**Resultados esperados:**
- ✅ Admin → `/views/admin/dashboard.html`
- ✅ Cliente → `/views/cliente/dashboard.html`
- ✅ Repartidor → `/views/repartidor/dashboard.html`
- ✅ Comercio → `/views/comercio/dashboard.html`

---

## 📋 CHECKLIST MÍNIMO

- [ ] Ejecutar `migracion_v3.1.sql`
- [ ] Importar middleware en `server-enterprise.js`
- [ ] Modificar login para incluir `role` en JWT
- [ ] Agregar `<script src="/js/router.js">` en index
- [ ] Cambiar redirección a `YAvoyRouter.handleLogin(token)`
- [ ] Crear usuarios de prueba
- [ ] Probar login con cada rol

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### **Error: "Token inválido"**
```javascript
// Verificar que login incluya role:
const token = generateToken({
    id: user.id,
    role: user.role  // ← Debe estar presente
});
```

### **Error: "Cannot find module './middleware/auth'"**
```bash
# Verificar que existe el archivo
ls middleware/auth.js

# Si no existe, fue creado en: middleware/auth.js
```

### **Redirección no funciona**
```html
<!-- Verificar que router.js esté cargado -->
<script src="/js/router.js"></script>

<!-- Verificar en consola del navegador -->
<script>
console.log(typeof YAvoyRouter); // Debe mostrar "function"
</script>
```

### **Error: "role is not defined"**
```sql
-- Agregar campo role manualmente si la migración falló
ALTER TABLE usuarios ADD COLUMN role VARCHAR(20) DEFAULT 'cliente';
```

---

## 📚 ENDPOINTS ESENCIALES

### **Agregar en server-enterprise.js:**

```javascript
// 1. Validación de token
app.post('/api/auth/validate', authenticateToken, (req, res) => {
    res.json({ valid: true, user: req.user });
});

// 2. Lista de comercios (para Cliente)
app.get('/api/comercios', authenticateToken, async (req, res) => {
    const comercios = await pool.query(
        'SELECT id, nombre, direccion FROM usuarios WHERE role = $1',
        ['comercio']
    );
    res.json(comercios.rows);
});

// 3. Pedidos del comercio
app.get('/api/comercio/pedidos', 
    authenticateToken, 
    requireComercio, 
    async (req, res) => {
        const pedidos = await pool.query(
            'SELECT * FROM orders WHERE comercio_id = $1',
            [req.user.id]
        );
        res.json(pedidos.rows);
    }
);

// 4. Métricas admin
app.get('/api/admin/metricas', 
    authenticateToken, 
    requireAdmin, 
    async (req, res) => {
        const metricas = await pool.query('SELECT * FROM admin_metricas');
        res.json(metricas.rows[0]);
    }
);
```

---

## 🎯 SIGUIENTE NIVEL

Una vez funcionando lo básico:

1. **Agregar más endpoints** desde `EJEMPLOS_INTEGRACION_MIDDLEWARE.js`
2. **Activar chatbot** en dashboards
3. **Configurar .env de producción**
4. **Desplegar con PM2**

---

## 📖 DOCUMENTACIÓN COMPLETA

- **Guía Completa:** `GUIA_IMPLEMENTACION_MULTILATERAL.md`
- **Resumen Visual:** `RESUMEN_TRANSFORMACION.md`
- **Entregable Final:** `ENTREGABLE_FINAL.md`
- **Ejemplos de Código:** `EJEMPLOS_INTEGRACION_MIDDLEWARE.js`

---

## ✅ RESULTADO

Después de estos 5 minutos tendrás:

✅ Sistema de roles funcionando  
✅ Redirección automática por usuario  
✅ Middleware de seguridad activo  
✅ 4 dashboards dedicados  
✅ Base de datos actualizada  

---

🚀 **YAvoy v3.1 funcionando en 5 minutos!**

*¿Problemas? Revisa `GUIA_IMPLEMENTACION_MULTILATERAL.md`*
