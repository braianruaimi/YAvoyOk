# 📸 YAvoy — Guía Visual Paso a Paso

## 🎯 Para tu Socio: Cómo Ejecutar el Proyecto

---

## 📥 PASO 1: Descomprimir el Proyecto

1. **Ubicá el archivo** `YAvoy_COMPLETO_2025-11-30.zip` que te compartí
2. **Click derecho** sobre el ZIP → **Extraer todo...**
3. **Elegí una ubicación** fácil de encontrar (ej: `C:\YAvoy\`)
4. **Click en Extraer**

```
✅ Resultado esperado:
   Carpeta con todos los archivos del proyecto
```

---

## ⚙️ PASO 2: Instalar Node.js (si no lo tenés)

1. **Descargá Node.js** desde: https://nodejs.org/
2. **Elegí la versión LTS** (recomendada)
3. **Instalá** con todas las opciones por defecto
4. **Reiniciá** PowerShell si estaba abierta

**Verificar instalación:**
```powershell
node --version
npm --version
```

```
✅ Deberías ver algo como:
   v20.10.0
   10.2.3
```

---

## 🚀 PASO 3: Iniciar el Proyecto (FÁCIL)

### Opción A — Automática (Recomendada)

1. **Navegá a la carpeta** del proyecto
2. **Doble click** en `INICIAR_SERVIDOR.bat`

```
┌─────────────────────────────────────────┐
│  📁 YAvoy                               │
│  📄 INICIAR_SERVIDOR.bat  ← DOBLE CLICK │
│  📄 index.html                          │
│  📄 script.js                           │
│  ...                                    │
└─────────────────────────────────────────┘
```

3. **Esperá unos segundos** mientras se inician:
   - Servidor de registros (puerto 5501)
   - Servidor web (puerto 5500)
   - Túnel público

4. **Copiá la URL pública** que aparece en pantalla:

```
========================================
  URL PÚBLICA PARA MÓVIL:
  https://xxxxx.loca.lt
========================================

✓ Abre esta URL en tu celular
✓ Funciona desde cualquier red (Wi-Fi, 4G, 5G)
```

---

### Opción B — Manual (PowerShell)

Si preferís control total:

**Terminal 1 — Instalar dependencias:**
```powershell
cd "C:\YAvoy"
npm install
```

**Terminal 2 — Servidor de registros:**
```powershell
cd "C:\YAvoy"
node server.js
```

```
✅ Deberías ver:
   🗂️  Servidor de registros activo en puerto 5501
   📁 Carpeta de registros: C:\YAvoy\registros
```

**Terminal 3 — Servidor web:**
```powershell
cd "C:\YAvoy"
npx http-server -p 5500 --cors
```

```
✅ Deberías ver:
   Starting up http-server, serving ./
   Available on:
     http://127.0.0.1:5500
     http://192.168.x.x:5500
```

**Terminal 4 — Túnel público (opcional):**
```powershell
cd "C:\YAvoy"
npx localtunnel --port 5500
```

```
✅ Deberías ver:
   your url is: https://xxxxx.loca.lt
```

---

## 🌐 PASO 4: Abrir en el Navegador

### En tu PC:
1. **Abrí tu navegador** (Chrome, Edge, Firefox)
2. **Navegá a:** `http://localhost:5500`

```
┌──────────────────────────────────────────┐
│ ← → ⟳  🔒 localhost:5500                 │
├──────────────────────────────────────────┤
│                                          │
│         🚀 YAvoy                         │
│   Entrega rápida y segura                │
│                                          │
│   [Comercios Locales] [Quiero ser Rep]  │
│                                          │
└──────────────────────────────────────────┘
```

### En tu Celular:
1. **Abrí el navegador** del celular
2. **Pegá la URL pública:** `https://xxxxx.loca.lt`
3. **Esperá la carga** (primera vez puede tardar 2-3 seg)

```
┌────────────────────────┐
│  📱 Chrome (Móvil)     │
│  https://xxxxx.loca.lt │
├────────────────────────┤
│                        │
│      🚀 YAvoy          │
│  Entrega rápida y      │
│      segura            │
│                        │
│ [Comercios Locales]    │
│ [Quiero ser Repartidor]│
│                        │
└────────────────────────┘
```

---

## ✅ PASO 5: Probar las Funcionalidades

### 🏪 Registrar un Comercio

1. **Scrolleá hasta** la sección "Comercios"
2. **Completá el formulario:**
   - Nombre: `Mi Pizzería`
   - Categoría: `Restaurante`
   - WhatsApp: `+54 9 11 1234-5678`
   - Email: `contacto@mipizzeria.com`
3. **Click en** "Quiero registrarme"

```
✅ Verás:
   Notificación verde: "¡Registro exitoso!"
   El comercio se guardó en:
   - localStorage (navegador)
   - registros/servicios-alimentacion/comercio_Mi_Pizzería_xxx.json
```

---

### 🛵 Registrar un Repartidor

1. **Scrolleá hasta** "Repartidores"
2. **Click en** "¡Quiero Empezar a Repartir!"
3. **Completá Paso 1:**
   - Nombre completo
   - Email
   - Teléfono
   - D.N.I
   - Experiencia (opcional)
4. **Click en** "Enviar Pre-Registro"
5. **Completá Paso 2 (aparece automáticamente):**
   - Marca: `Honda`
   - Modelo: `Wave 110`
   - Dominio: `ABC123`
   - Nº Motor: `12345678`
   - Nº Chasis: `87654321`
   - Foto registro (frente): seleccioná archivo
   - Foto registro (dorso): seleccioná archivo
6. **Click en** "Guardar Datos del Vehículo"

```
✅ Verás:
   Notificación: "¡Datos de vehículo guardados! Gracias."
   Repartidor y vehículo vinculados en localStorage
```

---

### 💬 Botón WhatsApp

1. **Click en cualquier tarjeta** de comercio
2. **Verás botón verde** "🟢 WhatsApp"
3. **Click sobre él**
4. **Se abre WhatsApp** con el número del comercio

```
┌────────────────────────┐
│  Sabor Express 🍔      │
│  Restaurante           │
│  30-45 min             │
│  [Ver Detalles]        │
│  [🟢 WhatsApp]         │
└────────────────────────┘
```

---

### 🔐 Panel de Administración

1. **Presiona** `Alt + A` en el teclado
2. **Se abre ventana emergente** con todos los datos
3. **Podés descargar:**
   - Comercios (JSON/CSV)
   - Repartidores + Vehículos (JSON/CSV)
   - Contactos (JSON/CSV)

```
┌──────────────────────────────────────┐
│  Panel de Administración             │
├──────────────────────────────────────┤
│  Comercios Registrados (5)           │
│  [                                   │
│    {                                 │
│      "nombre": "Mi Pizzería",        │
│      "categoria": "restaurante",     │
│      "whatsapp": "+54 9 11...",      │
│      ...                             │
│    }                                 │
│  ]                                   │
│                                      │
│  [Descargar JSON] [Descargar CSV]    │
│  [Borrar todos los datos]            │
└──────────────────────────────────────┘
```

---

## 📱 PASO 6: Instalar como App (PWA)

### En Chrome/Edge (PC):
1. **Click en el icono** "Instalar" en la barra de direcciones
2. **O:** Menú ⋮ → "Instalar YAvoy..."
3. **Click en "Instalar"**

```
✅ La app se instalará como:
   - Acceso directo en el escritorio
   - Entrada en el menú inicio
   - Aplicación independiente (sin barra del navegador)
```

### En Android:
1. **Menú del navegador** (tres puntitos)
2. **"Agregar a pantalla de inicio"**
3. **Confirmar**

```
✅ Verás el icono de YAvoy en tu pantalla de inicio
```

---

## 🔍 PASO 7: Verificar que Todo Funciona

### Checklist Completo:

- [ ] **Servidor corriendo** en `http://localhost:5500`
- [ ] **Túnel público** funcionando (URL compartible)
- [ ] **Formulario de comercios** guarda datos
- [ ] **Botón WhatsApp** abre wa.me
- [ ] **Filtros de categorías** funcionan
- [ ] **Modal de repartidor** abre y cierra correctamente
- [ ] **Paso 1 y 2** del repartidor fluyen bien
- [ ] **Panel Admin (Alt+A)** muestra datos
- [ ] **Exportar JSON/CSV** funciona
- [ ] **PWA instalable** (aparece botón "Instalar App")
- [ ] **Responsive en móvil** (menú hamburguesa, categorías scroll)

---

## ❓ Problemas Comunes

### 1. "npm no se reconoce como comando"
**Solución:**
- Instalá Node.js desde https://nodejs.org/
- Reiniciá PowerShell
- Verificá: `node --version`

### 2. "Puerto 5500 ya en uso"
**Solución:**
```powershell
# Ver qué proceso usa el puerto
netstat -ano | Select-String ":5500"

# Matar ese proceso (reemplazá PID)
Stop-Process -Id <PID> -Force
```

### 3. "No se abre en el celular con IP local"
**Solución:**
- Usá el túnel público (LocalTunnel)
- La URL `https://xxxxx.loca.lt` funciona desde cualquier red

### 4. "No veo los cambios que hice"
**Solución:**
- Recargá duro: `Ctrl + F5`
- Limpiá caché del Service Worker
- O editá `sw.js` y cambiá el número de versión

### 5. "El firewall bloquea el puerto"
**Solución:**
```powershell
# Ejecutá como Administrador
netsh advfirewall firewall add rule name="YAvoy_5500" dir=in action=allow protocol=TCP localport=5500
```

---

## 🎨 Capturas de las Secciones Principales

### Hero (Inicio)
```
┌─────────────────────────────────────────────────┐
│                    YAvoy                        │
│                                                 │
│      Entrega rápida y segura con YAvoy         │
│   Conecta comercios con repartidores locales   │
│                                                 │
│   [Comercios Locales] [Quiero ser Repartidor]  │
│                                                 │
│   [Imagen personalizada: Designer-6.jpg]       │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Estadísticas
```
┌──────────────────────────────────────────┐
│    5          2        33        97%     │
│ Comercios  Repartid  Envíos  Satisfac.  │
│  Activos    ores    Realizad            │
└──────────────────────────────────────────┘
```

### Comercios
```
┌───────────────────────────────────────────────┐
│  Comercios Destacados de tu Ciudad           │
│                                              │
│  [Formulario de registro]                    │
│  Nombre: ________________                    │
│  Categoría: [▼ Seleccionar]                  │
│  WhatsApp: ________________                  │
│  Email: ________________                     │
│  [Quiero registrarme]                        │
│                                              │
│  Filtros: [Todos][Empresas][Mayoristas]...  │
│                                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │ Sabor   │ │Farmacia │ │Detalle  │       │
│  │Express🍔│ │Bienest💊│ │Perfect🎁│       │
│  │30-45min │ │15-25min │ │45-60min │       │
│  │[Detalles]│ │[Detalles]│ │[Detalles]│     │
│  │[WhatsApp]│ │[WhatsApp]│ │[WhatsApp]│     │
│  └─────────┘ └─────────┘ └─────────┘       │
└───────────────────────────────────────────────┘
```

### Repartidores
```
┌──────────────────────────────────────────────┐
│  Genera Ingresos Extras con tu Moto o Auto  │
│              🏍️🚗                            │
│                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │   ⏰     │ │   💰     │ │   🗺️     │    │
│  │ Horarios │ │Ganancias │ │  Envíos  │    │
│  │Flexibles │ │  Claras  │ │ Locales  │    │
│  └──────────┘ └──────────┘ └──────────┘    │
│                                              │
│      [¡Quiero Empezar a Repartir!]          │
└──────────────────────────────────────────────┘
```

### Modal Repartidor
```
┌─────────────────────────────────────┐
│  ¡Únete como Repartidor! 🛵    [X] │
├─────────────────────────────────────┤
│  Completa el siguiente formulario   │
│                                     │
│  Nombre: ___________________        │
│  Email: ____________________        │
│  Teléfono: _________________        │
│  D.N.I: ____________________        │
│  Experiencia: ______________        │
│                                     │
│  [Enviar Pre-Registro]              │
│                                     │
│  ─── Paso 2 (aparece después) ───  │
│                                     │
│  Marca: ____________________        │
│  Modelo: ___________________        │
│  Dominio: __________________        │
│  Nº Motor: _________________        │
│  Nº Chasis: ________________        │
│  Registro (frente): [📷 Subir]     │
│  Registro (dorso): [📷 Subir]      │
│                                     │
│  [Guardar Datos del Vehículo]       │
└─────────────────────────────────────┘
```

---

## 🎯 Resumen para tu Socio

1. **Descomprimir** el ZIP
2. **Doble click** en `INICIAR_SERVIDOR.bat`
3. **Copiar URL pública** que aparece
4. **Abrir** en PC (`localhost:5500`) y celular (URL pública)
5. **Probar** registro de comercios y repartidores
6. **Verificar** WhatsApp y panel admin (Alt+A)
7. **Instalar como PWA** (opcional)

**Tiempo estimado:** 5-10 minutos

---

## 📞 Soporte

Si tenés algún problema:
- **WhatsApp:** 2215047962
- **Email:** YAvoy5@gmail.com

¡Listo para crecer juntos! 🚀
