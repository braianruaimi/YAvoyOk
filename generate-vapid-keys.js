#!/usr/bin/env node

/**
 * Script para generar claves VAPID válidas para notificaciones push
 * Compatible con web-push library
 * Genera claves que cumplen con el formato de 65 bytes para public key
 */

const webpush = require('web-push');

console.log('🔑 Generando claves VAPID para YAvoy...\n');

// Generar las claves
const vapidKeys = webpush.generateVAPIDKeys();

// Verificar que la public key tenga 65 bytes cuando se decodifique
const publicKeyDecoded = Buffer.from(vapidKeys.publicKey, 'base64url');
if (publicKeyDecoded.length !== 65) {
  console.error('❌ Error: La clave pública no tiene 65 bytes');
  process.exit(1);
}

console.log('✅ Claves VAPID generadas exitosamente');
console.log('📏 Longitud de clave pública decodificada:', publicKeyDecoded.length, 'bytes\n');

console.log('=== COPIA ESTAS LÍNEAS A TU ARCHIVO .env ===');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log('VAPID_SUBJECT=mailto:tu-email@tudominio.com');
console.log('================================================\n');

console.log('💡 Instrucciones:');
console.log('1. Copia las líneas anteriores a tu .env');
console.log('2. Reemplaza "tu-email@tudominio.com" con tu email real');
console.log('3. Reinicia el servidor: npm run prod');
console.log('\n🎉 ¡Listo para notificaciones push!');