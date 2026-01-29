// YAvoyOk Chatbot IA Avanzado con Configuración Dinámica
// Sistema empático, promocional e intuitivo
// Compatible con sistema de chatbot existente

class YAvoyAIAssistant {
    constructor(options = {}) {
        // Verificar compatibilidad con sistema existente
        this.isCompatibilityMode = window.chatbot ? true : false;
        
        this.config = {
            // Configuración de personalidad
            empathy_level: options.empathy_level || 8, // 1-10
            promotional_intensity: options.promotional_intensity || 6, // 1-10
            response_style: options.response_style || 'friendly', // friendly, professional, casual
            language: options.language || 'es',
            
            // Configuración de comportamiento
            proactive_suggestions: options.proactive_suggestions !== false,
            upselling_enabled: options.upselling_enabled !== false,
            personalization: options.personalization !== false,
            emotion_detection: options.emotion_detection !== false,
            
            // Configuración de accesibilidad
            voice_enabled: options.voice_enabled !== false,
            simple_language: options.simple_language || false,
            visual_indicators: options.visual_indicators !== false
        };

        this.userContext = {
            name: null,
            type: null, // cliente, comercio, repartidor
            preferences: {},
            history: [],
            mood: 'neutral', // happy, frustrated, confused, excited
            interaction_count: 0,
            last_interaction: null,
            satisfaction_score: 5
        };

        this.emotionalStates = {
            frustrated: {
                responses: [
                    "Entiendo que esto puede ser frustrante 😔 Déjame ayudarte de la mejor manera posible",
                    "Sé que esto no es lo ideal. Vamos paso a paso para solucionarlo juntos 💙",
                    "Lamento que estés pasando por esto. Mi prioridad es ayudarte ahora mismo"
                ],
                tone: 'understanding',
                urgency: 'high'
            },
            confused: {
                responses: [
                    "No te preocupes, vamos a aclarar esto juntos 😊 Te explico paso a paso",
                    "Entiendo que puede ser confuso. Déjame simplificártelo",
                    "Tranquilo/a, es normal tener dudas. Te voy a guiar"
                ],
                tone: 'patient',
                urgency: 'medium'
            },
            excited: {
                responses: [
                    "¡Qué emocionante! 🎉 Me alegra mucho poder ayudarte con esto",
                    "¡Me encanta tu entusiasmo! ✨ Vamos a hacer esto realidad",
                    "¡Genial! 🚀 Esto va a ser increíble"
                ],
                tone: 'enthusiastic',
                urgency: 'medium'
            },
            happy: {
                responses: [
                    "¡Excelente! 😊 Me alegra que estés contento/a",
                    "¡Qué bueno! ✨ Sigamos así",
                    "¡Perfecto! 🌟 Me encanta cuando todo sale bien"
                ],
                tone: 'positive',
                urgency: 'low'
            }
        };

        this.promotionalStrategies = {
            new_user: {
                offers: [
                    "🎁 ¡Primera entrega GRATIS en tu primer pedido!",
                    "✨ Descuento del 20% en tu primer pedido como bienvenida",
                    "🚀 Sin costos de envío en tu primera experiencia con YAvoy"
                ],
                timing: 'immediate'
            },
            returning_user: {
                offers: [
                    "💎 Eres usuario Premium! Envío gratis en pedidos sobre $1000",
                    "🔥 Oferta especial: 15% off en tu comercio favorito",
                    "⭐ Por tu fidelidad: accumula puntos por cada pedido"
                ],
                timing: 'contextual'
            },
            comercio_prospect: {
                offers: [
                    "🏪 Registro GRATIS + primer mes sin comisiones",
                    "📈 Aumenta tus ventas hasta 300% con nosotros",
                    "💰 Cero costos de inicio, solo ganas cuando vendes"
                ],
                timing: 'after_interest'
            }
        };

        this.contextualResponses = {
            tiempo_espera: {
                understanding: "Entiendo que el tiempo es valioso para ti",
                explanation: "Te cuento que nuestros repartidores están trabajando para llegar lo antes posible",
                action: "¿Te gustaría que contacte al repartidor para actualizar el tiempo?",
                promotion: "Mientras esperas, ¿sabías que con Premium tienes prioridad en todas las entregas?"
            },
            problema_pago: {
                understanding: "Los problemas de pago son súper frustrantes, lo entiendo perfectamente",
                explanation: "Esto puede pasar por varios motivos, pero siempre tiene solución",
                action: "Vamos a revisar esto juntos paso a paso",
                promotion: "Con YAvoy Wallet, nunca más tendrás problemas de pago. ¿Te interesa?"
            },
            primera_vez: {
                understanding: "¡Qué emocionante que pruebes YAvoy por primera vez! 🎉",
                explanation: "Te voy a guiar para que tengas la mejor experiencia posible",
                action: "¿Empezamos con tu primer pedido?",
                promotion: "Como bienvenida, tu primera entrega es completamente GRATIS 🎁"
            }
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadUserContext();
        this.initializePersonalityProfile();
        this.startProactiveEngagement();
        console.log('🤖 YAvoy AI Assistant initialized');
    }

    // CONFIGURACIÓN DINÁMICA
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.announceConfigChange();
        this.saveConfig();
    }

