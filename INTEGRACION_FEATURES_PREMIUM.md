# 🔌 GUÍA DE INTEGRACIÓN - FEATURES PREMIUM

**Archivo:** `server.js` o `app.js`  
**Dirección:** Integrar las 3 features premium en servidor  
**Tiempo estimado:** 10 minutos

---

## PASO 1: Importar Rutas

En la sección de **routes** de `server.js`, agrega:

```javascript
// ====================================
// 🎁 ROUTES FEATURES PREMIUM
// ====================================
const premiumFeaturesRoutes = require('./src/routes/premiumFeaturesRoutes');
```

---

## PASO 2: Montar Rutas

Después de definir otras rutas:

```javascript
// Rutas existentes
app.use('/api/auth', authRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/usuarios', usuariosRoutes);

// ✅ AGREGAR ESTA LÍNEA
app.use('/api/premium', premiumFeaturesRoutes);

// Ruta 404
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});
```

---

## PASO 3: Sincronizar Base de Datos

En la sección de **Sequelize sync**:

```javascript
// Sincronizar modelos con BD
try {
  // Modelos existentes
  await Usuario.sync({ alter: true });
  await Pedido.sync({ alter: true });
  // ... otros modelos ...

  // ✅ AGREGAR ESTOS
  await Calificacion.sync({ alter: true });
  await PuntosRecompensas.sync({ alter: true });
  await HistorialPuntos.sync({ alter: true });
  await RecompensasLibrary.sync({ alter: true });
  await Propina.sync({ alter: true });
  await EstadisticasPropinas.sync({ alter: true });

  console.log('✅ Base de datos sincronizada');
} catch (error) {
  console.error('❌ Error sincronizando BD:', error);
  process.exit(1);
}
```

---

## PASO 4: Importar Modelos

En el archivo `models/index.js` o donde defines tus exports:

```javascript
// Modelos existentes
module.exports = {
  Usuario,
  Pedido,
  Comercio,
  Repartidor,
  // ... otros ...

  // ✅ AGREGAR ESTOS
  Calificacion: require('./Calificacion'),
  PuntosRecompensas: require('./PuntosRecompensas'),
  HistorialPuntos,
  RecompensasLibrary,
  Propina: require('./Propina'),
  EstadisticasPropinas,
};
```

---

## PASO 5: Verificar Rutas

Una vez iniciado el servidor, verifica que las rutas estén disponibles:

```bash
# En otra terminal
curl http://localhost:5502/api/premium/puntos/saldo \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Respuesta esperada:
{
  "success": true,
  "puntosActuales": 0,
  "nivel": "BRONCE"
}
```

---

## PASO 6: Ejecutar Migraciones (Alternativo)

Si usas **sequelize-cli**, ejecuta:

```bash
# Listar migraciones pendientes
npx sequelize-cli db:migrate:status

# Ejecutar migraciones
npx sequelize-cli db:migrate

# Deshacer última migración (si es necesario)
npx sequelize-cli db:migrate:undo
```

---

## 📋 CHECKLIST DE VERIFICACIÓN

- [ ] ✅ Importadas rutas en `server.js`
- [ ] ✅ Montadas en `/api/premium`
- [ ] ✅ Modelos sincronizados con `sync()`
- [ ] ✅ Importados en `models/index.js`
- [ ] ✅ Servidor inicia sin errores
- [ ] ✅ Endpoints responden (test GET `/api/premium/puntos/saldo`)
- [ ] ✅ Base de datos tiene tablas nuevas

---

## 🐛 TROUBLESHOOTING

### Error: "Cannot find module './premiumFeaturesRoutes'"
**Solución:** Verifica que el archivo existe en `src/routes/premiumFeaturesRoutes.js`

```bash
ls -la src/routes/premiumFeaturesRoutes.js
```

### Error: "Calificacion is not defined"
**Solución:** Importa en `server.js`:

```javascript
const { Calificacion, Propina, PuntosRecompensas } = require('./models');
```

### Error: "requireAuth is not a function"
**Solución:** Verifica que el middleware está correctamente definido. En `premiumFeaturesRoutes.js`, debe estar:

```javascript
const { requireAuth } = require('../middleware/auth');
// o
const requireAuth = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  next();
};
```

### Base de datos: tablas no se crean
**Solución:** Ejecuta manualmente:

```bash
# Node.js REPL
node -e "
const seq = require('./config/database');
seq.sync({ force: false, alter: true })
  .then(() => console.log('✅ Sincronizado'))
  .catch(err => console.error('❌', err));
"
```

### Error 401 en endpoints
**Solución:** Incluye token JWT en header:

```bash
curl http://localhost:5502/api/premium/puntos/saldo \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 📊 ENDPOINTS DISPONIBLES

### Calificaciones
```
POST   /api/premium/calificaciones
GET    /api/premium/calificaciones/:usuarioId
GET    /api/premium/calificaciones/:usuarioId/resumen
GET    /api/premium/calificaciones/:usuarioId/destacadas
POST   /api/premium/calificaciones/:id/responder
POST   /api/premium/calificaciones/:id/util
```

### Puntos y Recompensas
```
GET    /api/premium/puntos/saldo
POST   /api/premium/puntos/agregar
GET    /api/premium/puntos/recompensas
POST   /api/premium/puntos/canjear
GET    /api/premium/puntos/historial
```

### Propinas
```
POST   /api/premium/propinas/ofrecer
POST   /api/premium/propinas/:id/responder
GET    /api/premium/propinas/mis-propinas
GET    /api/premium/propinas/estadisticas
GET    /api/premium/propinas/ranking
```

---

## 🚀 PRÓXIMOS PASOS

1. **Frontend Integration** ← **TÚ ERES AQUÍ**
   - Crear componentes React para cada feature
   - Integrar con API endpoints

2. **Testing**
   - Ejecutar: `npm test`
   - Validar 90+ tests

3. **Deployment**
   - Migrar BD a producción
   - Documentar cambios

---

## 💡 NOTAS IMPORTANTES

- ✅ Features son **100% independientes** entre sí
- ✅ Cada controlador maneja su **propia validación**
- ✅ JWT middleware es **requerido** en POST
- ✅ GET públicos para `/resumen`, `/ranking`, etc.
- ✅ Códigos de error: `400` (request), `403` (permission), `404` (not found), `409` (conflict), `500` (server)

---

**¡Listo para activar!** 🎉
