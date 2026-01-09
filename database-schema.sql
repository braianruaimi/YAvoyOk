-- ===========================================
-- YAvoy v3.1 - Esquema PostgreSQL
-- ===========================================
-- Fecha: 21 de diciembre de 2025
-- Descripción: Schema completo para migración desde JSON

-- Eliminar tablas existentes (en orden inverso por FK)
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS order_status_history CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS shops CASCADE;
DROP TABLE IF EXISTS delivery_persons CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS system_logs CASCADE;

-- ===========================================
-- TABLA: users (Clientes + Base común)
-- ===========================================
CREATE TABLE users (
    id VARCHAR(100) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100),
    whatsapp VARCHAR(20) NOT NULL,
    tipo VARCHAR(20) DEFAULT 'cliente' CHECK (tipo IN ('cliente', 'repartidor', 'comercio', 'admin')),
    
    -- Dirección
    direccion_calle VARCHAR(255),
    direccion_barrio VARCHAR(100),
    direccion_ciudad VARCHAR(100),
    direccion_provincia VARCHAR(100),
    direccion_codigo_postal VARCHAR(10),
    direccion_latitud DECIMAL(10, 7),
    direccion_longitud DECIMAL(10, 7),
    direccion_referencia TEXT,
    
    -- Ciudad operativa (crítico para WebSocket rooms)
    ciudad VARCHAR(100) NOT NULL DEFAULT 'Córdoba',
    
    -- Estado y seguridad
    activo BOOLEAN DEFAULT true,
    verificado BOOLEAN DEFAULT false,
    fecha_registro TIMESTAMP DEFAULT NOW(),
    ultima_conexion TIMESTAMP,
    
    -- Perfil
    foto_perfil TEXT,
    metodo_pago_preferido VARCHAR(50),
    notificaciones_push BOOLEAN DEFAULT true,
    
    -- Estadísticas cliente
    total_pedidos INTEGER DEFAULT 0,
    gasto_total DECIMAL(12, 2) DEFAULT 0.00,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tipo ON users(tipo);
CREATE INDEX idx_users_activo ON users(activo);
CREATE INDEX idx_users_whatsapp ON users(whatsapp);
CREATE INDEX idx_users_ciudad ON users(ciudad);