    announceConfigChange() {
        const announcement = this.generatePersonalizedResponse(
            `He actualizado mi configuración para brindarte una mejor experiencia. 
            Nivel de empatía: ${this.config.empathy_level}/10, 
            Estilo: ${this.config.response_style} ✨`
        );
        this.sendMessage(announcement, 'system');
    }

    // DETECCIÓN DE EMOCIONES
    detectEmotion(message) {
        const frustrationKeywords = ['problema', 'error', 'mal', 'no funciona', 'frustrado', 'molesto', 'terrible'];
        const confusionKeywords = ['no entiendo', 'confuso', 'como', 'que significa', 'ayuda', 'no sé'];
        const excitementKeywords = ['genial', 'increíble', 'perfecto', 'excelente', 'emocionado', 'ansioso'];
        const happinessKeywords = ['gracias', 'feliz', 'contento', 'bien', 'bueno', 'satisfecho'];

        const lowerMessage = message.toLowerCase();
        
        if (frustrationKeywords.some(word => lowerMessage.includes(word))) {
            this.userContext.mood = 'frustrated';
        } else if (confusionKeywords.some(word => lowerMessage.includes(word))) {
            this.userContext.mood = 'confused';
        } else if (excitementKeywords.some(word => lowerMessage.includes(word))) {
            this.userContext.mood = 'excited';
        } else if (happinessKeywords.some(word => lowerMessage.includes(word))) {
            this.userContext.mood = 'happy';
        }

        return this.userContext.mood;
    }

    // GENERACIÓN DE RESPUESTAS EMPÁTICAS
    generateEmpathicResponse(emotion, context) {
        const emotionalState = this.emotionalStates[emotion];
        if (!emotionalState) return "";

        const empathyMultiplier = this.config.empathy_level / 10;
        const baseResponse = emotionalState.responses[Math.floor(Math.random() * emotionalState.responses.length)];
        
        // Personalizar según el nivel de empatía configurado
        if (empathyMultiplier > 0.7) {
            return this.enhanceWithHighEmpathy(baseResponse, context);
        } else if (empathyMultiplier > 0.4) {
            return this.enhanceWithMediumEmpathy(baseResponse, context);
        } else {
            return this.enhanceWithLowEmpathy(baseResponse, context);
        }
    }

    enhanceWithHighEmpathy(response, context) {
        const personalTouch = this.userContext.name ? ` ${this.userContext.name}` : "";
        const contextualAddition = this.getContextualEmpathy(context);
        return `${response}${personalTouch}. ${contextualAddition}`;
    }

    enhanceWithMediumEmpathy(response, context) {
        return `${response} ${this.getContextualEmpathy(context)}`;
    }

    enhanceWithLowEmpathy(response, context) {
        return response;
    }

    getContextualEmpathy(context) {
        const empathicPhrases = [
            "Estoy aquí para ti en todo momento",
            "Tu experiencia es muy importante para nosotros",
            "Vamos a resolver esto juntos",
            "Entiendo exactamente por lo que estás pasando",
            "Tu paciencia es muy valiosa para mí"
        ];
        return empathicPhrases[Math.floor(Math.random() * empathicPhrases.length)];
    }

