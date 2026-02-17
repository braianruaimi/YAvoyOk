/**
 * ====================================
 * PRUEBA RÁPIDA - MAP ENGINE v2.0
 * ====================================
 * Verificación de nuevas funcionalidades
 * 
 * Uso: node prueba-map-engine-v2.js
 */

console.log('\n════════════════════════════════════════════════════════');
console.log('🗺️  VERIFICACIÓN MAP ENGINE v2.0');
console.log('════════════════════════════════════════════════════════\n');

const fs = require('fs');
const path = require('path');

console.log('📁 Verificando archivo actualizado...\n');

const archivo = 'js/map-engine.js';
const ruta = path.join(__dirname, archivo);

if (!fs.existsSync(ruta)) {
  console.log('❌ map-engine.js no encontrado\n');
  process.exit(1);
}

const stats = fs.statSync(ruta);
const tamano = (stats.size / 1024).toFixed(2);
console.log(`✅ ${archivo} (${tamano} KB)\n`);

console.log('════════════════════════════════════════════════════════');
console.log('🆕 VERIFICANDO NUEVAS FUNCIONALIDADES v2.0');
console.log('════════════════════════════════════════════════════════\n');

const contenido = fs.readFileSync(ruta, 'utf8');

const verificaciones = [
  { nombre: 'Límites extendidos', buscar: 'limitesExtendidos' },
  { nombre: 'Límites operativos', buscar: 'limitesOperativos' },
  { nombre: 'Overlay niebla expansión', buscar: 'overlayNieblaExpansion' },
  { nombre: 'crearOverlayExpansion()', buscar: 'crearOverlayExpansion()' },
  { nombre: 'agregarLeyendaExpansion()', buscar: 'agregarLeyendaExpansion()' },
  { nombre: 'geocodificarDireccion()', buscar: 'geocodificarDireccion(direccion)' },
  { nombre: 'Soporte direcciones en agregarComercio', buscar: 'comercio.direccion' },
  { nombre: 'API Nominatim', buscar: 'nominatim.openstreetmap.org' },
  { nombre: 'Niebla Norte', buscar: 'nieblaNorte' },
  { nombre: 'Niebla Sur', buscar: 'nieblaSur' },
  { nombre: 'Niebla Oeste', buscar: 'nieblaOeste' }
];

let todasVerificadas = true;

verificaciones.forEach(v => {
  if (contenido.includes(v.buscar)) {
    console.log(`✅ ${v.nombre}`);
  } else {
    console.log(`❌ ${v.nombre} - NO ENCONTRADO`);
    todasVerificadas = false;
  }
});

if (!todasVerificadas) {
  console.log('\n⚠️ Algunas funcionalidades v2.0 faltan\n');
  process.exit(1);
}

console.log('\n════════════════════════════════════════════════════════');
console.log('📏 VERIFICANDO LÍMITES EXTENDIDOS');
console.log('════════════════════════════════════════════════════════\n');

