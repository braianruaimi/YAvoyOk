/**
 * ==========================================
 * YAVOY v3.1 ENTERPRISE - SISTEMA DE MODALES
 * Sistema unificado de gestión de modales
 * ==========================================
 */

class ModalManager {
    constructor() {
        // Mapeo de todos los modales del sistema
        this.modals = {
            repartidor: document.getElementById('modalRepartidor'),
            pedido: document.getElementById('modalPedido'),
            beneficios: document.getElementById('modalBeneficios'),
            comercio: document.getElementById('modalComercio'),
            verificacionRepartidor: document.getElementById('modalVerificacionRepartidor'),
            verificacionComercio: document.getElementById('modalVerificacionComercio'),
            verificacionPedido: document.getElementById('modalVerificacionPedido'),
            tiendaPizzeria: document.getElementById('modalTiendaPizzeria'),
            tiendaFarmacia: document.getElementById('modalTiendaFarmacia'),
            tiendaKiosco: document.getElementById('modalTiendaKiosco'),
            tiendaBoutique: document.getElementById('modalTiendaBoutique'),
        };

        this.activeModal = null;
        this.init();

        console.log('✅ ModalManager inicializado');
    }

    /**
     * Inicializar event listeners globales
     */
    init() {
        this.setupCloseOnEscape();
        this.setupCloseOnOutsideClick();
        this.setupCloseButtons();
    }

    /**
     * Abrir un modal específico
     * @param {string} modalId - ID del modal a abrir
     */
    open(modalId) {
        const modal = this.modals[modalId];

        if (!modal) {
            console.warn(`Modal "${modalId}" no encontrado`);
            return;
        }

        // Cerrar modal anterior si existe
        if (this.activeModal && this.activeModal !== modal) {
            this.closeModal(this.activeModal);
        }

        // Abrir nuevo modal
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        this.activeModal = modal;

        // Foco en el primer input si existe
        setTimeout(() => {
            const firstInput = modal.querySelector('input, textarea, select');
            if (firstInput) firstInput.focus();
        }, 100);

        console.log(`Modal "${modalId}" abierto`);
    }

    /**
     * Cerrar un modal específico
     * @param {string} modalId - ID del modal a cerrar
     */
    close(modalId) {
        const modal = this.modals[modalId];

        if (!modal) {
            console.warn(`Modal "${modalId}" no encontrado`);
            return;
        }

        this.closeModal(modal);

        if (this.activeModal === modal) {
            this.activeModal = null;
            document.body.style.overflow = '';
        }

        console.log(`Modal "${modalId}" cerrado`);
    }

    /**
     * Cerrar un modal por elemento DOM
     * @param {HTMLElement} modal - Elemento del modal
     */
    closeModal(modal) {
        modal.style.display = 'none';
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
    }

    /**
     * Cerrar todos los modales
     */
    closeAll() {
        Object.keys(this.modals).forEach(id => {
            const modal = this.modals[id];
            if (modal) this.closeModal(modal);
        });

        this.activeModal = null;
        document.body.style.overflow = '';

        console.log('Todos los modales cerrados');
    }

    /**
     * Configurar cierre con tecla ESC
     */
    setupCloseOnEscape() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                const modalId = this.getModalId(this.activeModal);
                if (modalId) this.close(modalId);
            }
        });
    }

    /**
     * Configurar cierre al hacer clic fuera
     */
    setupCloseOnOutsideClick() {
        Object.entries(this.modals).forEach(([id, modal]) => {
            if (!modal) return;

            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.close(id);
                }
            });
        });
    }

    /**
     * Configurar botones de cierre
     */
    setupCloseButtons() {
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal-overlay');
                const modalId = this.getModalId(modal);

                if (modalId) this.close(modalId);
            });
        });
    }

    /**
     * Obtener ID de un modal por elemento DOM
     * @param {HTMLElement} modalElement - Elemento del modal
     * @returns {string|null} - ID del modal o null
     */
    getModalId(modalElement) {
        return Object.keys(this.modals).find(
            key => this.modals[key] === modalElement
        );
    }

    /**
     * Verificar si un modal está abierto
     * @param {string} modalId - ID del modal
     * @returns {boolean}
     */
    isOpen(modalId) {
        const modal = this.modals[modalId];
        return modal && modal.style.display === 'flex';
    }
}

// Crear instancia global
const modalManager = new ModalManager();

// ==========================================
// FUNCIONES GLOBALES DE COMPATIBILIDAD
// Mantienen compatibilidad con código existente
// ==========================================

// Modales de Registro
window.abrirModalRepartidor = () => modalManager.open('repartidor');
window.cerrarModalRepartidor = () => modalManager.close('repartidor');

window.abrirModalPedido = () => modalManager.open('pedido');
window.cerrarModalPedido = () => modalManager.close('pedido');

window.abrirModalComercio = () => modalManager.open('comercio');
window.cerrarModalComercio = () => modalManager.close('comercio');

// Modales de Verificación
window.mostrarModalVerificacion = (idRepartidor) => {
    cerrarModalRepartidor();

    const idDisplay = document.getElementById('repartidorIdDisplay');
    if (idDisplay) {
        idDisplay.textContent = idRepartidor;
        localStorage.setItem('ultimoRepartidorId', idRepartidor);
    }

    modalManager.open('verificacionRepartidor');
};

window.cerrarModalVerificacion = () => modalManager.close('verificacionRepartidor');

window.mostrarModalVerificacionComercio = (idComercio) => {
    cerrarModalComercio();

    const idDisplay = document.getElementById('comercioIdDisplay');
    if (idDisplay) {
        idDisplay.textContent = idComercio;
        localStorage.setItem('ultimoComercioId', idComercio);
    }

    modalManager.open('verificacionComercio');
};

