# 🧹 PLAN DE LIMPIEZA Y UNIFICACIÓN - YAVOY

**Fecha:** 11 de diciembre de 2025  
**Estado:** SERVIDOR OPERATIVO ✅  
**Objetivo:** Eliminar duplicados y mantener solo archivos oficiales

---

## 🎯 RESUMEN EJECUTIVO

### Estado actual:
- ✅ Servidor funcionando correctamente (PID 1592)
- ⚠️ **50 MB de archivos duplicados** en carpeta `updates_socio`
- ⚠️ **Confusión** entre versiones de archivos
- ✅ Sistema funcional pero desorganizado

### Objetivo:
- 🎯 Eliminar archivos duplicados
- 🎯 Mantener solo una versión oficial de cada archivo
- 🎯 Sistema limpio y mantenible

---

## 📊 ANÁLISIS DE DUPLICADOS

### Carpetas encontradas:

```
YAvoy_DEFINITIVO/ (RAÍZ - OFICIAL)
├── index.html ✅
├── panel-repartidor.html ✅
├── panel-comercio.html ✅
├── server.js ✅
├── [23 archivos HTML]
└── updates_socio/ ❌ CARPETA COMPLETA DUPLICADA
    ├── YAvoy2026/ (10 archivos) ❌
    ├── YAvoy_UNIFICADO_2026/ (2601 archivos, 25 MB) ❌
    ├── panel-repartidor.html ❌ DUPLICADO
    ├── panel-comercio.html ❌ DUPLICADO
    ├── server.js ❌ DUPLICADO
    └── [múltiples duplicados]
```

### Tamaño de duplicados:
- `YAvoy_UNIFICADO_2026/`: **25.77 MB** (2601 archivos)
- `YAvoy2026/`: **0.32 MB** (10 archivos)
- Otros archivos: **~1 MB**
- **TOTAL A ELIMINAR: ~27 MB**

---

## 🗂️ ARCHIVOS OFICIALES (A CONSERVAR)

### 📄 HTML Principal (23 archivos en RAÍZ):

#### Páginas públicas:
1. ✅ `index.html` - Página principal
2. ✅ `terminos.html` - Términos y condiciones
3. ✅ `privacidad.html` - Política de privacidad
4. ✅ `acerca-de.html` - Sobre YaVoy
5. ✅ `faq.html` - Preguntas frecuentes
6. ✅ `soporte.html` - Soporte

#### Paneles de usuario:
7. ✅ `panel-repartidor.html` - Dashboard repartidor
8. ✅ `panel-comercio.html` - Dashboard comercio
9. ✅ `panel-admin.html` - Panel admin

#### Apps:
10. ✅ `repartidor-app.html` - App repartidor
11. ✅ `comercio-app.html` - App comercio
12. ✅ `dashboard-ceo.html` - Dashboard CEO

#### Módulos:
13. ✅ `chat-sistema.html` - Chat
14. ✅ `mapa-entregas.html` - Mapa
15. ✅ `notificaciones-push.html` - Notificaciones
16. ✅ `calificaciones.html` - Calificaciones
17. ✅ `pagar-pedido.html` - Pagos
18. ✅ `pedidos.html` - Gestión pedidos

#### Herramientas:
19. ✅ `test-simple.html` - Pruebas
20. ✅ `pruebas-sistema.html` - Pruebas completas
21. ✅ `portal-gestion.html` - Portal
22. ✅ `admin-soporte.html` - Soporte admin

#### PWA:
23. ✅ `offline.html` - Offline

### 📜 JavaScript (RAÍZ):
- ✅ `server.js` - Servidor Express (OFICIAL)
- ✅ `script.js` - Frontend principal
- ✅ `sw.js` - Service Worker
- ✅ `/js/db.js` - Base de datos
- ✅ `/js/forms.js` - Formularios
- ✅ `/js/notifications.js` - Notificaciones
- ✅ `/js/ui.js` - UI

### 🎨 CSS (RAÍZ):
- ✅ `styles.css` - Estilos principales
- ✅ `/styles/animations.css` - Animaciones
- ✅ `/styles/modales.css` - Modales

### ⚙️ Configuración:
- ✅ `package.json`
- ✅ `manifest.json`
- ✅ `jsconfig.json`