    // SISTEMA PROMOCIONAL INTELIGENTE
    generatePromotionalContent(context) {
        if (!this.config.upselling_enabled) return "";

        const userType = this.identifyUserType(context);
        const intensity = this.config.promotional_intensity / 10;
        
        let promotionalStrategy = this.promotionalStrategies[userType];
        if (!promotionalStrategy) promotionalStrategy = this.promotionalStrategies.new_user;

        const offer = promotionalStrategy.offers[Math.floor(Math.random() * promotionalStrategy.offers.length)];
        
        return this.formatPromotionalOffer(offer, intensity);
    }

    formatPromotionalOffer(offer, intensity) {
        if (intensity > 0.7) {
            return `\n\n🌟 **¡OFERTA ESPECIAL!** ${offer}\n\n¿Te interesa aprovechar esta oportunidad única? ✨`;
        } else if (intensity > 0.4) {
            return `\n\n💡 Por cierto: ${offer}`;
        } else {
            return `\n\n${offer}`;
        }
    }

    identifyUserType(context) {
        if (this.userContext.type) return this.userContext.type;
        
        // Análisis inteligente del contexto
        const message = context.toLowerCase();
        if (message.includes('comercio') || message.includes('vender') || message.includes('negocio')) {
            return 'comercio_prospect';
        } else if (this.userContext.interaction_count > 3) {
            return 'returning_user';
        } else {
            return 'new_user';
        }
    }

    // PROCESAMIENTO PRINCIPAL DE MENSAJES
    async processMessage(message, context = {}) {
        this.userContext.interaction_count++;
        this.userContext.last_interaction = new Date();
        this.userContext.history.push({ message, timestamp: new Date() });

        // Detección de emociones
        const emotion = this.detectEmotion(message);
        
        // Análisis de intenciones
        const intent = await this.analyzeIntent(message);
        
        // Generación de respuesta base
        let response = await this.generateBaseResponse(message, intent);
        
        // Enriquecimiento empático
        const empathicEnhancement = this.generateEmpathicResponse(emotion, context);
        if (empathicEnhancement) {
            response = `${empathicEnhancement}\n\n${response}`;
        }

        // Contenido promocional contextual
        if (this.shouldIncludePromotion(intent, emotion)) {
            const promotional = this.generatePromotionalContent(context);
            response += promotional;
        }

        // Sugerencias proactivas
        if (this.config.proactive_suggestions) {
            const suggestions = this.generateProactiveSuggestions(intent, context);
            if (suggestions.length > 0) {
                response += `\n\n💡 **Sugerencias:**\n${suggestions.join('\n')}`;
            }
        }

        // Personalización final
        response = this.personalizeResponse(response);

        return this.formatResponse(response, emotion, intent);
    }

    async analyzeIntent(message) {
        const intents = {
            'hacer_pedido': ['pedido', 'pedir', 'ordenar', 'comprar'],
            'rastrear_pedido': ['seguir', 'rastrear', 'track', 'donde esta', 'estado'],
            'problema_tecnico': ['error', 'no funciona', 'problema', 'falla', 'bug'],
            'informacion_comercio': ['comercio', 'registrar', 'vender', 'negocio'],
            'informacion_repartidor': ['repartidor', 'delivery', 'trabajar', 'ganar'],
            'soporte_pago': ['pago', 'tarjeta', 'dinero', 'cobro'],
            'feedback': ['opinion', 'sugerencia', 'queja', 'felicitar'],
            'saludo': ['hola', 'buenas', 'saludos', 'hey'],
            'despedida': ['chau', 'adios', 'hasta luego', 'bye'],
            'agradecimiento': ['gracias', 'thank you', 'muchas gracias']
        };

        const lowerMessage = message.toLowerCase();
        
        for (const [intent, keywords] of Object.entries(intents)) {
            if (keywords.some(keyword => lowerMessage.includes(keyword))) {
                return intent;
            }
        }

        return 'consulta_general';
    }

    async generateBaseResponse(message, intent) {
        const responses = {
            'hacer_pedido': () => this.generateOrderResponse(),
            'rastrear_pedido': () => this.generateTrackingResponse(),
            'problema_tecnico': () => this.generateTechSupportResponse(),
            'informacion_comercio': () => this.generateBusinessInfoResponse(),
            'informacion_repartidor': () => this.generateDeliveryInfoResponse(),
            'soporte_pago': () => this.generatePaymentSupportResponse(),
            'saludo': () => this.generateGreetingResponse(),
            'despedida': () => this.generateFarewellResponse(),
            'agradecimiento': () => this.generateThankYouResponse(),
            'consulta_general': () => this.generateGeneralResponse(message)
        };

        return responses[intent] ? responses[intent]() : responses['consulta_general']();
    }

