# 📝 Instrucciones para Subir a GitHub

## 🚀 Pasos para Crear y Sincronizar el Repositorio

### 1️⃣ Crear Repositorio en GitHub

1. Ve a [github.com](https://github.com) e inicia sesión
2. Haz clic en el botón **"+"** (arriba derecha) → **"New repository"**
3. Completa los datos:
   - **Repository name:** `yavoy-sistema-reparto`
   - **Description:** `Sistema completo de gestión de pedidos y entregas - Conecta clientes, comercios y repartidores`
   - **Visibility:** Elige **Private** (recomendado) o **Public**
   - **NO** marques "Initialize this repository with README" (ya tenemos archivos)
4. Haz clic en **"Create repository"**

---

### 2️⃣ Conectar tu Repositorio Local con GitHub

GitHub te mostrará una página con comandos. Copia la **URL** de tu repositorio (algo como: `https://github.com/TU_USUARIO/yavoy-sistema-reparto.git`)

Luego ejecuta estos comandos en PowerShell:

```powershell
# Agregar el remote de GitHub
git remote add origin https://github.com/TU_USUARIO/yavoy-sistema-reparto.git

# Verificar que se agregó correctamente
git remote -v

# Subir el código a GitHub (rama main)
git push -u origin master
```

---

### 3️⃣ Autenticación

Si es la primera vez que usas GitHub desde esta PC, te pedirá autenticación:

#### Opción A: Personal Access Token (Recomendado)

1. Ve a: Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Crea un token con permisos: `repo`, `workflow`
3. Copia el token
4. Cuando te pida contraseña, pega el token

#### Opción B: GitHub CLI

```powershell
winget install GitHub.cli
gh auth login
```

---

### 4️⃣ Verificar que Subió Correctamente

1. Refresca la página de tu repositorio en GitHub
2. Deberías ver todos los archivos del proyecto
3. El README.md se mostrará en la página principal

---

## 🔄 Comandos Útiles para el Futuro

### Guardar Cambios y Subir a GitHub

```powershell
# Ver cambios
git status

# Agregar todos los cambios
git add .

# Hacer commit
git commit -m "📝 Descripción de los cambios"

# Subir a GitHub
git push
```

### Descargar Cambios de GitHub

```powershell
git pull
```

### Ver Historial

```powershell
git log --oneline
```

---

## 📋 Estado Actual

✅ Repositorio Git inicializado
✅ Commit inicial creado (415 archivos)
✅ Usuario configurado: YAvoy Developer (yavoyen5@gmail.com)
⏳ **Pendiente:** Crear repositorio en GitHub y conectarlo

---

## 🆘 Si Tienes Problemas

### Error: "remote origin already exists"

```powershell
git remote remove origin
git remote add origin URL_DE_TU_REPO
```

### Error: "Authentication failed"

- Asegúrate de usar un Personal Access Token, no tu contraseña de GitHub
- O usa `gh auth login` con GitHub CLI

---

**¿Necesitas ayuda?** Comparte el error específico que veas en la terminal.
