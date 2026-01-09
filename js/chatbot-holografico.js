/**
 * YaVoy v3.1 - Chatbot Holográfico
 * Asistente con estética premium glassmorphism
 * CPO & Lead UI Designer - 2025
 */

class ChatbotHolografico {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.init();
    }

    init() {
        this.createWidget();
        this.attachEventListeners();
        this.loadWelcomeMessages();
    }

    createWidget() {
        const widget = document.createElement('div');
        widget.id = 'holographic-chatbot';
        widget.innerHTML = `
            <style>
                /* Chatbot Holográfico Styles */
                #holographic-chatbot {
                    position: fixed;
                    bottom: 32px;
                    right: 32px;
                    z-index: 9999;
                    font-family: 'Inter', 'Segoe UI', sans-serif;
                }

                .hologram-button {
                    width: 70px;
                    height: 70px;
                    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
                    border-radius: 50%;
                    border: 3px solid rgba(251, 191, 36, 0.3);
                    cursor: pointer;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 32px;
                    box-shadow: 0 8px 32px rgba(251, 191, 36, 0.4);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .hologram-button::before {
                    content: '';
                    position: absolute;
                    top: -5px;
                    left: -5px;
                    right: -5px;
                    bottom: -5px;
                    background: linear-gradient(135deg, #fbbf24, transparent);
                    border-radius: 50%;
                    opacity: 0;
                    animation: hologram-pulse 3s ease-in-out infinite;
                }

                @keyframes hologram-pulse {
                    0%, 100% {
                        opacity: 0;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 0.5;
                        transform: scale(1.2);
                    }
                }

                .hologram-button:hover {
                    transform: scale(1.1) rotate(5deg);
                    box-shadow: 0 12px 48px rgba(251, 191, 36, 0.6);
                }

                .hologram-button.active {
                    transform: scale(0.9);
                }

                /* Panel del Chatbot */
                .chatbot-panel {
                    position: absolute;
                    bottom: 90px;
                    right: 0;
                    width: 420px;
                    max-width: calc(100vw - 64px);
                    height: 650px;
                    max-height: calc(100vh - 120px);
                    background: rgba(2, 6, 23, 0.85);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid rgba(251, 191, 36, 0.2);
                    border-radius: 24px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                    display: none;
                    flex-direction: column;
                    overflow: hidden;
                    transform-origin: bottom right;
                    animation: panel-appear 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }

                @keyframes panel-appear {
                    from {
                        opacity: 0;
                        transform: scale(0.8) translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }

                .chatbot-panel.active {
                    display: flex;
                }

                /* Header Holográfico */
                .chatbot-header {
                    background: linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.1));
                    border-bottom: 1px solid rgba(251, 191, 36, 0.2);
                    padding: 20px 24px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .chatbot-avatar {
                    width: 48px;
                    height: 48px;
                    background: linear-gradient(135deg, #fbbf24, #f59e0b);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
                    animation: avatar-float 3s ease-in-out infinite;
                }

                @keyframes avatar-float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-5px); }
                }

                .chatbot-info h3 {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 700;
                    color: #fbbf24;
                }

                .chatbot-status {
                    margin: 4px 0 0 0;
                    font-size: 13px;
                    color: rgba(255, 255, 255, 0.6);
                }

                .status-indicator {
                    display: inline-block;
                    width: 8px;
                    height: 8px;
                    background: #10b981;
                    border-radius: 50%;
                    margin-right: 6px;
                    animation: status-pulse 2s ease-in-out infinite;
                }

                @keyframes status-pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

                /* Área de mensajes */
                .chatbot-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .chatbot-messages::-webkit-scrollbar {
                    width: 6px;
                }

                .chatbot-messages::-webkit-scrollbar-track {
                    background: transparent;
                }

                .chatbot-messages::-webkit-scrollbar-thumb {
                    background: rgba(251, 191, 36, 0.3);
                    border-radius: 3px;
                }

                .message {
                    display: flex;
                    gap: 12px;
                    align-items: flex-start;
                    animation: message-appear 0.3s ease-out;
                }

                @keyframes message-appear {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .message.user {
                    flex-direction: row-reverse;
                }

                .message-avatar {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                    flex-shrink: 0;
                }

                .message.bot .message-avatar {
                    background: linear-gradient(135deg, #fbbf24, #f59e0b);
                }

                .message.user .message-avatar {
                    background: linear-gradient(135deg, #3b82f6, #2563eb);
                }

                .message-content {
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    padding: 12px 16px;
                    color: rgba(255, 255, 255, 0.9);
                    max-width: 70%;
                    line-height: 1.5;
                    font-size: 14px;
                }

                .message.user .message-content {
                    background: rgba(251, 191, 36, 0.15);
                    border-color: rgba(251, 191, 36, 0.3);
                }

                /* Acciones rápidas */
                .quick-actions {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-top: 8px;
                }

                .quick-action {
                    padding: 8px 16px;
                    background: rgba(251, 191, 36, 0.1);
                    border: 1px solid rgba(251, 191, 36, 0.3);
                    border-radius: 20px;
                    color: #fbbf24;
                    font-size: 13px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .quick-action:hover {
                    background: rgba(251, 191, 36, 0.2);
                    transform: translateY(-2px);
                }

                /* Input Area */
                .chatbot-input {
                    padding: 20px 24px;
                    border-top: 1px solid rgba(251, 191, 36, 0.2);
                    background: rgba(2, 6, 23, 0.8);
                }

                .input-container {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                }

                .chatbot-input input {
                    flex: 1;
                    padding: 12px 16px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(251, 191, 36, 0.2);
                    border-radius: 12px;
                    color: #ffffff;
                    font-size: 14px;
                    transition: all 0.3s ease;
                }

                .chatbot-input input:focus {
                    outline: none;
                    border-color: #fbbf24;
                    box-shadow: 0 0 20px rgba(251, 191, 36, 0.2);
                }

                .send-button {
                    width: 44px;
                    height: 44px;
                    background: linear-gradient(135deg, #fbbf24, #f59e0b);
                    border: none;
                    border-radius: 12px;
                    color: #020617;
                    font-size: 20px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .send-button:hover {
                    transform: scale(1.05);
                    box-shadow: 0 4px 15px rgba(251, 191, 36, 0.4);
                }

                /* Responsive */
                @media (max-width: 480px) {
                    #holographic-chatbot {
                        bottom: 16px;
                        right: 16px;
                    }

                    .chatbot-panel {
                        width: calc(100vw - 32px);
                        height: calc(100vh - 100px);
                    }
                }

                /* ========== MODO CLARO (Light Mode) ========== */
                body.light-mode .chatbot-panel {
                    background: rgba(255, 255, 255, 0.95) !important;
                    border-color: rgba(251, 191, 36, 0.4) !important;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15) !important;
                }

                body.light-mode .chatbot-header {
                    background: linear-gradient(135deg, rgba(251, 191, 36, 0.25), rgba(245, 158, 11, 0.15)) !important;
                    border-bottom-color: rgba(251, 191, 36, 0.3) !important;
                }

                body.light-mode .chatbot-info h3 {
                    color: #b45309 !important;
                }

                body.light-mode .chatbot-status {
                    color: #4b5563 !important;
                }

                body.light-mode .chatbot-messages {
                    background: rgba(249, 250, 251, 0.5) !important;
                }

                body.light-mode .message-content {
                    background: rgba(0, 0, 0, 0.05) !important;
                    border-color: rgba(0, 0, 0, 0.1) !important;
                    color: #1f2937 !important;
                }

                body.light-mode .message.user .message-content {
                    background: rgba(251, 191, 36, 0.2) !important;
                    border-color: rgba(251, 191, 36, 0.4) !important;
                    color: #1f2937 !important;
                }

                body.light-mode .quick-action {
                    background: rgba(251, 191, 36, 0.15) !important;
                    border-color: rgba(251, 191, 36, 0.4) !important;
                    color: #b45309 !important;
                }

                body.light-mode .quick-action:hover {
                    background: rgba(251, 191, 36, 0.3) !important;
                }

                body.light-mode .chatbot-input {
                    background: rgba(255, 255, 255, 0.9) !important;
                    border-top-color: rgba(251, 191, 36, 0.3) !important;
                }

                body.light-mode .chatbot-input input {
                    background: rgba(0, 0, 0, 0.05) !important;
                    border-color: rgba(251, 191, 36, 0.3) !important;
                    color: #1f2937 !important;
                }

                body.light-mode .chatbot-input input::placeholder {
                    color: #6b7280 !important;
                }

                body.light-mode .chatbot-input input:focus {
                    border-color: #f59e0b !important;
                    box-shadow: 0 0 15px rgba(251, 191, 36, 0.3) !important;
                }

                body.light-mode .chatbot-messages::-webkit-scrollbar-thumb {
                    background: rgba(251, 191, 36, 0.5) !important;
                }
            </style>

            <!-- Botón flotante -->
            <button class="hologram-button" id="hologramBtn">
                ✨
            </button>

            <!-- Panel del chatbot -->
            <div class="chatbot-panel" id="chatbotPanel">
                <div class="chatbot-header">
                    <div class="chatbot-avatar">🤖</div>
                    <div class="chatbot-info">
                        <h3>YaVoy Assistant</h3>
                        <p class="chatbot-status">
                            <span class="status-indicator"></span>
                            En línea
                        </p>
                    </div>
                </div>

                <div class="chatbot-messages" id="chatbotMessages">
                    <!-- Los mensajes se agregan aquí dinámicamente -->
                </div>

                <div class="chatbot-input">
                    <div class="input-container">
                        <input 
                            type="text" 
                            id="chatInput" 
                            placeholder="Escribe tu mensaje..."
                            autocomplete="off"
                        >
                        <button class="send-button" id="sendBtn">
                            ➤
                        </button>
                    </div>
                </div>
            </div>
        `;

        const container = document.getElementById('chatbot-holografico') || document.body;
        container.appendChild(widget);
    }

    attachEventListeners() {
        const btn = document.getElementById('hologramBtn');
        const panel = document.getElementById('chatbotPanel');
        const input = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendBtn');

        btn.addEventListener('click', () => this.togglePanel());
        
        sendBtn.addEventListener('click', () => this.sendMessage());
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
    }

    togglePanel() {
        this.isOpen = !this.isOpen;
        const panel = document.getElementById('chatbotPanel');
        const btn = document.getElementById('hologramBtn');

        if (this.isOpen) {
            panel.classList.add('active');
            btn.classList.add('active');
        } else {
            panel.classList.remove('active');
            btn.classList.remove('active');
        }
    }

    loadWelcomeMessages() {
        setTimeout(() => {
            this.addBotMessage('¡Hola! 👋 Soy tu asistente holográfico de YaVoy.');
        }, 500);

        setTimeout(() => {
            this.addBotMessage('¿En qué puedo ayudarte hoy?', [
                'Ver estado de pedido',
                'Hablar con soporte',
                'Preguntas frecuentes',
                'Seguimiento en tiempo real'
            ]);
        }, 1500);
    }

    addBotMessage(text, quickActions = null) {
        const messagesContainer = document.getElementById('chatbotMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot';
        
        let actionsHtml = '';
        if (quickActions && quickActions.length > 0) {
            actionsHtml = `
                <div class="quick-actions">
                    ${quickActions.map(action => 
                        `<button class="quick-action" onclick="chatbot.handleQuickAction('${action}')">${action}</button>`
                    ).join('')}
                </div>
            `;
        }

        messageDiv.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                ${text}
                ${actionsHtml}
            </div>
        `;

        messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addUserMessage(text) {
        const messagesContainer = document.getElementById('chatbotMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user';
        messageDiv.innerHTML = `
            <div class="message-avatar">👤</div>
            <div class="message-content">${text}</div>
        `;

        messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    sendMessage() {
        const input = document.getElementById('chatInput');
        const text = input.value.trim();

        if (!text) return;

        this.addUserMessage(text);
        input.value = '';

        // Simular respuesta del bot
        setTimeout(() => {
            this.generateBotResponse(text);
        }, 800);
    }

    generateBotResponse(userMessage) {
        const lowerMsg = userMessage.toLowerCase();

        if (lowerMsg.includes('estado') || lowerMsg.includes('pedido')) {
            this.addBotMessage('Para ver el estado de tu pedido, ingresa el número de seguimiento o revisa la sección "Mis Pedidos".');
        } else if (lowerMsg.includes('soporte') || lowerMsg.includes('ayuda')) {
            this.addBotMessage('Puedes contactar con nuestro equipo de soporte 24/7 al: +54 11 1234-5678 o por email: soporte@yavoy.com');
        } else if (lowerMsg.includes('horario') || lowerMsg.includes('hora')) {
            this.addBotMessage('¡Estamos disponibles 24/7! Puedes hacer pedidos en cualquier momento.');
        } else if (lowerMsg.includes('pago') || lowerMsg.includes('cobro')) {
            this.addBotMessage('Aceptamos efectivo, tarjetas de crédito/débito, MercadoPago y AstroPay. ¡Elige el que prefieras!');
        } else {
            this.addBotMessage('Entiendo. ¿Puedes darme más detalles para poder ayudarte mejor?');
        }
    }

    handleQuickAction(action) {
        this.addUserMessage(action);

        setTimeout(() => {
            switch(action) {
                case 'Ver estado de pedido':
                    this.addBotMessage('Por favor, proporciona tu número de pedido para consultar el estado.');
                    break;
                case 'Hablar con soporte':
                    this.addBotMessage('Te conectaré con un agente humano. Un momento por favor...');
                    break;
                case 'Preguntas frecuentes':
                    window.open('faq.html', '_blank');
                    this.addBotMessage('He abierto nuestra sección de Preguntas Frecuentes en una nueva pestaña.');
                    break;
                case 'Seguimiento en tiempo real':
                    this.addBotMessage('Puedes ver el seguimiento en tiempo real en tu panel de pedidos activos.');
                    break;
                default:
                    this.addBotMessage('¿En qué más puedo ayudarte?');
            }
        }, 800);
    }

    scrollToBottom() {
        const container = document.getElementById('chatbotMessages');
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 100);
    }
}

// Inicializar chatbot automáticamente
const chatbot = new ChatbotHolografico();
console.log('✨ Chatbot Holográfico YaVoy v3.1 cargado');
