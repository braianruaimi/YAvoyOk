# 🚀 YAvoy v3.1 Enterprise - Guía de Inicio Rápido

## Iniciar el Servidor

### Opción 1: Servidor Enterprise (Recomendado)
```powershell
cd "C:\Users\cdaim\OneDrive\Desktop\YAvoy2026"
node server-enterprise.js
```

### Opción 2: Servidor de Prueba Ligero
```powershell
cd "C:\Users\cdaim\OneDrive\Desktop\YAvoy2026"
node test-server.js
```

## Probar Endpoints

Una vez el servidor esté corriendo, prueba estos endpoints:

### Health Check Básico
```powershell
curl http://localhost:5502/api/test
```

### Sistema de Monitoreo
```powershell
curl http://localhost:5502/api/system/health
curl http://localhost:5502/api/system/metrics
curl http://localhost:5502/api/system/status
```

### Diagnóstico de Base de Datos
```powershell
curl http://localhost:5502/api/diagnostics/database
```

### Documentación Swagger
Abre en navegador: http://localhost:5502/api/docs

## Verificar que Todo Funciona

El servidor debería mostrar:

```
==================================================
🚀 YAVOY v3.1 ENTERPRISE SERVER INICIADO
==================================================
🌐 Servidor: http://localhost:5502
📊 WebSockets optimizados para GPS activados
🛡️  Seguridad CEO Enterprise activada
⚡ Modo Producción Hostinger optimizado
🔗 Conexiones activas: 0
==================================================
```

## Notas Importantes

- ⚠️ Los errores de PostgreSQL son normales en desarrollo (se usa fallback JSON)
- ⚠️ Los errores de Redis son normales (se usa NodeCache como fallback)
- ✅ El servidor funciona completamente sin PostgreSQL ni Redis

## Endpoints Disponibles

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/test` | GET | Prueba básica |
| `/api/system/health` | GET | Estado del servidor |
| `/api/system/metrics` | GET | Métricas del sistema |
| `/api/system/status` | GET | Estado de servicios |
| `/api/diagnostics/database` | GET | Diagnóstico de DB |
| `/api/docs` | GET | Documentación Swagger |
| `/api/auth/login` | POST | Login de usuario |
| `/api/auth/register/comercio` | POST | Registro de comercio |
| `/api/auth/register/repartidor` | POST | Registro de repartidor |
| `/api/pedidos` | GET/POST | Gestión de pedidos |

## Esquemas de Validación (24 disponibles)

- `registroUsuario`
- `login`
- `registroComercio`
- `registroRepartidor`
- `crearPedido`
- `actualizarEstadoPedido`
- `crearCalificacion`
- `enviarMensaje`
- ... y más