window.cerrarModalVerificacionComercio = () => modalManager.close('verificacionComercio');

window.mostrarModalVerificacionPedido = (idPedido) => {
    cerrarModalPedido();

    const idDisplay = document.getElementById('pedidoIdDisplay');
    if (idDisplay) {
        idDisplay.textContent = idPedido;
        localStorage.setItem('ultimoPedidoId', idPedido);
    }

    modalManager.open('verificacionPedido');
};

window.cerrarModalVerificacionPedido = () => modalManager.close('verificacionPedido');

// Modales de Tiendas
window.abrirModalTienda = (tiendaId) => {
    const modalKey = 'tienda' + tiendaId.charAt(0).toUpperCase() + tiendaId.slice(1);
    modalManager.open(modalKey);
};

window.cerrarModalTienda = (tiendaId) => {
    const modalKey = 'tienda' + tiendaId.charAt(0).toUpperCase() + tiendaId.slice(1);
    modalManager.close(modalKey);
};

// Funciones auxiliares para modales de verificación
window.copiarIdRepartidor = () => {
    const idDisplay = document.getElementById('repartidorIdDisplay');
    if (!idDisplay) return;

    const idTexto = idDisplay.textContent;

    navigator.clipboard.writeText(idTexto).then(() => {
        mostrarNotificacionCopia('ID de Repartidor copiado');
    }).catch(() => {
        alert('ID: ' + idTexto);
    });
};

window.copiarIdComercio = () => {
    const idDisplay = document.getElementById('comercioIdDisplay');
    if (!idDisplay) return;

    const idTexto = idDisplay.textContent;

    navigator.clipboard.writeText(idTexto).then(() => {
        mostrarNotificacionCopia('ID de Comercio copiado');
    }).catch(() => {
        alert('ID: ' + idTexto);
    });
};

window.copiarIdPedido = () => {
    const idDisplay = document.getElementById('pedidoIdDisplay');
    if (!idDisplay) return;

    const idTexto = idDisplay.textContent;

    navigator.clipboard.writeText(idTexto).then(() => {
        mostrarNotificacionCopia('N° de Pedido copiado');
    }).catch(() => {
        alert('N° Pedido: ' + idTexto);
    });
};

window.irAPanelComercio = () => {
    const idComercio = document.getElementById('comercioIdDisplay')?.textContent;
    if (idComercio) {
        window.location.href = `panel-comercio.html?id=${idComercio}`;
    }
};

/**
 * Mostrar notificación temporal de copia
 * @param {string} mensaje - Mensaje a mostrar
 */
function mostrarNotificacionCopia(mensaje) {
    const notif = document.createElement('div');
    notif.textContent = '✓ ' + mensaje;
    notif.style.cssText = `
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    background: #10b981;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10002;
    animation: slideUp 0.3s ease-out;
    font-weight: 600;
  `;

    document.body.appendChild(notif);

    setTimeout(() => {
        notif.style.animation = 'slideDown 0.3s ease-out';
        setTimeout(() => notif.remove(), 300);
    }, 2000);
}

// Agregar animaciones CSS si no existen
if (!document.getElementById('modal-animations')) {
    const style = document.createElement('style');
    style.id = 'modal-animations';
    style.textContent = `
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateX(-50%) translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    }
    
    @keyframes slideDown {
      from {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
      to {
        opacity: 0;
        transform: translateX(-50%) translateY(20px);
      }
    }
  `;
    document.head.appendChild(style);
}

// Exportar para uso en otros módulos
window.modalManager = modalManager;

// ==========================================
// FUNCIONES GLOBALES PARA MODALES
// ==========================================

/**
 * Scroll suave a la sección de clientes
 */
window.scrollToClientes = function() {
    console.log('🔵 Haciendo scroll a sección clientes...');
    const seccionClientes = document.getElementById('seccion-clientes');
    if (seccionClientes) {
        seccionClientes.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
    }
}

/**
 * Abrir modal de beneficios (se muestra primero antes de hacer pedido)
 */
window.abrirModalPedido = function() {
    console.log('🔵 Abriendo modal de beneficios...');
    modalManager.open('beneficios');
}

/**
 * Cerrar modal de beneficios
 */
window.cerrarModalBeneficios = function() {
    console.log('🔵 Cerrando modal de beneficios...');
    modalManager.close('beneficios');
}

/**
 * Continuar del modal de beneficios al modal de pedido
 */
window.continuarAPedido = function() {
    console.log('🔵 Continuando a formulario de pedido...');
    modalManager.close('beneficios');
    setTimeout(() => {
        modalManager.open('pedido');
    }, 300);
}

/**
 * Cerrar modal de pedido
 */
window.cerrarModalPedido = function() {
    console.log('🔵 Cerrando modal de pedido...');
    modalManager.close('pedido');
}

/**
 * Abrir modal de repartidor
 */
window.abrirModalRepartidor = function() {
    console.log('🔵 Abriendo modal de repartidor...');
    modalManager.open('repartidor');
}

/**
 * Cerrar modal de repartidor
 */
window.cerrarModalRepartidor = function() {
    console.log('🔵 Cerrando modal de repartidor...');
    modalManager.close('repartidor');
}

/**
 * Abrir modal de comercio
 */
window.abrirModalComercio = function() {
    console.log('🔵 Abriendo modal de comercio...');
    modalManager.open('comercio');
}

/**
 * Cerrar modal de comercio
 */
window.cerrarModalComercio = function() {
    console.log('🔵 Cerrando modal de comercio...');
    modalManager.close('comercio');
}

