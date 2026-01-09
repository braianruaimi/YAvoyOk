# 🚀 YAvoy — Plataforma de Reparto (PWA)

Aplicación web para conectar comercios locales con repartidores. Optimizada para móvil, con modo instalación (PWA), guardado de datos en el navegador y persistencia en archivos vía un micro-servidor Node.

## 🔎 Qué incluye
- Comercios con filtros por categorías: Empresas, Mayoristas, Indumentaria, Bazar, Kiosco, etc.
- Registro rápido de comercios con nombre, categoría, WhatsApp y email.
- En cada tarjeta de comercio: botón “Ver Detalles” y botón directo de WhatsApp (si hay número/link).
- Contacto general con teléfono, email y enlace a WhatsApp (redirección a wa.me).
- Sección Repartidores con popups informativos (Horarios, Ganancias, Envíos) y flujo en 2 pasos:
  - Pre-registro con D.N.I.
  - Carga de datos de vehículo (marca, modelo, dominio, Nº motor/chasis) y fotos del registro (frente/dorso).
- Panel Admin (Alt+A) para ver y exportar JSON/CSV de comercios, repartidores, vehículos y contactos.
- PWA con Service Worker v3, cache-busting (?v=3) y botón “Instalar App” cuando es soportado.
- Persistencia en archivos JSON por categoría con `server.js` (puerto 5501) dentro de `registros/`.

## 🗂️ Estructura principal
- `index.html`: Maquetado de secciones (Inicio, Comercios, Repartidores, Contacto) y modales.
- `styles.css` y `styles/`: Estilos generales y componentes.
- `script.js`: Lógica UI/UX, formularios, modales, WhatsApp dinámico, filtros, admin y guardado.
- `sw.js`, `manifest.json`, `icons/`: PWA y assets.
- `server.js`: Micro API Node para guardar comercios en carpetas por servicio.
- `INICIAR_SERVIDOR.bat` / `INICIAR_SERVIDOR.ps1`: Arranque fácil de servidor estático + túnel público.
- `registros/`: Carpeta donde se guardan JSON por categoría.

## ⚙️ Requisitos
- Windows 10/11.
- Node.js 16+ (recomendado LTS) y npm.

## ▶️ Formas de ejecutar

### Opción A — Automática (recomendada)
1) Doble clic en `INICIAR_SERVIDOR.bat`.
2) Se abrirán:
   - Servidor estático en `http://localhost:5500`.
   - Servidor de registros en `http://localhost:5501`.
   - Túnel público (LocalTunnel) con una URL `https://xxxxx.loca.lt` para usar desde el celular.

Copiá la URL pública en tu móvil (funciona por 4G/5G o Wi‑Fi de otra red).

### Opción B — Manual (PowerShell)
Ejecutá estos pasos desde la carpeta del proyecto:

```powershell
cd "C:\Users\estudiante\Desktop\Nueva carpeta"

# 1) Instalar dependencias (http-server en devDependencies)
npm install

# 2) Iniciar servidor de registros (5501)
node server.js

# 3) En otra ventana: iniciar servidor estático (5500)
npx http-server -p 5500 --cors

# 4) (Opcional) Túnel público para probar en el móvil
npx localtunnel --port 5500
```

Abrí `http://localhost:5500` en tu PC. Si usás túnel, abrí la URL `https://xxxxx.loca.lt` en tu celular.

## 🧾 Dónde se guardan los datos
- Navegador: `localStorage` guarda arrays `comercios`, `repartidores`, `vehiculos`, `contactos`.
- Archivos: `server.js` escribe JSON en `registros/<carpeta>/comercio_*.json` según la categoría:
  - `servicios-prioridad`, `servicios-alimentacion`, `servicios-salud`, `servicios-bazar`, `servicios-indumentaria`, `servicios-kiosco`, `servicios-otros`.

## 🧑‍💻 Panel Admin (Alt+A)
- Abrís una ventana con los datos actuales del navegador.
- Botones para descargar cada dataset en JSON/CSV.
- Botón para borrar todos los datos locales (solo `localStorage`).

## 📱 PWA y caché
- Service Worker v7 con cache inteligente.
- Para forzar actualización, los archivos principales usan `?v=7`.
- Si no ves cambios: recargá duro (Ctrl+F5) o limpiá caché de la app.

## 🧰 Problemas comunes
- No abre en el celular por IP local: algunos routers bloquean (AP isolation). Usá el túnel (`INICIAR_SERVIDOR.bat`).
- No se guardan archivos: asegurate de que `node server.js` esté corriendo en el puerto 5501.
- Bloqueo de firewall: habilitá la regla para el puerto 5500 si Windows pregunta.

## 🤝 Compartir con tu socio
1) Copiá toda la carpeta del proyecto.
2) En la PC de tu socio: instalar Node.js (si no lo tiene).
3) Doble clic en `INICIAR_SERVIDOR.bat` y compartir la URL pública que aparece.

---

Hecho con foco en UX móvil, instalación simple y datos portables (JSON).
