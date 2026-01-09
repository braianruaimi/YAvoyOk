# 🚀 CÓMO ABRIR YAVOY - GUÍA COMPLETA

## 📋 PASOS RÁPIDOS (Cada vez que quieras abrir la app)

### 1️⃣ Iniciar el Servidor
Abre PowerShell en la carpeta del proyecto y ejecuta:
```powershell
http-server -p 5500 --cors
```

### 2️⃣ Abrir en el Navegador
Ve a: **http://localhost:5500**

---

## 🔧 SI NO FUNCIONA O VES PANTALLA EN BLANCO

### Opción A: Limpiar Caché Automáticamente (RECOMENDADO)
1. Abre: **http://localhost:5500/LIMPIAR_CACHE.html**
2. Haz click en "Limpiar Todo"
3. Espera 2 segundos
4. Click en "Volver a la App"

### Opción B: Limpiar Manualmente
1. Abre **http://localhost:5500**
2. Presiona **F12** (Herramientas de desarrollador)
3. Ve a la pestaña **"Application"**
4. En el menú izquierdo, click en **"Service Workers"**
5. Click en **"Unregister"** en TODOS los service workers
6. Ve a **"Storage"** (menú izquierdo)
7. Click en **"Clear site data"**
8. Cierra el navegador completamente (Ctrl+Shift+Q en Chrome)
9. Vuelve a abrir: **http://localhost:5500**

### Opción C: Modo Incógnito (Temporal)
1. Abre navegador en **modo incógnito**: Ctrl+Shift+N
2. Ve a: **http://localhost:5500**

---

## 📱 ABRIR EN EL MÓVIL

### Mismo Wi-Fi (Red Local)
1. Asegúrate de que móvil y PC están en **la misma red Wi-Fi**
2. Desactiva **datos móviles** en el teléfono
3. Abre en el móvil: **http://192.168.0.4:5500**

### Desde Cualquier Lugar (Túnel Público)
1. En PowerShell ejecuta:
```powershell
npx localtunnel --port 5500
```
2. Copia la URL que aparece (ejemplo: https://algo-algo.loca.lt)
3. Ábrela en cualquier navegador/móvil

---

## 🐛 SOLUCIÓN DE PROBLEMAS COMUNES

### "No se puede acceder al sitio web"
✅ Verifica que el servidor esté corriendo:
```powershell
netstat -ano | Select-String ":5500"
```
Si no aparece nada, inicia el servidor de nuevo.

### "Pantalla en blanco" o "Textos sin mostrar"
✅ Usa LIMPIAR_CACHE.html o limpia manualmente (ver arriba)

### "Service Worker error" o "Failed to fetch"
✅ El navegador tiene cachés antiguas. Limpia con F12 → Application → Clear site data

### "Puerto 5500 ocupado"
✅ Mata el proceso:
```powershell
netstat -ano | Select-String ":5500"
# Busca el PID (última columna)
taskkill /PID NUMERO_PID /F
```

---

## 🎯 COMANDOS ÚTILES

### Verificar si el servidor está corriendo
```powershell
netstat -ano | Select-String ":5500"
```

### Ver tu IP local (para móvil)
```powershell
ipconfig | Select-String "IPv4"
```

### Iniciar servidor con una sola línea
```powershell
cd "C:\Users\estudiante\Desktop\Nueva carpeta"; http-server -p 5500 --cors
```

### Crear túnel público
```powershell
npx localtunnel --port 5500
```

---

## 📂 ESTRUCTURA DE ARCHIVOS

```
YAvoy/
├── index.html              # Página principal
├── styles.css              # Estilos (33,576 chars)
├── script.js               # Lógica (79,289 bytes)
├── sw.js                   # Service Worker v9
├── manifest.json           # PWA manifest
├── server.js               # API backend (puerto 5501)
├── LIMPIAR_CACHE.html      # Limpiador automático
└── registros/
    ├── comercios/          # Datos de comercios
    └── pedidos/            # Datos de pedidos
```

---

## 🔄 VERSIONES Y CACHÉ

**Versión actual:** v9

Si haces cambios en el código y no se reflejan:
1. Incrementa la versión en `sw.js` (v9 → v10)
2. Actualiza el número en `index.html`:
   - `styles.css?v=9` → `styles.css?v=10`
   - `script.js?v=9` → `script.js?v=10`
3. Limpia la caché del navegador

---

## 💡 MEJORES PRÁCTICAS

✅ **Siempre** abre con http:// (no https)
✅ **Siempre** verifica que el servidor esté corriendo antes de abrir
✅ Si ves errores, primero limpia la caché
✅ Para probar cambios en código, usa modo incógnito
✅ Para producción, usa Hostinger (ver DEPLOY_HOSTINGER.md)

---

## 🎨 MÓDULOS DISPONIBLES

1. **Comercios** - Gestión de comercios registrados
2. **Repartidores** - Gestión de repartidores
3. **Pedidos** (NUEVO v8) - Sistema completo de pedidos
   - Estados: Pendiente → Aceptado → En Camino → Entregado | Cancelado
   - 3 vistas: Activos, Historial, Disponibles
   - Modales: Crear pedido, Ver detalle

---

## 📞 RECORDATORIOS

- El servidor **no** inicia automáticamente, debes ejecutar `http-server -p 5500 --cors`
- Si cierras PowerShell, el servidor se detiene
- Los Service Workers se quedan cacheados en el navegador
- Usa **LIMPIAR_CACHE.html** cuando veas pantalla en blanco
- Para desarrollo: **localhost:5500**
- Para móvil local: **192.168.0.4:5500**
- Para público: **npx localtunnel --port 5500**

---

**Última actualización:** 30 de noviembre de 2025
**Versión actual:** v9
