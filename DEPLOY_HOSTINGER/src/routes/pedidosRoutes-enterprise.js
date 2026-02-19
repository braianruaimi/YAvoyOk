/**
 * ========================================
 * RUTAS: PEDIDOS - YAvoy v3.1 Enterprise
 * ========================================
 * Gestión completa de pedidos con MySQL
 */

const express = require('express');
const router = express.Router();
const { schemas, validate, validateAll } = require('../validation/schemas');

module.exports = (pool, io) => {

    /**
     * GET /api/pedidos
     * Listar pedidos con filtros y paginación
     */
    router.get('/', 
        validate(schemas.query.paginacion, 'query'),
        async (req, res) => {
            try {
                const { page, limit, sortBy, order } = req.query;
                const { estado, clienteId, comercioId, repartidorId } = req.query;
                
                const offset = (page - 1) * limit;
                
                let query = `
                    SELECT 
                        o.*,
                        CONCAT(u.nombre, ' ', COALESCE(u.apellido, '')) AS cliente_nombre,
                        s.nombre_comercio,
                        CONCAT(r.nombre, ' ', COALESCE(r.apellido, '')) AS repartidor_nombre
                    FROM orders o
                    LEFT JOIN users u ON o.cliente_id = u.id
                    LEFT JOIN shops s ON o.comercio_id = s.id
                    LEFT JOIN users r ON o.repartidor_id = r.id
                    WHERE 1=1
                `;
                
                const params = [];
                let paramIndex = 1;
                
                if (estado && estado !== 'todos') {
                    query += ` AND o.estado = ?`;
                    params.push(estado);
                }
                
                if (clienteId) {
                    query += ` AND o.cliente_id = ?`;
                    params.push(clienteId);
                    paramIndex++;
                }
                
                if (comercioId) {
                    query += ` AND o.comercio_id = $${paramIndex}`;
                    params.push(comercioId);
                    paramIndex++;
                }
                
                if (repartidorId) {
                    query += ` AND o.repartidor_id = $${paramIndex}`;
                    params.push(repartidorId);
                    paramIndex++;
                }
                
                query += ` ORDER BY o.${sortBy || 'fecha_creacion'} ${order}
                           LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
                
                params.push(limit, offset);
                
                const result = await pool.query(query, params);
                
                // Contar total
                const countQuery = `SELECT COUNT(*) FROM orders WHERE 1=1` + 
                    (estado && estado !== 'todos' ? ` AND estado = $1` : '');
                const countResult = await pool.query(countQuery, estado && estado !== 'todos' ? [estado] : []);
                const total = parseInt(countResult.rows[0].count);
                
                res.json({
                    success: true,
                    pedidos: result.rows,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit)
                    }
                });
                
            } catch (error) {
                console.error('Error listando pedidos:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        }
    );

    /**
     * POST /api/pedidos
     * Crear nuevo pedido
     */
    router.post('/',
        validate(schemas.crearPedido),
        async (req, res) => {
            try {
                const {
                    nombreCliente, telefonoCliente, direccionEntrega, descripcion,
                    destinatario, telefonoDestinatario, notas, monto,
                    clienteId, comercioId, metodoPago, ubicacionEntrega
                } = req.body;
                
                // Calcular comisiones
                const comisionCEO = monto * 0.15;
                const comisionRepartidor = monto * 0.85;
                
                const pedidoId = `PED-${Date.now()}`;
                const codigoSeguimiento = `TRACK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
                
                const query = `
                    INSERT INTO orders (
                        id, cliente_id, comercio_id,
                        nombre_cliente, telefono_cliente, direccion_entrega, descripcion,
                        destinatario, telefono_destinatario, notas,
                        monto, comision_ceo, comision_repartidor,
                        estado, codigo_seguimiento, metodo_pago,
                        ubicacion_entrega_lat, ubicacion_entrega_lng
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
                    )
                    RETURNING *
                `;
                
                const result = await pool.query(query, [
                    pedidoId,
                    clienteId || null,
                    comercioId || null,
                    nombreCliente,
                    telefonoCliente,
                    direccionEntrega,
                    descripcion,
                    destinatario || nombreCliente,
                    telefonoDestinatario || telefonoCliente,
                    notas || '',
                    monto,
                    comisionCEO,
                    comisionRepartidor,
                    'pendiente',
                    codigoSeguimiento,
                    metodoPago || 'efectivo',
                    ubicacionEntrega?.lat || null,
                    ubicacionEntrega?.lng || null
                ]);
                
                const pedido = result.rows[0];
                
                // Log de auditoría
                await pool.query(`
                    INSERT INTO system_logs (evento, descripcion, datos, nivel)
                    VALUES ($1, $2, $3, $4)
                `, [
                    'pedido_creado',
                    `Nuevo pedido ${pedidoId}`,
                    JSON.stringify({ pedido }),
                    'info'
                ]);
                
                // Notificar por Socket.io (optimizado por ciudad)
                io.emit('nuevoPedido', pedido);
                
                res.status(201).json({ success: true, pedido });
                
            } catch (error) {
                console.error('Error creando pedido:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        }
    );

    /**
     * GET /api/pedidos/:id
     * Obtener pedido por ID
     */
    router.get('/:id',
        validate(schemas.params.pedidoId, 'params'),
        async (req, res) => {
            try {
                const { id } = req.params;
                
                const result = await pool.query(`
                    SELECT 
                        o.*,
                        u.nombre || ' ' || COALESCE(u.apellido, '') AS cliente_nombre,
                        u.whatsapp AS cliente_whatsapp,
                        s.nombre_comercio,
                        s.telefono AS comercio_telefono,
                        r.nombre || ' ' || COALESCE(r.apellido, '') AS repartidor_nombre,
                        r.whatsapp AS repartidor_whatsapp,
                        rev.rating_general,
                        rev.comentario_general
                    FROM orders o
                    LEFT JOIN users u ON o.cliente_id = u.id
                    LEFT JOIN shops s ON o.comercio_id = s.id
                    LEFT JOIN users r ON o.repartidor_id = r.id
                    LEFT JOIN reviews rev ON o.id = rev.order_id
                    WHERE o.id = $1
                `, [id]);
                
                if (result.rows.length === 0) {
                    return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
                }
                
                res.json({ success: true, pedido: result.rows[0] });
                
            } catch (error) {
                console.error('Error obteniendo pedido:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        }
    );

    /**
     * PATCH /api/pedidos/:id/estado
     * Actualizar estado del pedido
     */
    router.patch('/:id/estado',
        validateAll(
            schemas.actualizarEstadoPedido,
            schemas.params.pedidoId,
            null
        ),
        async (req, res) => {
            const client = await pool.connect();
            
            try {
                await client.query('BEGIN');
                
                const { id } = req.params;
                const { estado, repartidorId, motivoCancelacion, ubicacionActual } = req.body;
                
                // Obtener estado anterior
                const pedidoAnterior = await client.query('SELECT * FROM orders WHERE id = $1', [id]);
                if (pedidoAnterior.rows.length === 0) {
                    throw new Error('Pedido no encontrado');
                }
                
                const estadoAnterior = pedidoAnterior.rows[0].estado;
                
                // Actualizar pedido
                const columnaFecha = {
                    'aceptado': 'fecha_aceptacion',
                    'preparando': 'fecha_preparacion',
                    'en_camino': 'fecha_en_camino',
                    'entregado': 'fecha_entrega',
                    'cancelado': 'fecha_cancelacion'
                }[estado];
                
                let updateQuery = `
                    UPDATE orders 
                    SET estado = $1,
                        ${columnaFecha ? `${columnaFecha} = NOW(),` : ''}
                        ${repartidorId ? 'repartidor_id = $2,' : ''}
                        ${motivoCancelacion ? 'motivo_cancelacion = $3,' : ''}
                        updated_at = NOW()
                    WHERE id = $4
                    RETURNING *
                `;
                
                const params = [estado];
                let paramIndex = 2;
                
                if (repartidorId) {
                    params.push(repartidorId);
                    paramIndex++;
                }
                if (motivoCancelacion) {
                    params.push(motivoCancelacion);
                    paramIndex++;
                }
                params.push(id);
                
                // Limpiar comas extra
                updateQuery = updateQuery.replace(',\n                    WHERE', '\n                    WHERE');
                
                const result = await client.query(updateQuery, params);
                const pedidoActualizado = result.rows[0];
                
                // Insertar en historial
                await client.query(`
                    INSERT INTO order_status_history (order_id, estado_anterior, estado_nuevo, comentario)
                    VALUES ($1, $2, $3, $4)
                `, [id, estadoAnterior, estado, motivoCancelacion || `Estado cambiado a ${estado}`]);
                
                // Si se asignó repartidor, actualizar estadísticas
                if (estado === 'entregado' && repartidorId) {
                    await client.query(`
                        UPDATE delivery_persons 
                        SET total_entregas = total_entregas + 1,
                            monto_ganado = monto_ganado + $1
                        WHERE id = $2
                    `, [pedidoActualizado.comision_repartidor, repartidorId]);
                }
                
                // Actualizar estadísticas de comercio
                if (estado === 'entregado' && pedidoActualizado.comercio_id) {
                    await client.query(`
                        UPDATE shops 
                        SET pedidos_recibidos = pedidos_recibidos + 1,
                            ventas_total = ventas_total + $1
                        WHERE id = $2
                    `, [pedidoActualizado.monto, pedidoActualizado.comercio_id]);
                }
                
                await client.query('COMMIT');
                
                // Notificar por WebSocket
                io.emit('actualizarEstadoPedido', {
                    pedidoId: id,
                    estado,
                    clienteId: pedidoActualizado.cliente_id,
                    repartidorId: pedidoActualizado.repartidor_id,
                    comercioId: pedidoActualizado.comercio_id
                });
                
                res.json({ success: true, pedido: pedidoActualizado });
                
            } catch (error) {
                await client.query('ROLLBACK');
                console.error('Error actualizando estado:', error);
                res.status(500).json({ success: false, error: error.message });
            } finally {
                client.release();
            }
        }
    );

    /**
     * GET /api/pedidos/:id/tracking
     * Obtener tracking del pedido
     */
    router.get('/:id/tracking',
        validate(schemas.params.pedidoId, 'params'),
        async (req, res) => {
            try {
                const { id } = req.params;
                
                // Obtener pedido con ubicación del repartidor
                const [result] = await pool.query(`
                    SELECT 
                        o.id, o.estado, o.codigo_seguimiento,
                        o.fecha_creacion, o.fecha_aceptacion, o.fecha_en_camino, o.fecha_entrega,
                        o.ubicacion_entrega_lat, o.ubicacion_entrega_lng,
                        dp.ubicacion_actual_lat AS repartidor_lat,
                        dp.ubicacion_actual_lng AS repartidor_lng,
                        dp.ultima_actualizacion_gps,
                        CONCAT(r.nombre, ' ', COALESCE(r.apellido, '')) AS repartidor_nombre
                    FROM orders o
                    LEFT JOIN delivery_persons dp ON o.repartidor_id = dp.id
                    LEFT JOIN users r ON dp.id = r.id
                    WHERE o.id = ?
                `, [id]);
                
                if (result.length === 0) {
                    return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
                }
                
                // Obtener historial de estados
                const [historial] = await pool.query(`
                    SELECT * FROM order_status_history
                    WHERE order_id = ?
                    ORDER BY created_at ASC
                `, [id]);
                
                res.json({
                    success: true,
                    tracking: {
                        ...result[0],
                        historial: historial
                    }
                });
                
            } catch (error) {
                console.error('Error obteniendo tracking:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        }
    );

    return router;
};
