// Testing simple de APIs
const http = require('http');

console.log('🧪 Testing APIs básicas...\n');

// Test 1: Debug básico
const testDebug = () => {
    return new Promise((resolve) => {
        const req = http.get('http://localhost:5502/api/debug/test-router', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log('✅ Debug API:', res.statusCode, data.substring(0, 50));
                resolve();
            });
        });
        req.on('error', (err) => {
            console.log('❌ Debug API error:', err.message);
            resolve();
        });
    });
};

// Test 2: MercadoPago public key
const testMercadoPago = () => {
    return new Promise((resolve) => {
        const req = http.get('http://localhost:5502/api/mercadopago/public-key', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log('✅ MercadoPago API:', res.statusCode, data.substring(0, 50));
                resolve();
            });
        });
        req.on('error', (err) => {
            console.log('❌ MercadoPago API error:', err.message);
            resolve();
        });
    });
};

// Test 3: Pedidos
const testPedidos = () => {
    return new Promise((resolve) => {
        const req = http.get('http://localhost:5502/api/pedidos', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log('✅ Pedidos API:', res.statusCode, data.substring(0, 50));
                resolve();
            });
        });
        req.on('error', (err) => {
            console.log('❌ Pedidos API error:', err.message);
            resolve();
        });
    });
};

async function runSimpleTest() {
    await testDebug();
    await testMercadoPago();
    await testPedidos();
    console.log('\n🏁 Testing completado');
}

runSimpleTest();