### 📁 Carpetas:
- ✅ `/registros/` - Datos de la aplicación
- ✅ `/docs/` - Documentación
- ✅ `/icons/` - Iconos PWA
- ✅ `/js/` - Módulos JavaScript
- ✅ `/styles/` - Estilos CSS
- ✅ `/node_modules/` - Dependencias

---

## 🗑️ ARCHIVOS A ELIMINAR

### ❌ Carpeta completa: `updates_socio/`

**Contenido duplicado:**
```
updates_socio/
├── YAvoy2026/ (ELIMINAR)
│   ├── panel-admin.html ❌
│   ├── repartidor-app.html ❌
│   ├── comercio-app.html ❌
│   └── [7 archivos más] ❌
│
├── YAvoy_UNIFICADO_2026/ (ELIMINAR)
│   ├── index.html ❌
│   ├── panel-repartidor.html ❌
│   ├── panel-comercio.html ❌
│   ├── server.js ❌
│   ├── /node_modules/ (2421 archivos) ❌
│   ├── /registros/ (12 archivos) ❌ [YA COPIADOS A RAÍZ]
│   └── [todos los demás archivos] ❌
│
├── panel-repartidor.html ❌ DUPLICADO
├── panel-comercio.html ❌ DUPLICADO
├── server.js ❌ DUPLICADO
├── test.html ❌
└── [todos los demás archivos] ❌
```

**Nota:** Los registros (repartidores y comercios) ya fueron copiados a la carpeta `/registros/` oficial.

---

## 📋 PASOS DE EJECUCIÓN

### ⚠️ ANTES DE EJECUTAR - VERIFICACIÓN:

```powershell
# 1. Verificar que el servidor está corriendo desde la RAÍZ
Get-Process -Name node | Where-Object {$_.Path -like "*YAvoy_DEFINITIVO\*"}

# 2. Confirmar ubicación actual
Get-Location

# 3. Verificar que estamos en la raíz correcta
Test-Path ".\server.js"  # Debe retornar True
Test-Path ".\index.html"  # Debe retornar True
```

### PASO 1: Crear Backup 🔐

**CRÍTICO: NO OMITIR ESTE PASO**

```powershell
# Ir a la raíz del proyecto
cd "C:\Users\cdaim\OneDrive\Desktop\YAvoy_DEFINITIVO"

# Crear backup de la carpeta updates_socio
$fecha = Get-Date -Format "yyyy-MM-dd_HHmmss"
$backupName = "BACKUP_updates_socio_$fecha.zip"

Compress-Archive -Path "updates_socio" -DestinationPath $backupName -Force

# Verificar que el backup se creó
if (Test-Path $backupName) {
    Write-Host "✅ Backup creado: $backupName" -ForegroundColor Green
    $size = (Get-Item $backupName).Length / 1MB
    Write-Host "   Tamaño: $([math]::Round($size, 2)) MB" -ForegroundColor Gray
} else {
    Write-Host "❌ ERROR: No se pudo crear el backup" -ForegroundColor Red
    Write-Host "   DETENER - No continuar sin backup" -ForegroundColor Red
}
```

### PASO 2: Verificar Registros 📊

```powershell
# Confirmar que los datos están en la raíz
Write-Host "`n📊 Verificando registros en RAÍZ..." -ForegroundColor Yellow

$repartidores = Get-ChildItem ".\registros\repartidores\*.json" | Measure-Object
$comercios = Get-ChildItem ".\registros\servicios-*\*.json" -Recurse | Measure-Object

Write-Host "   Repartidores: $($repartidores.Count)" -ForegroundColor Cyan
Write-Host "   Comercios: $($comercios.Count)" -ForegroundColor Cyan

if ($repartidores.Count -gt 0 -and $comercios.Count -gt 0) {
    Write-Host "✅ Datos verificados en raíz" -ForegroundColor Green
} else {
    Write-Host "❌ ADVERTENCIA: Faltan datos en raíz" -ForegroundColor Red
    Write-Host "   Ejecutar script de copia antes de continuar" -ForegroundColor Yellow
}
```

### PASO 3: Eliminar Duplicados 🗑️

**CUIDADO: Esta acción es irreversible (excepto por el backup)**

```powershell
# Confirmar que estamos en el directorio correcto
if ((Get-Location).Path -ne "C:\Users\cdaim\OneDrive\Desktop\YAvoy_DEFINITIVO") {
    Write-Host "❌ ERROR: No estás en el directorio correcto" -ForegroundColor Red
    exit
}

