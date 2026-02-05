# 🔍 VERIFICACIÓN DE SINCRONIZACIÓN - GUÍA PASO A PASO

**Objetivo:** Verificar que Features Premium se sincronicen correctamente en MySQL después de las correcciones

---

## PASO 1️⃣: Reiniciar Servidor

```bash
# En terminal (en directorio del proyecto)
npm start

# Verás logs como estos:
# ✅ Conectado a base de datos MySQL
# ✅ Modelos cargados: Usuario, Pedido, Chat, ...
# ✅ Calificaciones tabla creada/actualizada
# ✅ PuntosRecompensas tabla creada/actualizada
# ✅ HistorialPuntos tabla creada/actualizada
# ✅ RecompensasLibrary tabla creada/actualizada
# ✅ Propina tabla creada/actualizada
# ✅ EstadisticasPropinas tabla creada/actualizada
# ✅ Routes montadas: /api/premium/...
# 🚀 Servidor escuchando en puerto 5502
```

---

## PASO 2️⃣: Conectar a Base de Datos MySQL

### Opción A: MySQL Command Line
```bash
# Desde terminal
mysql -h localhost -u root -p

# Ingresar contraseña de MySQL

# Resultado esperado:
# mysql>
```

### Opción B: MySQL Workbench
```
1. Abrir MySQL Workbench
2. Conectarse a localhost (puerto 3306)
3. Elegir database: yavoyok (o la que uses)
```

### Opción C: phpMyAdmin (si está disponible)
```
1. Abrir http://localhost/phpmyadmin
2. Ingresar con usuario MySQL
3. Elegir database
```

---

## PASO 3️⃣: Verificar Tablas Creadas

```sql
-- Ver todas las tablas (incluyendo las nuevas)
SHOW TABLES;

-- Resultado ESPERADO (busca estos):
+-----------------------------+
| Tables_in_yavoyok           |
+-----------------------------+
| Chats                       |
| Pedidos                     |
| Usuarios                    |
| Calificaciones              | ← NUEVA ✅
| PuntosRecompensas           | ← NUEVA ✅
| HistorialPuntos             | ← NUEVA ✅
| RecompensasLibrary          | ← NUEVA ✅
| Propinas                    | ← NUEVA ✅
| EstadisticasPropinas        | ← NUEVA ✅
+-----------------------------+
```

---

## PASO 4️⃣: Inspeccionar Estructura de Cada Tabla

### Calificaciones
```sql
DESCRIBE Calificaciones;

-- Esperado:
+----------------------+---------+------+-----+---------+
| Field                | Type    | Null | Key | Default |
+----------------------+---------+------+-----+---------+
| id                   | varchar | NO   | PRI | NULL    | ✅ STRING
| pedidoId             | varchar | NO   | MUL | NULL    | ✅ STRING
| calificadorId        | varchar | NO   | MUL | NULL    | ✅ STRING
| calificadoId         | varchar | NO   | MUL | NULL    | ✅ STRING
| estrellas            | int     | NO   |     | NULL    | ✅ 1-5
| aspectos             | json    | YES  |     | NULL    | ✅ JSON
| tags                 | json    | YES  |     | NULL    |
| respuesta            | text    | YES  |     | NULL    | ✅ Business reply
| createdAt            | datetime| NO   |     | NULL    |
| updatedAt            | datetime| NO   |     | NULL    |
+----------------------+---------+------+-----+---------+

-- SÍ = STRING (no UUID) ✅
```

### PuntosRecompensas
```sql
DESCRIBE PuntosRecompensas;

-- Esperado:
+-------------------+---------+------+-----+---------+
| Field             | Type    | Null | Key | Default |
+-------------------+---------+------+-----+---------+
| id                | varchar | NO   | PRI | NULL    | ✅ STRING
| usuarioId         | varchar | NO   | UNI | NULL    | ✅ STRING
| puntosActuales    | int     | NO   |     | 0       | ✅
| nivel             | enum    | NO   |     | BRONCE  | ✅
| beneficios        | json    | YES  |     | NULL    | ✅
| createdAt         | datetime| NO   |     | NULL    |
| updatedAt         | datetime| NO   |     | NULL    |
+-------------------+---------+------+-----+---------+
```

### HistorialPuntos
```sql
DESCRIBE HistorialPuntos;

-- Esperado:
+------------------+---------+------+-----+---------+
| Field            | Type    | Null | Key | Default |
+------------------+---------+------+-----+---------+
| id               | varchar | NO   | PRI | NULL    | ✅ STRING
| usuarioId        | varchar | NO   | MUL | NULL    | ✅ STRING
| tipo             | enum    | NO   |     | COMPRA  | ✅
| monto            | int     | NO   |     | NULL    | ✅
| saldoAnterior    | int     | NO   |     | NULL    | ✅
| saldoPosterior   | int     | NO   |     | NULL    | ✅
| createdAt        | datetime| NO   |     | NULL    |
+------------------+---------+------+-----+---------+
```

