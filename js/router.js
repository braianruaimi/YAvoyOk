/**
 * YAVOY v3.1 - Sistema de Enrutamiento por Roles
 * Redirige automáticamente a los usuarios según su rol JWT
 * @author YAvoy Team
 * @version 3.1
 */

class YAvoyRouter {
    constructor() {
        this.routes = {
            cliente: '/views/cliente/dashboard.html',
            repartidor: '/views/repartidor/dashboard.html',
            comercio: '/views/comercio/dashboard.html',
            ceo: '/views/admin/dashboard.html',
            admin: '/views/admin/dashboard.html'
        };
        
        this.publicRoutes = [
            '/index.html',
            '/login.html',
            '/registro.html',
            '/privacidad.html',
            '/faq.html',
            '/acerca-de.html'
        ];
        
        this.init();
    }

    /**
     * Inicializa el router verificando autenticación
     */
    init() {
        const currentPath = window.location.pathname;
        
        // Si estamos en una ruta pública, no hacer nada
        if (this.isPublicRoute(currentPath)) {
            return;
        }

        // Verificar autenticación
        const token = this.getToken();
        
        if (!token) {
            this.redirectToLogin();
            return;
        }

        // Validar token y redirigir según rol
        this.validateAndRoute(token, currentPath);
    }

    /**
     * Verifica si la ruta es pública
     */
    isPublicRoute(path) {
        return this.publicRoutes.some(route => path.includes(route)) || path === '/';
    }

    /**
     * Obtiene el token del localStorage
     */
    getToken() {
        return localStorage.getItem('yavoy_token');
    }

    /**
     * Decodifica el JWT sin verificar firma (solo lectura)
     */
    parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64).split('').map(c => {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join('')
            );
            
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Error al decodificar JWT:', error);
            return null;
        }
    }

    /**
     * Valida el token y redirige según el rol
     */
    async validateAndRoute(token, currentPath) {
        const userData = this.parseJwt(token);
        
        if (!userData) {
            console.error('Token inválido');
            this.redirectToLogin();
            return;
        }

        // Verificar expiración
        if (userData.exp && userData.exp * 1000 < Date.now()) {
            console.warn('Token expirado');
            this.logout();
            return;
        }

        // Validar token en servidor (opcional pero recomendado)
        const isValid = await this.validateTokenServer(token);
        if (!isValid) {
            console.error('Token no válido en servidor');
            this.logout();
            return;
        }

        // Obtener rol del usuario
        const userRole = userData.role || userData.tipo || 'cliente';
        
        // Verificar si el usuario está en la ruta correcta
        const correctRoute = this.routes[userRole];
        
        if (!correctRoute) {
            console.error(`Rol desconocido: ${userRole}`);
            this.redirectToLogin();
            return;
        }

        // Si no está en la ruta correcta, redirigir
        if (!currentPath.includes(correctRoute)) {
            console.log(`Redirigiendo ${userRole} a ${correctRoute}`);
            window.location.href = correctRoute;
        }

        // Guardar datos del usuario en sessionStorage para acceso rápido
        this.cacheUserData(userData);
    }

    /**
     * Valida el token en el servidor
     */
    async validateTokenServer(token) {
        try {
            const response = await fetch('/api/auth/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            
            return response.ok;
        } catch (error) {
            console.error('Error al validar token en servidor:', error);
            return false;
        }
    }

    /**
     * Cachea datos del usuario en sessionStorage
     */
    cacheUserData(userData) {
        sessionStorage.setItem('yavoy_user_data', JSON.stringify({
            id: userData.id,
            name: userData.name || userData.nombre,
            email: userData.email,
            role: userData.role || userData.tipo,
            cached_at: Date.now()
        }));
    }

    /**
     * Obtiene datos del usuario cacheados
     */
    static getUserData() {
        try {
            const cached = sessionStorage.getItem('yavoy_user_data');
            if (cached) {
                const data = JSON.parse(cached);
                // Cache válido por 5 minutos
                if (Date.now() - data.cached_at < 5 * 60 * 1000) {
                    return data;
                }
            }
        } catch (error) {
            console.error('Error al obtener datos cacheados:', error);
        }
        return null;
    }

    /**
     * Redirige al login
     */
    redirectToLogin() {
        window.location.href = '/index.html';
    }

    /**
     * Cierra sesión y limpia datos
     */
    logout() {
        localStorage.removeItem('yavoy_token');
        sessionStorage.removeItem('yavoy_user_data');
        this.redirectToLogin();
    }

    /**
     * Maneja el login exitoso y redirige según rol
     */
    static async handleLogin(token) {
        if (!token) {
            console.error('Token no proporcionado');
            return false;
        }

        // Guardar token
        localStorage.setItem('yavoy_token', token);

        // Decodificar para obtener rol
        const router = new YAvoyRouter();
        const userData = router.parseJwt(token);
        
        if (!userData || !userData.role) {
            console.error('Token sin rol de usuario');
            return false;
        }

        // Redirigir a la ruta correspondiente
        const targetRoute = router.routes[userData.role];
        
        if (targetRoute) {
            window.location.href = targetRoute;
            return true;
        }

        console.error(`Rol desconocido: ${userData.role}`);
        return false;
    }

    /**
     * Verifica si el usuario tiene permiso para acceder a una ruta
     */
    static hasPermission(requiredRole) {
        const userData = YAvoyRouter.getUserData();
        
        if (!userData) {
            return false;
        }

        // Definir jerarquía de roles
        const roleHierarchy = {
            ceo: 4,
            admin: 4,
            comercio: 3,
            repartidor: 2,
            cliente: 1
        };

        const userLevel = roleHierarchy[userData.role] || 0;
        const requiredLevel = roleHierarchy[requiredRole] || 0;

        return userLevel >= requiredLevel;
    }

    /**
     * Middleware para proteger rutas
     */
    static protectRoute(allowedRoles = []) {
        const token = localStorage.getItem('yavoy_token');
        
        if (!token) {
            window.location.href = '/index.html';
            return false;
        }

        const router = new YAvoyRouter();
        const userData = router.parseJwt(token);
        
        if (!userData) {
            router.redirectToLogin();
            return false;
        }

        if (allowedRoles.length > 0 && !allowedRoles.includes(userData.role)) {
            alert('❌ No tienes permisos para acceder a esta sección');
            window.history.back();
            return false;
        }

        return true;
    }
}

// Inicializar router automáticamente al cargar la página
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new YAvoyRouter();
    });
} else {
    new YAvoyRouter();
}

// Exportar para uso global
window.YAvoyRouter = YAvoyRouter;

// Helpers globales
window.yavoyLogout = () => {
    const router = new YAvoyRouter();
    router.logout();
};

window.yavoyGetUserData = () => {
    return YAvoyRouter.getUserData();
};

console.log('✅ YAvoy Router v3.1 inicializado');
