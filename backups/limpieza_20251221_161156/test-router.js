// test-router.js - Verificar router
const router = require('./src/routes/pedidosRoutes');

console.log('✅ Router cargado');
console.log('Tipo:', typeof router);
console.log('Es función:', typeof router === 'function');
console.log('Tiene stack:', !!router.stack);
console.log('Stack length:', router.stack ? router.stack.length : 0);

if (router.stack) {
  console.log('\n📋 Rutas registradas en el router:');
  router.stack.forEach((layer, i) => {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
      console.log(`  [${i}] ${methods} ${layer.route.path}`);
    } else {
      console.log(`  [${i}] middleware`);
    }
  });
}
