// compatibility.js - Asegurar compatibilidad con todos los navegadores
(function() {
    'use strict';
    
    // Detectar navegador
    const userAgent = navigator.userAgent.toLowerCase();
    const isEdge = userAgent.indexOf('edg') > -1;
    const isChrome = userAgent.indexOf('chrome') > -1 && !isEdge;
    const isFirefox = userAgent.indexOf('firefox') > -1;
    const isSafari = userAgent.indexOf('safari') > -1 && !isChrome && !isEdge;
    
    console.log('🌐 Navegador detectado:', {
        Edge: isEdge,
        Chrome: isChrome,
        Firefox: isFirefox,
        Safari: isSafari
    });
    
    // Verificar compatibilidad de APIs
    const features = {
        fetch: typeof fetch !== 'undefined',
        promise: typeof Promise !== 'undefined',
        asyncAwait: true, // No se puede detectar directamente
        classList: 'classList' in document.createElement('div'),
        localStorage: (function() {
            try {
                localStorage.setItem('test', 'test');
                localStorage.removeItem('test');
                return true;
            } catch(e) {
                return false;
            }
        })(),
        serviceWorker: 'serviceWorker' in navigator
    };
    
    console.log('✅ Características soportadas:', features);
    
    // Polyfill para fetch (si no existe)
    if (!features.fetch) {
        console.warn('⚠️ Fetch API no soportado. Cargando polyfill...');
        // Fallback simple usando XMLHttpRequest
        window.fetch = function(url, options) {
            return new Promise(function(resolve, reject) {
                const xhr = new XMLHttpRequest();
                xhr.open(options && options.method || 'GET', url);
                
                if (options && options.headers) {
                    Object.keys(options.headers).forEach(function(key) {
                        xhr.setRequestHeader(key, options.headers[key]);
                    });
                }
                
                xhr.onload = function() {
                    resolve({
                        ok: xhr.status >= 200 && xhr.status < 300,
                        status: xhr.status,
                        json: function() {
                            return Promise.resolve(JSON.parse(xhr.responseText));
                        },
                        text: function() {
                            return Promise.resolve(xhr.responseText);
                        }
                    });
                };
                
                xhr.onerror = function() {
                    reject(new Error('Error de red'));
                };
                
                xhr.send(options && options.body || null);
            });
        };
    }
    
    // Polyfill para Promise (Edge antiguo)
    if (!features.promise) {
        console.error('❌ Promise no soportado. Navegador muy antiguo.');
        alert('Tu navegador es muy antiguo. Por favor actualiza Microsoft Edge a la última versión.');
    }
    
    // Polyfill para classList (navegadores muy antiguos)
    if (!features.classList) {
        console.warn('⚠️ classList no soportado. Agregando fallback...');
        // Fallback básico
        HTMLElement.prototype.addClass = function(className) {
            if (this.className.indexOf(className) === -1) {
                this.className += ' ' + className;
            }
        };
        HTMLElement.prototype.removeClass = function(className) {
            this.className = this.className.replace(new RegExp('\\b' + className + '\\b', 'g'), '');
        };
    }
    
    // Función helper para manejar errores de CORS
    window.handleFetchError = function(error) {
        console.error('Error en fetch:', error);
        
        if (error.message.includes('Failed to fetch')) {
            return {
                error: true,
                message: 'No se pudo conectar al servidor. Verifica que el servidor esté corriendo en http://localhost:5501'
            };
        }
        
        return {
            error: true,
            message: error.message
        };
    };
    
    // Función helper para fetch con timeout
    window.fetchWithTimeout = function(url, options, timeout) {
        timeout = timeout || 10000; // 10 segundos por defecto
        
        return Promise.race([
            fetch(url, options),
            new Promise(function(_, reject) {
                setTimeout(function() {
                    reject(new Error('Timeout: La petición tardó demasiado'));
                }, timeout);
            })
        ]);
    };
    
    // Agregar estilos CSS para indicador de compatibilidad
    const style = document.createElement('style');
    style.textContent = `
        .browser-warning {
            position: fixed;
            top: 10px;
            right: 10px;
            background: #ff9800;
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 14px;
            display: none;
        }
        .browser-warning.show {
            display: block;
            animation: slideIn 0.3s ease;
        }
        @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
        }
    `;
    document.head.appendChild(style);
    
    // Mostrar advertencia si hay problemas de compatibilidad
    if (!features.fetch || !features.promise) {
        const warning = document.createElement('div');
        warning.className = 'browser-warning show';
        warning.innerHTML = '⚠️ Tu navegador necesita actualización para funcionar correctamente';
        document.body.appendChild(warning);
        
        setTimeout(function() {
            warning.classList.remove('show');
        }, 5000);
    }
    
    // Verificar conectividad con el servidor
    function checkServerConnection() {
        fetch('/api/repartidores')
            .then(function(response) {
                if (response.ok) {
                    console.log('✅ Conexión con servidor: OK');
                    return response.json();
                }
                throw new Error('Servidor no responde correctamente');
            })
            .then(function(data) {
                console.log('📊 Datos del servidor:', data);
            })
            .catch(function(error) {
                console.error('❌ Error de conexión:', error);
                console.log('💡 Solución: Asegúrate de que el servidor esté corriendo con "node server.js"');
            });
    }
    
    // Verificar conexión cuando cargue el DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkServerConnection);
    } else {
        checkServerConnection();
    }
    
    console.log('✅ Sistema de compatibilidad inicializado');
    
})();
