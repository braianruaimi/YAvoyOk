# ==============================================================================
#                        🚀 YAVOY DEFINITIVO - LAUNCHER 🚀
# ==============================================================================
# Script de inicio para el sistema YAvoy
# Verifica requisitos, instala dependencias y arranca el servidor
# ==============================================================================

# Configuración de colores
$host.UI.RawUI.ForegroundColor = "White"
Clear-Host

# Banner
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "              🚀 INICIANDO YAVOY DEFINITIVO 🚀" -ForegroundColor Yellow
Write-Host ""
Write-Host "         Sistema Unificado de Gestión de Pedidos" -ForegroundColor White
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Verificar Node.js
Write-Host "[INFO] Verificando requisitos..." -ForegroundColor Cyan

try {
    $nodeVersion = node --version
    Write-Host "[✓] Node.js detectado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[✗] Node.js NO está instalado" -ForegroundColor Red
    Write-Host "[INFO] Descarga Node.js desde: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Presiona Enter para salir"
    exit 1
}

# Verificar NPM
try {
    $npmVersion = npm --version
    Write-Host "[✓] NPM detectado: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "[✗] NPM NO está instalado" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host ""
Write-Host "[INFO] Verificando dependencias..." -ForegroundColor Cyan

# Verificar node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "[WARN] Dependencias no instaladas" -ForegroundColor Yellow
    Write-Host "[INFO] Instalando dependencias (esto puede tomar unos minutos)..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[✗] Error al instalar dependencias" -ForegroundColor Red
        Read-Host "Presiona Enter para salir"
        exit 1
    }
    Write-Host "[✓] Dependencias instaladas correctamente" -ForegroundColor Green
} else {
    Write-Host "[✓] Dependencias ya instaladas" -ForegroundColor Green
}

Write-Host ""
Write-Host "[INFO] Verificando estructura de carpetas..." -ForegroundColor Cyan

# Crear carpetas necesarias
$carpetas = @(
    "registros",
    "registros\comercios",
    "registros\repartidores",
    "registros\pedidos",
    "registros\chats",
    "registros\informes-ceo",
    "registros\informes-ceo\repartidores",
    "registros\informes-ceo\comercios",
    "registros\informes-ceo\clientes"
)

foreach ($carpeta in $carpetas) {
    if (-not (Test-Path $carpeta)) {
        New-Item -ItemType Directory -Path $carpeta -Force | Out-Null
    }
}

Write-Host "[✓] Estructura de carpetas verificada" -ForegroundColor Green

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "   🌐 Iniciando servidor en http://localhost:5501" -ForegroundColor Yellow
Write-Host ""
Write-Host "   📋 Accesos rápidos:" -ForegroundColor White
Write-Host "      • Página principal: " -NoNewline -ForegroundColor White
Write-Host "http://localhost:5501" -ForegroundColor Green
Write-Host "      • Panel Comercio:   " -NoNewline -ForegroundColor White
Write-Host "http://localhost:5501/panel-comercio.html" -ForegroundColor Green
Write-Host "      • Panel Repartidor: " -NoNewline -ForegroundColor White
Write-Host "http://localhost:5501/panel-repartidor.html" -ForegroundColor Green
Write-Host ""
Write-Host "   ⚠️  Presiona Ctrl+C para detener el servidor" -ForegroundColor Yellow
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Iniciar servidor
node server.js

# Si el servidor se detiene
Write-Host ""
Write-Host "[INFO] Servidor detenido" -ForegroundColor Yellow
Read-Host "Presiona Enter para salir"
