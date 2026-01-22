# 🚀 Configuración de Repositorio YAvoyOk en GitHub

## 📋 Pasos para Crear el Repositorio

### 1️⃣ Crear Repositorio en GitHub

Ve a: **https://github.com/new**

**Configuración del repositorio:**

- **Repository name:** `YAvoyOk`
- **Description:** `YAvoy - Plataforma de entregas express con gestión de comercios y repartidores`
- **Visibility:** `Public` (o `Private` si prefieres)
- **⚠️ NO marcar:** "Initialize this repository with a README"
- **⚠️ NO agregar:** .gitignore (ya lo tenemos)
- **⚠️ NO agregar:** License (ya está en el proyecto)

### 2️⃣ Después de Crear el Repositorio

GitHub te mostrará instrucciones. **IGNORA** esas instrucciones y ejecuta estos comandos en tu terminal:

```powershell
# Configurar el nuevo remoto
git remote add origin https://github.com/TU_USUARIO/YAvoyOk.git

# Hacer push de todo el historial
git push -u origin main --force

# Verificar que se subió correctamente
git remote -v
```

**Reemplaza `TU_USUARIO`** con tu nombre de usuario de GitHub.

---

## 🔧 Comandos Rápidos

### Si ya creaste el repositorio:

```powershell
# Agregar el remoto (reemplaza TU_USUARIO)
git remote add origin https://github.com/TU_USUARIO/YAvoyOk.git

# Subir todo
git push -u origin main --force
```

### Para futuras actualizaciones:

```powershell
# Agregar cambios
git add .

# Commit
git commit -m "descripción de cambios"

# Push
git push origin main
```

---

## 📦 Sincronización con Hostinger

Una vez que el repositorio esté en GitHub:

### Opción 1: Despliegue Manual (Recomendado)

1. **Descargar ZIP desde GitHub:**
   - Ve a: `https://github.com/TU_USUARIO/YAvoyOk`
   - Click en el botón verde `Code`
   - Selecciona `Download ZIP`

2. **Subir a Hostinger:**
   - Accede al File Manager de Hostinger
   - Sube el contenido a `public_html` o la carpeta de tu dominio
   - Extrae el ZIP
   - Configura permisos (755 para carpetas, 644 para archivos)

### Opción 2: Git Deploy en Hostinger

Si Hostinger tiene acceso a Git:

```bash
# En terminal SSH de Hostinger
cd public_html
git clone https://github.com/TU_USUARIO/YAvoyOk.git .
```

Para actualizar:

```bash
cd public_html
git pull origin main
```

---

## 🌐 Configuración de yavoy.space

### Verificar DNS:

1. **Panel de Hostinger → Dominios**
2. Verificar que `yavoy.space` esté apuntando a tu hosting
3. Asegurar que el dominio esté asociado a la carpeta correcta

### Estructura recomendada en Hostinger:

```
/public_html/
  ├── index.html              (Landing principal)
  ├── panel-comercio.html
  ├── panel-repartidor.html
  ├── pedidos.html
  ├── css/
  ├── js/
  ├── icons/
  └── ... (resto de archivos)
```

---

## ✅ Verificación Post-Deploy

Después de subir a Hostinger, verifica:

- [ ] `https://yavoy.space` carga correctamente
- [ ] `https://yavoy.space/panel-comercio.html` funciona
- [ ] `https://yavoy.space/panel-repartidor.html` funciona
- [ ] `https://yavoy.space/pedidos.html` funciona
- [ ] Las redes sociales (WhatsApp, Facebook, Instagram) funcionan
- [ ] Los estilos CSS se cargan correctamente
- [ ] Las imágenes e iconos se muestran

---

## 📝 Información del Proyecto

- **Dominio:** yavoy.space
- **WhatsApp:** 2215047962
- **Facebook:** https://www.facebook.com/profile.php?id=61584920256289
- **Instagram:** https://www.instagram.com/yavoyen5/
- **Email:** yavoyen5@gmail.com

---

## 🆘 Soporte

Si tienes problemas:

1. **Verifica los logs** en Hostinger
2. **Revisa la consola del navegador** (F12) para errores de JavaScript
3. **Comprueba permisos** de archivos en el servidor
4. **Verifica rutas relativas** en HTML/CSS/JS

---

## 🎯 Estado Actual del Proyecto

✅ **Completado:**

- Sistema de gestión de pedidos con timeline visual
- Panel de comercio con catálogo de productos (límite 5 gratis)
- Panel de repartidor modernizado
- Búsqueda de pedidos en tiempo real
- Horario automático configurable
- Notificaciones push para nuevos pedidos
- Integración con WhatsApp, Facebook e Instagram
- Sistema de calculadora de costos
- Diseño responsive con tema cyan-gold
- Glassmorphism y efectos modernos

🔧 **Configurado:**

- Git con 20 commits
- .gitignore optimizado
- Documentación completa
- Número de WhatsApp actualizado (2215047962)

🚀 **Listo para:**

- Deploy a Hostinger
- Producción en yavoy.space
- Uso con clientes reales
