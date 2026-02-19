/**
 * YAvoy Theme Color Configuration
 * Configuración personalizada para diferentes páginas del sistema
 */

// Configuración de colores por página
window.YAvoyThemeConfig = {
    // Configuración general
    default: {
        color: '#06b6d4',
        name: 'YAvoy Cyan',
        rgb: '6, 182, 212'
    },
    
    // Configuración por página
    pages: {
        'index.html': {
            color: '#06b6d4',
            name: 'Principal',
            theme: 'default'
        },
        'landing-nueva.html': {
            color: '#06b6d4',
            name: 'Landing',
            theme: 'default'
        },
        'dashboard-ceo.html': {
            color: '#06b6d4',
            name: 'CEO Dashboard',
            theme: 'ceo'
        },
        'panel-comercio.html': {
            color: '#06b6d4',
            name: 'Panel Comercio',
            theme: 'default'
        },
        'panel-comercio-pro.html': {
            color: '#f59e0b',
            name: 'Comercio Pro',
            theme: 'comercio'
        },
        'panel-repartidor.html': {
            color: '#06b6d4',
            name: 'Panel Repartidor',
            theme: 'default'
        },
        'panel-repartidor-pro.html': {
            color: '#667eea',
            name: 'Repartidor Pro',
            theme: 'repartidor'
        }
    },
    
    // Configuración por tema
    themes: {
        default: {
            primary: '#06b6d4',
            secondary: '#0891b2',
            accent: '#06d6a0',
            rgb: '6, 182, 212'
        },
        ceo: {
            primary: '#06b6d4',
            secondary: '#0891b2',
            accent: '#f59e0b',
            rgb: '6, 182, 212'
        },
        comercio: {
            primary: '#f59e0b',
            secondary: '#d97706',
            accent: '#fbbf24',
            rgb: '245, 158, 11'
        },
        repartidor: {
            primary: '#667eea',
            secondary: '#5b21b6',
            accent: '#8b5cf6',
            rgb: '102, 126, 234'
        }
    },
    
    // Función para obtener configuración de la página actual
    getCurrentPageConfig: function() {
        const currentPage = window.location.pathname.split('/').pop();
        return this.pages[currentPage] || this.pages['index.html'];
    },
    
    // Función para aplicar tema específico
    applyPageTheme: function() {
        const config = this.getCurrentPageConfig();
        const theme = this.themes[config.theme];
        
        if (theme) {
            // Aplicar variables CSS
            document.documentElement.style.setProperty('--theme-primary', theme.primary);
            document.documentElement.style.setProperty('--theme-primary-rgb', theme.rgb);
            document.documentElement.style.setProperty('--theme-secondary', theme.secondary);
            document.documentElement.style.setProperty('--theme-accent', theme.accent);
            
            // Aplicar atributo de tema
            document.documentElement.setAttribute('data-theme', config.theme);
            
            // Actualizar meta theme-color si es necesario
            const metaTag = document.querySelector('meta[name="theme-color"]');
            if (metaTag && metaTag.getAttribute('content') !== theme.primary) {
                metaTag.setAttribute('content', theme.primary);
            }
            
            console.log(`🎨 Tema aplicado: ${config.name} (${theme.primary})`);
        }
    },
    
    // Función para cambiar tema dinámicamente
    setTheme: function(themeName) {
        const theme = this.themes[themeName];
        if (theme) {
            this.applyPageTheme();
            
            // Trigger polyfill update
            if (window.YAvoyThemePolyfill) {
                window.YAvoyThemePolyfill.applyThemeColor(theme.primary);
            }
        }
    }
};

// Auto-aplicar tema cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.YAvoyThemeConfig.applyPageTheme();
    });
} else {
    window.YAvoyThemeConfig.applyPageTheme();
}