/**
 * YAvoy Universal Theme Loader
 * Auto-carga el sistema de temas en todas las páginas
 */

(function() {
    'use strict';
    
    // Verificar si ya se cargó
    if (window.YAvoyThemeLoader) {
        return;
    }
    
    const YAvoyThemeLoader = {
        // Archivos necesarios para el sistema de temas
        requiredFiles: [
            'css/theme-enhancement.css',
            'js/theme-config.js',
            'js/theme-color-polyfill.js'
        ],
        
        // Verificar si los archivos están cargados
        checkFiles: function() {
            const loadedCSS = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
                .some(link => link.href.includes('theme-enhancement.css'));
            
            const loadedConfig = window.YAvoyThemeConfig !== undefined;
            const loadedPolyfill = window.YAvoyThemePolyfill !== undefined;
            
            return {
                css: loadedCSS,
                config: loadedConfig,
                polyfill: loadedPolyfill,
                allLoaded: loadedCSS && loadedConfig && loadedPolyfill
            };
        },
        
        // Cargar archivo CSS
        loadCSS: function(href) {
            return new Promise((resolve, reject) => {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = href;
                link.onload = () => resolve(href);
                link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));
                document.head.appendChild(link);
            });
        },
        
        // Cargar archivo JavaScript
        loadJS: function(src) {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.defer = true;
                script.onload = () => resolve(src);
                script.onerror = () => reject(new Error(`Failed to load JS: ${src}`));
                document.head.appendChild(script);
            });
        },
        
        // Cargar todos los archivos necesarios
        loadThemeSystem: function() {
            const status = this.checkFiles();
            const promises = [];
            
            if (!status.css) {
                promises.push(this.loadCSS('css/theme-enhancement.css'));
            }
            
            if (!status.config) {
                promises.push(this.loadJS('js/theme-config.js'));
            }
            
            if (!status.polyfill) {
                promises.push(this.loadJS('js/theme-color-polyfill.js'));
            }
            
            if (promises.length === 0) {
                console.log('✅ Sistema de temas YAvoy ya está cargado');
                return Promise.resolve();
            }
            
            console.log('🔄 Cargando sistema de temas YAvoy...');
            
            return Promise.all(promises).then(() => {
                console.log('✅ Sistema de temas YAvoy cargado correctamente');
                // Pequeño delay para asegurar que todo esté inicializado
                return new Promise(resolve => setTimeout(resolve, 100));
            }).catch(error => {
                console.warn('⚠️ Error cargando sistema de temas YAvoy:', error);
            });
        },
        
        // Inicializar sistema de temas
        init: function() {
            this.loadThemeSystem().then(() => {
                // Verificar que todo esté cargado
                const finalStatus = this.checkFiles();
                
                if (finalStatus.allLoaded) {
                    // Aplicar configuración de tema
                    if (window.YAvoyThemeConfig) {
                        window.YAvoyThemeConfig.applyPageTheme();
                    }
                    
                    // Inicializar polyfill si es necesario
                    if (window.YAvoyThemePolyfill && !window.YAvoyThemePolyfill.initialized) {
                        window.YAvoyThemePolyfill.init();
                        window.YAvoyThemePolyfill.initialized = true;
                    }
                    
                    console.log('🎨 YAvoy Theme System totalmente operativo');
                } else {
                    console.warn('⚠️ Sistema de temas parcialmente cargado:', finalStatus);
                }
            });
        }
    };
    
    // Exponer globalmente
    window.YAvoyThemeLoader = YAvoyThemeLoader;
    
    // Auto-inicializar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            YAvoyThemeLoader.init();
        });
    } else {
        YAvoyThemeLoader.init();
    }
    
})();