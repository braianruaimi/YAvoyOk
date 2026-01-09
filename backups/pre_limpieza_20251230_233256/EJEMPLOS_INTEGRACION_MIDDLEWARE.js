/**
 * ============================================
 * EJEMPLO DE INTEGRACIÓN DE MIDDLEWARE
 * Para server-enterprise.js
 * ============================================
 * Copiar y pegar estos fragmentos en el archivo principal
 */

// ============================================
// 1. IMPORTS AL INICIO DEL ARCHIVO
// ============================================
const {
    authenticateToken,
    authorizeRoles,
    requireAdmin,
    requireComercio,
    requireRepartidor,
    requireOwnership,
    generateToken,
    verifyToken,
    rateLimit,
    auditAccess
} = require('./middleware/auth');

// ============================================
// 2. MODIFICAR ENDPOINT DE LOGIN
// ============================================
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        // Buscar usuario con role
        const result = await pool.query(
            'SELECT id, nombre, email, password, role FROM usuarios WHERE email = $1 AND estado = $2',
            [email, 'activo']
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ 
                success: false, 
                error: 'Credenciales inválidas' 
            });
        }
        
        const user = result.rows[0];
        
        // Verificar password
        const bcrypt = require('bcrypt');
        const isValid = await bcrypt.compare(password, user.password);
        
        if (!isValid) {
            return res.status(401).json({ 
                success: false, 
                error: 'Credenciales inválidas' 
            });
        }
        
        // Generar token con rol
        const token = generateToken({
            id: user.id,
            email: user.email,
            nombre: user.nombre,
            role: user.role  // 🔥 CRÍTICO
        });
        
        res.json({ 
            success: true, 
            token,
            user: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error del servidor' 
        });
    }
});

// ============================================
// 3. ENDPOINT DE VALIDACIÓN DE TOKEN
// ============================================
app.post('/api/auth/validate', authenticateToken, (req, res) => {
    res.json({ 
        valid: true, 
        user: req.user 
    });
});

// ============================================
// 4. RUTAS DE ADMIN/CEO
// ============================================

// Protección global de rutas admin
app.use('/api/admin/*', authenticateToken, requireAdmin, auditAccess);