    generateOrderResponse() {
        return `¡Excelente! 🛒 Hacer un pedido en YAvoy es súper fácil y rápido:

**Proceso paso a paso:**
1️⃣ **Explora comercios** → Ve nuestra amplia selección
2️⃣ **Elige tu favorito** → Revisa menús y calificaciones  
3️⃣ **Personaliza tu pedido** → Añade notas especiales
4️⃣ **Confirma tu dirección** → Para entrega precisa
5️⃣ **Realiza el pago** → Múltiples opciones disponibles
6️⃣ **¡Relájate!** → Seguí tu pedido en tiempo real

🚀 **Tiempo promedio:** 15-30 minutos desde que confirmás hasta que llegue a tu puerta.`;
    }

    generateTrackingResponse() {
        return `📍 **Seguimiento en tiempo real activado**

Tu pedido pasa por estos estados:
🔄 **Confirmado** → El comercio recibió tu pedido
👨‍🍳 **Preparando** → Están preparando tu orden  
🚴‍♂️ **En camino** → Repartidor hacia tu ubicación
✅ **Entregado** → ¡Disfruta tu pedido!

💡 **Tips para mejor seguimiento:**
• Activa notificaciones push para actualizaciones instantáneas
• El repartidor te contactará si necesita indicaciones
• Puedes chatear directamente desde la plataforma`;
    }

    generateTechSupportResponse() {
        return `🔧 **Soporte Técnico Inmediato**

Entiendo que los problemas técnicos son frustrantes. Vamos a solucionarlo:

**Soluciones rápidas:**
1. **Recarga la página** → Ctrl+F5 (muchos problemas se resuelven así)
2. **Verifica tu conexión** → Revisa tu internet
3. **Limpia caché** → En configuración del navegador
4. **Prueba otro navegador** → Chrome, Firefox o Edge
5. **Desactiva extensiones** → Algunas pueden interferir

**Si persiste el problema:**
📱 WhatsApp: +54 221 504 7962 (respuesta inmediata)
📧 Email: YAvoy5@gmail.com
🕐 Soporte 24/7 disponible`;
    }

    generateBusinessInfoResponse() {
        return `🏪 **¡Súmate a YAvoy y transforma tu negocio!**

**¿Por qué elegirnos?**
✨ **Registro 100% GRATUITO** (sin costos ocultos)
📈 **Aumenta ventas hasta 300%** (datos reales de socios)
💰 **Solo pagas cuando vendes** (comisión justa por pedido)
🚀 **Visibilidad inmediata** (miles de clientes activos)
📱 **Panel de gestión intuitivo** (controla todo desde tu celular)
🎯 **Marketing incluido** (promociones automáticas)

**Proceso de registro:**
1. Completa formulario simple (2 minutos)
2. Verificación automática (mismo día)
3. Capacitación gratuita incluida
4. ¡Comienza a recibir pedidos!

**Soporte dedicado para comercios:**
🤝 Acompañamiento personalizado
📊 Reportes de ventas detallados  
🎓 Capacitación continua`;
    }

    generateDeliveryInfoResponse() {
        return `🚴‍♂️ **¡Únete al equipo de repartidores YAvoy!**

**¿Cuánto puedes ganar?**
💰 **$15,000 - $45,000 por mes** (dependiendo de horas trabajadas)
🏆 **Bonos por performance** (hasta $5,000 extra)
⭐ **Propinas promedio:** $50-150 por entrega
📈 **Ingresos crecientes** según tu calificación

**Requisitos mínimos:**
✅ Mayor de 18 años
✅ Vehículo propio (moto, bici, auto)
✅ Celular con internet
✅ Disponibilidad de horarios
✅ Ganas de trabajar

**Beneficios exclusivos:**
🛡️ **Seguro incluido** durante trabajos
⛽ **Descuentos en combustible**
🍕 **Descuentos en pedidos personales**
📱 **App intuitiva** para gestionar entregas
🕐 **Horarios flexibles** (trabajas cuando quieres)

**¿Cómo empezar?**
1. Registro online (5 minutos)
2. Verificación de datos (24-48hs)
3. Capacitación virtual gratuita
4. ¡Comienza a ganar!`;
    }

