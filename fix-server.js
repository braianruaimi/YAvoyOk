const fs = require('fs');
const path = require('path');

const filePath = 'server.js';
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔍 Buscando marcadores de conflicto...');

// Contar conflictos
const conflictCount = (content.match(/<<<<<<< HEAD/g) || []).length;
console.log(`   Encontrados: ${conflictCount} conflicto(s)`);

// Remover todos los conflictos - mantener la sección HEAD
content = content.replace(/<<<<<<< HEAD\r?\n([\s\S]*?)\n=======\r?\n[\s\S]*?\n>>>>>>> [^\n]+\r?\n/g, '$1\n');

// Remover marcadores solos si quedan
content = content.replace(/<<<<<<< HEAD\r?\n/g, '');
content = content.replace(/=======\r?\n/g, '');
content = content.replace(/>>>>>>> [^\n]+\r?\n/g, '');

// Escribir archivo limpio
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Archivo limpio y guardado');
console.log('✅ Ahora ejecuta: npm start');