// Métricas del dashboard CEO
app.get('/api/admin/metricas', async (req, res) => {
    try {
        const metricas = await pool.query(`
            SELECT * FROM admin_metricas
        `);
        
        // Calcular cambios vs ayer
        const ayer = await pool.query(`
            SELECT 
                COUNT(*) as pedidos_ayer,
                COALESCE(SUM(total), 0) as facturacion_ayer
            FROM orders 
            WHERE DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'
        `);
        
        const data = metricas.rows[0];
        const dataAyer = ayer.rows[0];
        
        res.json({
            ...data,
            cambios: {
                facturacion: dataAyer.facturacion_ayer > 0 
                    ? (((data.facturacion_hoy - dataAyer.facturacion_ayer) / dataAyer.facturacion_ayer) * 100).toFixed(1)
                    : 0,
                pedidos: dataAyer.pedidos_ayer > 0 
                    ? (((data.pedidos_hoy - dataAyer.pedidos_ayer) / dataAyer.pedidos_ayer) * 100).toFixed(1)
                    : 0,
                usuarios: 5, // Calcular según tu lógica
                satisfaccion: 0.2
            }
        });
    } catch (error) {
        console.error('Error al obtener métricas:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Mapa de calor de pedidos
app.get('/api/admin/mapa-pedidos', async (req, res) => {
    try {
        const pedidos = await pool.query(`
            SELECT id, lat, lng, estado, total 
            FROM orders 
            WHERE DATE(created_at) = CURRENT_DATE 
            AND lat IS NOT NULL 
            AND lng IS NOT NULL
        `);
        
        res.json(pedidos.rows);
    } catch (error) {
        console.error('Error al obtener mapa:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Gestión de usuarios
app.get('/api/admin/usuarios', async (req, res) => {
    try {
        const { role } = req.query;
        
        let query = 'SELECT id, nombre, email, role, estado FROM usuarios';
        const params = [];
        
        if (role) {
            query += ' WHERE role = $1';
            params.push(role);
        }
        
        query += ' ORDER BY created_at DESC';
        
        const usuarios = await pool.query(query, params);
        res.json(usuarios.rows);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Suspender usuario
app.put('/api/admin/usuarios/:id/suspender', async (req, res) => {
    try {
        await pool.query(
            'UPDATE usuarios SET estado = $1 WHERE id = $2',
            ['suspendido', req.params.id]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error al suspender usuario:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Activar usuario
app.put('/api/admin/usuarios/:id/activar', async (req, res) => {
    try {
        await pool.query(
            'UPDATE usuarios SET estado = $1 WHERE id = $2',
            ['activo', req.params.id]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error al activar usuario:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Transacciones recientes
app.get('/api/admin/transacciones', async (req, res) => {
    try {
        const transacciones = await pool.query(`
            SELECT 
                o.id,
                o.created_at as fecha,
                u.nombre as cliente,
                c.nombre as comercio,
                o.metodo_pago,
                o.total as monto,
                o.estado
            FROM orders o
            JOIN usuarios u ON o.cliente_id = u.id
            JOIN usuarios c ON o.comercio_id = c.id
            ORDER BY o.created_at DESC
            LIMIT 50
        `);
        
        res.json(transacciones.rows);
    } catch (error) {
        console.error('Error al obtener transacciones:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// ============================================
// 5. RUTAS DE COMERCIO
// ============================================

app.use('/api/comercio/*', authenticateToken, requireComercio);

// Pedidos del comercio
app.get('/api/comercio/pedidos', async (req, res) => {
    try {
        const pedidos = await pool.query(`
            SELECT 
                o.id,
                o.estado,
                o.total,
                o.direccion_entrega,
                u.nombre as cliente_nombre,
                o.items,
                o.created_at
            FROM orders o
            JOIN usuarios u ON o.cliente_id = u.id
            WHERE o.comercio_id = $1
            ORDER BY o.created_at DESC
        `, [req.user.id]);
        
        res.json(pedidos.rows);
    } catch (error) {
        console.error('Error al obtener pedidos:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Cambiar estado de pedido
app.put('/api/comercio/pedidos/:id/estado', async (req, res) => {
    try {
        const { estado } = req.body;
        
        await pool.query(
            'UPDATE orders SET estado = $1 WHERE id = $2 AND comercio_id = $3',
            [estado, req.params.id, req.user.id]
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error al cambiar estado:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Productos del comercio
app.get('/api/comercio/productos', async (req, res) => {
    try {
        const productos = await pool.query(
            'SELECT * FROM productos WHERE comercio_id = $1',
            [req.user.id]
        );
        res.json(productos.rows);
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Estadísticas del comercio
app.get('/api/comercio/estadisticas', async (req, res) => {
    try {
        const stats = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM orders WHERE comercio_id = $1 AND DATE(created_at) = CURRENT_DATE) as pedidos_hoy,
                (SELECT COALESCE(SUM(total), 0) FROM orders WHERE comercio_id = $1 AND DATE(created_at) = CURRENT_DATE) as ventas_hoy
        `, [req.user.id]);
        
        res.json(stats.rows[0]);
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Repartidores disponibles
app.get('/api/comercio/repartidores', async (req, res) => {
    try {
        const repartidores = await pool.query(`
            SELECT 
                u.id,
                u.nombre,
                COALESCE(rb.calificacion_promedio, 5.0) as calificacion,
                CASE 
                    WHEN EXISTS (SELECT 1 FROM orders WHERE repartidor_id = u.id AND estado IN ('en_camino', 'recogido'))
                    THEN 'ocupado'
                    ELSE 'activo'
                END as estado
            FROM usuarios u
            LEFT JOIN repartidor_billetera rb ON u.id = rb.repartidor_id
            WHERE u.role = 'repartidor' AND u.estado = 'activo'
        `);
        
        res.json(repartidores.rows);
    } catch (error) {
        console.error('Error al obtener repartidores:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// ============================================
// 6. RUTAS DE REPARTIDOR
// ============================================

app.use('/api/repartidor/*', authenticateToken, requireRepartidor);

// Conectar/desconectar
app.post('/api/repartidor/estado', async (req, res) => {
    try {
        const { estado, lat, lng } = req.body;
        
        // Actualizar ubicación y estado
        await pool.query(
            'UPDATE usuarios SET last_lat = $1, last_lng = $2, last_seen = NOW() WHERE id = $3',
            [lat, lng, req.user.id]
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error al actualizar estado:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Pedidos disponibles
app.get('/api/pedidos/disponibles', async (req, res) => {
    try {
        const pedidos = await pool.query(`
            SELECT 
                o.id,
                o.total,
                o.direccion_entrega,
                c.nombre as comercio,
                o.comision_repartidor as comision,
                1.2 as distancia
            FROM orders o
            JOIN usuarios c ON o.comercio_id = c.id
            WHERE o.estado = 'listo' 
            AND o.repartidor_id IS NULL
            ORDER BY o.created_at ASC
            LIMIT 20
        `);
        
        res.json(pedidos.rows);
    } catch (error) {
        console.error('Error al obtener pedidos:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Aceptar pedido
app.post('/api/pedidos/:id/aceptar', async (req, res) => {
    try {
        await pool.query(
            'UPDATE orders SET repartidor_id = $1, estado = $2 WHERE id = $3 AND repartidor_id IS NULL',
            [req.user.id, 'en_camino', req.params.id]
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error al aceptar pedido:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Billetera
app.get('/api/repartidor/billetera', async (req, res) => {
    try {
        const stats = await pool.query(`
            SELECT 
                COALESCE(rb.balance, 0) as balance,
                COALESCE(rb.pedidos_completados, 0) as pedidos_totales,
                COALESCE(rb.calificacion_promedio, 5.0) as calificacion_promedio,
                (SELECT COUNT(*) FROM orders WHERE repartidor_id = $1 AND DATE(created_at) = CURRENT_DATE AND estado = 'completado') as pedidos_hoy,
                (SELECT COALESCE(SUM(comision_repartidor), 0) FROM orders WHERE repartidor_id = $1 AND DATE(created_at) = CURRENT_DATE AND estado = 'completado') as ganancia_hoy,
                (SELECT COUNT(*) FROM orders WHERE repartidor_id = $1 AND created_at >= DATE_TRUNC('week', CURRENT_DATE) AND estado = 'completado') as pedidos_semana
            FROM usuarios u
            LEFT JOIN repartidor_billetera rb ON u.id = rb.repartidor_id
            WHERE u.id = $1
        `, [req.user.id]);
        
        res.json(stats.rows[0]);
    } catch (error) {
        console.error('Error al obtener billetera:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// ============================================
// 7. RUTAS DE CLIENTE
// ============================================

// Comercios
app.get('/api/comercios', authenticateToken, async (req, res) => {
    try {
        const comercios = await pool.query(`
            SELECT 
                u.id,
                u.nombre,
                u.direccion,
                'Abierto' as horario,
                4.5 as rating,
                120 as reviews
            FROM usuarios u
            WHERE u.role = 'comercio' AND u.estado = 'activo'
        `);
        
        res.json(comercios.rows);
    } catch (error) {
        console.error('Error al obtener comercios:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Repartidores activos (anónimos)
app.get('/api/repartidores/activos', authenticateToken, async (req, res) => {
    try {
        const repartidores = await pool.query(`
            SELECT 
                last_lat as lat,
                last_lng as lng
            FROM usuarios
            WHERE role = 'repartidor' 
            AND estado = 'activo'
            AND last_seen > NOW() - INTERVAL '5 minutes'
            AND last_lat IS NOT NULL
            AND last_lng IS NOT NULL
        `);
        
        res.json(repartidores.rows);
    } catch (error) {
        console.error('Error al obtener repartidores:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Pedido activo del cliente
app.get('/api/pedidos/activo', authenticateToken, async (req, res) => {
    try {
        const pedido = await pool.query(`
            SELECT id, estado, total
            FROM orders
            WHERE cliente_id = $1 
            AND estado NOT IN ('completado', 'cancelado')
            ORDER BY created_at DESC
            LIMIT 1
        `, [req.user.id]);
        
        if (pedido.rows.length === 0) {
            return res.status(404).json({ error: 'No hay pedido activo' });
        }
        
        res.json(pedido.rows[0]);
    } catch (error) {
        console.error('Error al obtener pedido activo:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// ============================================
// 8. CHATBOT (OPCIONAL)
// ============================================
app.post('/api/chatbot/query', authenticateToken, async (req, res) => {
    const { message, role, user_id } = req.body;
    
    // Aquí integrarías con OpenAI, Claude, etc.
    // Por ahora devuelve respuesta simple
    
    res.json({
        response: `Recibí tu mensaje: "${message}". Rol: ${role}`
    });
});

// ============================================
// FIN DE EJEMPLOS
// ============================================
// Copiar estos fragmentos en server-enterprise.js
// según corresponda
// ============================================
