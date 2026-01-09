/**
 * ========================================
 * CHATBOT WIDGET - COMPONENTE FLOTANTE
 * ========================================
 * Widget de chatbot integrado con los estilos de YAvoy
 * Se adapta automáticamente a los colores del tema
 */

class ChatbotWidget {
  constructor(options = {}) {
    this.isOpen = false;
    this.position = options.position || 'bottom-right';
    this.theme = options.theme || 'dark';
    this.apiEndpoint = options.apiEndpoint || '/api/chat/bot';
    this.init();
  }

  init() {
    this.createWidget();
    this.attachEventListeners();
  }

  createWidget() {
    // Crear contenedor del widget
    const widget = document.createElement('div');
    widget.id = 'yavoy-chatbot-widget';
    widget.className = `chatbot-widget ${this.position}`;
    widget.innerHTML = `
      <!-- Botón flotante -->
      <button class="chatbot-toggle" aria-label="Abrir chat de soporte">
        <svg class="icon-chat" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <svg class="icon-close" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
        <span class="notification-badge" style="display: none;">1</span>
      </button>

      <!-- Ventana del chat -->
      <div class="chatbot-window">
        <div class="chatbot-header">
          <div class="header-content">
            <div class="avatar">
              <img src="/icons/icon-yavoy.png" alt="YAvoy Bot">
            </div>
            <div class="info">
              <h3>YAvoy Asistente</h3>
              <span class="status">
                <span class="status-dot"></span>
                En línea
              </span>
            </div>
          </div>
          <button class="minimize-btn" aria-label="Minimizar chat">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>

        <div class="chatbot-messages" id="chatbot-messages">
          <div class="message bot-message">
            <div class="message-avatar">
              <img src="/icons/icon-yavoy.png" alt="Bot">
            </div>
            <div class="message-content">
              <p>👋 ¡Hola! Soy el asistente virtual de YAvoy. ¿En qué puedo ayudarte hoy?</p>
              <div class="quick-actions">
                <button class="quick-action" data-action="pedido">📦 Hacer pedido</button>
                <button class="quick-action" data-action="estado">🔍 Ver estado</button>
                <button class="quick-action" data-action="soporte">💬 Soporte</button>
              </div>
            </div>
          </div>
        </div>

        <div class="chatbot-input">
          <input 
            type="text" 
            placeholder="Escribe tu mensaje..." 
            id="chatbot-input-field"
            autocomplete="off"
          >
          <button class="send-btn" id="chatbot-send-btn" aria-label="Enviar mensaje">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>

        <div class="chatbot-footer">
          <small>Potenciado por YAvoy IA</small>
        </div>
      </div>
    `;

    // Agregar estilos
    const styles = document.createElement('style');
    styles.textContent = `
      /* Widget Chatbot YAvoy */
      #yavoy-chatbot-widget {
        position: fixed;
        z-index: 9999;
        font-family: 'Segoe UI', system-ui, sans-serif;
      }

      .chatbot-widget.bottom-right {
        bottom: 20px;
        right: 20px;
      }

      .chatbot-widget.bottom-left {
        bottom: 20px;
        left: 20px;
      }

      /* Botón flotante */
      .chatbot-toggle {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
        border: none;
        color: white;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(6, 182, 212, 0.4);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      }

      .chatbot-toggle:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 30px rgba(6, 182, 212, 0.6);
      }

      .chatbot-toggle:active {
        transform: scale(0.95);
      }

      .chatbot-toggle .icon-close {
        display: none;
      }

      .chatbot-widget.open .chatbot-toggle .icon-chat {
        display: none;
      }

      .chatbot-widget.open .chatbot-toggle .icon-close {
        display: block;
      }

      .notification-badge {
        position: absolute;
        top: -5px;
        right: -5px;
        background: #ef4444;
        color: white;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        border: 2px solid white;
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }

      /* Ventana del chat */
      .chatbot-window {
        position: absolute;
        bottom: 75px;
        right: 0;
        width: 380px;
        max-width: calc(100vw - 40px);
        height: 600px;
        max-height: calc(100vh - 120px);
        background: var(--color-superficie, #1a2332);
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        display: none;
        flex-direction: column;
        overflow: hidden;
        animation: slideUp 0.3s ease;
      }

      .chatbot-widget.open .chatbot-window {
        display: flex;
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Header */
      .chatbot-header {
        background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
        padding: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: white;
      }

      .header-content {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .chatbot-header .avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: white;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .chatbot-header .avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 50%;
      }

      .chatbot-header .info h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }

      .chatbot-header .status {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        opacity: 0.9;
      }

      .status-dot {
        width: 8px;
        height: 8px;
        background: #10b981;
        border-radius: 50%;
        animation: pulse-dot 2s infinite;
      }

      @keyframes pulse-dot {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      .minimize-btn {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 8px;
        border-radius: 8px;
        transition: background 0.2s;
      }

      .minimize-btn:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      /* Mensajes */
      .chatbot-messages {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        background: var(--color-fondo, #0f1724);
      }

      .message {
        display: flex;
        gap: 12px;
        animation: fadeIn 0.3s ease;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .message-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .message-avatar img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
      }

      .message-content {
        background: var(--color-card, #243241);
        padding: 12px 16px;
        border-radius: 12px;
        max-width: 75%;
        color: var(--color-texto, #e6eef6);
      }

      .message-content p {
        margin: 0;
        line-height: 1.5;
      }

      .user-message {
        flex-direction: row-reverse;
      }

      .user-message .message-content {
        background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
        color: white;
      }

      /* Quick Actions */
      .quick-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 12px;
      }

      .quick-action {
        background: rgba(6, 182, 212, 0.1);
        border: 1px solid rgba(6, 182, 212, 0.3);
        color: #06b6d4;
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .quick-action:hover {
        background: rgba(6, 182, 212, 0.2);
        border-color: #06b6d4;
      }

      /* Input */
      .chatbot-input {
        display: flex;
        gap: 8px;
        padding: 16px;
        background: var(--color-superficie, #1a2332);
        border-top: 1px solid var(--color-borde, #3a4a5c);
      }

      #chatbot-input-field {
        flex: 1;
        background: var(--color-card, #243241);
        border: 1px solid var(--color-borde, #3a4a5c);
        border-radius: 24px;
        padding: 12px 16px;
        color: var(--color-texto, #e6eef6);
        font-size: 14px;
        outline: none;
        transition: border 0.2s;
      }

      #chatbot-input-field:focus {
        border-color: #06b6d4;
      }

      .send-btn {
        width: 44px;
        height: 44px;
        background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
        border: none;
        border-radius: 50%;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s;
      }

      .send-btn:hover {
        transform: scale(1.1);
      }

      .send-btn:active {
        transform: scale(0.95);
      }

      /* Footer */
      .chatbot-footer {
        padding: 8px 16px;
        text-align: center;
        font-size: 11px;
        color: var(--color-texto-claro, #ffffff);
        opacity: 0.5;
        background: var(--color-superficie, #1a2332);
      }

      /* Scrollbar personalizado */
      .chatbot-messages::-webkit-scrollbar {
        width: 6px;
      }

      .chatbot-messages::-webkit-scrollbar-track {
        background: transparent;
      }

      .chatbot-messages::-webkit-scrollbar-thumb {
        background: rgba(6, 182, 212, 0.3);
        border-radius: 3px;
      }

      .chatbot-messages::-webkit-scrollbar-thumb:hover {
        background: rgba(6, 182, 212, 0.5);
      }

      /* Responsive */
      @media (max-width: 480px) {
        .chatbot-window {
          width: calc(100vw - 40px);
          height: calc(100vh - 120px);
        }
      }
    `;

    document.head.appendChild(styles);
    document.body.appendChild(widget);
  }