### RecompensasLibrary
```sql
DESCRIBE RecompensasLibrary;

-- Esperado:
+---------------------+---------+------+-----+---------+
| Field               | Type    | Null | Key | Default |
+---------------------+---------+------+-----+---------+
| id                  | varchar | NO   | PRI | NULL    | ✅ STRING
| nombre              | varchar | NO   |     | NULL    |
| descripcion         | text    | YES  |     | NULL    |
| puntosRequeridos    | int     | NO   |     | NULL    |
| tipo                | enum    | NO   |     | NULL    |
| cantidadDisponible  | int     | YES  |     | NULL    |
| createdAt           | datetime| NO   |     | NULL    |
+---------------------+---------+------+-----+---------+
```

### Propinas
```sql
DESCRIBE Propinas;

-- Esperado:
+------------------+---------+------+-----+---------+
| Field            | Type    | Null | Key | Default |
+------------------+---------+------+-----+---------+
| id               | varchar | NO   | PRI | NULL    | ✅ STRING
| pedidoId         | varchar | NO   | UNI | NULL    | ✅ STRING
| clienteId        | varchar | NO   | MUL | NULL    | ✅ STRING
| repartidorId     | varchar | NO   | MUL | NULL    | ✅ STRING
| monto            | decimal | NO   |     | NULL    | ✅ $$$
| estado           | enum    | NO   |     | PENDIENTE|
| motivo           | enum    | YES  |     | NULL    | ✅
| comisionYavoy    | decimal | NO   |     | 0.10    | ✅ 10%
| createdAt        | datetime| NO   |     | NULL    |
| updatedAt        | datetime| NO   |     | NULL    |
+------------------+---------+------+-----+---------+
```

### EstadisticasPropinas
```sql
DESCRIBE EstadisticasPropinas;

-- Esperado:
+------------------------------+---------+------+-----+---------+
| Field                        | Type    | Null | Key | Default |
+------------------------------+---------+------+-----+---------+
| id                           | varchar | NO   | PRI | NULL    | ✅ STRING
| repartidorId                 | varchar | NO   | UNI | NULL    | ✅ STRING
| totalPropinaRecibida         | decimal | NO   |     | 0.00    |
| totalPropinaAcumulada        | decimal | NO   |     | 0.00    |
| cantidadPropinasRecibidas    | int     | NO   |     | 0       |
| cantidadPropinasAceptadas    | int     | NO   |     | 0       |
| cantidadPropinasRechazadas   | int     | NO   |     | 0       |
| porcentajeAceptacion         | decimal | NO   |     | 0.00    |
| medallasBronce               | int     | NO   |     | 0       |
| medallasPLata                | int     | NO   |     | 0       |
| medallasOro                  | int     | NO   |     | 0       |
| medallasElite                | int     | NO   |     | 0       |
| createdAt                    | datetime| NO   |     | NULL    |
| updatedAt                    | datetime| NO   |     | NULL    |
+------------------------------+---------+------+-----+---------+
```

---

## PASO 5️⃣: Verificar Relaciones (Foreign Keys)

```sql
-- Ver todas las foreign keys de Calificaciones
SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_NAME = 'Calificaciones' AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Resultado esperado:
-- 4 relaciones encontradas:
-- 1. Calificaciones → Pedidos (pedidoId → id)
-- 2. Calificaciones → Usuarios (calificadorId → id)
-- 3. Calificaciones → Usuarios (calificadoId → id)
```

---

## PASO 6️⃣: Verificar IDs son STRING

```sql
-- Query para confirmar que NO hay UUID (buscar por tipo de dato)
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME IN ('Calificaciones', 'PuntosRecompensas', 'Propinas', 'EstadisticasPropinas')
AND COLUMN_NAME = 'id';

-- Resultado esperado:
+---------------------+-------------+---------------------+
| TABLE_NAME          | COLUMN_NAME | COLUMN_TYPE         |
+---------------------+-------------+---------------------+
| Calificaciones      | id          | varchar(255)        | ✅ STRING!
| PuntosRecompensas   | id          | varchar(255)        | ✅ STRING!
| Propinas            | id          | varchar(255)        | ✅ STRING!
| EstadisticasPropinas| id          | varchar(255)        | ✅ STRING!
+---------------------+-------------+---------------------+

-- ❌ NO deberían ser UUID - deberían ser varchar
```

---

## PASO 7️⃣: Contar Registros

