// 🧪 SCRIPT DE DATOS DE PRUEBA PARA PANEL REPARTIDOR

console.log('🧪 Configurando datos de prueba...');

// 1. Configurar usuario repartidor
const repartidor = {
    id: 'REP-001',
    nombre: 'Juan Pérez',
    apellido: 'Gómez',
    email: 'juan.repartidor@yavoy.com',
    telefono: '351-1234567',
    tipo: 'repartidor',
    ciudad: 'Córdoba',
    vehiculo: 'moto',
    ubicacionLat: -31.4201,
    ubicacionLng: -64.1888,
    verificado: true
};

localStorage.setItem('currentUser', JSON.stringify(repartidor));
console.log('✅ Repartidor configurado:', repartidor.nombre);

// 2. Crear pedidos de prueba
const pedidosPrueba = [
    {
        id: 'PED-' + Date.now(),
        numero: '#PED-001',
        estado: 'pendiente',
        comercio: 'Pizzería Don Mario',
        direccion: 'Av. Colón 1234, Córdoba',
        telefono: '351-1111111',
        total: 850,
        fecha: new Date().toISOString(),
        productos: [
            { nombre: 'Pizza Muzzarella', cantidad: 1, precio: 650 },
            { nombre: 'Coca Cola 1.5L', cantidad: 1, precio: 200 }
        ]
    },
    {
        id: 'PED-' + (Date.now() + 1),
        numero: '#PED-002',
        estado: 'pendiente',
        comercio: 'Farmacia La Salud',
        direccion: 'Calle San Martín 567, Córdoba',
        telefono: '351-2222222',
        total: 1200,
        fecha: new Date().toISOString(),
        productos: [
            { nombre: 'Medicamentos varios', cantidad: 1, precio: 1200 }
        ]
    },
    {
        id: 'PED-' + (Date.now() + 2),
        numero: '#PED-003',
        estado: 'pendiente',
        comercio: 'Kiosco El Rápido',
        direccion: 'Av. Vélez Sarsfield 890, Córdoba',
        telefono: '351-3333333',
        total: 450,
        fecha: new Date().toISOString(),
        productos: [
            { nombre: 'Snacks y bebidas', cantidad: 1, precio: 450 }
        ]
    },
    // Pedido ya aceptado por este repartidor
    {
        id: 'PED-' + (Date.now() + 3),
        numero: '#PED-004',
        estado: 'aceptado',
        repartidor: 'REP-001',
        comercio: 'Boutique Estilo',
        direccion: 'Bv. Illia 234, Córdoba',
        telefono: '351-4444444',
        total: 2500,
        fecha: new Date(Date.now() - 600000).toISOString(), // Hace 10 min
        fechaAceptado: new Date(Date.now() - 300000).toISOString(), // Hace 5 min
        productos: [
            { nombre: 'Ropa', cantidad: 1, precio: 2500 }
        ]
    },
    // Pedido en camino
    {
        id: 'PED-' + (Date.now() + 4),
        numero: '#PED-005',
        estado: 'en_camino',
        repartidor: 'REP-001',
        comercio: 'Panadería El Sol',
        direccion: 'Calle Rivadavia 445, Córdoba',
        telefono: '351-5555555',
        total: 680,
        fecha: new Date(Date.now() - 1200000).toISOString(), // Hace 20 min
        fechaAceptado: new Date(Date.now() - 900000).toISOString(), // Hace 15 min
        fechaEnCamino: new Date(Date.now() - 300000).toISOString(), // Hace 5 min
        productos: [
            { nombre: 'Pan y facturas', cantidad: 1, precio: 680 }
        ]
    },
    // Pedidos completados (para estadísticas)
    {
        id: 'PED-COMP-1',
        numero: '#PED-101',
        estado: 'entregado',
        repartidor: 'REP-001',
        comercio: 'Restaurante La Cocina',
        direccion: 'Av. Fader 123, Córdoba',
        telefono: '351-6666666',
        total: 1500,
        fecha: new Date(Date.now() - 7200000).toISOString(), // Hace 2 horas
        fechaAceptado: new Date(Date.now() - 6900000).toISOString(),
        fechaEnCamino: new Date(Date.now() - 6600000).toISOString(),
        fechaEntregado: new Date(Date.now() - 6300000).toISOString(),
        productos: [
            { nombre: 'Almuerzo completo', cantidad: 1, precio: 1500 }
        ]
    },
    {
        id: 'PED-COMP-2',
        numero: '#PED-102',
        estado: 'entregado',
        repartidor: 'REP-001',
        comercio: 'Supermercado Central',
        direccion: 'Av. Colón 5678, Córdoba',
        telefono: '351-7777777',
        total: 3200,
        fecha: new Date(Date.now() - 14400000).toISOString(), // Hace 4 horas
        fechaAceptado: new Date(Date.now() - 14100000).toISOString(),
        fechaEnCamino: new Date(Date.now() - 13800000).toISOString(),
        fechaEntregado: new Date(Date.now() - 13500000).toISOString(),
        productos: [
            { nombre: 'Compras varias', cantidad: 1, precio: 3200 }
        ]
    }
];

// Guardar pedidos en localStorage
let pedidosExistentes = JSON.parse(localStorage.getItem('pedidos')) || [];
// Agregar solo si no existen
pedidosPrueba.forEach(nuevoPedido => {
    const existe = pedidosExistentes.find(p => p.numero === nuevoPedido.numero);
    if (!existe) {
        pedidosExistentes.push(nuevoPedido);
    }
});
localStorage.setItem('pedidos', JSON.stringify(pedidosExistentes));

console.log('✅ Pedidos creados:', pedidosExistentes.length);
console.log('   - Disponibles:', pedidosExistentes.filter(p => p.estado === 'pendiente' && !p.repartidor).length);
console.log('   - Activos:', pedidosExistentes.filter(p => p.repartidor === 'REP-001' && ['aceptado', 'en_camino'].includes(p.estado)).length);
console.log('   - Completados:', pedidosExistentes.filter(p => p.repartidor === 'REP-001' && p.estado === 'entregado').length);

// 3. Calcular ganancias de prueba
const completados = pedidosExistentes.filter(p => p.repartidor === 'REP-001' && p.estado === 'entregado');
const gananciaTotal = completados.reduce((sum, p) => sum + (p.total * 0.8), 0);

console.log('💰 Ganancias totales:', gananciaTotal.toFixed(2));
console.log('');
console.log('🎯 DATOS LISTOS - Recarga la página (F5)');
console.log('');
console.log('📋 Cómo usar:');
console.log('1. Ve al tab "Disponibles" para ver pedidos sin asignar');
console.log('2. Click en "Aceptar Pedido" para tomar uno');
console.log('3. El pedido aparecerá en "Activos"');
console.log('4. Usa los botones para cambiar estados');
console.log('5. Las ganancias se calculan automáticamente (80%)');
