# ============================================
# Script: Configurar YAvoy en Shared Hosting
# Hostinger Premium/Business
# ============================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  🔧 CONFIGURAR YAVOY - SHARED HOSTING" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Tu plan: Shared Hosting Premium/Business" -ForegroundColor White
Write-Host "Solución: Mover app a public_html/app`n" -ForegroundColor Gray

Write-Host "¿Qué deseas hacer?`n" -ForegroundColor Cyan

Write-Host "1. " -ForegroundColor Yellow -NoNewline
Write-Host "Mover aplicación a public_html/app (Automático)" -ForegroundColor White

Write-Host "2. " -ForegroundColor Yellow -NoNewline
Write-Host "Ver instrucciones para hPanel" -ForegroundColor White

Write-Host "3. " -ForegroundColor Yellow -NoNewline
Write-Host "Contactar soporte Hostinger" -ForegroundColor White

Write-Host "4. " -ForegroundColor Yellow -NoNewline
Write-Host "Ver guía completa (DEPLOY_SHARED_HOSTING_HOSTINGER.md)`n" -ForegroundColor White

$opcion = Read-Host "Selecciona opción (1-4)"

switch ($opcion) {
    "1" {
        Write-Host "`n🚀 Moviendo aplicación a public_html/app...`n" -ForegroundColor Cyan
        
        $commands = @'
cd ~
echo "📁 Creando directorio public_html/app..."
mkdir -p public_html/app

echo "📦 Copiando aplicación..."
shopt -s dotglob
cp -r yavoy-app/* public_html/app/ 2>/dev/null ; true

echo "✅ Verificando archivos..."
cd public_html/app
ls -la | head -20

echo ""
echo "✅ Aplicación copiada correctamente"
echo "📍 Ubicación: /home/u695828542/public_html/app"
echo ""

echo "🛑 Deteniendo PM2 (no necesario en shared hosting)..."
pm2 delete all 2>/dev/null ; true
pm2 kill 2>/dev/null ; true

echo ""
echo "✅ COMPLETADO"
echo "Ahora configura en hPanel:"
echo "  Application Root: /public_html/app"
echo "  Application URL: http://yavoy.space"
echo "  Startup file: server.js"
'@

        Write-Host "Conectando al servidor..." -ForegroundColor Yellow
        $commands | ssh -p 65002 u695828542@147.79.84.219 bash
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n========================================" -ForegroundColor Green
            Write-Host "  ✅ APLICACIÓN MOVIDA EXITOSAMENTE" -ForegroundColor Cyan
            Write-Host "========================================`n" -ForegroundColor Green
            
            Write-Host "Nueva ubicación:" -ForegroundColor White
            Write-Host "  /home/u695828542/public_html/app`n" -ForegroundColor Yellow
            
            Write-Host "Ahora configura en hPanel:" -ForegroundColor Cyan
            Write-Host "  1. Ve a: Advanced -> Setup Node.js Application" -ForegroundColor White
            Write-Host "  2. Clic en 'Create Application'" -ForegroundColor White
            Write-Host "  3. Configura:" -ForegroundColor White
            Write-Host "     • Application root: /public_html/app" -ForegroundColor Gray
            Write-Host "     • Application URL: http://yavoy.space" -ForegroundColor Gray
            Write-Host "     • Application startup file: server.js" -ForegroundColor Gray
            Write-Host "     • Node.js version: 18.x" -ForegroundColor Gray
            Write-Host "  4. Clic 'Create' y espera 1-2 minutos`n" -ForegroundColor White
            
            Write-Host "Abriendo hPanel..." -ForegroundColor Yellow
            Start-Sleep -Seconds 2
            Start-Process "https://hpanel.hostinger.com/hosting/advanced/nodejs"
        }
        else {
            Write-Host "`n❌ Error al copiar archivos" -ForegroundColor Red
            Write-Host "Intenta opción 3 (contactar soporte)`n" -ForegroundColor Yellow
        }
    }
    
    "2" {
        Write-Host "`n📋 INSTRUCCIONES PARA hPANEL:" -ForegroundColor Cyan
        Write-Host "══════════════════════════════════════" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Primero ejecuta opción 1 para mover la app," -ForegroundColor White
        Write-Host "luego sigue estos pasos:`n" -ForegroundColor White
        
        Write-Host "1. Abre hPanel -> Advanced -> Setup Node.js Application" -ForegroundColor White
        Write-Host "2. Clic en 'Create Application'" -ForegroundColor White
        Write-Host "3. Configura los siguientes campos:" -ForegroundColor White
        Write-Host ""
        Write-Host "   📁 Application root:" -ForegroundColor Cyan
        Write-Host "      /public_html/app" -ForegroundColor Yellow
        Write-Host "      (o navega y selecciona la carpeta 'app')" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   🌐 Application URL:" -ForegroundColor Cyan
        Write-Host "      http://yavoy.space" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "   📄 Application startup file:" -ForegroundColor Cyan
        Write-Host "      server.js" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "   ⚙️  Node.js version:" -ForegroundColor Cyan
        Write-Host "      18.x (o la más reciente LTS)" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "   🔌 Port (si pide):" -ForegroundColor Cyan
        Write-Host "      Dejar en blanco (hPanel asigna automáticamente)" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "4. Clic en 'Create'" -ForegroundColor White
        Write-Host "5. Espera 1-2 minutos mientras se configura" -ForegroundColor White
        Write-Host "6. Verifica en https://yavoy.space`n" -ForegroundColor White
        
        Write-Host "Si el campo 'Application root' solo muestra '/':" -ForegroundColor Yellow
        Write-Host "  - Intenta escribir la ruta manualmente" -ForegroundColor Gray
        Write-Host "  - O contacta soporte (opción 3)`n" -ForegroundColor Gray
        
        Write-Host "Abriendo hPanel..." -ForegroundColor Cyan
        Start-Process "https://hpanel.hostinger.com/hosting/advanced/nodejs"
    }
    
    "3" {
        Write-Host "`n📞 CONTACTAR SOPORTE HOSTINGER:" -ForegroundColor Cyan
        Write-Host "══════════════════════════════════════" -ForegroundColor Gray
        Write-Host ""
        
        $mensaje = @"
Asunto: Configurar aplicación Node.js en Shared Hosting Premium/Business

Hola, necesito ayuda para configurar mi aplicación Node.js en mi plan Premium/Business.

INFORMACIÓN:
• Usuario: u695828542
• Dominio: yavoy.space
• Aplicación: /home/u695828542/public_html/app
• Archivo principal: server.js
• Node.js: v18.20.8 (ya instalado)

PROBLEMA:
El campo "Application Root" en "Setup Node.js Application" solo muestra "/" 
y no me permite seleccionar mi directorio /public_html/app.

He intentado:
1. Escribir la ruta manualmente
2. Navegar por el selector (no funciona)
3. Crear .htaccess con ProxyPass (no se aplica)

¿PUEDEN AYUDARME?
1. Configurar la aplicación manualmente desde su panel, O
2. Indicarme cómo seleccionar correctamente el directorio, O
3. Habilitar los módulos necesarios para que funcione el proxy reverso

La aplicación funciona correctamente cuando la ejecuto por SSH, 
solo necesito que sea accesible públicamente en yavoy.space.

¡Muchas gracias!
"@
        
        Write-Host $mensaje -ForegroundColor White
        Write-Host ""
        
        try {
            $mensaje | Set-Clipboard
            Write-Host "✅ Mensaje copiado al portapapeles" -ForegroundColor Green
        }
        catch {
            Write-Host "⚠️  Copia manualmente el mensaje de arriba" -ForegroundColor Yellow
        }
        
        Write-Host "`nAbriendo soporte Hostinger..." -ForegroundColor Cyan
        Start-Sleep -Seconds 1
        Start-Process "https://hpanel.hostinger.com/support/tickets"
    }
    
    "4" {
        Write-Host "`n📄 Abriendo guía completa...`n" -ForegroundColor Cyan
        
        if (Test-Path "DEPLOY_SHARED_HOSTING_HOSTINGER.md") {
            Start-Process "DEPLOY_SHARED_HOSTING_HOSTINGER.md"
        }
        else {
            Write-Host "❌ Archivo no encontrado" -ForegroundColor Red
            Write-Host "Búscalo en: DEPLOY_SHARED_HOSTING_HOSTINGER.md`n" -ForegroundColor Yellow
        }
    }
    
    default {
        Write-Host "`n❌ Opción inválida`n" -ForegroundColor Red
    }
}

Write-Host "========================================`n" -ForegroundColor Cyan
