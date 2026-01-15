// ====================================
// AUTO-RELOAD SCRIPT PARA YAVOY
// ====================================
// Inyectar en todas las páginas HTML para reload automático

(function() {
    'use strict';
    
    let socket;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    
    function connectReloadSocket() {
        try {
            // Conectar al servidor WebSocket en puerto 5502
            socket = new WebSocket(`ws://${window.location.hostname}:${window.location.port}`);
            
            socket.onopen = function() {
                console.log('🔄 Auto-reload conectado');
                reconnectAttempts = 0;
                
                // Mostrar indicador visual
                showReloadIndicator('Conectado', '#10b981');
            };
            
            socket.onmessage = function(event) {
                const data = JSON.parse(event.data);
                
                if (data.type === 'reload') {
                    console.log('🔄 Detectados cambios en:', data.file);
                    showReloadIndicator('Recargando...', '#f59e0b');
                    
                    // Recargar después de 500ms
                    setTimeout(() => {
                        location.reload();
                    }, 500);
                }
            };
            
            socket.onclose = function() {
                console.log('❌ Auto-reload desconectado');
                
                // Intentar reconectar
                if (reconnectAttempts < maxReconnectAttempts) {
                    reconnectAttempts++;
                    console.log(`🔄 Intentando reconectar (${reconnectAttempts}/${maxReconnectAttempts})...`);
                    setTimeout(connectReloadSocket, 2000);
                }
            };
            
            socket.onerror = function(error) {
                console.warn('⚠️ Error en auto-reload:', error);
            };
            
        } catch (error) {
            console.warn('⚠️ Auto-reload no disponible:', error.message);
        }
    }
    
    function showReloadIndicator(message, color) {
        let indicator = document.getElementById('auto-reload-indicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'auto-reload-indicator';
            indicator.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                font-size: 14px;
                font-family: monospace;
                z-index: 999999;
                backdrop-filter: blur(10px);
                border: 2px solid ${color};
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                transition: all 0.3s ease;
            `;
            document.body.appendChild(indicator);
        }
        
        indicator.textContent = `🔄 ${message}`;
        indicator.style.borderColor = color;
        
        // Ocultar después de 3 segundos
        setTimeout(() => {
            if (indicator && indicator.parentNode) {
                indicator.style.opacity = '0';
                setTimeout(() => {
                    if (indicator && indicator.parentNode) {
                        indicator.parentNode.removeChild(indicator);
                    }
                }, 300);
            }
        }, 3000);
    }
    
    // Iniciar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', connectReloadSocket);
    } else {
        connectReloadSocket();
    }
    
})();
