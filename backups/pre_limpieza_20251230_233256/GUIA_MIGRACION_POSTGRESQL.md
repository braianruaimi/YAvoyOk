# 🚀 GUÍA DE MIGRACIÓN A POSTGRESQL

## 📋 Contenido

1. [Requisitos Previos](#requisitos-previos)
2. [Instalación de PostgreSQL](#instalación-de-postgresql)
3. [Configuración Inicial](#configuración-inicial)
4. [Ejecución de la Migración](#ejecución-de-la-migración)
5. [Verificación de Datos](#verificación-de-datos)
6. [Solución de Problemas](#solución-de-problemas)

---

## 🔧 Requisitos Previos

### Software Necesario

- **Node.js** v18+ (verificar con `node --version`)
- **PostgreSQL** v14+ (verificar con `psql --version`)
- **npm** v9+ (verificar con `npm --version`)

### Dependencias de Node.js

```bash
npm install pg dotenv
```

---

## 💾 Instalación de PostgreSQL

### Windows

**Opción 1: Instalador Oficial**

1. Descargar de: https://www.postgresql.org/download/windows/
2. Ejecutar el instalador
3. Configurar:
   - Puerto: `5432` (por defecto)
   - Usuario: `postgres`
   - Contraseña: **RECORDAR ESTA CONTRASEÑA**
4. Instalar pgAdmin 4 (interfaz gráfica)

**Opción 2: Chocolatey**

```powershell
choco install postgresql
```

**Verificar instalación:**

```powershell
psql --version
# Debería mostrar: psql (PostgreSQL) 14.x
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### macOS

```bash
brew install postgresql@14
brew services start postgresql@14
```

---

## ⚙️ Configuración Inicial

### Paso 1: Crear Base de Datos

**Conectar a PostgreSQL:**

```bash
# Windows
psql -U postgres

# Linux/macOS
sudo -u postgres psql
```

**Ejecutar comandos SQL:**

```sql
-- Crear base de datos
CREATE DATABASE yavoy_db;

-- Crear usuario específico (opcional pero recomendado)
CREATE USER yavoy_user WITH ENCRYPTED PASSWORD 'tu_password_seguro';

-- Otorgar permisos
GRANT ALL PRIVILEGES ON DATABASE yavoy_db TO yavoy_user;

-- Salir
\q
```

### Paso 2: Aplicar Esquema

**Ejecutar archivo SQL:**

```bash
# Con usuario postgres
psql -U postgres -d yavoy_db -f database-schema.sql

# Con usuario personalizado
psql -U yavoy_user -d yavoy_db -f database-schema.sql
```

**Verificar que las tablas se crearon:**

```bash
psql -U postgres -d yavoy_db -c "\dt"
```

**Deberías ver:**

```
              List of relations
 Schema |         Name          | Type  |  Owner   
--------+-----------------------+-------+----------
 public | chat_messages         | table | postgres
 public | delivery_persons      | table | postgres
 public | order_status_history  | table | postgres
 public | orders                | table | postgres
 public | reviews               | table | postgres
 public | shops                 | table | postgres
 public | system_logs           | table | postgres
 public | users                 | table | postgres
```

### Paso 3: Configurar Variables de Entorno

**Copiar el template:**

```bash
cp .env.postgresql .env
```

**Editar `.env` con tus credenciales:**

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=yavoy_db
DB_USER=postgres
DB_PASSWORD=tu_password_real_aqui
```

⚠️ **IMPORTANTE**: Agregar `.env` a `.gitignore`:

```bash
echo ".env" >> .gitignore
```

---

## 🚀 Ejecución de la Migración

### Opción 1: Ejecución Directa

```bash
node migrate-to-postgresql.js
```

### Opción 2: Script npm

**Agregar en `package.json`:**

```json
{
  "scripts": {
    "migrate": "node migrate-to-postgresql.js"
  }
}
```

**Ejecutar:**

```bash
npm run migrate
```

### Salida Esperada

```
═══════════════════════════════════════════════════
   YAvoy v3.1 - Migración a PostgreSQL
═══════════════════════════════════════════════════

🔌 Verificando conexión a PostgreSQL...
✅ Conectado a: yavoy_db@localhost

📋 Migrando CLIENTES...
   Encontrados: 12 archivos
   ✅ Migrados: 12/12
   ✅ Completado: 12 exitosos, 0 errores

🛵 Migrando REPARTIDORES...
   Encontrados: 5 archivos
   ✅ Migrados: 5/5
   ✅ Completado: 5 exitosos, 0 errores

🏪 Migrando COMERCIOS...
   Encontrados: 28 archivos
   ✅ Migrados: 28/28
   ✅ Completado: 28 exitosos, 0 errores

📦 Migrando PEDIDOS...
   Encontrados: 1 archivos
   ✅ Migrados: 1/1
   ✅ Completado: 1 exitosos, 0 errores

═══════════════════════════════════════════════════
   RESUMEN DE MIGRACIÓN
═══════════════════════════════════════════════════

📊 Estadísticas:
   Clientes:     12/12 migrados
   Repartidores: 5/5 migrados
   Comercios:    28/28 migrados
   Pedidos:      1/1 migrados

⏱️  Duración: 2.45 segundos

✅ Migración completada sin errores

═══════════════════════════════════════════════════

🔌 Conexión a PostgreSQL cerrada
```

---

## ✅ Verificación de Datos

### Conectar a la Base de Datos

```bash
psql -U postgres -d yavoy_db
```

### Consultas de Verificación

**1. Contar registros:**

```sql
SELECT 
    (SELECT COUNT(*) FROM users) AS total_usuarios,
    (SELECT COUNT(*) FROM delivery_persons) AS total_repartidores,
    (SELECT COUNT(*) FROM shops) AS total_comercios,
    (SELECT COUNT(*) FROM orders) AS total_pedidos;
```

**2. Ver últimos usuarios:**

```sql
SELECT id, nombre, apellido, email, tipo, fecha_registro 
FROM users 
ORDER BY created_at DESC 
LIMIT 10;
```

**3. Ver últimos pedidos:**

```sql
SELECT id, nombre_cliente, descripcion, monto, estado, fecha_creacion 
FROM orders 
ORDER BY fecha_creacion DESC 
LIMIT 10;
```

**4. Verificar relaciones:**

```sql
SELECT 
    o.id AS pedido_id,
    o.descripcion,
    u.nombre AS cliente,
    s.nombre_comercio,
    d.nombre AS repartidor
FROM orders o
LEFT JOIN users u ON o.cliente_id = u.id
LEFT JOIN shops s ON o.comercio_id = s.id
LEFT JOIN users d ON o.repartidor_id = d.id
LIMIT 5;
```

**5. Ver estadísticas por categoría de comercio:**

```sql
SELECT 
    categoria,
    COUNT(*) AS total,
    SUM(pedidos_recibidos) AS pedidos_totales,
    AVG(rating) AS rating_promedio
FROM shops
GROUP BY categoria
ORDER BY total DESC;
```

**6. Usar vistas creadas:**

```sql
-- Pedidos con información completa
SELECT * FROM v_orders_full LIMIT 10;

-- Estadísticas de repartidores
SELECT * FROM v_delivery_stats ORDER BY rating DESC;

-- Estadísticas de comercios
SELECT * FROM v_shop_stats ORDER BY pedidos_completados DESC;
```

**7. Probar función de distancia:**

```sql
-- Encontrar repartidores cercanos a una ubicación
SELECT * FROM encontrar_repartidor_cercano(-31.4173, -64.1839, 10);
```

---

## 🔍 Solución de Problemas

### Error: "Connection refused"

**Problema:** PostgreSQL no está ejecutándose.

**Solución:**

```bash
# Windows
net start postgresql-x64-14

# Linux
sudo systemctl start postgresql

# macOS
brew services start postgresql@14
```

### Error: "FATAL: password authentication failed"

**Problema:** Credenciales incorrectas en `.env`.

**Solución:**

1. Verificar contraseña:

```bash
psql -U postgres
# Ingresar contraseña correcta
```

2. Resetear contraseña (si es necesario):

```bash
# Linux
sudo -u postgres psql
ALTER USER postgres PASSWORD 'nueva_password';
```

### Error: "permission denied for schema public"

**Problema:** Usuario sin permisos.

**Solución:**

```sql
GRANT ALL PRIVILEGES ON DATABASE yavoy_db TO yavoy_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO yavoy_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO yavoy_user;
```

### Error: "relation already exists"

**Problema:** Esquema ya ejecutado previamente.

**Solución:**

Si quieres recrear las tablas:

```sql
-- ADVERTENCIA: ESTO BORRARÁ TODOS LOS DATOS
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Luego volver a ejecutar database-schema.sql
```

### Error: "module 'pg' not found"

**Problema:** Dependencia no instalada.

**Solución:**

```bash
npm install pg dotenv
```

### Migración parcial (algunos archivos fallaron)

**Problema:** Errores en JSON malformados.

**Solución:**

El script muestra qué archivos fallaron. Para re-intentar solo esos:

1. Revisar la salida del script (muestra hasta 10 errores)
2. Corregir manualmente los JSON problemáticos
3. Re-ejecutar la migración (usa `ON CONFLICT` para evitar duplicados)

### Verificar logs detallados

**PostgreSQL logs (Linux):**

```bash
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

**PostgreSQL logs (Windows):**

```
C:\Program Files\PostgreSQL\14\data\log\
```

---

## 📊 Esquema de Tablas

### Diagrama de Relaciones

```
users (id)
  ├─ orders.cliente_id (FK)
  ├─ reviews.cliente_id (FK)
  ├─ chat_messages.user_id (FK)
  └─ delivery_persons.id (FK)
      ├─ orders.repartidor_id (FK)
      └─ reviews.repartidor_id (FK)

shops (id)
  ├─ orders.comercio_id (FK)
  └─ reviews.comercio_id (FK)

orders (id)
  ├─ order_status_history.order_id (FK)
  ├─ reviews.order_id (FK)
  └─ chat_messages.order_id (FK)
```

### Índices Creados

- **Búsqueda geoespacial**: Índices GiST en coordenadas
- **Búsqueda por estado**: Índices en `orders.estado`, `users.tipo`
- **Ordenamiento**: Índices en `created_at`, `rating`
- **Relaciones**: Índices en todas las FK

---

## 🎯 Próximos Pasos

1. **Integrar en `server.js`**:

```javascript
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20
});

// Ejemplo de consulta
app.get('/api/pedidos', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM v_orders_full ORDER BY fecha_creacion DESC LIMIT 20'
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error al obtener pedidos' });
    }
});
```

2. **Reemplazar `db.js` por llamadas a API REST**
3. **Eliminar carpeta `registros/` después de backup**
4. **Implementar conexión pooling en producción**

---

## 📚 Referencias

- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [node-postgres (pg) Docs](https://node-postgres.com/)
- [SQL Index Advisor](https://pgtune.leopard.in.ua/)

---

**¿Necesitas ayuda?** Contacta a soporte@yavoy.app
