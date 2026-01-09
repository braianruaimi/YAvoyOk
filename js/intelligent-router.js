/**
 * YAvoy v3.1 Enterprise - Router Inteligente
 * Sistema de redirección automática basado en JWT y roles
 * CTO: Sistema Elite de detección y ruteo de usuarios
 */

class YAvoyIntelligentRouter {
    constructor() {
        this.routes = {
            'ceo': '/dashboard-ceo.html',
            'admin': '/dashboard-ceo.html',
            'comercio': '/panel-comercio-pro.html', 
            'comercio-pro': '/panel-comercio-pro.html',
            'repartidor': '/panel-repartidor-pro.html',
            'repartidor-pro': '/panel-repartidor-pro.html',
            'cliente': '/panel-cliente-pro.html',
            'cliente-pro': '/panel-cliente-pro.html'
        };
        
        this.fallbackRoute = '/index.html';
        this.loginRoute = '/login.html';
        this.unauthorized = '/unauthorized.html';
        
        this.init();
    }

    /**
     * Inicializar el router y verificar estado del usuario
     */
    init() {
        console.log('🎯 YAvoy Intelligent Router v3.1 Enterprise iniciado');
        
        // Verificar si hay token almacenado
        const token = this.getStoredToken();
        
        if (token && this.isValidToken(token)) {
            this.handleAuthenticatedUser(token);
        } else {
            this.handleUnauthenticatedUser();
        }

        // Configurar listeners para cambios de autenticación
        this.setupAuthListeners();
    }

    /**
     * Obtener token almacenado (múltiples fuentes)
     */
    getStoredToken() {
        // Prioridad: sessionStorage > localStorage > cookies
        return sessionStorage.getItem('yavoy_token') || 
               localStorage.getItem('yavoy_token') || 
               this.getCookie('yavoy_token');
    }

    /**
     * Validar formato y expiración del token JWT
     */
    isValidToken(token) {
        try {
            if (!token || token.split('.').length !== 3) {
                return false;
            }

            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Date.now() / 1000;

            // Verificar expiración
            if (payload.exp && payload.exp < currentTime) {
                console.warn('⚠️ Token expirado, limpiando sesión');
                this.clearSession();
                return false;
            }

            // Verificar campos requeridos
            if (!payload.role || !payload.userId) {
                console.warn('⚠️ Token inválido: faltan campos requeridos');
                return false;
            }

            return true;
        } catch (error) {
            console.error('❌ Error validando token:', error);
            return false;
        }
    }

    /**
     * Decodificar payload del JWT
     */
    decodeToken(token) {
        try {
            return JSON.parse(atob(token.split('.')[1]));
        } catch (error) {
            console.error('❌ Error decodificando token:', error);
            return null;
        }
    }

    /**
     * Manejar usuario autenticado - REDIRECCIÓN AUTOMÁTICA
     */
    handleAuthenticatedUser(token) {
        const payload = this.decodeToken(token);
        
        if (!payload) {
            this.redirectToLogin();
            return;
        }

        console.log('✅ Usuario autenticado detectado:', {
            role: payload.role,
            userId: payload.userId,
            email: payload.email
        });

        // Obtener ruta destino basada en rol
        const targetRoute = this.getRouteForRole(payload.role);
        const currentPath = window.location.pathname;

        // Si ya está en la ruta correcta, no redirigir
        if (currentPath === targetRoute) {
            console.log('✅ Usuario ya está en su dashboard correcto');
            return;
        }

        // Si está en index.html o login, redirigir automáticamente
        if (currentPath === '/' || 
            currentPath === '/index.html' || 
            currentPath === '/login.html' ||
            currentPath.endsWith('/')) {
            
            console.log(`🎯 Redirección automática: ${payload.role} → ${targetRoute}`);
            this.redirectWithDelay(targetRoute, 1000);
            return;
        }

        // Verificar si tiene acceso a la página actual
        if (!this.hasAccessToCurrentPage(payload.role)) {
            console.warn(`⚠️ Acceso denegado a ${currentPath} para rol ${payload.role}`);
            this.redirectUnauthorized(targetRoute);
            return;
        }

        // Usuario autenticado con acceso válido
        this.enhancePageForUser(payload);
    }

    /**
     * Obtener ruta según rol del usuario
     */
    getRouteForRole(role) {
        const normalizedRole = role.toLowerCase().trim();
        
        // Mapeo inteligente de roles
        if (normalizedRole.includes('ceo') || normalizedRole.includes('admin')) {
            return this.routes.ceo;
        }
        
        if (normalizedRole.includes('comercio')) {
            return this.routes.comercio;
        }
        
        if (normalizedRole.includes('repartidor') || normalizedRole.includes('delivery')) {
            return this.routes.repartidor;
        }
        
        if (normalizedRole.includes('cliente') || normalizedRole.includes('customer')) {
            return this.routes.cliente;
        }

        // Rol directo
        return this.routes[normalizedRole] || this.fallbackRoute;
    }

    /**
     * Verificar si el usuario tiene acceso a la página actual
     */
    hasAccessToCurrentPage(role) {
        const currentPath = window.location.pathname;
        const normalizedRole = role.toLowerCase();

        // CEO/Admin tienen acceso total
        if (normalizedRole.includes('ceo') || normalizedRole.includes('admin')) {
            return true;
        }

        // Páginas públicas permitidas para todos
        const publicPages = [
            '/', '/index.html', '/landing-nueva.html', '/acerca-de.html',
            '/privacidad.html', '/terminos.html', '/soporte.html', '/faq.html'
        ];
        
        if (publicPages.includes(currentPath)) {
            return true;
        }

        // Verificar acceso específico por rol
        if (normalizedRole.includes('comercio') && currentPath.includes('comercio')) {
            return true;
        }
        
        if (normalizedRole.includes('repartidor') && currentPath.includes('repartidor')) {
            return true;
        }
        
        if (normalizedRole.includes('cliente') && currentPath.includes('cliente')) {
            return true;
        }

        return false;
    }

