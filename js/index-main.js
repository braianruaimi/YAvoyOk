/**
 * ==========================================
 * YAVOY v3.1 ENTERPRISE - SCRIPT PRINCIPAL
 * Inicialización y utilidades generales
 * ==========================================
 */

// ==========================================
// CONSTANTES Y CONFIGURACIÓN
// ==========================================
const YAVOY_CONFIG = {
    version: '3.1.0',
    apiBaseUrl: window.location.hostname === 'localhost' ? 'http://localhost:3000' : '',
    splashDuration: 1500,
    autoHideNotifications: 5000,
};

// ==========================================
// INICIALIZACIÓN PRINCIPAL
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 YAvoy v3.1 Enterprise - Inicializando...');

    // Inicializar sistemas en orden
    initSplashScreen();
    initUI();
    initServiceWorker();
    initAnalytics();
    initLoginRedirect();

    console.log('✅ YAvoy v3.1 Enterprise completamente cargado');
});

/**
 * Inicializar splash screen
 */
function initSplashScreen() {
    const splash = document.getElementById('splash-screen');

    if (!splash) return;

    setTimeout(() => {
        splash.style.opacity = '0';
        setTimeout(() => {
            splash.remove();
        }, 500);
    }, YAVOY_CONFIG.splashDuration);
}

/**
 * Inicializar elementos de UI
 */
function initUI() {
    // Scroll to top button
    const scrollBtn = document.getElementById('scrollToTop');

    if (scrollBtn) {
        // Mostrar/ocultar según scroll
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollBtn.style.display = 'flex';
            } else {
                scrollBtn.style.display = 'none';
            }
        });

        // Click para subir
        scrollBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Smooth scroll para links internos
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const target = document.querySelector(targetId);

            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Animaciones al hacer scroll (lazy)
    if ('IntersectionObserver' in window) {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        document.querySelectorAll('.feature-item, .role-card, .tienda-card').forEach(el => {
            observer.observe(el);
        });
    }

    console.log('✅ UI inicializada');
}

/**
 * Inicializar Service Worker (deshabilitado temporalmente)
 */
function initServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        console.log('⚠️ Service Worker no soportado');
        return;
    }

    // Desregistrar todos los service workers existentes
    navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
            registration.unregister();
            console.log('Service Worker desregistrado');
        });
    });

    // Limpiar cachés
    if ('caches' in window) {
        caches.keys().then(cacheNames => {
            cacheNames.forEach(cacheName => {
                caches.delete(cacheName);
                console.log('Caché eliminado:', cacheName);
            });
        });
    }

    console.log('⚠️ Service Worker deshabilitado temporalmente');
}

/**
 * Inicializar analytics y estadísticas
 */
async function initAnalytics() {
    try {
        const response = await fetch(`${YAVOY_CONFIG.apiBaseUrl}/api/dashboard/stats`);

        if (response.ok) {
            const data = await response.json();

            if (data.success && data.stats) {
                updateStatsDisplay(data.stats);
            }
        }
    } catch (error) {
        console.log('Usando estadísticas de demostración');
        updateStatsDisplay({
            totalPedidos: 1247,
            totalComercios: 89,
            totalRepartidores: 156
        });
    }
}

/**
 * Actualizar display de estadísticas
 * @param {Object} stats - Estadísticas a mostrar
 */
function updateStatsDisplay(stats) {
    const elements = {
        pedidos: document.getElementById('statPedidos'),
        comercios: document.getElementById('statComercios'),
        repartidores: document.getElementById('statRepartidores')
    };

    if (elements.pedidos && stats.totalPedidos) {
        elements.pedidos.textContent = stats.totalPedidos.toLocaleString();
    }

    if (elements.comercios && stats.totalComercios) {
        elements.comercios.textContent = stats.totalComercios.toLocaleString();
    }

    if (elements.repartidores && stats.totalRepartidores) {
        elements.repartidores.textContent = stats.totalRepartidores.toLocaleString();
    }
}

/**
 * Inicializar redirección de login
 */
function initLoginRedirect() {
    // Función global para redirigir al login
    window.redirectToLogin = () => {
        window.location.href = 'login.html';
    };
}

// ==========================================
// UTILIDADES GLOBALES
// ==========================================

/**
 * Objeto global YAvoy con utilidades
 */
