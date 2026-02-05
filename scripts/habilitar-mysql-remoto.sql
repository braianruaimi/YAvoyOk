-- ============================================
-- SCRIPT PARA HABILITAR ACCESO REMOTO A MYSQL
-- ============================================
-- Base de datos: u695828542_yavoy_web
-- Usuario: u695828542_yavoyen5
-- Ejecutar desde phpMyAdmin en Hostinger

-- 1. Ver usuarios actuales y sus hosts permitidos
SELECT User, Host FROM mysql.user WHERE User = 'u695828542_yavoyen5';

-- 2. Crear usuario con acceso desde cualquier IP (%)
-- Si el usuario ya existe, primero eliminarlo:
-- DROP USER IF EXISTS 'u695828542_yavoyen5'@'%';

CREATE USER IF NOT EXISTS 'u695828542_yavoyen5'@'%' 
IDENTIFIED BY 'Yavoy25!';

-- 3. Otorgar permisos completos en la base de datos
GRANT ALL PRIVILEGES ON u695828542_yavoy_web.* 
TO 'u695828542_yavoyen5'@'%';

-- 4. Aplicar cambios
FLUSH PRIVILEGES;

-- 5. Verificar permisos
SHOW GRANTS FOR 'u695828542_yavoyen5'@'%';

-- ============================================
-- ALTERNATIVA: Permitir solo desde IPs específicas
-- ============================================

-- Para permitir desde tu IP local (ejemplo: 181.89.23.79)
-- CREATE USER IF NOT EXISTS 'u695828542_yavoyen5'@'181.89.23.79' 
-- IDENTIFIED BY 'Yavoy25!';
-- GRANT ALL PRIVILEGES ON u695828542_yavoy_web.* 
-- TO 'u695828542_yavoyen5'@'181.89.23.79';
-- FLUSH PRIVILEGES;

-- Para permitir desde el servidor Hostinger (ejemplo: 147.79.84.219)
-- CREATE USER IF NOT EXISTS 'u695828542_yavoyen5'@'147.79.84.219' 
-- IDENTIFIED BY 'Yavoy25!';
-- GRANT ALL PRIVILEGES ON u695828542_yavoy_web.* 
-- TO 'u695828542_yavoyen5'@'147.79.84.219';
-- FLUSH PRIVILEGES;

-- ============================================
-- VERIFICACIÓN DE CONFIGURACIÓN
-- ============================================

-- Ver todos los permisos del usuario
SELECT * FROM mysql.user WHERE User = 'u695828542_yavoyen5'\G

-- Ver bases de datos accesibles
SHOW DATABASES;

-- Probar acceso a la base de datos
USE u695828542_yavoy_web;
SHOW TABLES;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 
-- 1. Si usas '%' cualquier IP puede conectarse (menos seguro pero más fácil)
-- 2. Si usas IPs específicas, es más seguro pero debes agregar cada IP
-- 3. Después de ejecutar este script, reinicia el servidor Node.js
-- 4. Verifica la conexión con: node -e "require('./config/database').authenticate()"
