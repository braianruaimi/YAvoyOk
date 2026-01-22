# 🚀 Sincronización con GitHub - YAvoyOk

## Usuario de GitHub: braianruaimi

---

## 📋 Pasos para Subir a GitHub

### 1️⃣ Crear Repositorio en GitHub

1. Ve a: https://github.com/new
2. Completa los datos:
   - **Repository name:** `YAvoyOk`
   - **Description:** `YAvoy - Sistema completo de entregas con paneles de comercio, repartidor y gestión CEO`
   - **Visibilidad:** Public o Private
   - ❌ **NO marcar** "Initialize this repository with a README"
3. Click en **Create repository**

---

### 2️⃣ Configurar y Subir el Código

Ejecuta estos comandos en PowerShell:

```powershell
# Navegar al proyecto
cd "C:\Users\estudiante\Downloads\YAvoy_DEFINITIVO\YAvoy_DEFINITIVO"

# Eliminar remoto anterior (si existe)
git remote remove origin

# Agregar nuevo remoto
git remote add origin https://github.com/braianruaimi/YAvoyOk.git

# Verificar remoto
git remote -v

# Asegurar que estamos en main
git branch -M main

# Subir todo el código
git push -u origin main
```

---

### 3️⃣ Verificar en GitHub

1. Ve a: https://github.com/braianruaimi/YAvoyOk
2. Verifica que todos los archivos estén subidos
3. Revisa el README.md en la página principal

---

## 🌐 Sincronización con Hostinger (yavoy.space)

Una vez que el código esté en GitHub, puedes sincronizarlo con Hostinger:

### Opción A: Via SFTP (Recomendado)

```powershell
# Ver guía en SFTP_DEPLOYMENT_GUIDE.md
.\DEPLOY_SFTP.ps1
```

### Opción B: Via SSH + Git

Conecta por SSH a Hostinger y ejecuta:

```bash
cd public_html
git clone https://github.com/braianruaimi/YAvoyOk.git .
```

Para actualizaciones futuras:

```bash
cd public_html
git pull origin main
```

---

## 🔄 Flujo de Trabajo Recomendado

1. **Desarrollo Local** → Editas código en VS Code
2. **Commit Local** → `git add . && git commit -m "mensaje"`
3. **Push a GitHub** → `git push origin main`
4. **Deploy a Hostinger** → SSH y `git pull` o usar SFTP

---

## 📝 Comandos Útiles

```powershell
# Ver estado
git status

# Ver commits recientes
git log --oneline -10

# Ver remoto configurado
git remote -v

# Ver rama actual
git branch

# Crear commit rápido
git add -A
git commit -m "Actualización del sistema"
git push origin main
```

---

## ⚠️ Importante

- El repositorio debe llamarse **YAvoyOk**
- El usuario es **braianruaimi**
- La rama principal es **main**
- El archivo `.gitignore` ya está configurado para excluir:
  - node_modules
  - logs
  - backups
  - archivos temporales

---

## 🎯 URL del Repositorio

**GitHub:** https://github.com/braianruaimi/YAvoyOk
**Website:** https://yavoy.space

---

## 🆘 Solución de Problemas

### Error: "remote origin already exists"

```powershell
git remote remove origin
git remote add origin https://github.com/braianruaimi/YAvoyOk.git
```

### Error: "Updates were rejected"

```powershell
git pull origin main --rebase
git push origin main
```

### Error de autenticación

- Asegúrate de estar logueado en GitHub
- Usa Personal Access Token si es necesario
- Ve a: https://github.com/settings/tokens
