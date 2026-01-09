# YAvoy — Guía Rápida para Compartir

Esta guía es para que cualquier socio/colaborador pueda abrir el proyecto y probarlo en minutos.

## Requisitos
- Windows 10/11
- Node.js 16+ y npm

## Arranque en 1 clic (recomendado)
1. Doble clic en `INICIAR_SERVIDOR.bat`.
2. Esperá que se muestren:
   - Servidor estático en `http://localhost:5500`
   - Servidor de registros en `http://localhost:5501`
   - URL pública (LocalTunnel) tipo `https://xxxxx.loca.lt`
3. Abrí la URL pública en tu celular para probar desde cualquier red.

## Arranque manual (PowerShell)
```powershell
cd "C:\Users\estudiante\Desktop\Nueva carpeta"

npm install

# Servidor de registros (5501)
node server.js

# En otra ventana: servidor estático (5500)
npx http-server -p 5500 --cors

# Opcional: túnel público para el móvil
npx localtunnel --port 5500
```

## Qué probar
- Registrar un comercio (nombre, categoría, WhatsApp, email).
- Abrir detalles de un comercio y el botón WhatsApp.
- Sección Repartidores: pre-registro con D.N.I. y luego datos del vehículo.
- Panel Admin (Alt+A) para ver/descargar datos.

## Dónde se guardan los datos
- Navegador: `localStorage` (comercios, repartidores, vehículos, contactos).
- Disco: carpeta `registros/` con JSON por categoría cuando está activo `server.js`.

## Si algo no funciona
- Usá el túnel público en lugar de la IP local del PC.
- Aceptá el permiso del firewall para el puerto 5500.
- Asegurate de tener Node.js instalado (reiniciá PowerShell si lo acabás de instalar).

¡Listo! Con esto ya podés compartir y validar el flujo completo en pocos minutos.