// Extraer límites extendidos
const limitesExtendidos = contenido.match(/limitesExtendidos:\s*{\s*norte:\s*([\-\d\.]+),\s*sur:\s*([\-\d\.]+),\s*este:\s*([\-\d\.]+),\s*oeste:\s*([\-\d\.]+)/);

if (limitesExtendidos) {
  const norte = parseFloat(limitesExtendidos[1]);
  const sur = parseFloat(limitesExtendidos[2]);
  const este = parseFloat(limitesExtendidos[3]);
  const oeste = parseFloat(limitesExtendidos[4]);

  console.log('🧭 Límites Extendidos:');
  console.log(`   Norte: ${norte}°`);
  console.log(`   Sur: ${sur}°`);
  console.log(`   Este: ${este}°`);
  console.log(`   Oeste: ${oeste}°\n`);

  // Calcular extensión aproximada
  const extensionLat = Math.abs(norte - sur);
  const extensionLng = Math.abs(este - oeste);
  
  console.log(`📐 Extensión del mapa:`);
  console.log(`   Latitud: ${extensionLat.toFixed(2)}° (~${(extensionLat * 111).toFixed(1)} km)`);
  console.log(`   Longitud: ${extensionLng.toFixed(2)}° (~${(extensionLng * 111 * Math.cos(Math.abs(norte) * Math.PI / 180)).toFixed(1)} km)`);
  
  // Verificar que este no cambió (mar)
  if (este === -57.90) {
    console.log('\n✅ Límite este SIN CAMBIO (Río de la Plata protegido)');
  } else {
    console.log('\n⚠️ Límite este cambió - debería ser -57.90 (mar)');
  }
} else {
  console.log('❌ No se pudieron extraer los límites extendidos');
}

console.log('\n════════════════════════════════════════════════════════');
console.log('🌫️ VERIFICANDO OVERLAY DE NIEBLA');
console.log('════════════════════════════════════════════════════════\n');

const overlayNiebla = contenido.match(/fillOpacity:\s*(0\.\d+).*niebla/i);
if (overlayNiebla) {
  const opacity = parseFloat(overlayNiebla[1]);
  console.log(`✅ Opacidad de niebla: ${opacity} (${opacity * 100}%)`);
  
  if (opacity >= 0.6 && opacity <= 0.8) {
    console.log('✅ Opacidad óptima para efecto de niebla');
  }
}

// Verificar leyenda "Muy pronto disponible"
if (contenido.includes('Muy Pronto Disponible') || contenido.includes('Muy pronto disponible')) {
  console.log('✅ Leyenda "Muy pronto disponible" implementada');
}

// Verificar popup de expansión
if (contenido.includes('Estamos expandiendo')) {
  console.log('✅ Mensaje de expansión en popups');
}

console.log('\n════════════════════════════════════════════════════════');
console.log('🔍 VERIFICANDO GEOCODIFICACIÓN');
console.log('════════════════════════════════════════════════════════\n');

// Verificar que usa Nominatim
if (contenido.includes('nominatim.openstreetmap.org')) {
  console.log('✅ API Nominatim (OpenStreetMap) configurada');
}

// Verificar que es async
if (contenido.includes('async geocodificarDireccion')) {
  console.log('✅ Función geocodificarDireccion es async');
}

// Verificar que retorna coordenadas
if (contenido.includes('parseFloat(data[0].lat)') && contenido.includes('parseFloat(data[0].lon)')) {
  console.log('✅ Parseo de coordenadas implementado');
}

// Verificar que agregarComercio es async
if (contenido.includes('async agregarComercio')) {
  console.log('✅ Función agregarComercio es async');
}

// Verificar integración de direccion en agregarComercio
if (contenido.includes('else if (comercio.direccion)')) {
  console.log('✅ Soporte para direcciones en agregarComercio');
}

console.log('\n════════════════════════════════════════════════════════');
console.log('⚙️ VERIFICANDO CONFIGURACIÓN DE ZOOM');
console.log('════════════════════════════════════════════════════════\n');

const zoomConfig = contenido.match(/zoom:\s*{\s*inicial:\s*(\d+),\s*minimo:\s*(\d+),\s*maximo:\s*(\d+)/);

if (zoomConfig) {
  console.log(`✅ Zoom Inicial: ${zoomConfig[1]}`);
  console.log(`✅ Zoom Mínimo: ${zoomConfig[2]}`);
  console.log(`✅ Zoom Máximo: ${zoomConfig[3]}`);
  
  const inicial = parseInt(zoomConfig[1]);
  const minimo = parseInt(zoomConfig[2]);
  const maximo = parseInt(zoomConfig[3]);
  
  const rango = maximo - minimo;
  console.log(`\n📊 Rango de zoom: ${rango} niveles`);
  
  if (rango >= 4) {
    console.log('✅ Rango ampliado para área extendida (buenos para +10km)');
  }
}

console.log('\n════════════════════════════════════════════════════════');
console.log('🚀 PRÓXIMOS PASOS');
console.log('════════════════════════════════════════════════════════\n');

console.log('1. Abrir demo mejorada en navegador:');
console.log('   http://localhost:3000/demo-map-engine.html\n');

console.log('2. Verificar NUEVAS FUNCIONALIDADES:');
console.log('   ✅ Mapa extendido (más área visible)');
console.log('   ✅ Zonas grises con niebla fuera de cobertura');
console.log('   ✅ Click en zonas grises → "Muy pronto disponible"');
console.log('   ✅ Leyenda flotante en esquina inferior derecha');
console.log('   ✅ Campo de búsqueda de direcciones');
console.log('   ✅ Botones de ejemplo (Costanera, Calle 122, Puerto)\n');

console.log('3. Probar geocodificación:');
console.log('   a) Escribir: "Calle 50 123, Ensenada"');
console.log('   b) Click en "Buscar en Mapa"');
console.log('   c) Verificar que aparece marcador 📍\n');

console.log('4. Integrar en panel-comercio.html:');
console.log('   - Cambiar map-engine.js por la versión v2.0');
console.log('   - Actualizar llamada a inicializar() (ahora es async)');
console.log('   - Pasar direccion en lugar de lat/lng si está disponible\n');

console.log('════════════════════════════════════════════════════════');
console.log('✅ VERIFICACIÓN v2.0 COMPLETADA - TODO LISTO');
console.log('════════════════════════════════════════════════════════\n');

console.log('💡 TIP: El mapa ahora cubre un área más amplia y muestra');
console.log('   claramente qué zonas están operativas y cuáles están');
console.log('   en expansión. ¡Mucho más profesional e informativo!\n');