```sql
-- Ver cuántos registros hay en cada tabla (deben estar en 0 al inicio)
SELECT 'Calificaciones' as tabla, COUNT(*) as registros FROM Calificaciones
UNION ALL
SELECT 'PuntosRecompensas', COUNT(*) FROM PuntosRecompensas
UNION ALL
SELECT 'HistorialPuntos', COUNT(*) FROM HistorialPuntos
UNION ALL
SELECT 'RecompensasLibrary', COUNT(*) FROM RecompensasLibrary
UNION ALL
SELECT 'Propinas', COUNT(*) FROM Propinas
UNION ALL
SELECT 'EstadisticasPropinas', COUNT(*) FROM EstadisticasPropinas;

-- Resultado esperado (al iniciar):
+---------------------+----------+
| tabla               | registros|
+---------------------+----------+
| Calificaciones      | 0        | ✅
| PuntosRecompensas   | 0        | ✅
| HistorialPuntos     | 0        | ✅
| RecompensasLibrary  | 0        | ✅
| Propinas            | 0        | ✅
| EstadisticasPropinas| 0        | ✅
+---------------------+----------+
```

---

## PASO 8️⃣: Probar Endpoints

```bash
# En terminal NUEVA (mientras servidor sigue corriendo)

# Test 1: Obtener saldo de puntos (debe retornar error si usuario no existe)
curl -X GET http://localhost:5502/api/premium/puntos/saldo \
  -H "Authorization: Bearer <JWT_TOKEN>"

# Resultado esperado:
# {"error": "Usuario no encontrado"} o {"puntosActuales": 0, "nivel": "BRONCE"}

# Test 2: Listar calificaciones
curl -X GET http://localhost:5502/api/premium/calificaciones/usuario/123 \
  -H "Authorization: Bearer <JWT_TOKEN>"

# Resultado esperado:
# {"data": [], "total": 0}

# Test 3: Obtener ranking propinas
curl -X GET http://localhost:5502/api/premium/propinas/ranking

# Resultado esperado:
# {"data": [], "total": 0}
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

- [ ] ✅ Servidor inicia sin errores
- [ ] ✅ 6 tablas nuevas aparecen en `SHOW TABLES`
- [ ] ✅ Todas las tablas tienen STRING IDs (no UUID)
- [ ] ✅ Todas las tablas tienen los campos correctos
- [ ] ✅ Foreign keys están creadas
- [ ] ✅ ENUM types están configurados
- [ ] ✅ JSON columns funcionan
- [ ] ✅ Registros en 0 al iniciar
- [ ] ✅ Endpoints responden correctamente
- [ ] ✅ No hay errores de tipo en logs

---

## 🚨 TROUBLESHOOTING

### Error: "Table already exists"
```bash
# Si aparece este error, es porque las tablas ya existían con UUID
# OPCIÓN 1: Dejar que Sequelize las actualice (alter: true)
# Should show: ✅ Tabla alterada

# OPCIÓN 2: Si sigue sin funcionar, hacer DROP de las tablas:
# ⚠️ SOLO EN DESARROLLO, NO EN PRODUCCIÓN

# MySQL:
DROP TABLE EstadisticasPropinas;
DROP TABLE Propinas;
DROP TABLE RecompensasLibrary;
DROP TABLE HistorialPuntos;
DROP TABLE PuntosRecompensas;
DROP TABLE Calificaciones;

# Luego reiniciar servidor:
npm start
```

### Error: "Invalid data type UUID"
```bash
# Significa que UUID está siendo usado aún
# Verificar que los archivos fueron modificados correctamente:

grep -n "DataTypes.UUID" models/Calificacion.js
# No debe mostrar nada

grep -n "DataTypes.STRING" models/Calificacion.js
# Debe mostrar líneas donde está el id
```

### Error: "Foreign key constraint fails"
```bash
# Puede suceder si hay IDs no coincidentes
# Verificar en MySQL que pedidoId existe en Pedidos:

SELECT id FROM Pedidos WHERE id = 'COM1704067200000';
# Si retorna resultado = OK
# Si retorna vacío = ERROR (ese pedido no existe)
```

---

## 📊 RESULTADO EXITOSO

Cuando TODO está correcto, en las logs verás:

```
✅ [11:30:15] Conectado a MySQL (yavoyok)
✅ [11:30:16] Calificaciones sincronizada
✅ [11:30:16] PuntosRecompensas sincronizada
✅ [11:30:16] HistorialPuntos sincronizada
✅ [11:30:16] RecompensasLibrary sincronizada
✅ [11:30:16] Propina sincronizada
✅ [11:30:16] EstadisticasPropinas sincronizada
✅ [11:30:17] Routes Premium montadas (/api/premium)
✅ [11:30:17] 🚀 Servidor escuchando en puerto 5502
```

---

**NEXT STEPS:**
1. ✅ Ejecutar `npm start`
2. ✅ Verificar logs
3. ✅ Conectar a MySQL y confirmar tablas
4. ✅ Probar endpoints
5. 🎉 **Proceder a crear Frontend UI**

¡Tu Features Premium ahora es 100% compatible con MySQL! 🎯