    /**
     * Manejar usuario no autenticado
     */
    handleUnauthenticatedUser() {
        const currentPath = window.location.pathname;
        
        // Páginas que requieren autenticación
        const protectedPages = [
            'dashboard', 'panel-', 'admin', 'ceo', 'comercio', 'repartidor', 'cliente'
        ];
        
        const requiresAuth = protectedPages.some(pattern => 
            currentPath.includes(pattern)
        );

        if (requiresAuth) {
            console.log('🔒 Página protegida detectada, redirigiendo al login');
            this.redirectToLogin();
        } else {
            console.log('✅ Página pública, acceso permitido');
        }
    }

    /**
     * Redirección con delay y efectos visuales
     */
    redirectWithDelay(targetRoute, delay = 1500) {
        // Mostrar indicador de carga
        this.showRedirectionIndicator(targetRoute);
        
        setTimeout(() => {
            window.location.href = targetRoute;
        }, delay);
    }

    /**
     * Mostrar indicador visual de redirección
     */
    showRedirectionIndicator(targetRoute) {
        const indicator = document.createElement('div');
        indicator.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
                color: white;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                font-family: Arial, sans-serif;
            ">
                <div style="
                    background: linear-gradient(135deg, #f59e0b, #06b6d4);
                    padding: 30px;
                    border-radius: 15px;
                    text-align: center;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                ">
                    <h3 style="margin: 0; font-size: 1.5em; margin-bottom: 20px;">
                        🎯 YAvoy Enterprise
                    </h3>
                    <p style="margin: 10px 0;">Redirigiendo a tu dashboard...</p>
                    <div style="
                        width: 40px;
                        height: 40px;
                        border: 3px solid rgba(255,255,255,0.3);
                        border-top: 3px solid white;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 20px auto;
                    "></div>
                </div>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            </div>
        `;
        
        document.body.appendChild(indicator);
    }

    /**
     * Configurar listeners para eventos de autenticación
     */
    setupAuthListeners() {
        // Listener para login exitoso
        window.addEventListener('yavoy:login', (event) => {
            const { token } = event.detail;
            console.log('🔑 Login exitoso detectado');
            this.handleAuthenticatedUser(token);
        });

        // Listener para logout
        window.addEventListener('yavoy:logout', () => {
            console.log('🚪 Logout detectado');
            this.clearSession();
            this.redirectToLogin();
        });

        // Listener para cambios en localStorage/sessionStorage
        window.addEventListener('storage', (event) => {
            if (event.key === 'yavoy_token' || event.key === 'yavoy_session') {
                location.reload();
            }
        });
    }

    /**
     * Mejorar página para usuario autenticado
     */
    enhancePageForUser(userPayload) {
        // Agregar información del usuario al header si existe
        const userInfo = document.querySelector('.user-info');
        if (userInfo) {
            userInfo.innerHTML = `
                <span class="user-role">${userPayload.role}</span>
                <span class="user-email">${userPayload.email}</span>
            `;
        }

        // Configurar logout automático por inactividad
        this.setupAutoLogout();
    }

    /**
     * Configurar logout automático por inactividad
     */
    setupAutoLogout() {
        let timeout;
        const INACTIVITY_TIME = 30 * 60 * 1000; // 30 minutos

        const resetTimeout = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                console.log('⏱️ Sesión expirada por inactividad');
                this.logout();
            }, INACTIVITY_TIME);
        };

        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            window.addEventListener(event, resetTimeout, true);
        });

        resetTimeout();
    }

    /**
     * Funciones de redirección
     */
    redirectToLogin() {
        window.location.href = this.loginRoute;
    }

    redirectUnauthorized(allowedRoute) {
        const message = `Acceso denegado. Redirigiendo a tu dashboard autorizado...`;
        alert(message);
        this.redirectWithDelay(allowedRoute, 2000);
    }

    /**
     * Limpiar sesión completamente
     */
    clearSession() {
        sessionStorage.removeItem('yavoy_token');
        localStorage.removeItem('yavoy_token');
        this.deleteCookie('yavoy_token');
        sessionStorage.clear();
    }

    /**
     * Logout programático
     */
    logout() {
        this.clearSession();
        window.dispatchEvent(new CustomEvent('yavoy:logout'));
    }

    /**
     * Utilidades para cookies
     */
    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    deleteCookie(name) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
}

// Inicializar el router automáticamente
document.addEventListener('DOMContentLoaded', () => {
    window.YAvoyRouter = new YAvoyIntelligentRouter();
});

// Exponer funciones globalmente para integración
window.YAvoyAuth = {
    login: (token) => {
        sessionStorage.setItem('yavoy_token', token);
        window.dispatchEvent(new CustomEvent('yavoy:login', { detail: { token } }));
    },
    
    logout: () => {
        if (window.YAvoyRouter) {
            window.YAvoyRouter.logout();
        }
    },
    
    getCurrentUser: () => {
        const token = sessionStorage.getItem('yavoy_token') || localStorage.getItem('yavoy_token');
        if (token && window.YAvoyRouter && window.YAvoyRouter.isValidToken(token)) {
            return window.YAvoyRouter.decodeToken(token);
        }
        return null;
    }
};

console.log('🚀 YAvoy v3.1 Enterprise Router System cargado');