  attachEventListeners() {
    const toggle = document.querySelector('.chatbot-toggle');
    const minimize = document.querySelector('.minimize-btn');
    const sendBtn = document.getElementById('chatbot-send-btn');
    const input = document.getElementById('chatbot-input-field');

    toggle.addEventListener('click', () => this.toggleChat());
    minimize.addEventListener('click', () => this.toggleChat());
    sendBtn.addEventListener('click', () => this.sendMessage());
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });

    // Quick actions
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('quick-action')) {
        const action = e.target.dataset.action;
        this.handleQuickAction(action);
      }
    });
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    const widget = document.getElementById('yavoy-chatbot-widget');
    widget.classList.toggle('open', this.isOpen);

    if (this.isOpen) {
      document.getElementById('chatbot-input-field').focus();
      this.hideBadge();
    }
  }

  sendMessage() {
    const input = document.getElementById('chatbot-input-field');
    const message = input.value.trim();

    if (!message) return;

    this.addMessage(message, 'user');
    input.value = '';

    // Simular respuesta del bot (aquí conectarías con tu API)
    setTimeout(() => {
      this.addMessage(this.getBotResponse(message), 'bot');
    }, 800);
  }

  addMessage(text, sender = 'bot') {
    const messagesContainer = document.getElementById('chatbot-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;

    const avatar = sender === 'bot' 
      ? '<div class="message-avatar"><img src="/icons/icon-yavoy.png" alt="Bot"></div>'
      : '';

    messageDiv.innerHTML = `
      ${avatar}
      <div class="message-content">
        <p>${text}</p>
      </div>
    `;

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  handleQuickAction(action) {
    switch(action) {
      case 'pedido':
        this.addMessage('¿Quieres hacer un pedido?', 'user');
        setTimeout(() => {
          this.addMessage('Perfecto! Te ayudaré con tu pedido. ¿Desde qué comercio quieres ordenar?', 'bot');
        }, 600);
        break;
      case 'estado':
        this.addMessage('Ver estado de mi pedido', 'user');
        setTimeout(() => {
          this.addMessage('Por favor, proporcióname tu número de pedido y verificaré su estado.', 'bot');
        }, 600);
        break;
      case 'soporte':
        this.addMessage('Necesito ayuda', 'user');
        setTimeout(() => {
          this.addMessage('Estoy aquí para ayudarte. ¿Cuál es tu consulta?', 'bot');
        }, 600);
        break;
    }
  }

  getBotResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('hola') || lowerMessage.includes('buenas')) {
      return '¡Hola! ¿En qué puedo ayudarte hoy? 😊';
    }
    if (lowerMessage.includes('pedido')) {
      return 'Para ayudarte con tu pedido, necesito que me indiques: ¿Quieres hacer un nuevo pedido o consultar el estado de uno existente?';
    }
    if (lowerMessage.includes('horario')) {
      return 'Nuestro servicio está disponible de Lunes a Domingo de 8:00 AM a 11:00 PM. 🕐';
    }
    if (lowerMessage.includes('pago')) {
      return 'Aceptamos pagos con MercadoPago, AstroPay y efectivo. ¿Necesitas ayuda con algún método en particular?';
    }
    
    return 'Gracias por tu mensaje. Un agente revisará tu consulta y te responderá pronto. ¿Hay algo más en lo que pueda ayudarte?';
  }

  showBadge(count = 1) {
    const badge = document.querySelector('.notification-badge');
    if (badge) {
      badge.textContent = count;
      badge.style.display = 'flex';
    }
  }

  hideBadge() {
    const badge = document.querySelector('.notification-badge');
    if (badge) {
      badge.style.display = 'none';
    }
  }
}

// Inicializar el chatbot automáticamente cuando se carga el DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.yavoyChatbot = new ChatbotWidget({
      position: 'bottom-right',
      theme: 'dark'
    });
  });
} else {
  window.yavoyChatbot = new ChatbotWidget({
    position: 'bottom-right',
    theme: 'dark'
  });
}