    generatePaymentSupportResponse() {
        return `💳 **Soporte de Pagos - Te ayudo a resolver esto**

**Métodos de pago disponibles:**
💳 **Tarjetas** → Débito/Crédito (todas las marcas)
📱 **Billeteras digitales** → MercadoPago, Todo Pago
💵 **Efectivo** → Pago contra entrega
🏧 **Transferencia** → CBU disponible
💎 **YAvoy Wallet** → Nuestra billetera digital

**Problemas comunes y soluciones:**
🚫 **Tarjeta rechazada**
• Verifica datos ingresados
• Confirma límites de compra
• Contacta a tu banco

⏳ **Pago pendiente**  
• Puede tardar 5-15 minutos en procesar
• Verifica en tu homebanking
• Te notificaremos cuando se confirme

🔒 **Seguridad garantizada**
• Encriptación de datos
• Sin almacenamiento de información sensible
• Certificación SSL`;
    }

    generateGreetingResponse() {
        const greetings = [
            `¡Hola! 👋 Soy el asistente inteligente de YAvoy. ¿En qué puedo ayudarte hoy?`,
            `¡Bienvenido/a a YAvoy! 🌟 Estoy aquí para hacer tu experiencia increíble. ¿Qué necesitas?`,
            `¡Hola! 😊 Me alegra verte por aquí. Soy tu asistente personal de YAvoy. ¿Cómo puedo ayudarte?`
        ];
        return greetings[Math.floor(Math.random() * greetings.length)];
    }

    generateFarewellResponse() {
        return `¡Hasta pronto! 👋 Fue un placer ayudarte. 

🌟 Recuerda que estoy disponible 24/7 para cualquier cosa que necesites.
💙 ¡Que tengas un excelente día y disfrutes de YAvoy!`;
    }

