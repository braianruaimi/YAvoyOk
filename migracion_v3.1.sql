-- ============================================
-- YAVOY v3.1 - SCRIPT DE MIGRACIÓN POSTGRESQL
-- Actualización de esquema para sistema multilateral
-- ============================================

-- 1. AGREGAR CAMPO ROLE A USUARIOS (si no existe)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'usuarios' AND column_name = 'role'
    ) THEN
        ALTER TABLE usuarios ADD COLUMN role VARCHAR(20) DEFAULT 'cliente';
        RAISE NOTICE 'Campo role agregado a tabla usuarios';
    ELSE
        RAISE NOTICE 'Campo role ya existe en tabla usuarios';
    END IF;
END $$;

-- 2. AGREGAR CAMPO ESTADO A USUARIOS (si no existe)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'usuarios' AND column_name = 'estado'
    ) THEN
        ALTER TABLE usuarios ADD COLUMN estado VARCHAR(20) DEFAULT 'activo';
        RAISE NOTICE 'Campo estado agregado a tabla usuarios';
    ELSE
        RAISE NOTICE 'Campo estado ya existe en tabla usuarios';
    END IF;
END $$;

-- 3. ACTUALIZAR ROLES EXISTENTES (basado en tipo_usuario o tabla separada)
UPDATE usuarios 
SET role = CASE 
    WHEN tipo = 'cliente' THEN 'cliente'
    WHEN tipo = 'repartidor' THEN 'repartidor'
    WHEN tipo = 'comercio' THEN 'comercio'
    WHEN es_admin = true THEN 'ceo'
    ELSE 'cliente'
END
WHERE role IS NULL OR role = 'cliente';

-- 4. CREAR ÍNDICES PARA OPTIMIZACIÓN
CREATE INDEX IF NOT EXISTS idx_usuarios_role ON usuarios(role);
CREATE INDEX IF NOT EXISTS idx_usuarios_estado ON usuarios(estado);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- 5. AGREGAR CONSTRAINT DE ROLES VÁLIDOS
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'usuarios_role_check'
    ) THEN
        ALTER TABLE usuarios 
        ADD CONSTRAINT usuarios_role_check 
        CHECK (role IN ('cliente', 'repartidor', 'comercio', 'ceo', 'admin'));
        RAISE NOTICE 'Constraint de roles agregado';
    ELSE
        RAISE NOTICE 'Constraint de roles ya existe';
    END IF;
END $$;

-- 6. AGREGAR CONSTRAINT DE ESTADOS VÁLIDOS
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'usuarios_estado_check'
    ) THEN
        ALTER TABLE usuarios 
        ADD CONSTRAINT usuarios_estado_check 
        CHECK (estado IN ('activo', 'inactivo', 'suspendido'));
        RAISE NOTICE 'Constraint de estados agregado';
    ELSE
        RAISE NOTICE 'Constraint de estados ya existe';
    END IF;
END $$;

-- 7. CREAR TABLA DE AUDITORÍA (opcional pero recomendado)
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES usuarios(id),
    role VARCHAR(20),
    action VARCHAR(100),
    method VARCHAR(10),
    path VARCHAR(255),
    ip VARCHAR(45),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details JSONB
);

CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);

