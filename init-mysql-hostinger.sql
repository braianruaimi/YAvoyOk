-- ====================================
-- YAVOY v3.1 ENTERPRISE - MYSQL HOSTINGER
-- ====================================
-- Base de datos: u695828542_yavoysql
-- Host: srv1722.hstgr.io (193.203.175.157)

-- Crear tablas del sistema YAvoy
-- ====================================

-- TABLA: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('cliente', 'comercio', 'repartidor', 'admin', 'ceo') NOT NULL DEFAULT 'cliente',
    estado ENUM('activo', 'inactivo', 'suspendido', 'verificando') NOT NULL DEFAULT 'activo',
    verificado BOOLEAN DEFAULT FALSE,
    biometric_id VARCHAR(255),
    foto_perfil TEXT,
    direccion TEXT,
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso TIMESTAMP NULL,
    intentos_fallidos INT DEFAULT 0,
    bloqueado_hasta TIMESTAMP NULL,
    metadata JSON,
    INDEX idx_email (email),
    INDEX idx_rol (rol),
    INDEX idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLA: pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_pedido VARCHAR(50) NOT NULL UNIQUE,
    cliente_id INT NOT NULL,
    comercio_id INT NOT NULL,
    repartidor_id INT NULL,
    estado ENUM('pendiente', 'aceptado', 'preparando', 'en_camino', 'entregado', 'cancelado') NOT NULL DEFAULT 'pendiente',
    tipo_entrega ENUM('delivery', 'retiro') NOT NULL DEFAULT 'delivery',
    direccion_entrega TEXT,
    latitud_entrega DECIMAL(10, 8),
    longitud_entrega DECIMAL(11, 8),
    telefono_contacto VARCHAR(20),
    notas_cliente TEXT,
    subtotal DECIMAL(10, 2) NOT NULL,
    comision_plataforma DECIMAL(10, 2) DEFAULT 0,
    comision_repartidor DECIMAL(10, 2) DEFAULT 0,
    costo_envio DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    metodo_pago ENUM('efectivo', 'mercadopago', 'astropay', 'tarjeta') NOT NULL,
    pago_completado BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_aceptacion TIMESTAMP NULL,
    fecha_preparacion TIMESTAMP NULL,
    fecha_en_camino TIMESTAMP NULL,
    fecha_entrega TIMESTAMP NULL,
    calificacion_cliente INT NULL CHECK (calificacion_cliente BETWEEN 1 AND 5),
    calificacion_repartidor INT NULL CHECK (calificacion_repartidor BETWEEN 1 AND 5),
    comentario_cliente TEXT,
    tiempo_preparacion INT NULL,
    tiempo_entrega INT NULL,
    distancia_km DECIMAL(6, 2) NULL,
    metadata JSON,
    FOREIGN KEY (cliente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (comercio_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (repartidor_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_numero_pedido (numero_pedido),
    INDEX idx_cliente (cliente_id),
    INDEX idx_comercio (comercio_id),
    INDEX idx_repartidor (repartidor_id),
    INDEX idx_estado (estado),
    INDEX idx_fecha (fecha_creacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLA: productos_pedido
CREATE TABLE IF NOT EXISTS productos_pedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    nombre_producto VARCHAR(255) NOT NULL,
    descripcion TEXT,
    cantidad INT NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    notas TEXT,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    INDEX idx_pedido (pedido_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLA: comercios
CREATE TABLE IF NOT EXISTS comercios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL UNIQUE,
    nombre_comercio VARCHAR(255) NOT NULL,
    descripcion TEXT,
    categoria ENUM('restaurante', 'supermercado', 'farmacia', 'tienda', 'otros') NOT NULL,
    logo TEXT,
    banner TEXT,
    direccion TEXT NOT NULL,
    latitud DECIMAL(10, 8) NOT NULL,
    longitud DECIMAL(11, 8) NOT NULL,
    telefono VARCHAR(20),
    email_comercio VARCHAR(255),
    horario_apertura TIME,
    horario_cierre TIME,
    dias_atencion VARCHAR(100) DEFAULT 'Lunes-Domingo',
    acepta_pedidos BOOLEAN DEFAULT TRUE,
    tiempo_preparacion_promedio INT DEFAULT 30,
    calificacion_promedio DECIMAL(3, 2) DEFAULT 0.00,
    total_pedidos INT DEFAULT 0,
    comision_porcentaje DECIMAL(5, 2) DEFAULT 20.00,
    verificado BOOLEAN DEFAULT FALSE,
    destacado BOOLEAN DEFAULT FALSE,
    metadata JSON,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_categoria (categoria),
    INDEX idx_verificado (verificado),
    INDEX idx_calificacion (calificacion_promedio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLA: repartidores
CREATE TABLE IF NOT EXISTS repartidores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL UNIQUE,
    vehiculo ENUM('bicicleta', 'moto', 'auto', 'pie') NOT NULL,
    placa_vehiculo VARCHAR(20),
    licencia_conducir VARCHAR(50),
    disponible BOOLEAN DEFAULT FALSE,
    en_servicio BOOLEAN DEFAULT FALSE,
    latitud_actual DECIMAL(10, 8),
    longitud_actual DECIMAL(11, 8),
    ultima_actualizacion_gps TIMESTAMP NULL,
    calificacion_promedio DECIMAL(3, 2) DEFAULT 0.00,
    total_entregas INT DEFAULT 0,
    total_ganado DECIMAL(10, 2) DEFAULT 0.00,
    radio_operacion_km DECIMAL(6, 2) DEFAULT 5.00,
    comision_porcentaje DECIMAL(5, 2) DEFAULT 80.00,
    verificado BOOLEAN DEFAULT FALSE,
    documentos_verificados BOOLEAN DEFAULT FALSE,
    metadata JSON,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_disponible (disponible),
    INDEX idx_verificado (verificado),
    INDEX idx_calificacion (calificacion_promedio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLA: transacciones
CREATE TABLE IF NOT EXISTS transacciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    usuario_id INT NOT NULL,
    tipo ENUM('pago', 'comision', 'ganancia', 'retiro', 'reembolso') NOT NULL,
    metodo ENUM('efectivo', 'mercadopago', 'astropay', 'transferencia') NOT NULL,
    monto DECIMAL(10, 2) NOT NULL,
    estado ENUM('pendiente', 'completado', 'fallido', 'reembolsado') NOT NULL DEFAULT 'pendiente',
    referencia_externa VARCHAR(255),
    descripcion TEXT,
    fecha_transaccion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSON,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_pedido (pedido_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_estado (estado),
    INDEX idx_fecha (fecha_transaccion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLA: notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    tipo ENUM('pedido', 'pago', 'sistema', 'promocion', 'chat') NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    leida BOOLEAN DEFAULT FALSE,
    url_accion VARCHAR(500),
    metadata JSON,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario (usuario_id),
    INDEX idx_leida (leida),
    INDEX idx_fecha (fecha_creacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLA: mensajes_chat
CREATE TABLE IF NOT EXISTS mensajes_chat (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    remitente_id INT NOT NULL,
    destinatario_id INT NOT NULL,
    mensaje TEXT NOT NULL,
    tipo ENUM('texto', 'ubicacion', 'imagen', 'sistema') NOT NULL DEFAULT 'texto',
    leido BOOLEAN DEFAULT FALSE,
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (remitente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (destinatario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_pedido (pedido_id),
    INDEX idx_remitente (remitente_id),
    INDEX idx_destinatario (destinatario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLA: auditorias
CREATE TABLE IF NOT EXISTS auditorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    accion VARCHAR(100) NOT NULL,
    tabla_afectada VARCHAR(100),
    registro_id INT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    datos_anteriores JSON,
    datos_nuevos JSON,
    fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_usuario (usuario_id),
    INDEX idx_accion (accion),
    INDEX idx_fecha (fecha_accion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- INSERTAR DATOS DE PRUEBA
-- ====================================

-- Usuario CEO
INSERT INTO usuarios (nombre, apellido, email, telefono, password_hash, rol, verificado) VALUES
('Admin', 'CEO', 'admin@yavoy.space', '+54911111111', '$2a$10$xN8VvxQz7qYvE.5KLh8g4OXmYfZ8VQZtLpRbKdJhPGqKvH3zJ6YmK', 'ceo', TRUE);

-- Clientes de prueba
INSERT INTO usuarios (nombre, apellido, email, telefono, password_hash, rol, verificado) VALUES
('Juan', 'Pérez', 'cliente001@test.com', '+54911222222', '$2a$10$xN8VvxQz7qYvE.5KLh8g4OXmYfZ8VQZtLpRbKdJhPGqKvH3zJ6YmK', 'cliente', TRUE),
('María', 'González', 'cliente002@test.com', '+54911333333', '$2a$10$xN8VvxQz7qYvE.5KLh8g4OXmYfZ8VQZtLpRbKdJhPGqKvH3zJ6YmK', 'cliente', TRUE);

-- Comercios de prueba
INSERT INTO usuarios (nombre, apellido, email, telefono, password_hash, rol, verificado) VALUES
('Pizzería', 'Don José', 'comercio001@test.com', '+54911444444', '$2a$10$xN8VvxQz7qYvE.5KLh8g4OXmYfZ8VQZtLpRbKdJhPGqKvH3zJ6YmK', 'comercio', TRUE),
('Supermercado', 'El Ahorro', 'comercio002@test.com', '+54911555555', '$2a$10$xN8VvxQz7qYvE.5KLh8g4OXmYfZ8VQZtLpRbKdJhPGqKvH3zJ6YmK', 'comercio', TRUE);

-- Repartidores de prueba
INSERT INTO usuarios (nombre, apellido, email, telefono, password_hash, rol, verificado) VALUES
('Carlos', 'Rodríguez', 'repartidor001@test.com', '+54911666666', '$2a$10$xN8VvxQz7qYvE.5KLh8g4OXmYfZ8VQZtLpRbKdJhPGqKvH3zJ6YmK', 'repartidor', TRUE),
('Ana', 'Martínez', 'repartidor002@test.com', '+54911777777', '$2a$10$xN8VvxQz7qYvE.5KLh8g4OXmYfZ8VQZtLpRbKdJhPGqKvH3zJ6YmK', 'repartidor', TRUE);

-- Comercios (detalles)
INSERT INTO comercios (usuario_id, nombre_comercio, descripcion, categoria, direccion, latitud, longitud, telefono, horario_apertura, horario_cierre, acepta_pedidos, verificado) VALUES
(4, 'Pizzería Don José', 'Las mejores pizzas artesanales de la ciudad', 'restaurante', 'Av. Corrientes 1234, CABA', -34.603722, -58.381592, '+54911444444', '18:00:00', '23:30:00', TRUE, TRUE),
(5, 'Supermercado El Ahorro', 'Todo lo que necesitas para tu hogar', 'supermercado', 'Av. Santa Fe 5678, CABA', -34.597400, -58.393600, '+54911555555', '08:00:00', '22:00:00', TRUE, TRUE);

-- Repartidores (detalles)
INSERT INTO repartidores (usuario_id, vehiculo, disponible, verificado, documentos_verificados) VALUES
(6, 'moto', TRUE, TRUE, TRUE),
(7, 'bicicleta', TRUE, TRUE, TRUE);

-- ====================================
-- COMPLETADO
-- ====================================
-- Total de tablas: 9
-- Usuarios de prueba: 7 (1 CEO, 2 clientes, 2 comercios, 2 repartidores)
-- Contraseña por defecto para todos: cliente123 / comercio123 / repartidor123 / admin123