window.YAvoy = {
    version: YAVOY_CONFIG.version,

    /**
     * Mostrar overlay de carga
     */
    showLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    },

    /**
     * Ocultar overlay de carga
     */
    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    },

    /**
     * Mostrar notificación toast
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - 'success', 'error', 'warning', 'info'
     */
    showToast(message, type = 'info') {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#06b6d4'
        };

        const toast = document.createElement('div');
        toast.className = 'yavoy-toast';
        toast.textContent = message;
        toast.style.cssText = `
      position: fixed;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      background: ${colors[type] || colors.info};
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10002;
      animation: slideUp 0.3s ease-out;
      font-weight: 600;
      max-width: 90%;
      text-align: center;
    `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideDown 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    /**
     * Validar conexión a internet
     * @returns {boolean}
     */
    isOnline() {
        return navigator.onLine;
    },

    /**
     * Formatear número como moneda
     * @param {number} amount - Cantidad a formatear
     * @returns {string}
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(amount);
    },

    /**
     * Formatear fecha
     * @param {Date|string} date - Fecha a formatear
     * @returns {string}
     */
    formatDate(date) {
        return new Intl.DateTimeFormat('es-AR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    },

    /**
     * Generar ID único
     * @param {string} prefix - Prefijo del ID
     * @returns {string}
     */
    generateId(prefix = 'ID') {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `${prefix}-${timestamp}${random}`.toUpperCase();
    }
};

// ==========================================
// MANEJO DE ERRORES GLOBAL
// ==========================================

/**
 * Manejar errores no capturados
 */
window.addEventListener('error', (e) => {
    console.error('Error no capturado:', e.error);

    // En producción, enviar a servicio de logging
    if (window.location.hostname !== 'localhost') {
        // sendErrorToLoggingService(e.error);
    }
});

/**
 * Manejar promesas rechazadas no manejadas
 */
window.addEventListener('unhandledrejection', (e) => {
    console.error('Promesa rechazada no manejada:', e.reason);

    // En producción, enviar a servicio de logging
    if (window.location.hostname !== 'localhost') {
        // sendErrorToLoggingService(e.reason);
    }
});

// ==========================================
// DETECCIÓN DE CONECTIVIDAD
// ==========================================

/**
 * Manejar cambios en conectividad
 */
window.addEventListener('online', () => {
    console.log('✅ Conexión restaurada');
    YAvoy.showToast('Conexión restaurada', 'success');
});

window.addEventListener('offline', () => {
    console.log('⚠️ Sin conexión a internet');
    YAvoy.showToast('Sin conexión a internet', 'warning');
});

// ==========================================
// PWA INSTALL PROMPT
// ==========================================

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevenir el prompt automático
    e.preventDefault();
    deferredPrompt = e;

    // Mostrar botón de instalación personalizado
    showInstallButton();
});

/**
 * Mostrar botón de instalación de PWA
 */
function showInstallButton() {
    const btnInstalar = document.createElement('button');
    btnInstalar.textContent = '📱 Instalar App';
    btnInstalar.className = 'btn-instalar-pwa';
    btnInstalar.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 20px;
    background: #06b6d4;
    color: white;
    border: none;
    border-radius: 50px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 1500;
    animation: pulseBtn 2s infinite;
  `;

    btnInstalar.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();

            const { outcome } = await deferredPrompt.userChoice;
            console.log(`Usuario eligió: ${outcome}`);

            deferredPrompt = null;
            btnInstalar.remove();
        }
    });

    document.body.appendChild(btnInstalar);
}

// Agregar animación del botón
if (!document.getElementById('pwa-install-animation')) {
    const style = document.createElement('style');
    style.id = 'pwa-install-animation';
    style.textContent = `
    @keyframes pulseBtn {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
  `;
    document.head.appendChild(style);
}

// ==========================================
// INICIALIZACIÓN DE MÓDULOS EXTERNOS
// ==========================================

/**
 * Inicializar módulos UI existentes
 */
if (typeof initUI === 'function') {
    initUI();
}

if (typeof initForms === 'function') {
    initForms();
}

if (typeof initializePushNotifications === 'function') {
    initializePushNotifications();
}

// MercadoPago
if (window.mercadoPagoSecure) {
    window.mercadoPagoSecure.init().catch(err => {
        console.error('Error inicializando MercadoPago:', err);
    });
}

console.log(`📦 YAvoy v${YAVOY_CONFIG.version} - Sistema completo cargado`);
