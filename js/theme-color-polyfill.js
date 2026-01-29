/**
 * YAvoy Enhanced Theme Color Polyfill 
 * Elimina warnings de Firefox/Opera y mejora compatibilidad universal
 * Versión: 2.1.0 - Optimizado para YAvoy v3.1 Enterprise
 */

(function () {
    'use strict';

    // Configuración del polyfill mejorado
    const ThemeColorPolyfill = {
        // Detectar browsers que necesitan polyfill
        needsPolyfill: function () {
            const userAgent = navigator.userAgent.toLowerCase();
            return userAgent.includes('firefox') ||
                userAgent.includes('opera') ||
                userAgent.includes('opr/') ||
                userAgent.includes('edge') && !userAgent.includes('edg/');
        },

        // Detectar soporte nativo mejorado
        hasNativeSupport: function () {
            // Test más robusto para detectar soporte real
            if (this.needsPolyfill()) return false;
            
            try {
                const testMeta = document.createElement('meta');
                testMeta.name = 'theme-color';
                testMeta.content = '#test';
                document.head.appendChild(testMeta);
                
                // Si el navegador soporta, lo detectamos por CSS o API
                const supported = 'CSS' in window && 'supports' in CSS ? 
                    CSS.supports('color', '#06b6d4') : true;
                
                document.head.removeChild(testMeta);
                return supported;
            } catch (e) {
                return false;
            }
        },

        // Obtener color del theme-color meta tag
        getThemeColor: function () {
            const metaTag = document.querySelector('meta[name="theme-color"]');
            return metaTag ? metaTag.getAttribute('content') : '#06b6d4';
        },

        // Aplicar color a elementos del navegador que se pueden controlar
        applyThemeColor: function (color) {
            // Solo aplicar si es necesario
            if (this.hasNativeSupport()) {
                console.log('✅ Theme color nativo detectado, usando soporte del navegador');
                return;
            }

            // 1. Aplicar al status bar en móviles
            this.setStatusBarColor(color);

            // 2. Aplicar al header del navegador (cuando sea posible)
            this.setHeaderColor(color);

            // 3. Aplicar al fondo de scrollbars personalizadas
            this.setScrollbarColor(color);

            // 4. Aplicar a elementos específicos de la interfaz
            this.setUIAccents(color);

            console.log('🎨 YAvoy Theme Color polyfill aplicado:', color);
        },

        // Color del status bar en móviles
        setStatusBarColor: function (color) {
            // iOS Safari
            let iosMetaTag = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
            if (!iosMetaTag) {
                iosMetaTag = document.createElement('meta');
                iosMetaTag.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
                document.head.appendChild(iosMetaTag);
            }

            // Determinar si usar dark o light content
            const isDark = this.isColorDark(color);
            iosMetaTag.setAttribute('content', isDark ? 'light-content' : 'dark-content');

            // Android Chrome
            let androidMetaTag = document.querySelector('meta[name="msapplication-navbutton-color"]');
            if (!androidMetaTag) {
                androidMetaTag = document.createElement('meta');
                androidMetaTag.setAttribute('name', 'msapplication-navbutton-color');
                androidMetaTag.setAttribute('content', color);
                document.head.appendChild(androidMetaTag);
            }
        },

        // Color del header (limitado pero efectivo)
        setHeaderColor: function (color) {
            // Aplicar color de acento usando CSS custom properties
            const root = document.documentElement;
            root.style.setProperty('--browser-theme-color', color);
            root.style.setProperty('--theme-rgb', this.hexToRgb(color));

            // Insertar estilos específicos para la interfaz
            const style = document.getElementById('theme-color-polyfill') || document.createElement('style');
            style.id = 'theme-color-polyfill';
            style.innerHTML = `
                /* Polyfill Theme Color Styles */
                :root {
                    --theme-primary: ${color};
                    --theme-rgb: ${this.hexToRgb(color)};
                    --theme-alpha-10: rgba(${this.hexToRgb(color)}, 0.1);
                    --theme-alpha-20: rgba(${this.hexToRgb(color)}, 0.2);
                }
                
                /* Focus rings y elementos interactivos */
                *:focus {
                    outline-color: var(--theme-primary) !important;
                }
                
                /* Selection color */
                ::selection {
                    background-color: var(--theme-alpha-20);
                }
                
                ::-moz-selection {
                    background-color: var(--theme-alpha-20);
                }
                
                /* Scrollbars webkit */
                ::-webkit-scrollbar-thumb {
                    background-color: var(--theme-alpha-20);
                }
                
                ::-webkit-scrollbar-thumb:hover {
                    background-color: var(--theme-primary);
                }
                
                /* Progress elements */
                progress::-webkit-progress-bar {
                    background-color: var(--theme-alpha-10);
                }
                
                progress::-webkit-progress-value {
                    background-color: var(--theme-primary);
                }
                
                /* Range inputs */
                input[type="range"]::-webkit-slider-thumb {
                    background-color: var(--theme-primary);
                }
                
                input[type="range"]::-moz-range-thumb {
                    background-color: var(--theme-primary);
                }
            `;

            if (!document.getElementById('theme-color-polyfill')) {
                document.head.appendChild(style);
            }
        },

        // Scrollbars personalizadas
        setScrollbarColor: function (color) {
            const rgb = this.hexToRgb(color);
            document.documentElement.style.setProperty('scrollbar-color', `${color} rgba(${rgb}, 0.1)`);
        },

        // Elementos de UI específicos
        setUIAccents: function (color) {
            // Actualizar favicon dinámicamente con el color
            this.updateFaviconColor(color);

            // Aplicar a elementos específicos de YAvoy
            const elements = document.querySelectorAll('.theme-aware, [data-theme-color]');
            elements.forEach(el => {
                el.style.setProperty('--dynamic-theme', color);
            });
        },

        // Actualizar favicon con color
        updateFaviconColor: function (color) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 32;
            canvas.height = 32;

            // Crear favicon simple con el color del theme
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, 32, 32);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 20px Arial';
            ctx.fillText('Y', 8, 24);

            // Reemplazar favicon
            let favicon = document.querySelector('link[rel="icon"]') ||
                document.querySelector('link[rel="shortcut icon"]');

            if (!favicon) {
                favicon = document.createElement('link');
                favicon.rel = 'icon';
                document.head.appendChild(favicon);
            }

            favicon.href = canvas.toDataURL();
        },

        // Utilidades
        hexToRgb: function (hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ?
                `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` :
                '6, 182, 212';
        },

        isColorDark: function (color) {
            const rgb = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
            if (!rgb) return false;

            const r = parseInt(rgb[1], 16);
            const g = parseInt(rgb[2], 16);
            const b = parseInt(rgb[3], 16);

            // Calcular luminosidad
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            return luminance < 0.5;
        },

        // Monitorear cambios dinámicos
        watchForChanges: function () {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' &&
                        mutation.target.name === 'theme-color') {
                        const newColor = this.getThemeColor();
                        this.applyThemeColor(newColor);
                    }
                });
            });

            const metaTag = document.querySelector('meta[name="theme-color"]');
            if (metaTag) {
                observer.observe(metaTag, {
                    attributes: true,
                    attributeFilter: ['content']
                });
            }
        },

        // Inicializar polyfill
        init: function () {
            const currentColor = this.getThemeColor();

            if (!this.hasNativeSupport()) {
                console.log('🔧 Iniciando YAvoy Theme Color Polyfill');
                this.applyThemeColor(currentColor);
                this.watchForChanges();
            } else {
                console.log('✅ Soporte nativo de theme-color detectado');
                // Aplicar mejoras adicionales aún con soporte nativo
                this.setUIAccents(currentColor);
            }
        }
    };

    // Auto-inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            ThemeColorPolyfill.init();
        });
    } else {
        ThemeColorPolyfill.init();
    }

    // Exponer globalmente para uso manual
    window.YAvoyThemePolyfill = ThemeColorPolyfill;

})();