# Mostrar lo que se va a eliminar
Write-Host "`n⚠️  SE ELIMINARÁ LA CARPETA:" -ForegroundColor Red
Write-Host "   updates_socio\ ($(Get-ChildItem 'updates_socio' -Recurse -File | Measure-Object).Count archivos)" -ForegroundColor Yellow

$confirmacion = Read-Host "`n¿Estás SEGURO de eliminar? (Escribe 'CONFIRMAR' para continuar)"

if ($confirmacion -eq "CONFIRMAR") {
    Write-Host "`n🗑️  Eliminando carpeta updates_socio..." -ForegroundColor Yellow
    
    Remove-Item -Path "updates_socio" -Recurse -Force -ErrorAction SilentlyContinue
    
    Start-Sleep -Seconds 2
    
    if (!(Test-Path "updates_socio")) {
        Write-Host "✅ Carpeta eliminada exitosamente" -ForegroundColor Green
        
        # Mostrar espacio liberado
        Write-Host "`n💾 Espacio liberado: ~27 MB" -ForegroundColor Cyan
    } else {
        Write-Host "❌ ERROR: No se pudo eliminar completamente" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Operación cancelada" -ForegroundColor Yellow
}
```

### PASO 4: Verificar Sistema 🔍

```powershell
# Verificar que el servidor sigue corriendo
Write-Host "`n🔍 Verificando servidor..." -ForegroundColor Yellow

$serverProcess = Get-Process -Name node -ErrorAction SilentlyContinue
if ($serverProcess) {
    Write-Host "✅ Servidor sigue corriendo (PID: $($serverProcess.Id))" -ForegroundColor Green
} else {
    Write-Host "⚠️  Servidor detenido - Reiniciar" -ForegroundColor Yellow
}

# Probar API
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5501/api/repartidores" -TimeoutSec 5
    Write-Host "✅ API respondiendo correctamente" -ForegroundColor Green
    Write-Host "   Repartidores: $($response.repartidores.Count)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ API no responde" -ForegroundColor Red
}

# Listar archivos HTML en raíz
Write-Host "`n📄 Archivos HTML en raíz:" -ForegroundColor Yellow
$htmlFiles = Get-ChildItem "*.html" | Measure-Object
Write-Host "   Total: $($htmlFiles.Count) archivos" -ForegroundColor Cyan
```

### PASO 5: Reiniciar Servidor (si es necesario) 🔄

```powershell
# Si el servidor se detuvo, reiniciarlo
if (!(Get-Process -Name node -ErrorAction SilentlyContinue)) {
    Write-Host "`n🔄 Reiniciando servidor..." -ForegroundColor Yellow
    
    Start-Process -FilePath "node" -ArgumentList "server.js" -WindowStyle Hidden
    
    Start-Sleep -Seconds 3
    
    $newProcess = Get-Process -Name node -ErrorAction SilentlyContinue
    if ($newProcess) {
        Write-Host "✅ Servidor reiniciado (PID: $($newProcess.Id))" -ForegroundColor Green
    } else {
        Write-Host "❌ Error al reiniciar servidor" -ForegroundColor Red
    }
}
```

---

## ✅ VERIFICACIÓN POST-LIMPIEZA

### Checklist:

```powershell
# Ejecutar este script para verificar todo
Write-Host "`n╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         VERIFICACIÓN POST-LIMPIEZA                       ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

$checks = @()

# 1. Carpeta updates_socio eliminada
$check1 = !(Test-Path "updates_socio")
$checks += $check1
Write-Host "`n1. Carpeta updates_socio eliminada: $(if($check1){"✅"}else{"❌"})" -ForegroundColor $(if($check1){"Green"}else{"Red"})

# 2. Servidor corriendo
$check2 = $null -ne (Get-Process -Name node -ErrorAction SilentlyContinue)
$checks += $check2
Write-Host "2. Servidor corriendo: $(if($check2){"✅"}else{"❌"})" -ForegroundColor $(if($check2){"Green"}else{"Red"})

# 3. API respondiendo
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5501/api/repartidores" -TimeoutSec 5
    $check3 = $response.success -eq $true
} catch {
    $check3 = $false
}
$checks += $check3
Write-Host "3. API respondiendo: $(if($check3){"✅"}else{"❌"})" -ForegroundColor $(if($check3){"Green"}else{"Red"})

