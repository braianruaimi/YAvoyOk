/**
 * 🧪 SCRIPT DE TESTING PARA APIS - YAvoy 2026
 * Prueba sistemática de todas las funcionalidades
 */

const http = require('http');

// Función helper para hacer requests
function makeRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5502,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ 
                        status: res.statusCode,
                        headers: res.headers,
                        data: jsonData
                    });
                } catch (error) {
                    resolve({ 
                        status: res.statusCode,
                        headers: res.headers,
                        data: data
                    });
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (data && method !== 'GET') {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

// Función de testing principal
async function runTests() {
    console.log('🧪 INICIANDO TESTING SISTEMÁTICO DE YAVOY 2026\n');

    const tests = [
        // 1. TESTS BÁSICOS
        {
            name: 'Test de conectividad básica',
            path: '/api/debug/test-router',
            method: 'GET'
        },
        {
            name: 'Estado de seguridad',
            path: '/api/debug/security-status',
            method: 'GET'
        },

        // 2. TESTS DE MERCADOPAGO
        {
            name: 'Obtener clave pública MercadoPago',
            path: '/api/mercadopago/public-key',
            method: 'GET'
        },
        {
            name: 'Crear QR de pago',
            path: '/api/mercadopago/crear-qr',
            method: 'POST',
            data: {
                pedidoId: 'test-001',
                monto: 1500,
                descripcion: 'Pedido de prueba',
                comercio: 'Restaurante Test',
                cliente: 'Cliente Test',
                email: 'test@example.com',
                token: 'test_token_12345'
            }
        },
        {
            name: 'Verificar pago',
            path: '/api/mercadopago/verificar-pago/test-001',
            method: 'GET'
        },
        {
            name: 'Estadísticas MercadoPago',
            path: '/api/mercadopago/stats',
            method: 'GET'
        },

        // 3. TESTS DE PEDIDOS
        {
            name: 'Listar pedidos',
            path: '/api/pedidos',
            method: 'GET'
        },
        {
            name: 'Crear pedido test',
            path: '/api/pedidos',
            method: 'POST',
            data: {
                nombreCliente: 'Juan Test',
                telefonoCliente: '+54911234567',
                direccionEntrega: 'Av. Test 123',
                descripcion: 'Pedido de prueba',
                monto: 2500,
                comercioId: 'test-comercio',
                metodoPago: 'mercadopago'
            }
        },

        // 4. TESTS DE AUTENTICACIÓN
        {
            name: 'Documentación de Auth',
            path: '/api/auth/docs',
            method: 'GET'
        },

        // 5. TESTS DE CALIFICACIONES
        {
            name: 'Listar calificaciones',
            path: '/api/calificaciones',
            method: 'GET'
        },

        // 6. TESTS DE ANALYTICS
        {
            name: 'Datos completos dashboard',
            path: '/api/analytics/datos-completos',
            method: 'GET'
        },

        // 7. TESTS DE SISTEMA
        {
            name: 'VAPID public key',
            path: '/api/vapid-public-key',
            method: 'GET'
        },
        {
            name: 'Dashboard stats',
            path: '/api/dashboard/stats',
            method: 'GET'
        }
    ];

    let passedTests = 0;
    let failedTests = 0;
    const results = [];

    for (let i = 0; i < tests.length; i++) {
        const test = tests[i];
        console.log(`\n🔬 [${i + 1}/${tests.length}] ${test.name}`);
        console.log(`   📡 ${test.method} ${test.path}`);
        
        try {
            const result = await makeRequest(test.path, test.method, test.data);
            
            if (result.status >= 200 && result.status < 400) {
                console.log(`   ✅ PASS - Status: ${result.status}`);
                if (result.data && typeof result.data === 'object') {
                    console.log(`   📄 Response: ${JSON.stringify(result.data).substring(0, 100)}...`);
                }
                passedTests++;
                results.push({ ...test, status: 'PASS', code: result.status, response: result.data });
            } else {
                console.log(`   ❌ FAIL - Status: ${result.status}`);
                console.log(`   🚨 Error: ${JSON.stringify(result.data)}`);
                failedTests++;
                results.push({ ...test, status: 'FAIL', code: result.status, response: result.data });
            }
        } catch (error) {
            console.log(`   💥 ERROR - ${error.message}`);
            failedTests++;
            results.push({ ...test, status: 'ERROR', error: error.message });
        }
        
        // Pequeña pausa entre requests
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // RESUMEN FINAL
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE TESTING');
    console.log('='.repeat(60));
    console.log(`✅ Tests exitosos: ${passedTests}`);
    console.log(`❌ Tests fallidos: ${failedTests}`);
    console.log(`📈 Porcentaje éxito: ${((passedTests / tests.length) * 100).toFixed(1)}%`);

    // DETALLES POR CATEGORÍA
    console.log('\n📋 RESULTADOS POR CATEGORÍA:');
    
    const categories = {
        'Básicos': results.filter(r => r.path.includes('/debug')),
        'MercadoPago': results.filter(r => r.path.includes('/mercadopago')),
        'Pedidos': results.filter(r => r.path.includes('/pedidos')),
        'Autenticación': results.filter(r => r.path.includes('/auth')),
        'Sistema': results.filter(r => !r.path.includes('/debug') && !r.path.includes('/mercadopago') && !r.path.includes('/pedidos') && !r.path.includes('/auth'))
    };

    for (const [category, categoryResults] of Object.entries(categories)) {
        if (categoryResults.length > 0) {
            const passed = categoryResults.filter(r => r.status === 'PASS').length;
            const failed = categoryResults.filter(r => r.status !== 'PASS').length;
            console.log(`\n🏷️  ${category}: ${passed}/${categoryResults.length} ✅`);
            
            categoryResults.forEach(result => {
                const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '💥';
                console.log(`   ${icon} ${result.name} (${result.code || 'ERROR'})`);
            });
        }
    }

    console.log('\n🎯 ANÁLISIS DE FUNCIONALIDADES CRÍTICAS:');
    
    const criticalAPIs = [
        '/api/mercadopago/public-key',
        '/api/mercadopago/crear-qr',
        '/api/pedidos',
        '/api/debug/test-router'
    ];

    criticalAPIs.forEach(api => {
        const result = results.find(r => r.path === api);
        if (result) {
            const icon = result.status === 'PASS' ? '✅' : '🚨';
            console.log(`${icon} ${api} - ${result.status}`);
        }
    });

    return {
        total: tests.length,
        passed: passedTests,
        failed: failedTests,
        percentage: ((passedTests / tests.length) * 100).toFixed(1),
        results: results
    };
}

// Ejecutar tests si se ejecuta directamente
if (require.main === module) {
    runTests().then(summary => {
        console.log('\n🏁 Testing completado');
        process.exit(summary.failed > 0 ? 1 : 0);
    }).catch(error => {
        console.error('💥 Error fatal en testing:', error);
        process.exit(1);
    });
}

module.exports = { runTests, makeRequest };