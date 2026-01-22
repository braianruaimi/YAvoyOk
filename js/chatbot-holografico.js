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
            this.addBotMessage('¡Hola! 👋 Soy tu asistente holográfico de YAvoy.');
        }, 500);

        setTimeout(() => {
            this.addBotMessage('¿En qué puedo ayudarte hoy?', [
                '🚀 ¿Qué es YAvoy?',
                '🛍️ Hacer un pedido',
                '🏪 Registrar comercio',
                '🚴 Ser repartidor',
                '❓ Preguntas frecuentes'
            ]);
        }, 1500);
    }

    // Base de conocimiento con todas las preguntas frecuentes
    knowledgeBase = {
        beneficios: {
            clientes: [
                '✅ Entregas rápidas en 20-40 minutos',
                '✅ Amplia variedad de comercios locales',
                '✅ Rastreo de pedido en tiempo real',
                '✅ Métodos de pago flexibles',
                '✅ Soporte al cliente 24/7',
                '✅ Sin costo de registro'
            ],
            comercios: [
                '✅ Registro 100% GRATUITO - Sin mensualidades',
                '✅ Aumenta tus ventas con red de repartidores',
                '✅ Gestión simple de pedidos',
                '✅ Visibilidad en la plataforma',
                '✅ Sin costos ocultos',
                '✅ Soporte técnico dedicado'
            ],
            repartidores: [
                '✅ Gana el 85% del costo de envío',
                '✅ Elige tus propios horarios',
                '✅ Sé tu propio jefe',
                '✅ Bonos por entregas rápidas',
                '✅ Sistema de logros y recompensas',
                '✅ Pago inmediato por entrega'
            ]
        },
        
        faq: {
            clientes: {
                '¿Cómo hago un pedido?': 'Es muy simple:\n\n1. Haz clic en "Hacer Pedido" en la página principal\n2. Completa el formulario con los detalles\n3. Un repartidor cercano tomará tu pedido\n4. Recibirás actualizaciones sobre el estado',
                
                '¿Cuánto cuesta el envío?': 'El costo del envío se calcula automáticamente por distancia:\n\n• Primer kilómetro: $1000\n• Por cada 100m adicionales: +$100\n\nEjemplos:\n• 1 km → $1000\n• 1.5 km → $1500\n• 2 km → $2000\n• 3 km → $3000',
                
                '¿Cuánto tarda la entrega?': 'Tiempos promedio:\n\n• Entregas locales: 20-40 minutos\n• Zonas cercanas: 30-60 minutos\n\nEl tiempo exacto depende de la disponibilidad del repartidor y la distancia.',
                
                '¿Puedo rastrear mi pedido?': 'Sí, cuando tu pedido es aceptado recibirás actualizaciones sobre su estado: Pendiente → Aceptado → En Camino → Entregado.',
                
                '¿Qué métodos de pago aceptan?': 'Los métodos de pago son acordados directamente con el comercio. Generalmente aceptan: efectivo, transferencia, MercadoPago o tarjetas.'
            },
            
            comercios: {
                '¿Cómo me registro como comercio?': 'El registro es rápido y gratuito:\n\n1. Haz clic en "Soy Comercio" → "Registrarme"\n2. Completa el formulario con tus datos\n3. Envía el formulario y listo',
                
                '¿Cuánto cuesta registrarse?': '¡Es completamente GRATIS! 🎉\n\nNo hay costos de registro ni mensualidades. Solo pagas el costo del envío cuando solicitas una entrega.',
                
                '¿Cómo recibo los pedidos?': 'Los clientes te contactan directamente por WhatsApp o teléfono. Luego coordinas la entrega con el repartidor disponible.',
                
                '¿Puedo modificar mis datos?': 'Sí, contáctanos a yavoyen5@gmail.com con tus datos actualizados y lo modificamos inmediatamente.'
            },
            
            repartidores: {
                '¿Qué necesito para ser repartidor?': 'Requisitos básicos:\n\n✅ Ser mayor de 18 años\n✅ Tener DNI argentino\n✅ Poseer vehículo propio (moto, bici o auto)\n✅ Documentación del vehículo vigente\n✅ Celular con internet',
                
                '¿Cuánto puedo ganar?': 'Recibes el 85% del costo de envío. Por ejemplo:\n\n• Envío de $1000 (1 km) → Ganas $850\n• Envío de $1500 (1.5 km) → Ganas $1275\n• Envío de $2000 (2 km) → Ganas $1700\n• Envío de $3000 (3 km) → Ganas $2550\n\nCuantas más entregas hagas, más ganas. Además, hay beneficios por entregas rápidas.',
                
                '¿Cómo recibo los pagos?': 'Los pagos se coordinan directamente con el comercio o cliente al momento de la entrega. Puedes recibir efectivo, transferencia o MercadoPago.',
                
                '¿Puedo elegir qué entregas hacer?': '¡Sí! Eres completamente independiente. Ves los pedidos disponibles y decides cuáles tomar según tu ubicación, horario y preferencia.',
                
                '¿Qué pasa si tengo un problema?': 'Contáctanos inmediatamente por WhatsApp al +54 221 504 7962. Te ayudamos a resolver cualquier inconveniente.'
            },
            
            general: {
                '¿En qué zonas operan?': 'Actualmente operamos en Ensenada y zonas aledañas. Estamos expandiéndonos constantemente a nuevas áreas.',
                
                '¿YAvoy es una app móvil?': 'YAvoy es una Progressive Web App (PWA). Funciona desde tu navegador y puedes agregarla a tu pantalla de inicio para usarla como una app nativa.',
                
                '¿Es seguro usar YAvoy?': 'Sí, tomamos muy en serio la seguridad. Tus datos están cifrados y nunca los compartimos sin tu consentimiento.',
                
                '¿Cómo contactarlos?': 'Estamos disponibles:\n\n📧 Email: yavoyen5@gmail.com\n📱 WhatsApp: +54 221 504 7962\n☎️ Teléfono: 2215047962'
            }
        }
    };

    // Detectar intención del mensaje
    detectIntent(message) {
        const msg = message.toLowerCase();
        
        // Beneficios
        if (msg.includes('beneficio') || msg.includes('ventaja') || msg.includes('por qué')) {
            if (msg.includes('comercio') || msg.includes('negocio')) return 'beneficios_comercios';
            if (msg.includes('repartidor') || msg.includes('delivery')) return 'beneficios_repartidores';
            return 'beneficios_clientes';
        }
        
        // Preguntas frecuentes - Clientes
        if (msg.includes('pedido') || msg.includes('ordenar') || msg.includes('pedir')) return 'como_hacer_pedido';
        if (msg.includes('envío') || msg.includes('envio') || msg.includes('costo') || msg.includes('precio')) return 'costo_envio';
        if (msg.includes('tarda') || msg.includes('demora') || msg.includes('tiempo')) return 'tiempo_entrega';
        if (msg.includes('rastrear') || msg.includes('seguir') || msg.includes('track')) return 'rastrear_pedido';
        if (msg.includes('pago') || msg.includes('pagar')) return 'metodos_pago';
        
        // Preguntas frecuentes - Comercios
        if (msg.includes('registr') && (msg.includes('comercio') || msg.includes('negocio'))) return 'registro_comercio';
        if (msg.includes('gratis') || msg.includes('gratuito') || msg.includes('cuesta registr')) return 'costo_registro';
        if (msg.includes('recibo pedido') || msg.includes('cómo funciona comercio')) return 'como_recibo_pedidos';
        if (msg.includes('modificar') || msg.includes('cambiar') || msg.includes('actualizar')) return 'modificar_datos';
        
        // Preguntas frecuentes - Repartidores
        if (msg.includes('requisito') || msg.includes('necesito') && msg.includes('repartidor')) return 'requisitos_repartidor';
        if (msg.includes('gan') || msg.includes('cuánto') || msg.includes('salario')) return 'cuanto_gano';
        if (msg.includes('cobr') || msg.includes('pago repartidor')) return 'como_cobro';
        if (msg.includes('eleg') || msg.includes('independiente') || msg.includes('horario')) return 'elegir_entregas';
        if (msg.includes('problema') || msg.includes('ayuda') || msg.includes('soporte')) return 'problema_entrega';
        
        // General
        if (msg.includes('zona') || msg.includes('dónde') || msg.includes('ubicación')) return 'zonas_operacion';
        if (msg.includes('app') || msg.includes('aplicación') || msg.includes('descarg')) return 'es_app_movil';
        if (msg.includes('segur') || msg.includes('privacidad') || msg.includes('dato')) return 'seguridad';
        if (msg.includes('contact') || msg.includes('comunic') || msg.includes('teléfono')) return 'contacto';
        
        // Acciones
        if (msg.includes('que es yavoy') || msg.includes('qué es yavoy') || msg.includes('🚀')) return 'que_es_yavoy';
        if (msg.includes('hacer pedido') || msg.includes('hacer un pedido') || msg.includes('🛍️')) return 'accion_hacer_pedido';
        if (msg.includes('registrar comercio') || msg.includes('soy comercio') || msg.includes('🏪')) return 'accion_registro_comercio';
        if (msg.includes('ser repartidor') || msg.includes('trabajar') || msg.includes('🚴')) return 'accion_ser_repartidor';
        if (msg.includes('pregunta') || msg.includes('faq') || msg.includes('❓')) return 'mostrar_categorias';
        
        return 'desconocido';
    }

    // Obtener respuesta según intención
    getResponse(intent) {
        const responses = {
            // Beneficios
            beneficios_clientes: '🛍️ *Beneficios para Clientes:*\n\n' + this.knowledgeBase.beneficios.clientes.join('\n'),
            beneficios_comercios: '🏪 *Beneficios para Comercios:*\n\n' + this.knowledgeBase.beneficios.comercios.join('\n'),
            beneficios_repartidores: '🚴 *Beneficios para Repartidores:*\n\n' + this.knowledgeBase.beneficios.repartidores.join('\n'),
            
            // Clientes
            como_hacer_pedido: this.knowledgeBase.faq.clientes['¿Cómo hago un pedido?'],
            costo_envio: this.knowledgeBase.faq.clientes['¿Cuánto cuesta el envío?'],
            tiempo_entrega: this.knowledgeBase.faq.clientes['¿Cuánto tarda la entrega?'],
            rastrear_pedido: this.knowledgeBase.faq.clientes['¿Puedo rastrear mi pedido?'],
            metodos_pago: this.knowledgeBase.faq.clientes['¿Qué métodos de pago aceptan?'],
            
            // Comercios
            registro_comercio: this.knowledgeBase.faq.comercios['¿Cómo me registro como comercio?'],
            costo_registro: this.knowledgeBase.faq.comercios['¿Cuánto cuesta registrarse?'],
            como_recibo_pedidos: this.knowledgeBase.faq.comercios['¿Cómo recibo los pedidos?'],
            modificar_datos: this.knowledgeBase.faq.comercios['¿Puedo modificar mis datos?'],
            
            // Repartidores
            requisitos_repartidor: this.knowledgeBase.faq.repartidores['¿Qué necesito para ser repartidor?'],
            cuanto_gano: this.knowledgeBase.faq.repartidores['¿Cuánto puedo ganar?'],
            como_cobro: this.knowledgeBase.faq.repartidores['¿Cómo recibo los pagos?'],
            elegir_entregas: this.knowledgeBase.faq.repartidores['¿Puedo elegir qué entregas hacer?'],
            problema_entrega: this.knowledgeBase.faq.repartidores['¿Qué pasa si tengo un problema?'],
            
            // General
            zonas_operacion: this.knowledgeBase.faq.general['¿En qué zonas operan?'],
            es_app_movil: this.knowledgeBase.faq.general['¿YAvoy es una app móvil?'],
            seguridad: this.knowledgeBase.faq.general['¿Es seguro usar YAvoy?'],
            contacto: this.knowledgeBase.faq.general['¿Cómo contactarlos?'],
            
            // Acciones
            que_es_yavoy: '🚀 *YAvoy* es la plataforma de delivery inteligente que conecta clientes, comercios locales y repartidores independientes.\n\n¿Qué te gustaría saber?',
            accion_hacer_pedido: 'Para hacer un pedido, haz clic en el botón "Pedir Ahora" en la página principal. Te llevará al formulario de pedidos. ¿Necesitas ayuda con algo más?',
            accion_registro_comercio: 'Para registrar tu comercio, haz clic en "Unirse como Socio" en la página principal. Es 100% GRATIS. ¿Quieres saber los beneficios?',
            accion_ser_repartidor: 'Para ser repartidor, haz clic en "Ganar con YAvoy" en la página principal. Ganas el 85% por entrega. ¿Te interesa saber los requisitos?',
            
            mostrar_categorias: '¿Sobre qué tema necesitas ayuda?',
            
            desconocido: 'Disculpa, no entendí tu pregunta. ¿Podrías reformularla? También puedes seleccionar una opción de las sugerencias.'
        };
        
        return responses[intent] || responses.desconocido;
    }

    // Obtener acciones rápidas según contexto
    getQuickActions(intent) {
        const actions = {
            que_es_yavoy: ['🛍️ Beneficios clientes', '🏪 Beneficios comercios', '🚴 Beneficios repartidores', '❓ Más preguntas'],
            
            beneficios_clientes: ['¿Cómo hago un pedido?', '¿Cuánto cuesta el envío?', '¿Cuánto tarda?', '¿Puedo rastrear?'],
            beneficios_comercios: ['¿Cómo me registro?', '¿Cuánto cuesta?', '¿Cómo recibo pedidos?', 'Modificar datos'],
            beneficios_repartidores: ['¿Qué necesito?', '¿Cuánto gano?', '¿Cómo cobro?', '¿Elijo entregas?'],
            
            mostrar_categorias: ['🛍️ Clientes', '🏪 Comercios', '🚴 Repartidores', '⚙️ General'],
            
            como_hacer_pedido: ['¿Cuánto cuesta envío?', '¿Cuánto tarda?', '¿Puedo rastrear?', 'Métodos de pago'],
            accion_hacer_pedido: ['¿Cuánto cuesta envío?', '¿Cuánto tarda?', '¿Puedo rastrear?'],
            
            accion_registro_comercio: ['Ver beneficios', '¿Cuánto cuesta?', 'Contactar'],
            accion_ser_repartidor: ['Ver requisitos', '¿Cuánto gano?', 'Contactar'],
            
            desconocido: ['🚀 ¿Qué es YAvoy?', '🛍️ Hacer pedido', '🏪 Registrar comercio', '🚴 Ser repartidor']
        };
        
        return actions[intent] || actions.desconocido;
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

        // Generar respuesta inteligente del bot
        setTimeout(() => {
            this.generateBotResponse(text);
        }, 800);
    }

    generateBotResponse(userMessage) {
        // Detectar la intención del mensaje
        const intent = this.detectIntent(userMessage);
        
        // Obtener la respuesta apropiada
        const response = this.getResponse(intent);
        
        // Obtener acciones rápidas contextuales
        const actions = this.getQuickActions(intent);
        
        // Enviar respuesta con acciones
        this.addBotMessage(response, actions);
    }

    handleQuickAction(action) {
        this.addUserMessage(action);

        setTimeout(() => {
            // Procesar la acción como si fuera un mensaje del usuario
            this.generateBotResponse(action);
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