# 4. Archivos HTML presentes
$check4 = (Get-ChildItem "*.html" | Measure-Object).Count -eq 23
$checks += $check4
Write-Host "4. 23 archivos HTML en raíz: $(if($check4){"✅"}else{"❌"})" -ForegroundColor $(if($check4){"Green"}else{"Red"})

# 5. Registros presentes
$repCount = (Get-ChildItem ".\registros\repartidores\*.json" -ErrorAction SilentlyContinue | Measure-Object).Count
$comCount = (Get-ChildItem ".\registros\servicios-*\*.json" -Recurse -ErrorAction SilentlyContinue | Measure-Object).Count
$check5 = $repCount -gt 0 -and $comCount -gt 0
$checks += $check5
Write-Host "5. Datos en registros: $(if($check5){"✅"}else{"❌"}) (Rep: $repCount, Com: $comCount)" -ForegroundColor $(if($check5){"Green"}else{"Red"})

# 6. Backup existe
$backupExists = (Get-ChildItem "BACKUP_updates_socio_*.zip" -ErrorAction SilentlyContinue | Measure-Object).Count -gt 0
$checks += $backupExists
Write-Host "6. Backup creado: $(if($backupExists){"✅"}else{"❌"})" -ForegroundColor $(if($backupExists){"Green"}else{"Red"})

# Resultado final
$allPassed = $checks -notcontains $false
Write-Host "`n══════════════════════════════════════════════════════════" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "✅ TODAS LAS VERIFICACIONES PASADAS" -ForegroundColor Green
    Write-Host "`nSistema limpio y operativo. ¡Listo para usar!" -ForegroundColor Green
} else {
    Write-Host "⚠️  ALGUNAS VERIFICACIONES FALLARON" -ForegroundColor Yellow
    Write-Host "`nRevisa los elementos marcados con ❌" -ForegroundColor Yellow
}
Write-Host "══════════════════════════════════════════════════════════`n" -ForegroundColor Cyan
```

---

## 🎯 RESULTADO ESPERADO

### Después de la limpieza:

```
YAvoy_DEFINITIVO/
├── index.html ✅
├── panel-repartidor.html ✅
├── panel-comercio.html ✅
├── server.js ✅
├── [20 archivos HTML más] ✅
├── /js/ ✅
├── /styles/ ✅
├── /icons/ ✅
├── /registros/ ✅
│   ├── /repartidores/ (1 archivo) ✅
│   ├── /servicios-otros/ (4 archivos) ✅
│   ├── /servicios-kiosco/ (1 archivo) ✅
│   └── [otras categorías] ✅
├── /docs/ ✅
├── /node_modules/ ✅
├── BACKUP_updates_socio_2025-12-11_XXXXXX.zip 🔐
└── updates_socio/ ❌ ELIMINADA
```

### Beneficios:
- ✅ ~27 MB de espacio liberado
- ✅ Sin archivos duplicados
- ✅ Estructura clara y mantenible
- ✅ Sin confusión sobre qué archivos usar
- ✅ Backup disponible por seguridad

---

## 🚨 RECUPERACIÓN (si algo sale mal)

### Si necesitas restaurar:

```powershell
# Encontrar el backup más reciente
$backup = Get-ChildItem "BACKUP_updates_socio_*.zip" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if ($backup) {
    Write-Host "Restaurando desde: $($backup.Name)" -ForegroundColor Yellow
    
    # Extraer backup
    Expand-Archive -Path $backup.FullName -DestinationPath "." -Force
    
    Write-Host "✅ Backup restaurado" -ForegroundColor Green
} else {
    Write-Host "❌ No se encontró backup" -ForegroundColor Red
}
```

---

## 📞 SOPORTE

Si algo sale mal durante la limpieza:

1. **NO PÁNICO** - El backup está disponible
2. Detén cualquier operación en curso
3. Verifica el backup: `Test-Path "BACKUP_updates_socio_*.zip"`
4. Restaura desde el backup si es necesario
5. Revisa los logs del servidor

**Archivos críticos a preservar siempre:**
- `server.js`
- `index.html`
- `/registros/` (todos los datos)
- `package.json`

---

**Estado:** ✅ LISTO PARA EJECUTAR  
**Última actualización:** 11/12/2025 15:50  
**Backup requerido:** SÍ (obligatorio)