    generateThankYouResponse() {
        const responses = [
            `¡De nada! 😊 Para eso estoy aquí. Tu satisfacción es mi prioridad.`,
            `¡Un placer ayudarte! 💙 Si necesitas algo más, no dudes en preguntarme.`,
            `¡Siempre es un gusto asistirte! ✨ Estoy aquí cuando me necesites.`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    generateGeneralResponse(message) {
        return `Recibí tu mensaje: "${message}"

🤔 Aunque no estoy 100% seguro de cómo responderte de la mejor manera, estoy aquí para ayudarte con:

👤 **Para Clientes:**
• Hacer y rastrear pedidos
• Soporte técnico  
• Información de pagos

🏪 **Para Comercios:**
• Registro gratuito
• Gestión de pedidos
• Estrategias de ventas

🚴‍♂️ **Para Repartidores:**
• Proceso de registro
• Información de ganancias
• Soporte en entregas

💬 ¿Podrías contarme un poco más específicamente qué necesitas? Así te puedo dar la respuesta perfecta que buscas.`;
    }

    shouldIncludePromotion(intent, emotion) {
        // No incluir promociones si el usuario está frustrado
        if (emotion === 'frustrated') return false;
        
        // Incluir promociones en contextos apropiados
        const promotionalIntents = ['hacer_pedido', 'informacion_comercio', 'informacion_repartidor', 'consulta_general'];
        return promotionalIntents.includes(intent) && Math.random() > 0.3;
    }

    generateProactiveSuggestions(intent, context) {
        const suggestions = [];
        
        switch (intent) {
            case 'hacer_pedido':
                suggestions.push('💡 Activa notificaciones para seguir tu pedido en tiempo real');
                suggestions.push('⭐ Revisa las calificaciones antes de elegir');
                break;
            case 'problema_tecnico':
                suggestions.push('📱 Descarga nuestra app para mejor experiencia');
                suggestions.push('🔔 Reporta el problema para mejoras futuras');
                break;
            case 'informacion_comercio':
                suggestions.push('📊 Solicita una demo personalizada');
                suggestions.push('🎯 Conoce casos de éxito de otros comercios');
                break;
        }
        
        return suggestions;
    }

    personalizeResponse(response) {
        if (this.userContext.name) {
            // Personalización con nombre cuando sea apropiado
            return response.replace(/\b(te|tu|tus)\b/gi, match => {
                return Math.random() > 0.7 ? `${this.userContext.name}, ${match}` : match;
            });
        }
        return response;
    }

    formatResponse(response, emotion, intent) {
        // Formato según la emoción detectada
        switch (emotion) {
            case 'frustrated':
                return `🚨 **ATENCIÓN PRIORITARIA**\n\n${response}`;
            case 'excited':
                return `🎉 **¡GENIAL!**\n\n${response}`;
            case 'confused':
                return `🤝 **Te explico paso a paso:**\n\n${response}`;
            default:
                return response;
        }
    }

    // ENGAGEMENT PROACTIVO
    startProactiveEngagement() {
        // Mensajes proactivos basados en comportamiento
        setTimeout(() => {
            if (this.userContext.interaction_count === 0) {
                this.sendProactiveMessage("¡Hola! 👋 Veo que estás navegando por YAvoy. ¿Te puedo ayudar con algo?");
            }
        }, 30000); // Después de 30 segundos sin interacción

        // Seguimiento de satisfacción
        setInterval(() => {
            if (this.userContext.interaction_count > 3 && Math.random() > 0.8) {
                this.sendSatisfactionCheck();
            }
        }, 120000); // Cada 2 minutos
    }

    sendProactiveMessage(message) {
        this.sendMessage(message, 'proactive');
    }

    sendSatisfactionCheck() {
        const message = `💙 ¿Cómo ha sido tu experiencia conmigo hasta ahora? Tu opinión me ayuda a mejorar.

<div style="display: flex; gap: 10px; margin-top: 10px;">
    <button onclick="yavoyAI.rateSatisfaction(5)" class="satisfaction-btn">😍 Excelente</button>
    <button onclick="yavoyAI.rateSatisfaction(4)" class="satisfaction-btn">😊 Buena</button>
    <button onclick="yavoyAI.rateSatisfaction(3)" class="satisfaction-btn">😐 Regular</button>
    <button onclick="yavoyAI.rateSatisfaction(2)" class="satisfaction-btn">😕 Mala</button>
</div>`;
        
        this.sendMessage(message, 'satisfaction');
    }

    rateSatisfaction(score) {
        this.userContext.satisfaction_score = score;
        
        const responses = {
            5: "¡Increíble! 🎉 Me alegra mucho saber que tenemos una excelente conexión. ¡Seguimos así!",
            4: "¡Genial! 😊 Me da mucha satisfacción ayudarte bien. Siempre busco mejorar.",
            3: "Gracias por tu honestidad 😐 ¿Hay algo específico en lo que pueda mejorar para ti?",
            2: "Lamento que la experiencia no haya sido la mejor 😕 ¿Podrías contarme qué puedo hacer mejor?"
        };
        
        this.sendMessage(responses[score] || responses[3], 'system');
        
        // Ajustar configuración basada en feedback
        if (score < 3) {
            this.config.empathy_level = Math.min(10, this.config.empathy_level + 1);
            this.config.promotional_intensity = Math.max(1, this.config.promotional_intensity - 2);
        }
    }

    // MÉTODOS DE CONFIGURACIÓN PARA ADMINISTRADORES
    configureForAccessibility() {
        this.updateConfig({
            simple_language: true,
            voice_enabled: true,
            visual_indicators: true,
            empathy_level: 9,
            response_style: 'simple'
        });
        
        this.sendMessage("✨ Modo accesibilidad activado. Respuestas simplificadas y soporte de voz habilitado.", 'system');
    }

    configureForBusiness() {
        this.updateConfig({
            promotional_intensity: 8,
            response_style: 'professional',
            upselling_enabled: true,
            proactive_suggestions: true
        });
        
        this.sendMessage("💼 Modo comercial activado. Enfoque en ventas y oportunidades de negocio.", 'system');
    }

    configureForSupport() {
        this.updateConfig({
            empathy_level: 10,
            promotional_intensity: 2,
            response_style: 'friendly',
            proactive_suggestions: true
        });
        
        this.sendMessage("🤝 Modo soporte activado. Máxima empatía y enfoque en resolver problemas.", 'system');
    }

    // PERSISTENCIA DE DATOS
    saveUserContext() {
        localStorage.setItem('yavoy_ai_context', JSON.stringify(this.userContext));
    }

    loadUserContext() {
        const saved = localStorage.getItem('yavoy_ai_context');
        if (saved) {
            this.userContext = { ...this.userContext, ...JSON.parse(saved) };
        }
    }

    saveConfig() {
        localStorage.setItem('yavoy_ai_config', JSON.stringify(this.config));
    }

    loadConfig() {
        const saved = localStorage.getItem('yavoy_ai_config');
        if (saved) {
            this.config = { ...this.config, ...JSON.parse(saved) };
        }
    }

    // INTERFAZ CON EL CHATBOT EXISTENTE - Modo compatible
    sendMessage(message, type = 'bot') {
        if (this.isCompatibilityMode && window.chatbot && window.chatbot.addMessage) {
            // Usar chatbot existente si está disponible
            window.chatbot.addMessage(message, type);
        } else if (this.externalSendMessage) {
            // Usar función externa si fue configurada
            this.externalSendMessage(message, type);
        } else {
            console.log(`[YAvoy AI ${type}]: ${message}`);
        }
    }

    setExternalSendMessage(sendMessageFunction) {
        this.externalSendMessage = sendMessageFunction;
    }

    setupEventListeners() {
        // Integración con el sistema existente - Modo no invasivo
        if (this.isCompatibilityMode && window.chatbot) {
            // Guardar referencia original
            this.originalProcessMessage = window.chatbot.processMessage;
            
            // Enhancer no invasivo - solo si no hay conflicto
            const self = this;
            const originalProcessMessage = window.chatbot.processMessage;
            
            if (originalProcessMessage) {
                window.chatbot.processMessageWithAI = async function(message) {
                    try {
                        const aiResponse = await self.processMessage(message);
                        return aiResponse;
                    } catch (error) {
                        console.warn('AI fallback to original:', error);
                        return originalProcessMessage.call(this, message);
                    }
                };
            }
        }
    }
}

// SISTEMA DE CONFIGURACIÓN ADMINISTRATIVA
class YAvoyAIAdmin {
    constructor(aiAssistant) {
        this.ai = aiAssistant;
        this.setupAdminInterface();
    }

    setupAdminInterface() {
        // Crear panel de administración
        this.createAdminPanel();
        this.setupConfigControls();
        this.setupAnalytics();
    }

    createAdminPanel() {
        const adminPanel = document.createElement('div');
        adminPanel.id = 'yavoy-ai-admin';
        adminPanel.innerHTML = `
            <div class="ai-admin-panel">
                <h3>🤖 YAvoy AI - Panel de Configuración</h3>
                
                <div class="config-section">
                    <h4>Personalidad del Bot</h4>
                    <label>Nivel de Empatía (1-10):</label>
                    <input type="range" id="empathy-slider" min="1" max="10" value="${this.ai.config.empathy_level}">
                    <span id="empathy-value">${this.ai.config.empathy_level}</span>
                    
                    <label>Intensidad Promocional (1-10):</label>
                    <input type="range" id="promo-slider" min="1" max="10" value="${this.ai.config.promotional_intensity}">
                    <span id="promo-value">${this.ai.config.promotional_intensity}</span>
                    
                    <label>Estilo de Respuesta:</label>
                    <select id="response-style">
                        <option value="friendly" ${this.ai.config.response_style === 'friendly' ? 'selected' : ''}>Amigable</option>
                        <option value="professional" ${this.ai.config.response_style === 'professional' ? 'selected' : ''}>Profesional</option>
                        <option value="casual" ${this.ai.config.response_style === 'casual' ? 'selected' : ''}>Casual</option>
                    </select>
                </div>

                <div class="config-section">
                    <h4>Funcionalidades</h4>
                    <label><input type="checkbox" id="proactive-suggestions" ${this.ai.config.proactive_suggestions ? 'checked' : ''}> Sugerencias Proactivas</label>
                    <label><input type="checkbox" id="upselling-enabled" ${this.ai.config.upselling_enabled ? 'checked' : ''}> Upselling Habilitado</label>
                    <label><input type="checkbox" id="emotion-detection" ${this.ai.config.emotion_detection ? 'checked' : ''}> Detección de Emociones</label>
                    <label><input type="checkbox" id="voice-enabled" ${this.ai.config.voice_enabled ? 'checked' : ''}> Síntesis de Voz</label>
                </div>

                <div class="config-section">
                    <h4>Presets Rápidos</h4>
                    <button onclick="window.yavoyAdvancedAIAdmin.ai.configureForAccessibility()">♿ Modo Accesibilidad</button>
                    <button onclick="window.yavoyAdvancedAIAdmin.ai.configureForBusiness()">💼 Modo Comercial</button>
                    <button onclick="window.yavoyAdvancedAIAdmin.ai.configureForSupport()">🤝 Modo Soporte</button>
                </div>

                <div class="config-section">
                    <h4>Estadísticas</h4>
                    <div id="ai-stats">
                        <p>Interacciones hoy: <span id="interactions-today">0</span></p>
                        <p>Satisfacción promedio: <span id="avg-satisfaction">0</span>/5</p>
                        <p>Modo actual: <span id="current-mode">${this.ai.config.response_style}</span></p>
                    </div>
                </div>
            </div>
        `;
        
        // Insertar en el DOM si existe el contenedor del chatbot
        const chatContainer = document.querySelector('.chatbot-container') || document.body;
        chatContainer.appendChild(adminPanel);
    }

    setupConfigControls() {
        // Event listeners para los controles
        document.getElementById('empathy-slider')?.addEventListener('input', (e) => {
            const value = e.target.value;
            document.getElementById('empathy-value').textContent = value;
            this.ai.updateConfig({ empathy_level: parseInt(value) });
        });

        document.getElementById('promo-slider')?.addEventListener('input', (e) => {
            const value = e.target.value;
            document.getElementById('promo-value').textContent = value;
            this.ai.updateConfig({ promotional_intensity: parseInt(value) });
        });

        document.getElementById('response-style')?.addEventListener('change', (e) => {
            this.ai.updateConfig({ response_style: e.target.value });
            document.getElementById('current-mode').textContent = e.target.value;
        });

        // Checkboxes
        ['proactive-suggestions', 'upselling-enabled', 'emotion-detection', 'voice-enabled'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', (e) => {
                const configKey = id.replace(/-/g, '_');
                this.ai.updateConfig({ [configKey]: e.target.checked });
            });
        });
    }

    setupAnalytics() {
        // Actualizar estadísticas cada 30 segundos
        setInterval(() => {
            this.updateStats();
        }, 30000);
    }

    updateStats() {
        if (document.getElementById('interactions-today')) {
            document.getElementById('interactions-today').textContent = this.ai.userContext.interaction_count;
            document.getElementById('avg-satisfaction').textContent = this.ai.userContext.satisfaction_score.toFixed(1);
        }
    }
}

