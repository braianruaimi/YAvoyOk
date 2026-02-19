# ============================================
# Script: Configurar Proxy Reverso Hostinger
# YAvoy v3.1 Enterprise
# ============================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  🔧 CONFIGURAR PROXY REVERSO HOSTINGER" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Opciones disponibles:`n" -ForegroundColor White

Write-Host "1. " -ForegroundColor Yellow -NoNewline
Write-Host "Subir .htaccess vía SSH (Automático)" -ForegroundColor White

Write-Host "2. " -ForegroundColor Yellow -NoNewline
Write-Host "Crear .htaccess vía File Manager (Manual)" -ForegroundColor White

Write-Host "3. " -ForegroundColor Yellow -NoNewline
Write-Host "Ejecutar script completo en servidor" -ForegroundColor White

Write-Host "4. " -ForegroundColor Yellow -NoNewline
Write-Host "Contactar soporte Hostinger`n" -ForegroundColor White

$opcion = Read-Host "Selecciona una opción (1-4)"

switch ($opcion) {
    "1" {
        Write-Host "`n🚀 Subiendo .htaccess al servidor...`n" -ForegroundColor Cyan
        
        # Conectar por SSH y crear .htaccess
        $commands = @"
cd /home/u695828542/public_html
cat > .htaccess << 'HTACCESS_END'
RewriteEngine On

# Excluir archivos reales
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d

# Proxy reverso a Node.js
RewriteRule ^(.*)$ http://127.0.0.1:5502/`$1 [P,L]

<IfModule mod_proxy.c>
    ProxyRequests Off
    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:5502/
    ProxyPassReverse / http://127.0.0.1:5502/
</IfModule>
HTACCESS_END

echo "✅ .htaccess creado exitosamente"
ls -la .htaccess
cat .htaccess
"@
        
        Write-Host "Ejecutando comandos en servidor..." -ForegroundColor Yellow
        $commands | ssh -p 65002 u695828542@147.79.84.219
        
        Write-Host "`n✅ .htaccess configurado!" -ForegroundColor Green
        Write-Host "Verifica: https://yavoy.space`n" -ForegroundColor Cyan
    }
    
    "2" {
        Write-Host "`n📋 INSTRUCCIONES MANUALES:" -ForegroundColor Cyan
        Write-Host "══════════════════════════════════════" -ForegroundColor Gray
        Write-Host "`n1. Abre hPanel → File Manager" -ForegroundColor White
        Write-Host "2. Ve a: public_html" -ForegroundColor White
        Write-Host "3. Clic derecho → New File → Nombre: .htaccess" -ForegroundColor White
        Write-Host "4. Abre el archivo y pega este contenido:" -ForegroundColor White
        Write-Host ""
        
        $htaccess = @"
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://127.0.0.1:5502/`$1 [P,L]

<IfModule mod_proxy.c>
    ProxyRequests Off
    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:5502/
    ProxyPassReverse / http://127.0.0.1:5502/
</IfModule>
"@
        
        Write-Host $htaccess -ForegroundColor Yellow
        Write-Host ""
        Write-Host "5. Guarda y cierra" -ForegroundColor White
        Write-Host "6. Verifica: https://yavoy.space`n" -ForegroundColor White
        
        # Copiar al portapapeles si es posible
        try {
            $htaccess | Set-Clipboard
            Write-Host "✅ Contenido copiado al portapapeles`n" -ForegroundColor Green
        }
        catch {
            Write-Host "⚠️  Copia manualmente el contenido de arriba`n" -ForegroundColor Yellow
        }
        
        Write-Host "Abriendo File Manager..." -ForegroundColor Cyan
        Start-Process "https://hpanel.hostinger.com/file-manager"
    }
    
    "3" {
        Write-Host "`n🚀 Ejecutando script completo...`n" -ForegroundColor Cyan
        
        # Subir el script
        Write-Host "Subiendo script al servidor..." -ForegroundColor Yellow
        scp -P 65002 configurar-proxy-hostinger.sh u695828542@147.79.84.219:/home/u695828542/yavoy-app/
        
        # Ejecutar
        Write-Host "Ejecutando configuración..." -ForegroundColor Yellow
        ssh -p 65002 u695828542@147.79.84.219 "cd /home/u695828542/yavoy-app && chmod +x configurar-proxy-hostinger.sh && bash configurar-proxy-hostinger.sh"
        
        Write-Host "`n✅ Script ejecutado!`n" -ForegroundColor Green
    }
    
    "4" {
        Write-Host "`n📞 CONTACTAR SOPORTE HOSTINGER:" -ForegroundColor Cyan
        Write-Host "══════════════════════════════════════" -ForegroundColor Gray
        Write-Host "`nVe a hPanel → Support → Live Chat" -ForegroundColor White
        Write-Host "`nMensaje sugerido:" -ForegroundColor Yellow
        Write-Host ""
        
        $mensaje = @"
Hola, necesito configurar un proxy reverso para mi aplicación Node.js:

• Servidor VPS: 147.79.84.219
• Aplicación: /home/u695828542/yavoy-app/server.js
• Puerto interno: 5502
• Dominio: yavoy.space

La aplicación ya está corriendo con PM2, pero necesito que el 
tráfico web (puerto 80/443) se redirija al puerto 5502.

¿Pueden ayudarme a configurar el proxy reverso en Apache/Nginx?
"@
        
        Write-Host $mensaje -ForegroundColor White
        Write-Host ""
        
        try {
            $mensaje | Set-Clipboard
            Write-Host "✅ Mensaje copiado al portapapeles`n" -ForegroundColor Green
        }
        catch {}
        
        Write-Host "Abriendo soporte..." -ForegroundColor Cyan
        Start-Process "https://hpanel.hostinger.com/support/tickets"
    }
    
    default {
        Write-Host "`n❌ Opción inválida`n" -ForegroundColor Red
    }
}

Write-Host "========================================`n" -ForegroundColor Cyan
