/**
 * YAVOY v3.1 - Chatbot IA Universal con Contexto
 * Asistente inteligente adaptado al rol del usuario
 * @author YAvoy Team
 * @version 3.1
 */

class YAvoyChatbot {
    constructor(userRole) {
        this.userRole = userRole;
        this.isOpen = false;
        this.conversationHistory = [];
        this.userId = null;
        this.userName = null;
        
        this.init();
    }

    /**
     * Inicializa el chatbot
     */
    init() {
        this.getUserInfo();
        this.createChatbotUI();
        this.attachEventListeners();
        this.loadConversationHistory();
    }

    /**
     * Obtiene información del usuario
     */
    getUserInfo() {
        const userData = window.yavoyGetUserData ? window.yavoyGetUserData() : null;
        if (userData) {
            this.userId = userData.id;
            this.userName = userData.name;
        }
    }

    /**
     * Crea la interfaz del chatbot
     */
    createChatbotUI() {
        const container = document.getElementById('chatbot-container') || document.body;
        
        const chatbotHTML = `
            <div id="yavoy-chatbot" class="yavoy-chatbot-widget">
                <button id="chatbot-toggle" class="chatbot-toggle-btn">
                    💬
                </button>
                
                <div id="chatbot-window" class="chatbot-window" style="display: none;">
                    <div class="chatbot-header">
                        <div class="chatbot-title">
                            <span class="chatbot-icon">🤖</span>
                            <span>Asistente YAvoy</span>
                        </div>
                        <button id="chatbot-close" class="chatbot-close-btn">✕</button>
                    </div>
                    
                    <div id="chatbot-messages" class="chatbot-messages">
                        <div class="chatbot-message bot-message">
                            <div class="message-content">
                                ${this.getWelcomeMessage()}
                            </div>
                        </div>
                    </div>
                    
                    <div class="chatbot-input-container">
                        <input 
                            type="text" 
                            id="chatbot-input" 
                            class="chatbot-input" 
                            placeholder="Escribe tu pregunta..."
                            autocomplete="off"
                        />
                        <button id="chatbot-send" class="chatbot-send-btn">📤</button>
                    </div>
                    
                    <div class="chatbot-suggestions">
                        ${this.getSuggestions()}
                    </div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', chatbotHTML);
        this.injectStyles();
    }

    /**
     * Obtiene mensaje de bienvenida según el rol
     */
    getWelcomeMessage() {
        const messages = {
            cliente: `¡Hola ${this.userName || 'Cliente'}! 👋<br>Soy tu asistente virtual. Puedo ayudarte a:<br>
                • Rastrear tu pedido en tiempo real<br>
                • Encontrar comercios cercanos<br>
                • Resolver dudas sobre tu cuenta`,
            
            repartidor: `¡Hola ${this.userName || 'Repartidor'}! 🏍️<br>Estoy aquí para ayudarte con:<br>
                • Estado de tus pedidos activos<br>
                • Resumen de ganancias<br>
                • Soporte técnico y rutas`,
            
            comercio: `¡Hola ${this.userName || 'Comercio'}! 🏪<br>Puedo asistirte con:<br>
                • Estado de pedidos pendientes<br>
                • Gestión de inventario<br>
                • Análisis de ventas`,
            
            ceo: `Bienvenido Administrador 👑<br>Análisis y métricas disponibles:<br>
                • Resumen de ventas del día<br>
                • Estado de la plataforma<br>
                • Gestión de usuarios`
        };
        
        return messages[this.userRole] || messages.cliente;
    }

    /**
     * Obtiene sugerencias contextuales según el rol
     */
    getSuggestions() {
        const suggestions = {
            cliente: [
                '¿Dónde está mi pedido?',
                'Comercios cercanos',
                'Modificar mi pedido'
            ],
            repartidor: [
                'Mis ganancias hoy',
                'Pedidos disponibles',
                'Soporte técnico'
            ],
            comercio: [
                'Pedidos pendientes',
                'Ventas del día',
                'Repartidores activos'
            ],
            ceo: [
                'Resumen del día',
                'Transacciones recientes',
                'Usuarios activos'
            ]
        };
        
        const items = suggestions[this.userRole] || suggestions.cliente;
        
        return items.map(text => 
            `<button class="suggestion-btn" data-query="${text}">${text}</button>`
        ).join('');
    }

    /**
     * Adjunta eventos a los elementos
     */
    attachEventListeners() {
        const toggleBtn = document.getElementById('chatbot-toggle');
        const closeBtn = document.getElementById('chatbot-close');
        const sendBtn = document.getElementById('chatbot-send');
        const input = document.getElementById('chatbot-input');
        
        toggleBtn.addEventListener('click', () => this.toggleChat());
        closeBtn.addEventListener('click', () => this.toggleChat());
        sendBtn.addEventListener('click', () => this.sendMessage());
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        
        // Sugerencias
        document.querySelectorAll('.suggestion-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const query = e.target.dataset.query;
                input.value = query;
                this.sendMessage();
            });
        });
    }

    /**
     * Alterna la visibilidad del chat
     */
    toggleChat() {
        const window = document.getElementById('chatbot-window');
        const toggleBtn = document.getElementById('chatbot-toggle');
        
        this.isOpen = !this.isOpen;
        
        if (this.isOpen) {
            window.style.display = 'flex';
            toggleBtn.style.display = 'none';
            document.getElementById('chatbot-input').focus();
        } else {
            window.style.display = 'none';
            toggleBtn.style.display = 'flex';
        }
    }

    /**
     * Envía un mensaje
     */
    async sendMessage() {
        const input = document.getElementById('chatbot-input');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Agregar mensaje del usuario
        this.addMessage(message, 'user');
        input.value = '';
        
        // Mostrar indicador de escritura
        this.showTypingIndicator();
        
        // Procesar mensaje
        const response = await this.processMessage(message);
        
        // Remover indicador y mostrar respuesta
        this.hideTypingIndicator();
        this.addMessage(response, 'bot');
        
        // Guardar en historial
        this.conversationHistory.push({ user: message, bot: response });
        this.saveConversationHistory();
    }

    /**
     * Procesa el mensaje según el contexto del usuario
     */
    async processMessage(message) {
        const lowerMessage = message.toLowerCase();
        
        try {
            // Intentar respuesta desde el servidor (con IA)
            const response = await fetch('/api/chatbot/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('yavoy_token')}`
                },
                body: JSON.stringify({
                    message: message,
                    role: this.userRole,
                    user_id: this.userId
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.response;
            }
        } catch (error) {
            console.log('Respuesta local del chatbot');
        }
        
