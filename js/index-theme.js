/**
 * ==========================================
 * YAVOY v3.1 ENTERPRISE - SISTEMA DE TEMAS
 * Gestión de tema claro/oscuro
 * ==========================================
 */

class ThemeManager {
    constructor() {
        this.STORAGE_KEY = 'yavoy-theme';
        this.currentTheme = this.getSavedTheme();
        this.elements = {
            toggleBtn: document.getElementById('btnThemeToggle'),
            themeIcon: document.getElementById('themeIcon'),
            body: document.body
        };

        this.init();
        console.log('✅ ThemeManager inicializado');
    }

    /**
     * Inicializar sistema de temas
     */
    init() {
        this.applyTheme(this.currentTheme);
        this.setupToggleButton();
        this.setupMediaQuery();
    }

    /**
     * Obtener tema guardado
     * @returns {string} - 'dark' o 'light'
     */
    getSavedTheme() {
        try {
            return localStorage.getItem(this.STORAGE_KEY) || 'dark';
        } catch (e) {
            console.warn('No se pudo acceder a localStorage');
            return 'dark';
        }
    }

    /**
     * Aplicar tema
     * @param {string} theme - 'dark' o 'light'
     */
    applyTheme(theme) {
        const { body, themeIcon } = this.elements;

        if (theme === 'light') {
            body.classList.add('light-mode');
            if (themeIcon) themeIcon.textContent = '☀️';
        } else {
            body.classList.remove('light-mode');
            if (themeIcon) themeIcon.textContent = '🌙';
        }

        this.currentTheme = theme;
        this.saveTheme(theme);

        // Emitir evento personalizado
        document.dispatchEvent(new CustomEvent('themechange', {
            detail: { theme }
        }));

        console.log(`Tema aplicado: ${theme}`);
    }

    /**
     * Guardar tema en localStorage
     * @param {string} theme - Tema a guardar
     */
    saveTheme(theme) {
        try {
            localStorage.setItem(this.STORAGE_KEY, theme);
        } catch (e) {
            console.warn('No se pudo guardar el tema');
        }
    }

    /**
     * Alternar tema
     */
    toggle() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
    }

    /**
     * Configurar botón de alternancia
     */
    setupToggleButton() {
        const { toggleBtn } = this.elements;

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggle());
        }
    }

    /**
     * Escuchar cambios del sistema
     */
    setupMediaQuery() {
        if (!window.matchMedia) return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (e) => {
            // Solo aplicar si el usuario no ha guardado una preferencia
            const hasSavedPreference = localStorage.getItem(this.STORAGE_KEY);

            if (!hasSavedPreference) {
                const systemTheme = e.matches ? 'dark' : 'light';
                this.applyTheme(systemTheme);
            }
        };

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleChange);
        } else if (mediaQuery.addListener) {
            mediaQuery.addListener(handleChange);
        }
    }

    /**
     * Obtener tema actual
     * @returns {string} - Tema actual
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * Forzar tema específico
     * @param {string} theme - 'dark' o 'light'
     */
    setTheme(theme) {
        if (theme === 'dark' || theme === 'light') {
            this.applyTheme(theme);
        }
    }
}

// Crear instancia global
const themeManager = new ThemeManager();

// Exportar para uso en otros módulos
window.themeManager = themeManager;

// ==========================================
// GESTIÓN DE CONTROLES FLOTANTES
// ==========================================

/**
 * Inicializar controles flotantes
 */
function initFloatingControls() {
    // Botón de notificaciones
    const btnNotif = document.getElementById('btnNotificacionesFlotante');
    const notifPopup = document.getElementById('notificationPopup');

    if (btnNotif && notifPopup) {
        btnNotif.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = notifPopup.style.display === 'block';
            notifPopup.style.display = isVisible ? 'none' : 'block';
            btnNotif.classList.toggle('active', !isVisible);
        });

        // Cerrar al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!notifPopup.contains(e.target) && e.target !== btnNotif) {
                notifPopup.style.display = 'none';
                btnNotif.classList.remove('active');
            }
        });

        // Botón activar notificaciones
        const btnActivarNotif = document.getElementById('btnActivarNotif');
        if (btnActivarNotif) {
            btnActivarNotif.addEventListener('click', async () => {
                try {
                    const permission = await Notification.requestPermission();

                    if (permission === 'granted') {
                        new Notification('🔔 Notificaciones Activadas', {
                            body: 'Recibirás alertas sobre tus pedidos',
                            icon: 'icons/icon-yavoy.png'
                        });

                        btnActivarNotif.textContent = '✓ Activadas';
                        btnActivarNotif.disabled = true;
                        btnActivarNotif.style.background = '#10b981';
                    } else {
                        alert('Permiso denegado. Actívalas desde la configuración del navegador.');
                    }
                } catch (error) {
                    console.error('Error al solicitar notificaciones:', error);
                }
            });
        }
    }

    // Botón chatbot
    const btnChatbot = document.getElementById('btnChatbotFlotante');
    if (btnChatbot) {
        btnChatbot.addEventListener('click', () => {
            // Integración con el chatbot existente
            if (window.modalManager) {
                // Abrir modal del chatbot si existe
                const chatbotModal = document.getElementById('chatbotModal');
                if (chatbotModal) {
                    chatbotModal.classList.toggle('active');
                    btnChatbot.classList.toggle('active');
                }
            }
        });
    }
}

// Inicializar controles cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFloatingControls);
} else {
    initFloatingControls();
}