// Inicializar el sistema automáticamente - Modo compatible
document.addEventListener('DOMContentLoaded', () => {
    // Esperar a que el chatbot existente esté disponible
    setTimeout(() => {
        // Solo inicializar si no existe ya una instancia
        if (!window.yavoyAdvancedAI) {
            window.yavoyAdvancedAI = new YAvoyAIAssistant({
                empathy_level: 8,
                promotional_intensity: 6,
                response_style: 'friendly'
            });
            
            window.yavoyAdvancedAIAdmin = new YAvoyAIAdmin(window.yavoyAdvancedAI);
            
            console.log('🚀 YAvoy AI Assistant con configuración avanzada iniciado (modo compatible)');
        }
    }, 2000);
});

// CSS para el panel de administración
const adminStyles = `
<style>
.ai-admin-panel {
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(15, 23, 36, 0.95);
    border: 2px solid #06b6d4;
    border-radius: 15px;
    padding: 20px;
    color: white;
    font-family: 'Segoe UI', sans-serif;
    max-width: 350px;
    z-index: 10000;
    backdrop-filter: blur(10px);
}

.ai-admin-panel h3 {
    color: #06b6d4;
    margin-bottom: 20px;
    text-align: center;
}

.config-section {
    margin-bottom: 20px;
    padding: 15px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
}

.config-section h4 {
    color: #fbbf24;
    margin-bottom: 10px;
}

.config-section label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
}

.config-section input[type="range"] {
    width: 100%;
    margin-bottom: 10px;
}

.config-section select {
    width: 100%;
    padding: 5px;
    border-radius: 5px;
    background: #1f2937;
    color: white;
    border: 1px solid #374151;
}

.config-section button {
    background: #06b6d4;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 5px;
    margin: 5px;
    cursor: pointer;
    font-size: 12px;
}

.config-section button:hover {
    background: #0891b2;
}

.satisfaction-btn {
    background: #06b6d4;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    margin: 2px;
}

.satisfaction-btn:hover {
    background: #fbbf24;
}

#ai-stats p {
    margin: 5px 0;
    font-size: 14px;
}
</style>`;

document.head.insertAdjacentHTML('beforeend', adminStyles);