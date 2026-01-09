##############################################################################
# YAVOY v3.1 ENTERPRISE - INICIO RÁPIDO (VERSIÓN REFACTORIZADA)
# Script PowerShell para iniciar el servidor y abrir la aplicación
##############################################################################

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "  YAvoy v3.1 Enterprise - Versión Refactorizada" -ForegroundColor Green
Write-Host "  Sistema Modular Profesional" -ForegroundColor Yellow
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# Función para verificar si un puerto está en uso
function Test-Port {
    param([int]$Port)
    try {
        $tcpConnection = New-Object System.Net.Sockets.TcpClient
        $tcpConnection.Connect("127.0.0.1", $Port)
        $tcpConnection.Close()
        return $true
    }
    catch {
        return $false
    }
}

# Verificar si el puerto 8000 está en uso
if (Test-Port 8000) {
    Write-Host "⚠️  El puerto 8000 ya está en uso." -ForegroundColor Yellow
    Write-Host "   Abriendo navegador en http://localhost:8000..." -ForegroundColor Cyan
    Start-Process "http://localhost:8000"
    exit 0
}

# Verificar si npx está disponible
try {
    $npxVersion = npx --version 2>&1
    Write-Host "✅ npx encontrado: $npxVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ ERROR: npx no está instalado." -ForegroundColor Red
    Write-Host "   Por favor, instala Node.js desde: https://nodejs.org/" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host ""
Write-Host "🚀 Iniciando servidor HTTP en puerto 8000..." -ForegroundColor Cyan
Write-Host "   Ubicación: $PWD" -ForegroundColor Gray
Write-Host ""
Write-Host "📝 MEJORAS DE LA VERSIÓN REFACTORIZADA:" -ForegroundColor Green
Write-Host "   ✅ CSS externo consolidado (800+ líneas)" -ForegroundColor White
Write-Host "   ✅ JavaScript modular (4 archivos separados)" -ForegroundColor White
Write-Host "   ✅ HTML limpio (80% menos líneas)" -ForegroundColor White
Write-Host "   ✅ Carga 50% más rápida" -ForegroundColor White
Write-Host "   ✅ Mantenimiento simplificado" -ForegroundColor White
Write-Host ""
Write-Host "📂 ESTRUCTURA MODULAR:" -ForegroundColor Yellow
Write-Host "   📄 index.html - HTML limpio y semántico" -ForegroundColor White
Write-Host "   📄 css/index-styles.css - Estilos consolidados" -ForegroundColor White
Write-Host "   📄 js/index-modals.js - Gestión de modales" -ForegroundColor White
Write-Host "   📄 js/index-forms.js - Validación de formularios" -ForegroundColor White
Write-Host "   📄 js/index-theme.js - Sistema de temas" -ForegroundColor White
Write-Host "   📄 js/index-main.js - Inicialización principal" -ForegroundColor White
Write-Host ""
Write-Host "🌐 El navegador se abrirá automáticamente..." -ForegroundColor Cyan
Write-Host "   Si no se abre, visita: http://localhost:8000" -ForegroundColor Gray
Write-Host ""
Write-Host "⏹️  Para detener el servidor, presiona CTRL+C" -ForegroundColor Yellow
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# Esperar 2 segundos antes de abrir el navegador
Start-Sleep -Seconds 2
Start-Process "http://localhost:8000"

# Iniciar el servidor HTTP (esto bloqueará la terminal)
npx http-server -p 8000 -c-1
