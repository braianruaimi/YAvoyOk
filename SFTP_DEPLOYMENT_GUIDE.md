# YAvoy SFTP Deployment Guide
# Guía de Despliegue Rápido con SFTP

## 🚀 Configuración Hostinger

### 1. Datos de Conexión
```json
{
  "host": "tu-dominio.com",              # Tu dominio principal
  "username": "tu-usuario-hostinger",    # Usuario cPanel/SFTP
  "password": "tu-password-hostinger",   # Password del cPanel
  "port": 22,                           # Puerto SFTP estándar
  "remotePath": "/public_html"          # Carpeta web principal
}
```

### 2. Configurar Credenciales
**IMPORTANTE:** Actualiza el archivo `.vscode/sftp.json` con tus datos reales:

1. **Host**: Reemplaza `tu-dominio.com` con tu dominio real
2. **Username**: Tu usuario de cPanel/Hostinger  
3. **Password**: Tu contraseña de cPanel
4. **RemotePath**: Usualmente `/public_html` para dominio principal

### 3. Estructura de Carpetas Recomendada
```
/public_html/
├── index.html              # Página principal YAvoy
├── css/                    # Estilos CSS
├── js/                     # JavaScript y polyfills
├── icons/                  # Iconos y favicon
├── assets/                 # Recursos estáticos
├── api/                    # Endpoints PHP (si aplica)
└── admin/                  # Panel administrativo
```

## 📋 Comandos SFTP Útiles

### VS Code Command Palette (Ctrl+Shift+P):
- `SFTP: Upload Project` - Subir proyecto completo
- `SFTP: Upload Active Folder` - Subir carpeta actual
- `SFTP: Upload Active File` - Subir archivo actual
- `SFTP: Download Project` - Descargar desde servidor
- `SFTP: Sync Local -> Remote` - Sincronizar local a remoto
- `SFTP: Sync Remote -> Local` - Sincronizar remoto a local

## 🔧 Flujo de Trabajo Recomendado

### Desarrollo Local:
1. Modifica archivos en VS Code
2. Guarda el archivo (Ctrl+S)
3. **Auto-upload activado** - Se sube automáticamente

### Despliegue de Cambios:
```bash
# Método 1: Auto-upload (Recomendado)
- uploadOnSave: true activado
- Cualquier cambio se sube automáticamente

# Método 2: Manual
Ctrl+Shift+P -> "SFTP: Upload Active File"

# Método 3: Proyecto Completo
Ctrl+Shift+P -> "SFTP: Upload Project"
```

## 🎯 Archivos Específicos YAvoy

### Prioridad Alta (Subir siempre):
- `index.html` - Página principal
- `dashboard-ceo.html` - Panel CEO
- `panel-comercio*.html` - Paneles comercio
- `panel-repartidor*.html` - Paneles repartidor
- `css/theme-enhancement.css` - Sistema de temas
- `js/theme-*.js` - Polyfills de temas
- `manifest.json` - PWA manifest

### Archivos Excluidos (No subir):
- `*.md` - Documentación local
- `*.ps1` - Scripts Windows
- `backups/` - Respaldos locales
- `.vscode/` - Configuración VS Code
- `migrate-*.js` - Scripts de migración

## 🔐 Seguridad y Mejores Prácticas

### 1. Credenciales Seguras:
```json
// Opción 1: Archivo .env local (Recomendado)
{
  "host": "${env:HOSTINGER_HOST}",
  "username": "${env:HOSTINGER_USER}",
  "password": "${env:HOSTINGER_PASS}"
}

// Opción 2: SSH Key (Más seguro)
{
  "privateKeyPath": "~/.ssh/hostinger_key",
  "passphrase": "tu-passphrase"
}
```

### 2. Backup antes de Modificar:
```bash
# Siempre descargar backup antes de cambios grandes
Ctrl+Shift+P -> "SFTP: Download Project"
```

### 3. Testing de Conexión:
```bash
# Verificar conexión
Ctrl+Shift+P -> "SFTP: Open SSH in Terminal"
```

## 🚨 Troubleshooting Común

### Error de Conexión:
1. Verificar host/usuario/password
2. Confirmar puerto 22 abierto
3. Revisar firewall/antivirus
4. Probar desde terminal: `ssh usuario@host`

### Permisos de Archivos:
```bash
# En terminal SFTP:
chmod 644 *.html *.css *.js
chmod 755 carpetas/
```

### Archivos No Se Suben:
1. Revisar array `ignore` en sftp.json
2. Verificar `uploadOnSave: true`
3. Comprobar permisos de carpeta remota

## 🔄 Scripts de Deployment

### Comando Rápido - Subir Solo Cambios:
1. Guarda archivo modificado (Ctrl+S)
2. Auto-upload lo sube inmediatamente
3. Verifica en navegador

### Comando Completo - Despliegue Full:
```bash
# 1. Backup actual
Ctrl+Shift+P -> "SFTP: Download Project"

# 2. Subir proyecto completo  
Ctrl+Shift+P -> "SFTP: Upload Project"

# 3. Verificar funcionamiento
# Abrir: https://tu-dominio.com
```

## 📊 Monitoreo Post-Deployment

### Verificaciones Esenciales:
1. **Página Principal**: https://tu-dominio.com
2. **Panel CEO**: https://tu-dominio.com/dashboard-ceo.html  
3. **Temas CSS**: Verificar colores y estilos
4. **JavaScript**: Abrir consola (F12) - sin errores
5. **PWA**: Manifest y service worker funcionando

### Logs de Errores:
- **cPanel Error Logs**: Revisar errores PHP/servidor
- **Browser Console**: Verificar errores JavaScript
- **Network Tab**: Comprobar archivos 404

---

## 🎯 Configuración Final Recomendada

Para YAvoy en Hostinger, usa esta configuración optimizada:

```json
{
  "name": "YAvoy Production",
  "host": "tu-dominio.com",
  "username": "tu-usuario",  
  "password": "tu-password",
  "remotePath": "/public_html",
  "uploadOnSave": true,
  "ignore": [".vscode/**", "*.md", "*.ps1", "backups/**"]
}
```

**¡Listo para despliegue rápido de YAvoy!** 🚀