# 🚀 YAvoy v3.1 - Quick Start Guide

**Versión:** 3.1.0  
**Fecha:** 15 de Diciembre de 2025  
**Tiempo estimado:** 5 minutos para estar operativo

---

## ⚡ Inicio Rápido (5 Pasos)

### 1️⃣ Instalar Dependencias (1 min)
```bash
cd "C:\Users\cdaim\OneDrive\Desktop\YAvoy_DEFINITIVO"
npm install
```

### 2️⃣ Configurar Variables de Entorno (1 min)
```bash
# Crear archivo .env
cp .env.example .env

# Editar .env con tus datos
# Mínimo requerido:
PORT=5501
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=tu_app_password
NODE_ENV=production
```

### 3️⃣ Iniciar Servidor (30 seg)
```bash
npm start
```

### 4️⃣ Acceder a la Aplicación (30 seg)
```
📱 Página Principal:    http://localhost:5501
👑 Panel CEO Master:    http://localhost:5501/panel-ceo-master.html
```

### 5️⃣ Login al Panel CEO (1 min)
```
Usuario:     ceo_yavoy
Contraseña:  YaVoy2025Master!CEO
```

✅ **¡Listo! Ya estás dentro del panel de administración**

---

## 📋 Comandos Principales

| Comando | Función |
|---------|---------|
| `npm start` | Iniciar servidor |
| `npm run dev` | Iniciar con auto-reload |
| `npm run lint` | Validar código |
| `npm run lint:fix` | Arreglar errores |
| `npm run format` | Formatear código |

---

## 🎯 Acciones Comunes

### Ver Comercios Registrados
1. Panel CEO → Pestaña "🏪 Comercios"
2. Se cargan automáticamente

### Crear Nuevo Comercio
1. Panel CEO → Pestaña "🏪 Comercios"
2. Click "➕ Agregar Nuevo Comercio"
3. Rellenar formulario
4. Click "✅ Crear Comercio"

### Editar Comercio Existente
1. Panel CEO → Pestaña "🏪 Comercios"
2. Click botón "✏️ Editar" en el comercio
3. Cambiar datos
4. Click "💾 Guardar Cambios"

### Ver Estadísticas
1. Panel CEO → Se muestran en la parte superior
2. Muestra: Comercios, Repartidores, Clientes, Pedidos

### Exportar Registros
1. Panel CEO → Pestaña "📊 Registros"
2. Seleccionar tipo de registro
3. Click "📥 Exportar a CSV" o "📥 Exportar a JSON"

### Editar Categorías
1. Panel CEO → Pestaña "📂 Categorías"
2. Click "✏️ Editar" en categoría
3. Cambiar nombre, icono o color
4. Click "💾 Guardar Cambios"

### Ver Suspensiones
1. Panel CEO → Pestaña "🚫 Suspensiones"
2. Muestra usuarios suspendidos
3. Click "✅ Reactivar" para reactivar

### Gestionar Solicitudes
1. Panel CEO → Pestaña "📋 Solicitudes"
2. Aparecen solicitudes de tienda y publicidad
3. Click "✅ Aprobar" o "❌ Rechazar"

---

## 🔧 Configuración Avanzada

### Cambiar Credenciales CEO (IMPORTANTE en producción)
**Archivo:** `panel-ceo-master.html` (línea ~230)
```javascript
const CEO_CREDENTIALS = {
  username: 'tu_nuevo_usuario',
  password: 'tu_nueva_contraseña'
};
```

### Cambiar Puerto
**Archivo:** `.env`
```env
PORT=5502  # O el puerto que desees
```

### Cambiar Email
**Archivo:** `.env`
```env
EMAIL_USER=tu_nuevo_email@gmail.com
EMAIL_PASSWORD=tu_nueva_contraseña_app
```

### Cambiar a Modo Desarrollo
**Archivo:** `.env`
```env
NODE_ENV=development
```

---

## 📁 Estructura Principal

