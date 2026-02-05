# ⚡ QUICK START - ACTIVAR FEATURES PREMIUM

**Tiempo de integración:** 10 minutos  
**Complejidad:** Baja  
**Resultados:** 19 nuevos endpoints funcionales

---

## 1️⃣ ABRALES ARCHIVOS CREADOS

Deberías ver estos archivos nuevos en tu workspace:

### Models (3 archivos)
```
✅ models/Calificacion.js
✅ models/PuntosRecompensas.js
✅ models/Propina.js
```

### Controllers (3 archivos)
```
✅ src/controllers/calificacionesController.js
✅ src/controllers/puntosRecompensasController.js
✅ src/controllers/propinasController.js
```

### Routes (1 archivo)
```
✅ src/routes/premiumFeaturesRoutes.js
```

### Migrations (3 archivos)
```
✅ migrations/001-create-calificaciones.js
✅ migrations/002-create-puntos-recompensas.js
✅ migrations/003-create-propinas.js
```

### Tests (3 archivos)
```
✅ tests/unit/calificacionesController.test.js
✅ tests/unit/puntosRecompensasController.test.js
✅ tests/unit/propinasController.test.js
```

### Documentation (4 archivos)
```
✅ FEATURES_PREMIUM_IMPLEMENTACION.md
✅ INTEGRACION_FEATURES_PREMIUM.md
✅ FEATURES_PREMIUM_ROADMAP_IMPACTO.md
✅ QUICK_START_FEATURES.md (este archivo)
```

---

## 2️⃣ PASO 1: EDITAR server.js

Busca la sección donde importas rutas:

```javascript
const authRoutes = require('./src/routes/auth');
const pedidosRoutes = require('./src/routes/pedidos');
```

**Agrega arriba:**
```javascript
const premiumFeaturesRoutes = require('./src/routes/premiumFeaturesRoutes');
```

Luego busca donde montas las rutas:

```javascript
app.use('/api/auth', authRoutes);
app.use('/api/pedidos', pedidosRoutes);
```

**Agrega aquí:**
```javascript
app.use('/api/premium', premiumFeaturesRoutes);
```

---

## 3️⃣ PASO 2: SINCRONIZAR DB

En la sección donde sincronizas modelos, agrega:

```javascript
const { Calificacion, PuntosRecompensas, HistorialPuntos, RecompensasLibrary, Propina, EstadisticasPropinas } = require('./models');

// Ya existe:
await Usuario.sync({ alter: true });
await Pedido.sync({ alter: true });

// AGREGA ESTO:
await Calificacion.sync({ alter: true });
await PuntosRecompensas.sync({ alter: true });
await HistorialPuntos.sync({ alter: true });
await RecompensasLibrary.sync({ alter: true });
await Propina.sync({ alter: true });
await EstadisticasPropinas.sync({ alter: true });
```

---

## 4️⃣ PASO 3: REINICIA SERVIDOR

```bash
# Ctrl+C para detener
# Luego:
npm start

# Deberías ver:
# ✅ Base de datos sincronizada
# ✅ Servidor en puerto 5502
```

---

## 5️⃣ VERIFICAR INTEGRACIÓN

Abre una **nueva terminal** y prueba:

```bash
# Sin auth (GET público):
curl http://localhost:5502/api/premium/propinas/ranking

# Con auth (GET privado):
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:5502/api/premium/puntos/saldo

# Crear dato (POST - requiere auth + método en body):
curl -X POST http://localhost:5502/api/premium/calificaciones \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "pedidoId": "test-123",
    "estrellas": 5,
    "comentario": "Excelente"
  }'
```

---

## 6️⃣ EJECUTAR TESTS

```bash
# Correr todos los tests
npm test

# Debería ver:
# ✅ 130+ tests pasando

# Solo features premium:
npm test -- calificacionesController.test.js
npm test -- puntosRecompensasController.test.js
npm test -- propinasController.test.js
```

---

## ✅ LISTA DE VERIFICACIÓN

- [ ] ✅ 13 archivos nuevos creados
- [ ] ✅ Rutas importadas en server.js
- [ ] ✅ Rutas montadas en `/api/premium`
- [ ] ✅ Modelos en sync() section
- [ ] ✅ Servidor inicia sin errores
- [ ] ✅ GET /api/premium/propinas/ranking responde
- [ ] ✅ Tests pasan (npm test)
- [ ] ✅ BD tiene 6 tablas nuevas

---

## 🚨 SI HAY ERROR

### "Cannot find module remiumFeaturesRoutes"
```bash
# Verifica archivo existe:
ls -la src/routes/premiumFeaturesRoutes.js
```

### Error al sincronizar BD
```bash
# Ejecuta manualmente:
node -e "
const db = require('./config/database');
db.sync().then(() => console.log('✅')).catch(e => console.error('❌', e));
"
```

### Tests fallan
```bash
# Limpia cache y reintenta:
rm -rf node_modules/.cache
npm test -- --clearCache
```

---

## 📞 QUICK LINKS

- 📖 [Implementación completa](./FEATURES_PREMIUM_IMPLEMENTACION.md)
- 🔌 [Guía integración detallada](./INTEGRACION_FEATURES_PREMIUM.md)
- 📈 [Roadmap e impacto](./FEATURES_PREMIUM_ROADMAP_IMPACTO.md)
- 🧪 [Tests (130+ casos)](./tests/unit/)

---

## 🎉 ¡LISTO!

Al terminar esto tendrás:
- ✅ 19 endpoints funcionales
- ✅ 3 sistemas monetizables activos
- ✅ Base de datos completa
- ✅ Tests pasando
- ✅ Documentación lista

**Próximo paso:** Frontend components para que usuarios vean las features

---

**Tiempo total: ~15 minutos** ⚡