-- ===========================================
-- TABLA: delivery_persons (Repartidores)
-- ===========================================
CREATE TABLE delivery_persons (
    id VARCHAR(100) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    
    -- Vehículo
    tipo_vehiculo VARCHAR(50),
    modelo_vehiculo VARCHAR(100),
    patente VARCHAR(20),
    
    -- Operación
    zona_operacion VARCHAR(255),
    disponible BOOLEAN DEFAULT true,
    premium BOOLEAN DEFAULT false,
    
    -- Estadísticas
    rating DECIMAL(3, 2) DEFAULT 0.00,
    total_entregas INTEGER DEFAULT 0,
    monto_ganado DECIMAL(12, 2) DEFAULT 0.00,
    
    -- Documentos
    doc_dni VARCHAR(20) DEFAULT 'pendiente',
    doc_licencia VARCHAR(20) DEFAULT 'pendiente',
    doc_seguro VARCHAR(20) DEFAULT 'pendiente',
    doc_vtv VARCHAR(20) DEFAULT 'pendiente',
    
    -- Horarios (JSON)
    horarios_preferido VARCHAR(50),
    horarios_disponibilidad JSONB,
    
    -- Ubicación en tiempo real
    ubicacion_actual_lat DECIMAL(10, 7),
    ubicacion_actual_lng DECIMAL(10, 7),
    ultima_actualizacion_gps TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_delivery_disponible ON delivery_persons(disponible);
CREATE INDEX idx_delivery_premium ON delivery_persons(premium);
CREATE INDEX idx_delivery_rating ON delivery_persons(rating DESC);
CREATE INDEX idx_delivery_ubicacion ON delivery_persons USING GIST (
    point(ubicacion_actual_lng, ubicacion_actual_lat)
);

-- ===========================================
-- TABLA: shops (Comercios)
-- ===========================================
CREATE TABLE shops (
    id VARCHAR(100) PRIMARY KEY,
    
    -- Datos básicos
    nombre_comercio VARCHAR(255) NOT NULL,
    nombre_propietario VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    
    -- Dirección
    direccion_calle VARCHAR(255),
    direccion_barrio VARCHAR(100),
    direccion_ciudad VARCHAR(100),
    direccion_provincia VARCHAR(100),
    direccion_codigo_postal VARCHAR(10),
    direccion_latitud DECIMAL(10, 7),
    direccion_longitud DECIMAL(10, 7),
    
    -- Horarios (JSON)
    horarios JSONB,
    
    -- Estado
    activo BOOLEAN DEFAULT true,
    verificado BOOLEAN DEFAULT false,
    premium BOOLEAN DEFAULT false,
    
    -- Estadísticas
    pedidos_recibidos INTEGER DEFAULT 0,
    ventas_total DECIMAL(12, 2) DEFAULT 0.00,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    
    -- Multimedia
    logo TEXT,
    banner TEXT,
    fotos_galeria JSONB,
    
    -- SEO
    descripcion TEXT,
    tags JSONB,
    
    -- Timestamps
    fecha_registro TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_shops_email ON shops(email);
CREATE INDEX idx_shops_categoria ON shops(categoria);
CREATE INDEX idx_shops_activo ON shops(activo);
CREATE INDEX idx_shops_premium ON shops(premium);
CREATE INDEX idx_shops_rating ON shops(rating DESC);
CREATE INDEX idx_shops_ubicacion ON shops USING GIST (
    point(direccion_longitud, direccion_latitud)
);

-- ===========================================
-- TABLA: orders (Pedidos)
-- ===========================================
CREATE TABLE orders (
    id VARCHAR(100) PRIMARY KEY,
    
    -- Relaciones
    cliente_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
    comercio_id VARCHAR(100) REFERENCES shops(id) ON DELETE SET NULL,
    repartidor_id VARCHAR(100) REFERENCES delivery_persons(id) ON DELETE SET NULL,
    
    -- Datos del pedido
    nombre_cliente VARCHAR(255) NOT NULL,
    telefono_cliente VARCHAR(20) NOT NULL,
    direccion_entrega TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    
    -- Destinatario (puede ser diferente al cliente)
    destinatario VARCHAR(255),
    telefono_destinatario VARCHAR(20),
    notas TEXT,
    
    -- Montos
    monto DECIMAL(12, 2) NOT NULL,
    comision_ceo DECIMAL(12, 2) DEFAULT 0.00,
    comision_repartidor DECIMAL(12, 2) DEFAULT 0.00,
    propina DECIMAL(12, 2) DEFAULT 0.00,
    
    -- Estado
    estado VARCHAR(50) DEFAULT 'pendiente' CHECK (
        estado IN ('pendiente', 'aceptado', 'preparando', 'en_camino', 
                   'entregado', 'cancelado', 'rechazado')
    ),
    
    -- Tiempos
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    fecha_aceptacion TIMESTAMP,
    fecha_preparacion TIMESTAMP,
    fecha_en_camino TIMESTAMP,
    fecha_entrega TIMESTAMP,
    fecha_cancelacion TIMESTAMP,
    
    -- Tracking
    ubicacion_entrega_lat DECIMAL(10, 7),
    ubicacion_entrega_lng DECIMAL(10, 7),
    distancia_km DECIMAL(8, 2),
    tiempo_estimado_min INTEGER,
    
    -- Metadata
    metodo_pago VARCHAR(50),
    codigo_seguimiento VARCHAR(100) UNIQUE,
    motivo_cancelacion TEXT,
    
    -- Timestamps JSON originales
    timestamp TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_orders_cliente ON orders(cliente_id);
CREATE INDEX idx_orders_comercio ON orders(comercio_id);
CREATE INDEX idx_orders_repartidor ON orders(repartidor_id);
CREATE INDEX idx_orders_estado ON orders(estado);
CREATE INDEX idx_orders_fecha_creacion ON orders(fecha_creacion DESC);
CREATE INDEX idx_orders_codigo ON orders(codigo_seguimiento);

-- ===========================================
-- TABLA: order_status_history (Historial de estados)
-- ===========================================
CREATE TABLE order_status_history (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(100) REFERENCES orders(id) ON DELETE CASCADE,
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50) NOT NULL,
    comentario TEXT,
    usuario_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_status_order ON order_status_history(order_id);
CREATE INDEX idx_status_fecha ON order_status_history(created_at DESC);

-- ===========================================
-- TABLA: reviews (Calificaciones)
-- ===========================================
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    
    -- Relaciones
    order_id VARCHAR(100) UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    cliente_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
    repartidor_id VARCHAR(100) REFERENCES delivery_persons(id) ON DELETE SET NULL,
    comercio_id VARCHAR(100) REFERENCES shops(id) ON DELETE SET NULL,
    
    -- Calificaciones (1-5)
    rating_repartidor INTEGER CHECK (rating_repartidor BETWEEN 1 AND 5),
    rating_comercio INTEGER CHECK (rating_comercio BETWEEN 1 AND 5),
    rating_general INTEGER CHECK (rating_general BETWEEN 1 AND 5),
    
    -- Comentarios
    comentario_repartidor TEXT,
    comentario_comercio TEXT,
    comentario_general TEXT,
    
    -- Metadata
    tiempo_entrega_real_min INTEGER,
    satisfaccion_general VARCHAR(50),
    recomendaria BOOLEAN,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reviews_order ON reviews(order_id);
CREATE INDEX idx_reviews_repartidor ON reviews(repartidor_id);
CREATE INDEX idx_reviews_comercio ON reviews(comercio_id);
CREATE INDEX idx_reviews_rating ON reviews(rating_general DESC);

-- ===========================================
-- TABLA: chat_messages (Mensajes de chat)
-- ===========================================
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    
    -- Relaciones
    order_id VARCHAR(100) REFERENCES orders(id) ON DELETE CASCADE,
    user_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Mensaje
    mensaje TEXT NOT NULL,
    tipo_usuario VARCHAR(20) CHECK (tipo_usuario IN ('cliente', 'repartidor', 'comercio', 'sistema')),
    nombre_usuario VARCHAR(255),
    
    -- Metadata
    leido BOOLEAN DEFAULT false,
    tipo_mensaje VARCHAR(50) DEFAULT 'texto',
    archivo_adjunto TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chat_order ON chat_messages(order_id);
CREATE INDEX idx_chat_user ON chat_messages(user_id);
CREATE INDEX idx_chat_fecha ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_leido ON chat_messages(leido);

-- ===========================================
-- TABLA: system_logs (Logs de auditoría)
-- ===========================================
CREATE TABLE system_logs (
    id SERIAL PRIMARY KEY,
    
    -- Datos del evento
    evento VARCHAR(100) NOT NULL,
    descripcion TEXT,
    nivel VARCHAR(20) DEFAULT 'info' CHECK (nivel IN ('debug', 'info', 'warning', 'error', 'critical')),
    
    -- Contexto
    user_id VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    endpoint VARCHAR(255),
    metodo VARCHAR(10),
    
    -- Metadata (JSON)
    datos JSONB,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_logs_evento ON system_logs(evento);
CREATE INDEX idx_logs_nivel ON system_logs(nivel);
CREATE INDEX idx_logs_user ON system_logs(user_id);
CREATE INDEX idx_logs_fecha ON system_logs(created_at DESC);

-- ===========================================
-- VISTAS ÚTILES
-- ===========================================

-- Vista: Pedidos con toda la información relacionada
CREATE VIEW v_orders_full AS
SELECT 
    o.id,
    o.descripcion,
    o.monto,
    o.estado,
    o.fecha_creacion,
    
    -- Cliente
    u.nombre || ' ' || COALESCE(u.apellido, '') AS cliente_nombre,
    u.whatsapp AS cliente_whatsapp,
    o.direccion_entrega,
    
    -- Comercio
    s.nombre_comercio,
    s.categoria AS comercio_categoria,
    s.telefono AS comercio_telefono,
    
    -- Repartidor
    ur.nombre || ' ' || COALESCE(ur.apellido, '') AS repartidor_nombre,
    ur.whatsapp AS repartidor_whatsapp,
    dp.tipo_vehiculo,
    dp.rating AS repartidor_rating,
    
    -- Calificación
    r.rating_general,
    r.comentario_general
    
FROM orders o
LEFT JOIN users u ON o.cliente_id = u.id
LEFT JOIN shops s ON o.comercio_id = s.id
LEFT JOIN delivery_persons dp ON o.repartidor_id = dp.id
LEFT JOIN users ur ON dp.id = ur.id
LEFT JOIN reviews r ON o.id = r.order_id;

-- Vista: Estadísticas por repartidor
CREATE VIEW v_delivery_stats AS
SELECT 
    dp.id,
    u.nombre || ' ' || COALESCE(u.apellido, '') AS nombre_completo,
    dp.rating,
    dp.total_entregas,
    dp.monto_ganado,
    dp.disponible,
    COUNT(o.id) AS pedidos_actuales,
    AVG(r.rating_repartidor) AS rating_promedio_reviews
FROM delivery_persons dp
JOIN users u ON dp.id = u.id
LEFT JOIN orders o ON o.repartidor_id = dp.id AND o.estado IN ('aceptado', 'en_camino')
LEFT JOIN reviews r ON r.repartidor_id = dp.id
GROUP BY dp.id, u.nombre, u.apellido, dp.rating, dp.total_entregas, dp.monto_ganado, dp.disponible;

-- Vista: Estadísticas por comercio
CREATE VIEW v_shop_stats AS
SELECT 
    s.id,
    s.nombre_comercio,
    s.categoria,
    s.pedidos_recibidos,
    s.ventas_total,
    s.rating,
    COUNT(CASE WHEN o.estado = 'pendiente' THEN 1 END) AS pedidos_pendientes,
    COUNT(CASE WHEN o.estado = 'entregado' THEN 1 END) AS pedidos_completados,
    AVG(r.rating_comercio) AS rating_promedio_reviews
FROM shops s
LEFT JOIN orders o ON o.comercio_id = s.id
LEFT JOIN reviews r ON r.comercio_id = s.id
GROUP BY s.id, s.nombre_comercio, s.categoria, s.pedidos_recibidos, s.ventas_total, s.rating;

-- ===========================================
-- FUNCIONES ÚTILES
-- ===========================================

-- Función: Actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER trigger_users_updated
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_delivery_updated
    BEFORE UPDATE ON delivery_persons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_shops_updated
    BEFORE UPDATE ON shops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_orders_updated
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Función: Calcular distancia Manhattan (km)
CREATE OR REPLACE FUNCTION calcular_distancia_manhattan(
    lat1 DECIMAL, lng1 DECIMAL,
    lat2 DECIMAL, lng2 DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
    RETURN ABS(lat1 - lat2) * 111 + ABS(lng1 - lng2) * 111 * COS(RADIANS((lat1 + lat2) / 2));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función: Encontrar repartidor más cercano
CREATE OR REPLACE FUNCTION encontrar_repartidor_cercano(
    p_lat DECIMAL,
    p_lng DECIMAL,
    p_radio_km INTEGER DEFAULT 10
) RETURNS TABLE(
    repartidor_id VARCHAR,
    nombre VARCHAR,
    distancia_km DECIMAL,
    rating DECIMAL,
    total_entregas INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dp.id,
        u.nombre || ' ' || COALESCE(u.apellido, '') AS nombre,
        calcular_distancia_manhattan(p_lat, p_lng, dp.ubicacion_actual_lat, dp.ubicacion_actual_lng) AS distancia,
        dp.rating,
        dp.total_entregas
    FROM delivery_persons dp
    JOIN users u ON dp.id = u.id
    WHERE dp.disponible = true
      AND dp.ubicacion_actual_lat IS NOT NULL
      AND dp.ubicacion_actual_lng IS NOT NULL
      AND calcular_distancia_manhattan(p_lat, p_lng, dp.ubicacion_actual_lat, dp.ubicacion_actual_lng) <= p_radio_km
    ORDER BY distancia ASC, dp.rating DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- PERMISOS Y ROLES (Opcional)
-- ===========================================

-- Crear rol de solo lectura para analíticas
-- CREATE ROLE yavoy_analytics WITH LOGIN PASSWORD 'tu_password_seguro';
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO yavoy_analytics;
-- GRANT SELECT ON v_orders_full, v_delivery_stats, v_shop_stats TO yavoy_analytics;

-- ===========================================
-- COMENTARIOS EN TABLAS
-- ===========================================
COMMENT ON TABLE users IS 'Tabla principal de usuarios (clientes, repartidores, comercios, admin)';
COMMENT ON TABLE delivery_persons IS 'Información extendida de repartidores';
COMMENT ON TABLE shops IS 'Comercios registrados en la plataforma';
COMMENT ON TABLE orders IS 'Pedidos realizados';
COMMENT ON TABLE reviews IS 'Calificaciones y reseñas';
COMMENT ON TABLE chat_messages IS 'Mensajes de chat por pedido';
COMMENT ON TABLE system_logs IS 'Logs de auditoría del sistema';

-- ===========================================
-- TABLAS FALTANTES (Features v3.0_socio)
-- ===========================================

-- TABLA: products (Inventario de comercios)
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    shop_id VARCHAR(100) NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(100),
    precio DECIMAL(10,2) NOT NULL,
    stock INTEGER DEFAULT 0,
    stock_minimo INTEGER DEFAULT 5,
    imagen_url TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_products_shop ON products(shop_id);
CREATE INDEX idx_products_categoria ON products(categoria);
CREATE INDEX idx_products_activo ON products(activo);

-- TABLA: referral_codes (Códigos de referidos)
CREATE TABLE referral_codes (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    activo BOOLEAN DEFAULT true,
    usos INTEGER DEFAULT 0,
    usos_maximos INTEGER DEFAULT 50,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_referral_codes_user ON referral_codes(user_id);
CREATE INDEX idx_referral_codes_codigo ON referral_codes(codigo);

-- TABLA: referrals (Registro de referidos)
CREATE TABLE referrals (
    id SERIAL PRIMARY KEY,
    referrer_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_name VARCHAR(255),
    codigo VARCHAR(20) NOT NULL,
    credito_otorgado DECIMAL(10,2) DEFAULT 50.00,
    estado VARCHAR(50) DEFAULT 'pendiente',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred ON referrals(referred_id);

-- TABLA: rewards (Sistema de recompensas)
CREATE TABLE rewards (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    valor DECIMAL(10,2),
    canjeado BOOLEAN DEFAULT false,
    fecha_obtencion TIMESTAMP DEFAULT NOW(),
    fecha_caducidad TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rewards_user ON rewards(user_id);
CREATE INDEX idx_rewards_canjeado ON rewards(canjeado);

-- TABLA: tips (Propinas a repartidores)
CREATE TABLE tips (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(100) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    repartidor_id VARCHAR(100) NOT NULL REFERENCES delivery_persons(id) ON DELETE CASCADE,
    monto DECIMAL(10,2) NOT NULL,
    tipo VARCHAR(50) DEFAULT 'efectivo',
    metodo_pago VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tips_order ON tips(order_id);
CREATE INDEX idx_tips_repartidor ON tips(repartidor_id);

-- Triggers para updated_at en nuevas tablas
CREATE TRIGGER trigger_products_updated
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_rewards_updated
    BEFORE UPDATE ON rewards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- TABLA: pedidos_grupales (Pedidos colaborativos)
CREATE TABLE pedidos_grupales (
    id SERIAL PRIMARY KEY,
    anfitrion_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    codigo_grupo VARCHAR(10) UNIQUE NOT NULL,
    nombre_grupo VARCHAR(255),
    descripcion TEXT,
    estado VARCHAR(20) DEFAULT 'abierto' CHECK (estado IN ('abierto', 'cerrado', 'procesado', 'cancelado')),
    comercio_id VARCHAR(100) REFERENCES shops(id) ON DELETE SET NULL,
    participantes_json JSONB DEFAULT '[]'::jsonb,
    items_json JSONB DEFAULT '[]'::jsonb,
    total_acumulado DECIMAL(10,2) DEFAULT 0.00,
    fecha_limite TIMESTAMP,
    fecha_cierre TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pedidos_grupales_anfitrion ON pedidos_grupales(anfitrion_id);
CREATE INDEX idx_pedidos_grupales_codigo ON pedidos_grupales(codigo_grupo);
CREATE INDEX idx_pedidos_grupales_estado ON pedidos_grupales(estado);
CREATE INDEX idx_pedidos_grupales_comercio ON pedidos_grupales(comercio_id);

-- Trigger para updated_at
CREATE TRIGGER trigger_pedidos_grupales_updated
    BEFORE UPDATE ON pedidos_grupales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE products IS 'Inventario de productos por comercio';
COMMENT ON TABLE referral_codes IS 'Códigos de referidos generados por usuarios';
COMMENT ON TABLE referrals IS 'Registro de referidos completados';
COMMENT ON TABLE rewards IS 'Sistema de recompensas y logros';
COMMENT ON TABLE tips IS 'Propinas otorgadas a repartidores';
COMMENT ON TABLE pedidos_grupales IS 'Pedidos colaborativos con múltiples participantes';