        // Respuestas locales según rol
        return this.getLocalResponse(lowerMessage);
    }

    /**
     * Respuestas locales contextuales
     */
    getLocalResponse(message) {
        // Respuestas para CLIENTE
        if (this.userRole === 'cliente') {
            if (message.includes('pedido') || message.includes('donde')) {
                return this.getPedidoStatus();
            }
            if (message.includes('comercio') || message.includes('tienda')) {
                return '📍 Puedes ver todos los comercios disponibles en el panel principal. ¿Buscas algo específico?';
            }
            if (message.includes('ayuda') || message.includes('soporte')) {
                return '🆘 Estoy aquí para ayudarte. Puedes contactar soporte en: soporte@yavoy.com o llamar al +54 11 1234-5678';
            }
        }
        
        // Respuestas para REPARTIDOR
        if (this.userRole === 'repartidor') {
            if (message.includes('ganancia') || message.includes('dinero') || message.includes('pago')) {
                return this.getGananciasResumen();
            }
            if (message.includes('pedido') || message.includes('entrega')) {
                return '📦 Tienes pedidos disponibles en el panel. Conéctate para verlos en tiempo real.';
            }
            if (message.includes('soporte') || message.includes('problema')) {
                return '🔧 Para soporte técnico contacta: repartidores@yavoy.com o WhatsApp: +54 11 9876-5432';
            }
        }
        
        // Respuestas para COMERCIO
        if (this.userRole === 'comercio') {
            if (message.includes('pedido') || message.includes('orden')) {
                return '📋 Revisa los pedidos pendientes en la pestaña "Pedidos". Recuerda aceptarlos rápidamente.';
            }
            if (message.includes('venta') || message.includes('ganancia')) {
                return this.getVentasResumen();
            }
            if (message.includes('repartidor')) {
                return '🏍️ Los repartidores disponibles aparecen en el panel lateral. Se asignan automáticamente.';
            }
        }
        
        // Respuestas para CEO
        if (this.userRole === 'ceo') {
            if (message.includes('venta') || message.includes('facturacion')) {
                return this.getVentasDia();
            }
            if (message.includes('usuario') || message.includes('activo')) {
                return '👥 Consulta la sección de "Gestión de Usuarios" para ver estadísticas detalladas.';
            }
            if (message.includes('transaccion') || message.includes('pago')) {
                return '💳 Las transacciones recientes están en la tabla del dashboard principal.';
            }
        }
        
        // Respuesta genérica
        return `Entiendo tu consulta sobre "${message}". ¿Podrías ser más específico? Intenta usar las sugerencias rápidas.`;
    }

    /**
     * Obtiene estado del pedido (Cliente)
     */
    getPedidoStatus() {
        // Aquí normalmente harías una llamada al API
        return '📦 Tu pedido está <strong>en camino</strong>. El repartidor llegará en aproximadamente 15 minutos. Puedes ver su ubicación en el mapa del dashboard.';
    }

    /**
     * Obtiene resumen de ganancias (Repartidor)
     */
    getGananciasResumen() {
        return '💰 Hoy has completado <strong>8 entregas</strong> y ganaste <strong>$1,200</strong>. ¡Sigue así! Tu promedio semanal es de $6,500.';
    }

    /**
     * Obtiene resumen de ventas (Comercio)
     */
    getVentasResumen() {
        return '📊 Hoy llevas <strong>15 pedidos</strong> con un total de <strong>$8,500</strong> en ventas. Esto representa un +12% vs ayer.';
    }

    /**
     * Obtiene ventas del día (CEO)
     */
    getVentasDia() {
        return '📈 <strong>Resumen del día:</strong><br>• Facturación: $125,000<br>• Pedidos: 342<br>• Comercios activos: 48<br>• Repartidores: 67<br>• Tasa de satisfacción: 4.7/5.0';
    }

    /**
     * Agrega mensaje al chat
     */
    addMessage(content, type) {
        const messagesContainer = document.getElementById('chatbot-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chatbot-message ${type}-message`;
        
        const timestamp = new Date().toLocaleTimeString('es-AR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        messageDiv.innerHTML = `
            <div class="message-content">${content}</div>
            <div class="message-time">${timestamp}</div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    /**
     * Muestra indicador de escritura
     */
    showTypingIndicator() {
        const messagesContainer = document.getElementById('chatbot-messages');
        const indicator = document.createElement('div');
        indicator.id = 'typing-indicator';
        indicator.className = 'chatbot-message bot-message';
        indicator.innerHTML = `
            <div class="message-content typing-dots">
                <span></span><span></span><span></span>
            </div>
        `;
        messagesContainer.appendChild(indicator);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    /**
     * Oculta indicador de escritura
     */
    hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    }

    /**
     * Guarda historial de conversación
     */
    saveConversationHistory() {
        try {
            localStorage.setItem(`yavoy_chat_history_${this.userId}`, 
                JSON.stringify(this.conversationHistory.slice(-20))); // Últimas 20
        } catch (error) {
            console.error('Error al guardar historial:', error);
        }
    }

    /**
     * Carga historial de conversación
     */
    loadConversationHistory() {
        try {
            const history = localStorage.getItem(`yavoy_chat_history_${this.userId}`);
            if (history) {
                this.conversationHistory = JSON.parse(history);
            }
        } catch (error) {
            console.error('Error al cargar historial:', error);
        }
    }

    /**
     * Inyecta estilos CSS
     */
    injectStyles() {
        if (document.getElementById('yavoy-chatbot-styles')) return;
        
        const styles = `
            <style id="yavoy-chatbot-styles">
                .yavoy-chatbot-widget {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 9999;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                
                .chatbot-toggle-btn {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    color: white;
                    font-size: 28px;
                    cursor: pointer;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                    transition: all 0.3s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .chatbot-toggle-btn:hover {
                    transform: scale(1.1);
                }
                
                .chatbot-window {
                    width: 380px;
                    height: 600px;
                    background: white;
                    border-radius: 15px;
                    box-shadow: 0 5px 40px rgba(0,0,0,0.3);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                
                .chatbot-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 1rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .chatbot-title {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-weight: bold;
                    font-size: 1.1rem;
                }
                
                .chatbot-close-btn {
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 18px;
                    transition: all 0.3s;
                }
                
                .chatbot-close-btn:hover {
                    background: rgba(255,255,255,0.3);
                }
                
                .chatbot-messages {
                    flex: 1;
                    padding: 1rem;
                    overflow-y: auto;
                    background: #f5f7fb;
                }
                
                .chatbot-message {
                    margin-bottom: 1rem;
                    animation: fadeIn 0.3s;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .bot-message .message-content {
                    background: white;
                    color: #333;
                    padding: 0.8rem;
                    border-radius: 10px 10px 10px 0;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    max-width: 80%;
                    display: inline-block;
                }
                
                .user-message {
                    text-align: right;
                }
                
                .user-message .message-content {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 0.8rem;
                    border-radius: 10px 10px 0 10px;
                    max-width: 80%;
                    display: inline-block;
                }
                
                .message-time {
                    font-size: 0.7rem;
                    color: #999;
                    margin-top: 0.3rem;
                }
                
                .typing-dots {
                    display: flex;
                    gap: 0.3rem;
                    padding: 1rem !important;
                }
                
                .typing-dots span {
                    width: 8px;
                    height: 8px;
                    background: #667eea;
                    border-radius: 50%;
                    animation: typing 1.4s infinite;
                }
                
                .typing-dots span:nth-child(2) {
                    animation-delay: 0.2s;
                }
                
                .typing-dots span:nth-child(3) {
                    animation-delay: 0.4s;
                }
                
                @keyframes typing {
                    0%, 60%, 100% { transform: translateY(0); }
                    30% { transform: translateY(-10px); }
                }
                
                .chatbot-input-container {
                    display: flex;
                    padding: 1rem;
                    border-top: 1px solid #e0e0e0;
                    background: white;
                }
                
                .chatbot-input {
                    flex: 1;
                    padding: 0.8rem;
                    border: 1px solid #e0e0e0;
                    border-radius: 25px;
                    outline: none;
                    font-size: 0.95rem;
                }
                
                .chatbot-input:focus {
                    border-color: #667eea;
                }
                
                .chatbot-send-btn {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    color: white;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    margin-left: 0.5rem;
                    cursor: pointer;
                    font-size: 18px;
                    transition: all 0.3s;
                }
                
                .chatbot-send-btn:hover {
                    transform: scale(1.1);
                }
                
                .chatbot-suggestions {
                    padding: 0.5rem 1rem 1rem 1rem;
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                    background: white;
                }
                
                .suggestion-btn {
                    padding: 0.5rem 1rem;
                    background: #f0f0f0;
                    border: 1px solid #e0e0e0;
                    border-radius: 20px;
                    cursor: pointer;
                    font-size: 0.85rem;
                    transition: all 0.3s;
                }
                
                .suggestion-btn:hover {
                    background: #667eea;
                    color: white;
                    border-color: #667eea;
                }
                
                @media (max-width: 480px) {
                    .chatbot-window {
                        width: calc(100vw - 40px);
                        height: calc(100vh - 40px);
                    }
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }
}

// Función de inicialización global
function initChatbot(userRole) {
    if (window.yavoyBot) {
        console.warn('Chatbot ya inicializado');
        return;
    }
    
    window.yavoyBot = new YAvoyChatbot(userRole);
    console.log(`✅ Chatbot YAvoy inicializado para rol: ${userRole}`);
}

// Exportar para uso global
window.initChatbot = initChatbot;
window.YAvoyChatbot = YAvoyChatbot;
