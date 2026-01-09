# 🚀 Guía Rápida de Despliegue en Hostinger
# YAvoy v3.0

## 📋 Pre-requisitos

1. Cuenta de Hostinger con soporte Node.js
2. Acceso SSH al servidor
3. Dominio configurado

## 🔧 Pasos de Instalación

### 1. Subir Archivos
```bash
# Opción A: Usar FTP/FileZilla
# Subir todo el contenido de YAvoy_DEFINITIVO_3.0 a public_html

# Opción B: Usar Git (recomendado)
git clone tu-repositorio.git
```

### 2. Configurar Node.js en Hostinger

**Panel de Control > Advanced > Node.js:**
- Node.js version: 18.x o superior
- Application root: /public_html
- Application URL: tu-dominio.com
- Application startup file: server.js
- Environment variables:
  ```
  PORT=5501
  NODE_ENV=production
  EMAIL_USER=yavoyen5@gmail.com
  EMAIL_PASSWORD=tu_app_password
  ```

### 3. Instalar Dependencias
```bash
# Conectar por SSH
ssh usuario@tuservidor.com

# Ir a la carpeta del proyecto
cd public_html

# Instalar dependencias
npm install --production

# O si necesitas todas las dependencias:
npm install
```

### 4. Configurar Variables de Entorno

Crear archivo `.env` en la raíz:
```env
PORT=5501
NODE_ENV=production
EMAIL_USER=yavoyen5@gmail.com
EMAIL_PASSWORD=tu_app_password_gmail
MERCADOPAGO_ACCESS_TOKEN=tu_token_produccion
MERCADOPAGO_PUBLIC_KEY=tu_public_key_produccion
```

### 5. Iniciar Aplicación

**Opción A: Panel de Hostinger**
- Ir a Node.js en panel
- Click en "Start Application"

**Opción B: PM2 (Recomendado)**
```bash
npm install -g pm2
pm2 start server.js --name yavoy
pm2 save
pm2 startup
```

### 6. Verificar Funcionamiento

Visita:
- https://tudominio.com (Página principal)
- https://tudominio.com/panel-ceo-master.html (Panel CEO)
- https://tudominio.com/api/listar-comercios (API)

## 🔐 Configuración de Seguridad

### Cambiar Contraseñas:

**Panel CEO:**
Editar `panel-ceo-master.html` línea ~230:
```javascript
if (user === 'ceo_yavoy' && pass === 'TU_NUEVA_PASSWORD') {
```

**Panel Comercio:**
Editar `panel-comercio.html` línea ~597:
```javascript
const passwordCorrecta = 'TU_NUEVA_PASSWORD';
```

### SSL/HTTPS:
- Activar SSL gratuito en panel de Hostinger
- El .htaccess redirigirá automáticamente HTTP → HTTPS

## 📁 Permisos de Carpetas

```bash
# Dar permisos de escritura a carpetas de datos
chmod 755 registros/
chmod 755 servicios-*/
chmod 755 fotos-perfil/
chmod 755 suspensiones/
chmod 755 solicitudes-*/
chmod 755 terminos-aceptados/
chmod 755 emails-registrados/
chmod 755 telefonos-registrados/
```

## 🔄 Actualización de la App

```bash
# Detener la aplicación
pm2 stop yavoy

# Actualizar archivos
git pull
# o subir archivos nuevos por FTP

# Reinstalar dependencias si hay cambios
npm install

# Reiniciar
pm2 start yavoy
```

## 🐛 Solución de Problemas

### La app no inicia:
```bash
# Ver logs
pm2 logs yavoy

# O si usas panel de Hostinger:
# Ver en Node.js > Application Logs
```

### Error de puerto ocupado:
- Cambiar PORT en `.env`
- Reiniciar aplicación

### Error de permisos:
```bash
chmod -R 755 .
chown -R usuario:usuario .
```

## 📊 Monitoreo

### Con PM2:
```bash
pm2 status
pm2 monit
pm2 logs yavoy --lines 100
```

### Panel de Hostinger:
- Node.js > Application Logs
- Statistics

## 🔗 URLs Importantes

- **App Principal:** https://tudominio.com
- **Panel CEO:** https://tudominio.com/panel-ceo-master.html
- **Panel Comercio:** https://tudominio.com/panel-comercio.html
- **Panel Repartidor:** https://tudominio.com/panel-repartidor.html
- **API REST:** https://tudominio.com/api/*

## 📞 Soporte

Si encuentras problemas:
1. Revisar logs: `pm2 logs yavoy`
2. Verificar permisos de carpetas
3. Comprobar variables de entorno
4. Contactar soporte de Hostinger si es problema del servidor

## ✅ Checklist Final

- [ ] Archivos subidos
- [ ] Node.js configurado en panel
- [ ] Dependencias instaladas (`npm install`)
- [ ] Variables de entorno configuradas (`.env`)
- [ ] Aplicación iniciada (PM2 o panel)
- [ ] SSL activado
- [ ] Contraseñas cambiadas
- [ ] Permisos de carpetas correctos
- [ ] URLs funcionando
- [ ] Backup configurado

---

**¡Tu app está lista para producción! 🎉**