-- 8. CREAR TABLA DE BILLETERA PARA REPARTIDORES
CREATE TABLE IF NOT EXISTS repartidor_billetera (
    id SERIAL PRIMARY KEY,
    repartidor_id INTEGER REFERENCES usuarios(id) UNIQUE,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    pedidos_completados INTEGER DEFAULT 0,
    ganancia_total DECIMAL(10, 2) DEFAULT 0.00,
    calificacion_promedio DECIMAL(3, 2) DEFAULT 5.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. CREAR TABLA DE ESTADÍSTICAS DE COMERCIO
CREATE TABLE IF NOT EXISTS comercio_stats (
    id SERIAL PRIMARY KEY,
    comercio_id INTEGER REFERENCES usuarios(id) UNIQUE,
    pedidos_total INTEGER DEFAULT 0,
    pedidos_hoy INTEGER DEFAULT 0,
    ventas_total DECIMAL(10, 2) DEFAULT 0.00,
    ventas_hoy DECIMAL(10, 2) DEFAULT 0.00,
    calificacion_promedio DECIMAL(3, 2) DEFAULT 5.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. CREAR VISTA DE MÉTRICAS PARA CEO
CREATE OR REPLACE VIEW admin_metricas AS
SELECT 
    (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURRENT_DATE) as pedidos_hoy,
    (SELECT SUM(total) FROM orders WHERE DATE(created_at) = CURRENT_DATE) as facturacion_hoy,
    (SELECT COUNT(*) FROM usuarios WHERE estado = 'activo') as usuarios_activos,
    (SELECT COUNT(*) FROM usuarios WHERE role = 'repartidor' AND estado = 'activo') as repartidores_activos,
    (SELECT COUNT(*) FROM usuarios WHERE role = 'comercio' AND estado = 'activo') as comercios_activos,
    (SELECT AVG(calificacion) FROM orders WHERE calificacion IS NOT NULL) as satisfaccion_promedio;

-- 11. FUNCIÓN PARA ACTUALIZAR BILLETERA DE REPARTIDOR
CREATE OR REPLACE FUNCTION actualizar_billetera_repartidor()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado = 'completado' AND NEW.repartidor_id IS NOT NULL THEN
        INSERT INTO repartidor_billetera (repartidor_id, balance, pedidos_completados, ganancia_total)
        VALUES (NEW.repartidor_id, NEW.comision_repartidor, 1, NEW.comision_repartidor)
        ON CONFLICT (repartidor_id) 
        DO UPDATE SET 
            balance = repartidor_billetera.balance + NEW.comision_repartidor,
            pedidos_completados = repartidor_billetera.pedidos_completados + 1,
            ganancia_total = repartidor_billetera.ganancia_total + NEW.comision_repartidor,
            updated_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. CREAR TRIGGER PARA ACTUALIZAR BILLETERA
DROP TRIGGER IF EXISTS trigger_actualizar_billetera ON orders;
CREATE TRIGGER trigger_actualizar_billetera
    AFTER UPDATE ON orders
    FOR EACH ROW
    WHEN (NEW.estado = 'completado')
    EXECUTE FUNCTION actualizar_billetera_repartidor();

-- 13. FUNCIÓN PARA ACTUALIZAR STATS DE COMERCIO
CREATE OR REPLACE FUNCTION actualizar_stats_comercio()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado IN ('completado', 'pagado') THEN
        INSERT INTO comercio_stats (comercio_id, pedidos_total, ventas_total)
        VALUES (NEW.comercio_id, 1, NEW.total)
        ON CONFLICT (comercio_id) 
        DO UPDATE SET 
            pedidos_total = comercio_stats.pedidos_total + 1,
            ventas_total = comercio_stats.ventas_total + NEW.total,
            updated_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 14. CREAR TRIGGER PARA STATS DE COMERCIO
DROP TRIGGER IF EXISTS trigger_actualizar_stats_comercio ON orders;
CREATE TRIGGER trigger_actualizar_stats_comercio
    AFTER INSERT OR UPDATE ON orders
    FOR EACH ROW
    WHEN (NEW.estado IN ('completado', 'pagado'))
    EXECUTE FUNCTION actualizar_stats_comercio();

-- 15. CREAR USUARIO ADMIN POR DEFECTO (si no existe)
INSERT INTO usuarios (nombre, email, password, role, estado, created_at)
SELECT 
    'Administrador',
    'admin@yavoy.com',
    '$2b$10$YourHashedPasswordHere', -- Reemplazar con hash real
    'ceo',
    'activo',
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM usuarios WHERE email = 'admin@yavoy.com'
);

-- 16. LIMPIAR DATOS INCONSISTENTES
UPDATE usuarios SET estado = 'activo' WHERE estado IS NULL;
UPDATE usuarios SET role = 'cliente' WHERE role IS NULL;

-- 17. RESETEAR CONTADORES DIARIOS (ejecutar diariamente con CRON)
CREATE OR REPLACE FUNCTION reset_daily_stats()
RETURNS void AS $$
BEGIN
    UPDATE comercio_stats SET 
        pedidos_hoy = 0,
        ventas_hoy = 0;
    
    RAISE NOTICE 'Estadísticas diarias reseteadas';
END;
$$ LANGUAGE plpgsql;

-- 18. CREAR FUNCIÓN DE BACKUP SIMPLIFICADA
CREATE OR REPLACE FUNCTION create_backup_info()
RETURNS TABLE(
    total_usuarios INTEGER,
    total_pedidos INTEGER,
    total_comercios INTEGER,
    total_repartidores INTEGER,
    facturacion_total DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM usuarios),
        (SELECT COUNT(*)::INTEGER FROM orders),
        (SELECT COUNT(*)::INTEGER FROM usuarios WHERE role = 'comercio'),
        (SELECT COUNT(*)::INTEGER FROM usuarios WHERE role = 'repartidor'),
        (SELECT COALESCE(SUM(total), 0) FROM orders WHERE estado = 'completado');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VERIFICACIÓN DE MIGRACIÓN
-- ============================================

DO $$
DECLARE
    v_role_exists BOOLEAN;
    v_estado_exists BOOLEAN;
    v_audit_exists BOOLEAN;
BEGIN
    -- Verificar campo role
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'usuarios' AND column_name = 'role'
    ) INTO v_role_exists;
    
    -- Verificar campo estado
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'usuarios' AND column_name = 'estado'
    ) INTO v_estado_exists;
    
    -- Verificar tabla audit_log
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'audit_log'
    ) INTO v_audit_exists;
    
    -- Reporte
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VERIFICACIÓN DE MIGRACIÓN YAVOY v3.1';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Campo role en usuarios: %', CASE WHEN v_role_exists THEN '✅ OK' ELSE '❌ FALTA' END;
    RAISE NOTICE 'Campo estado en usuarios: %', CASE WHEN v_estado_exists THEN '✅ OK' ELSE '❌ FALTA' END;
    RAISE NOTICE 'Tabla audit_log: %', CASE WHEN v_audit_exists THEN '✅ OK' ELSE '❌ FALTA' END;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total usuarios: %', (SELECT COUNT(*) FROM usuarios);
    RAISE NOTICE 'Usuarios CEO: %', (SELECT COUNT(*) FROM usuarios WHERE role = 'ceo');
    RAISE NOTICE 'Usuarios Comercio: %', (SELECT COUNT(*) FROM usuarios WHERE role = 'comercio');
    RAISE NOTICE 'Usuarios Repartidor: %', (SELECT COUNT(*) FROM usuarios WHERE role = 'repartidor');
    RAISE NOTICE 'Usuarios Cliente: %', (SELECT COUNT(*) FROM usuarios WHERE role = 'cliente');
    RAISE NOTICE '========================================';
END $$;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
-- Ejecutar con: psql -U postgres -d yavoy_production -f migracion_v3.1.sql
-- ============================================