```
YAvoy_v3.1/
├── server.js                    # ⭐ Servidor principal (6817 líneas)
├── panel-ceo-master.html       # ⭐ Panel CEO (13 pestañas)
├── package.json                 # Dependencias (v3.1.0)
├── .env                         # Variables de entorno
├── .env.example                 # Plantilla de .env
│
├── js/                          # JavaScript modular
│   ├── ceo-panel-v3.js         # Lógica del panel CEO
│   └── [otros módulos...]
│
├── registros/                   # 25 carpetas de datos
│   ├── comercios/
│   ├── repartidores/
│   ├── clientes/
│   ├── pedidos/
│   └── [más carpetas...]
│
├── docs/                        # Documentación
└── [más archivos...]
```

---

## 🔐 Credenciales por Defecto

⚠️ **CAMBIAR EN PRODUCCIÓN**

### CEO Master
- Usuario: `ceo_yavoy`
- Contraseña: `YaVoy2025Master!CEO`

### Comercios
- Contraseña: `2215690902`

---

## 🌐 URLs Importantes

| URL | Descripción |
|-----|-------------|
| `http://localhost:5501` | Página principal |
| `http://localhost:5501/panel-ceo-master.html` | Panel CEO Master |
| `http://localhost:5501/panel-comercio.html` | Panel Comercios |
| `http://localhost:5501/panel-repartidor.html` | Panel Repartidores |
| `http://localhost:5501/panel-cliente-pro.html` | Panel Clientes |
| `http://localhost:5501/api/*` | API REST endpoints |

---

## 🆘 Solución de Problemas

### "Cannot find module 'express'"
```bash
# Faltaron instalar dependencias
npm install
```

### "Port 5501 already in use"
```bash
# Cambiar puerto en .env
PORT=5502
# O matar proceso existente:
# Windows: netstat -ano | findstr :5501
```

### "Error: ENOENT: no such file or directory, open '.env'"
```bash
# Crear archivo .env
cp .env.example .env
# Editar con tus valores
```

### Panel CEO no carga datos
```bash
# Verificar que el servidor está corriendo
# Verificar que la URL es correcta
# Comprobar consola del navegador (F12) para errores
```

### Email no se envía
```bash
# Verificar credenciales en .env
# Asegurarse de usar App Password de Gmail (no contraseña normal)
# Verificar que EMAIL_USER está configurado
```

---

## 📊 Pruebas Rápidas

### Probar Servidor
```bash
# Ver logs en consola
npm start
# Deberías ver:
# ✅ Servidor de email listo
# 🚀 Servidor escuchando en puerto 5501
```

### Probar Panel CEO
1. Abre http://localhost:5501/panel-ceo-master.html
2. Ingresa: usuario `ceo_yavoy`, contraseña `YaVoy2025Master!CEO`
3. Deberías ver dashboard con estadísticas

### Probar API
```bash
# En otra terminal o Postman:
curl http://localhost:5501/api/comercios
# Debería devolver lista de comercios en JSON
```

---

## 🚀 Desplegar a Hostinger

### 1. Subir archivos
```bash
# Usar FTP o gestor de archivos de Hostinger
# Subir todos los archivos a public_html o carpeta deseada
```

### 2. Instalar Node.js (si no está)
```bash
# En Hostinger, ir a cPanel
# Aplicaciones → Node.js
# Instalar versión LTS
```

### 3. Instalar dependencias
```bash
# En terminal de Hostinger
npm install
```

### 4. Configurar dominio
```bash
# En Hostinger
# Crear alias de dominio apuntando al puerto 5501
# O usar proxy inverso
```

### 5. Iniciar con PM2
```bash
npm install -g pm2
pm2 start server.js --name "yavoy"
pm2 save
pm2 startup
```

---

## 📞 Soporte

**Documentación completa:** Ver carpeta `/docs`  
**Email:** yavoyen5@gmail.com  
**Problemas:** Revisar archivos de log y console del navegador

---

## ✅ Checklist

- [ ] npm install ejecutado sin errores
- [ ] .env creado y configurado
- [ ] npm start ejecutado correctamente
- [ ] Servidor escucha en puerto 5501
- [ ] Panel CEO es accesible
- [ ] Login funciona
- [ ] Dashboard muestra estadísticas
- [ ] Puedo ver comercios

**Si todo el checklist está ✅, estás listo para usar YAvoy v3.1 🎉**

---

**¡Bienvenido a YAvoy v3.1!**

*Versión: 3.1.0*  
*Última actualización: 15 de Diciembre de 2025*
