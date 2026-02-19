// Integración YAvoy IA Assistant con Sistema Principal
// Conecta el chatbot avanzado con todas las páginas de YAvoyOk

(function() {
    'use strict';

    // Configuración global del bot
    const YAVOY_AI_CONFIG = {
        // Configuración por página
        pageConfigs: {
            'index.html': {
                empathy_level: 8,
                promotional_intensity: 9,
                response_style: 'friendly',
                focus: 'registration'
            },
            'pedidos.html': {
                empathy_level: 7,
                promotional_intensity: 5,
                response_style: 'helpful',
                focus: 'orders'
            },
            'panel-comercio.html': {
                empathy_level: 6,
                promotional_intensity: 8,
                response_style: 'professional',
                focus: 'business'
            },
            'panel-repartidor.html': {
                empathy_level: 7,
                promotional_intensity: 6,
                response_style: 'motivational',
                focus: 'delivery'
            },
            'panel-ceo-master.html': {
                empathy_level: 5,
                promotional_intensity: 3,
                response_style: 'executive',
                focus: 'analytics'
            }
        },

        // Configuración por usuario
        userTypeConfigs: {
            cliente: {
                greetings: [
                    "¡Hola! 🛒 Soy tu asistente personal para pedidos. ¿En qué puedo ayudarte hoy?",
                    "¡Bienvenido/a! 😊 Estoy aquí para hacer tu experiencia de pedidos perfecta.",
                    "¡Hola! 🌟 ¿Listo para descubrir los mejores comercios cerca tuyo?"
                ],
                proactive_messages: [
                    "💡 ¿Sabías que puedes rastrear tu pedido en tiempo real?",
                    "🎁 ¡Tienes ofertas especiales esperándote!",
                    "⭐ ¿Te ayudo a encontrar tu comercio favorito?"
                ]
            },
            comercio: {
                greetings: [
                    "¡Hola! 🏪 Soy tu asistente comercial. Estoy aquí para ayudarte a crecer.",
                    "¡Bienvenido al panel de tu comercio! 📈 ¿Cómo puedo potenciar tu negocio hoy?",
                    "¡Hola! 💼 Listo para ayudarte a maximizar tus ventas."
                ],
                proactive_messages: [
                    "📊 ¿Quieres revisar las estadísticas de hoy?",
                    "🎯 ¿Te ayudo a optimizar tu menú?",
                    "💰 ¿Sabías que puedes aumentar ventas con promociones?"
                ]
            },
            repartidor: {
                greetings: [
                    "¡Hola repartidor! 🚴 Estoy aquí para ayudarte a maximizar tus ganancias.",
                    "¡Bienvenido! ⚡ ¿Listo para otra jornada exitosa?",
                    "¡Hola! 🏆 Tu asistente personal para delivery está aquí."
                ],
                proactive_messages: [
                    "💰 ¿Quieres ver tus ganancias del día?",
                    "🗺️ ¿Te ayudo a optimizar tu ruta?",
                    "📈 ¿Sabías que puedes ganar bonos extra?"
                ]
            },
            admin: {
                greetings: [
                    "Hola Administrator. Sistema IA listo para asistencia ejecutiva.",
                    "Bienvenido/a. Analytics y reportes disponibles.",
                    "Sistema IA configurado para gestión administrativa."
                ],
                proactive_messages: [
                    "📊 Reporte diario listo para revisión",
                    "⚠️ Alertas del sistema disponibles",
                    "📈 KPIs actualizados"
                ]
            }
        }
    };

    // Clase principal de integración
    class YAvoyAIIntegration {
        constructor() {
            this.currentPage = this.detectCurrentPage();
            this.userType = this.detectUserType();
            this.botInstance = null;
            this.initialized = false;
            
            this.init();
        }

        detectCurrentPage() {
            const path = window.location.pathname;
            const filename = path.split('/').pop() || 'index.html';
            return filename;
        }

        detectUserType() {
            // Detectar tipo de usuario basado en la página y contexto
            const page = this.currentPage;
            
            if (page.includes('comercio')) return 'comercio';
            if (page.includes('repartidor')) return 'repartidor';
            if (page.includes('ceo') || page.includes('admin')) return 'admin';
            
            // Verificar localStorage para persistencia
            const savedType = localStorage.getItem('yavoy_user_type');
            if (savedType) return savedType;
            
            return 'cliente'; // Default
        }

        async init() {
            console.log('🚀 Inicializando YAvoy IA Integration...');
            
            // Esperar a que el script principal se cargue
            await this.waitForAIScript();
            
            // Configurar bot según página y usuario
            await this.setupBot();
            
            // Integrar con UI existente
            this.integrateWithExistingChat();
            
            // Configurar eventos personalizados
            this.setupCustomEvents();
            
            // Inicializar engagement proactivo
            this.startProactiveEngagement();
            
            this.initialized = true;
            console.log('✅ YAvoy IA Integration completada');
        }

        async waitForAIScript() {
            return new Promise((resolve) => {
                const checkForAI = () => {
                    if (window.YAvoyAIAssistant) {
                        resolve();
                    } else {
                        setTimeout(checkForAI, 100);
                    }
                };
                checkForAI();
            });
        }

        async setupBot() {
            // Obtener configuración para la página actual
            const pageConfig = YAVOY_AI_CONFIG.pageConfigs[this.currentPage] || {};
            const userConfig = YAVOY_AI_CONFIG.userTypeConfigs[this.userType] || {};
            
            // Configuración combinada
            const botConfig = {
                empathy_level: pageConfig.empathy_level || 7,
                promotional_intensity: pageConfig.promotional_intensity || 6,
                response_style: pageConfig.response_style || 'friendly',
                proactive_suggestions: true,
                upselling_enabled: true,
                emotion_detection: true,
                personalization: true,
                voice_enabled: true,
                language: 'es',
                focus_area: pageConfig.focus || 'general',
                user_type: this.userType,
                page_context: this.currentPage
            };

            // Crear instancia del bot
            this.botInstance = new window.YAvoyAIAssistant(botConfig);
            
            // Configurar contexto específico
            this.botInstance.userContext.type = this.userType;
            this.botInstance.userContext.page = this.currentPage;
            this.botInstance.userContext.greetings = userConfig.greetings || [];
            this.botInstance.userContext.proactive_messages = userConfig.proactive_messages || [];

            console.log(`🤖 Bot configurado para: ${this.userType} en ${this.currentPage}`);
        }

        integrateWithExistingChat() {
            // Buscar chatbot existente en la página - Modo no invasivo
            const existingChatbot = document.querySelector('#chatbotContainer, .chatbot-container, .chat-container');
            
            // Verificar si hay chatbot original activo
            if (window.chatbot && window.chatbot.init) {
                console.log('🔍 Chatbot original detectado - Modo co-existencia activado');
                this.enhanceExistingChatCompatible();
            } else if (existingChatbot) {
                this.enhanceExistingChat(existingChatbot);
            } else {
                this.createFloatingChat();
            }
        }

        enhanceExistingChatCompatible() {
            // Mejora no invasiva del chatbot existente
            console.log('🔧 Mejorando chatbot existente en modo compatible...');
            
            // Agregar funcionalidad IA como addon, no reemplazo
            if (window.chatbot) {
                // Registrar instancia IA para uso opcional
                window.chatbot.aiAssistant = this.botInstance;
                
                // Agregar botón toggle para IA si no existe
                this.addAIToggleButton();
                
                // Configurar modo híbrido
                this.setupHybridMode();
            }
        }
        
        addAIToggleButton() {
            const chatContainer = document.querySelector('#chatbotContainer, .chatbot-container');
            if (chatContainer && !document.getElementById('ai-toggle-btn')) {
                const toggleBtn = document.createElement('button');
                toggleBtn.id = 'ai-toggle-btn';
                toggleBtn.innerHTML = '🤖 IA';
                toggleBtn.style.cssText = `
                    position: absolute;
                    top: 10px;
                    right: 50px;
                    background: #06b6d4;
                    color: white;
                    border: none;
                    border-radius: 15px;
                    padding: 5px 10px;
                    font-size: 12px;
                    cursor: pointer;
                    z-index: 1000;
                `;
                toggleBtn.onclick = () => this.toggleAIMode();
                
                const header = chatContainer.querySelector('.chatbot-header, .chat-header');
                if (header) {
                    header.style.position = 'relative';
                    header.appendChild(toggleBtn);
                }
            }
        }
        
        setupHybridMode() {
            // Modo híbrido: chatbot original + IA como opción
            this.aiModeEnabled = false;
            
            // Preservar método original
            if (window.chatbot && window.chatbot.processMessage) {
                window.chatbot.originalProcessMessage = window.chatbot.processMessage;
            }
        }
        
        toggleAIMode() {
            this.aiModeEnabled = !this.aiModeEnabled;
            const toggleBtn = document.getElementById('ai-toggle-btn');
            
            if (this.aiModeEnabled) {
                toggleBtn.innerHTML = '🤖 IA ✓';
                toggleBtn.style.background = '#10b981';
                
                // Activar procesamiento IA
                if (window.chatbot && this.botInstance) {
                    const self = this;
                    window.chatbot.processMessage = async function(message) {
                        try {
                            const response = await self.botInstance.processMessage(message);
                            self.addMessage(self.getMessagesContainer(), response, 'bot');
                            return response;
                        } catch (error) {
                            console.error('IA Error, fallback:', error);
                            return this.originalProcessMessage ? this.originalProcessMessage(message) : 'Error procesando mensaje';
                        }
                    };
                }
                
                this.addMessage(this.getMessagesContainer(), '🤖 Modo IA activado. Ahora tendré respuestas más empáticas y personalizadas.', 'system');
            } else {
                toggleBtn.innerHTML = '🤖 IA';
                toggleBtn.style.background = '#06b6d4';
                
                // Restaurar procesamiento original
                if (window.chatbot && window.chatbot.originalProcessMessage) {
                    window.chatbot.processMessage = window.chatbot.originalProcessMessage;
                }
                
                this.addMessage(this.getMessagesContainer(), '💬 Modo chatbot normal activado.', 'system');
            }
        }
        
        getMessagesContainer() {
            return document.querySelector('#ai-floating-messages, #chatbotMessages, .chatbot-messages, .messages') || 
                   document.getElementById('ai-messages');
        }

        enhanceExistingChat(container) {
            // Mejorar chatbot existente con IA
            console.log('🔧 Mejorando chatbot existente con IA...');
            
            // Buscar elementos del chat
            const messagesContainer = container.querySelector('.chatbot-messages, #chatbotMessages, .messages');
            const inputElement = container.querySelector('.chatbot-input, #chatbotInput, input[type="text"]');
            const sendButton = container.querySelector('.chatbot-send, #btnEnviarChatbot, .send-btn');

            if (inputElement && sendButton) {
                // Reemplazar funcionalidad de envío
                sendButton.onclick = () => this.handleMessage(inputElement, messagesContainer);
                
                // Evento de tecla Enter
                inputElement.onkeypress = (e) => {
                    if (e.key === 'Enter') {
                        this.handleMessage(inputElement, messagesContainer);
                    }
                };

                // Saludo inicial personalizado
                this.sendGreeting(messagesContainer);
            }
        }

        createFloatingChat() {
            console.log('💬 Creando chatbot flotante...');
            
            const chatHTML = `
                <div id="yavoy-ai-chat-floating" class="yavoy-floating-chat">
                    <div class="chat-toggle" onclick="yavoyAIIntegration.toggleChat()">
                        <div class="chat-icon">🤖</div>
                        <div class="notification-badge" id="ai-chat-badge">1</div>
                    </div>
                    
                    <div class="chat-window" id="ai-chat-window" style="display: none;">
                        <div class="chat-header">
                            <div class="bot-info">
                                <div class="bot-avatar">🤖</div>
                                <div class="bot-details">
                                    <div class="bot-name">YAvoy AI Assistant</div>
                                    <div class="bot-status">🟢 En línea</div>
                                </div>
                            </div>
                            <button class="chat-close" onclick="yavoyAIIntegration.toggleChat()">✕</button>
                        </div>
                        
                        <div class="chat-messages" id="ai-floating-messages"></div>
                        
                        <div class="chat-input-area">
                            <input type="text" id="ai-floating-input" placeholder="Escribe tu mensaje..." />
                            <button id="ai-floating-send">📤</button>
                        </div>
                        
                        <div class="quick-actions">
                            <button onclick="yavoyAIIntegration.quickAction('help')">❓ Ayuda</button>
                            <button onclick="yavoyAIIntegration.quickAction('order')">🛒 Pedido</button>
                            <button onclick="yavoyAIIntegration.quickAction('status')">📍 Estado</button>
                        </div>
                    </div>
                </div>
            `;

            // Insertar en el DOM
            document.body.insertAdjacentHTML('beforeend', chatHTML);
            
            // Configurar eventos de chat flotante
            document.getElementById('ai-floating-send').onclick = () => {
                const input = document.getElementById('ai-floating-input');
                const messages = document.getElementById('ai-floating-messages');
                this.handleMessage(input, messages);
            };
            
            document.getElementById('ai-floating-input').onkeypress = (e) => {
                if (e.key === 'Enter') {
                    const input = document.getElementById('ai-floating-input');
                    const messages = document.getElementById('ai-floating-messages');
                    this.handleMessage(input, messages);
                }
            };

            // Agregar estilos
            this.addFloatingChatStyles();
            
            // Saludo inicial después de un momento
            setTimeout(() => {
                const messages = document.getElementById('ai-floating-messages');
                this.sendGreeting(messages);
            }, 2000);
        }

        async handleMessage(inputElement, messagesContainer) {
            const message = inputElement.value.trim();
            if (!message) return;

            // Agregar mensaje del usuario
            this.addMessage(messagesContainer, message, 'user');
            inputElement.value = '';

            // Mostrar typing indicator
            this.showTyping(messagesContainer);

            try {
                // Procesar con IA
                const response = await this.botInstance.processMessage(message);
                
                // Remover typing
                this.removeTyping(messagesContainer);
                
                // Agregar respuesta del bot
                this.addMessage(messagesContainer, response, 'bot');
                
                // Analytics
                this.trackInteraction(message, response);
                
            } catch (error) {
                console.error('Error procesando mensaje:', error);
                this.removeTyping(messagesContainer);
                this.addMessage(messagesContainer, 'Disculpa, tuve un problema técnico. ¿Puedes intentar de nuevo?', 'bot');
            }
        }

        addMessage(container, message, type) {
            if (!container) return;

            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${type}-message`;
            
            const avatar = type === 'user' ? '👤' : '🤖';
            const time = new Date().toLocaleTimeString('es-AR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            messageDiv.innerHTML = `
                <div class="message-avatar">${avatar}</div>
                <div class="message-content">
                    <div class="message-text">${message}</div>
                    <div class="message-time">${time}</div>
                </div>
            `;
            
            container.appendChild(messageDiv);
            container.scrollTop = container.scrollHeight;
        }

        showTyping(container) {
            const typingDiv = document.createElement('div');
            typingDiv.className = 'typing-indicator';
            typingDiv.id = 'typing-indicator';
            typingDiv.innerHTML = `
                <div class="message-avatar">🤖</div>
                <div class="typing-dots">
                    <span></span><span></span><span></span>
                </div>
            `;
            
            container.appendChild(typingDiv);
            container.scrollTop = container.scrollHeight;
        }

        removeTyping(container) {
            const typing = container.querySelector('#typing-indicator');
            if (typing) typing.remove();
        }

        sendGreeting(container) {
            const userConfig = YAVOY_AI_CONFIG.userTypeConfigs[this.userType];
            const greetings = userConfig?.greetings || ["¡Hola! Soy tu asistente IA de YAvoy. ¿En qué puedo ayudarte?"];
            
            const greeting = greetings[Math.floor(Math.random() * greetings.length)];
            
            setTimeout(() => {
                this.addMessage(container, greeting, 'bot');
            }, 1000);
        }

        toggleChat() {
            const window = document.getElementById('ai-chat-window');
            const badge = document.getElementById('ai-chat-badge');
            
            if (window.style.display === 'none') {
                window.style.display = 'flex';
                badge.style.display = 'none';
            } else {
                window.style.display = 'none';
            }
        }

        quickAction(action) {
            const input = document.getElementById('ai-floating-input');
            const messages = document.getElementById('ai-floating-messages');
            
            const actions = {
                help: '¿Cómo puedes ayudarme?',
                order: 'Quiero hacer un pedido',
                status: '¿Cuál es el estado de mi pedido?'
            };
            
            input.value = actions[action] || action;
            this.handleMessage(input, messages);
        }

        startProactiveEngagement() {
            // Mensaje proactivo después de inactividad
            setTimeout(() => {
                if (this.shouldSendProactiveMessage()) {
                    this.sendProactiveMessage();
                }
            }, 30000); // 30 segundos

            // Mensajes contextuales
            this.setupContextualTriggers();
        }

        shouldSendProactiveMessage() {
            const lastInteraction = localStorage.getItem('yavoy_last_interaction');
            if (!lastInteraction) return true;
            
            const timeSince = Date.now() - parseInt(lastInteraction);
            return timeSince > 300000; // 5 minutos
        }

        sendProactiveMessage() {
            const userConfig = YAVOY_AI_CONFIG.userTypeConfigs[this.userType];
            const messages = userConfig?.proactive_messages || ["¿Hay algo en lo que pueda ayudarte?"];
            
            const message = messages[Math.floor(Math.random() * messages.length)];
            
            const container = document.getElementById('ai-messages') || 
                             document.querySelector('.chatbot-messages, #chatbotMessages');
            
            if (container) {
                this.addMessage(container, message, 'bot');
                
                // Mostrar notificación
                const badge = document.getElementById('chat-badge');
                if (badge) {
                    badge.style.display = 'block';
                    badge.textContent = '1';
                }
            }
        }

        setupContextualTriggers() {
            // Trigger en errores de página
            window.addEventListener('error', () => {
                this.sendContextualMessage('Veo que puede haber un problema técnico. ¿Te puedo ayudar?');
            });

            // Trigger en tiempo de permanencia
            setTimeout(() => {
                if (this.userType === 'comercio') {
                    this.sendContextualMessage('¿Te ayudo a optimizar tu perfil comercial?');
                }
            }, 60000); // 1 minuto
        }

        sendContextualMessage(message) {
            const container = document.getElementById('ai-floating-messages') || 
                             document.getElementById('ai-messages') ||
                             document.querySelector('.chatbot-messages, #chatbotMessages') ||
                             this.getMessagesContainer();
            
            if (container) {
                this.addMessage(container, `💡 ${message}`, 'bot');
                
                // Mostrar notificación si el chat está cerrado
                const chatWindow = document.getElementById('ai-chat-window');
                const badge = document.getElementById('ai-chat-badge');
                
                if (chatWindow && chatWindow.style.display === 'none' && badge) {
                    badge.style.display = 'block';
                    badge.textContent = '1';
                }
            }
        }

        trackInteraction(userMessage, botResponse) {
            const interaction = {
                timestamp: new Date().toISOString(),
                user_message: userMessage,
                bot_response: botResponse,
                user_type: this.userType,
                page: this.currentPage,
                session_id: this.getSessionId()
            };

            // Guardar en localStorage (en producción sería API)
            const interactions = JSON.parse(localStorage.getItem('yavoy_ai_interactions') || '[]');
            interactions.push(interaction);
            
            // Mantener solo las últimas 50 interacciones
            if (interactions.length > 50) {
                interactions.splice(0, interactions.length - 50);
            }
            
            localStorage.setItem('yavoy_ai_interactions', JSON.stringify(interactions));
            localStorage.setItem('yavoy_last_interaction', Date.now().toString());
        }

        getSessionId() {
            let sessionId = sessionStorage.getItem('yavoy_session_id');
            if (!sessionId) {
                sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
                sessionStorage.setItem('yavoy_session_id', sessionId);
            }
            return sessionId;
        }

        setupCustomEvents() {
            // Eventos personalizados para diferentes acciones
            document.addEventListener('yavoy:order-created', (e) => {
                this.sendContextualMessage(`¡Perfecto! Tu pedido #${e.detail.orderId} está confirmado. ¿Te ayudo con el seguimiento?`);
            });

            document.addEventListener('yavoy:user-registered', (e) => {
                this.userType = e.detail.userType;
                this.sendContextualMessage(`¡Bienvenido/a a YAvoy! Como ${e.detail.userType}, estoy aquí para ayudarte específicamente.`);
            });

            document.addEventListener('yavoy:error-occurred', (e) => {
                this.sendContextualMessage(`Veo que hubo un problema. ¿Te puedo ayudar a resolverlo?`);
            });
        }

        addFloatingChatStyles() {
            const styles = `
                <style>
                .yavoy-floating-chat {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 9999;
                    font-family: 'Segoe UI', sans-serif;
                }

                .chat-toggle {
                    width: 60px;
                    height: 60px;
                    background: linear-gradient(135deg, #06b6d4, #fbbf24);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                    position: relative;
                    transition: transform 0.3s ease;
                }

                .chat-toggle:hover {
                    transform: scale(1.1);
                }

                .chat-icon {
                    font-size: 24px;
                    color: white;
                }

                .notification-badge {
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background: #ff4444;
                    color: white;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                }

                .chat-window {
                    position: absolute;
                    bottom: 70px;
                    right: 0;
                    width: 350px;
                    height: 500px;
                    background: #0f1724;
                    border: 2px solid #06b6d4;
                    border-radius: 15px;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    color: white;
                }

                .chat-header {
                    background: linear-gradient(135deg, #06b6d4, #fbbf24);
                    padding: 15px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .bot-info {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .bot-avatar {
                    width: 35px;
                    height: 35px;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                }

                .bot-name {
                    font-weight: 600;
                    font-size: 16px;
                }

                .bot-status {
                    font-size: 12px;
                    opacity: 0.8;
                }

                .chat-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 5px;
                    border-radius: 3px;
                }

                .chat-close:hover {
                    background: rgba(255, 255, 255, 0.2);
                }

                .chat-messages {
                    height: 350px;
                    overflow-y: auto;
                    padding: 15px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .message {
                    display: flex;
                    gap: 8px;
                    align-items: flex-start;
                }

                .message.user-message {
                    flex-direction: row-reverse;
                }

                .message-avatar {
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    flex-shrink: 0;
                }

                .bot-message .message-avatar {
                    background: #06b6d4;
                }

                .user-message .message-avatar {
                    background: #fbbf24;
                }

                .message-content {
                    max-width: 80%;
                }

                .message-text {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 10px 12px;
                    border-radius: 12px;
                    line-height: 1.4;
                    font-size: 14px;
                }

                .user-message .message-text {
                    background: #fbbf24;
                    color: #0f1724;
                }

                .message-time {
                    font-size: 10px;
                    color: #94a3b8;
                    margin-top: 3px;
                }

                .chat-input-area {
                    padding: 15px;
                    display: flex;
                    gap: 10px;
                    background: rgba(255, 255, 255, 0.05);
                }

                .chat-input-area input {
                    flex: 1;
                    background: #1f2937;
                    border: 1px solid #374151;
                    border-radius: 20px;
                    padding: 10px 15px;
                    color: white;
                    font-size: 14px;
                    outline: none;
                }

                .chat-input-area input:focus {
                    border-color: #06b6d4;
                }

                .chat-input-area button {
                    background: #06b6d4;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .chat-input-area button:hover {
                    background: #0891b2;
                }

                .quick-actions {
                    padding: 10px 15px;
                    display: flex;
                    gap: 8px;
                    background: rgba(255, 255, 255, 0.02);
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                }

                .quick-actions button {
                    background: rgba(6, 182, 212, 0.2);
                    color: #06b6d4;
                    border: 1px solid #06b6d4;
                    border-radius: 15px;
                    padding: 6px 10px;
                    font-size: 11px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .quick-actions button:hover {
                    background: #06b6d4;
                    color: white;
                }

                .typing-indicator {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }

                .typing-dots {
                    display: flex;
                    gap: 4px;
                }

                .typing-dots span {
                    width: 8px;
                    height: 8px;
                    background: #06b6d4;
                    border-radius: 50%;
                    animation: typing 1.4s infinite ease-in-out;
                }

                .typing-dots span:nth-child(1) { animation-delay: 0s; }
                .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
                .typing-dots span:nth-child(3) { animation-delay: 0.4s; }

                @keyframes typing {
                    0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
                    30% { opacity: 1; transform: scale(1); }
                }

                @media (max-width: 768px) {
                    .chat-window {
                        width: 300px;
                        height: 450px;
                    }
                }
                </style>
            `;
            
            document.head.insertAdjacentHTML('beforeend', styles);
        }
    }

    // Inicializar automáticamente cuando el DOM esté listo - Modo compatible
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Solo inicializar si no hay conflictos
            if (!window.yavoyAIIntegration) {
                window.yavoyAIIntegration = new YAvoyAIIntegration();
            }
        });
    } else {
        if (!window.yavoyAIIntegration) {
            window.yavoyAIIntegration = new YAvoyAIIntegration();
        }
    }

})();