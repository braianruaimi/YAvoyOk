/**
 * 🚀 YAvoy Cache Management System
 * Sistema inteligente de versionado y cache para CSS/JS
 * Versión: 1.0.0 - YAvoy v3.1 Enterprise
 */

(function() {
    'use strict';
    
    const CacheManager = {
        // Versión actual del sistema
        version: '3.1.0',
        buildTimestamp: Date.now(),
        
        // Detectar si estamos en desarrollo o producción
        isDevelopment: function() {
            return window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' ||
                   window.location.port === '5502';
        },
        
        // Generar hash para versionado
        generateVersionHash: function() {
            const buildInfo = `${this.version}-${this.buildTimestamp}`;
            return btoa(buildInfo).substring(0, 8);
        },
        
        // Agregar parámetros de cache a URLs
        addCacheParams: function(url) {
            const separator = url.includes('?') ? '&' : '?';
            const versionParam = this.isDevelopment() ? 
                `v=${Date.now()}` : // En desarrollo, siempre nuevo
                `v=${this.generateVersionHash()}`; // En producción, hash estable
                
            return `${url}${separator}${versionParam}`;
        },
        
        // Actualizar todos los enlaces CSS
        updateCSSLinks: function() {
            const cssLinks = document.querySelectorAll('link[rel="stylesheet"]');
            let updated = 0;
            
            cssLinks.forEach(link => {
                const originalHref = link.href;
                
                // Solo procesar archivos locales (no CDN)
                if (!originalHref.includes('http') || 
                    originalHref.includes(window.location.hostname)) {
                    
                    // Remover parámetros anteriores
                    const cleanHref = originalHref.split('?')[0];
                    
                    // Agregar nueva versión
                    link.href = this.addCacheParams(cleanHref);
                    updated++;
                }
            });
            
            console.log(`🎨 Cache Manager: ${updated} archivos CSS actualizados`);
            return updated;
        },
        
        // Actualizar todos los scripts JS
        updateJSScripts: function() {
            const jsScripts = document.querySelectorAll('script[src]');
            let updated = 0;
            
            jsScripts.forEach(script => {
                const originalSrc = script.src;
                
                // Solo procesar archivos locales
                if (!originalSrc.includes('http') || 
                    originalSrc.includes(window.location.hostname)) {
                    
                    // Crear nuevo script con versión actualizada
                    const newScript = document.createElement('script');
                    const cleanSrc = originalSrc.split('?')[0];
                    
                    newScript.src = this.addCacheParams(cleanSrc);
                    newScript.async = script.async;
                    newScript.defer = script.defer;
                    
                    // Reemplazar el script anterior
                    script.parentNode.insertBefore(newScript, script);
                    script.parentNode.removeChild(script);
                    updated++;
                }
            });
            
            console.log(`⚡ Cache Manager: ${updated} archivos JS actualizados`);
            return updated;
        },
        
        // Limpiar cache del navegador (solo desarrollo)
        clearBrowserCache: function() {
            if (this.isDevelopment() && 'caches' in window) {
                caches.keys().then(names => {
                    names.forEach(name => {
                        caches.delete(name);
                    });
                });
                console.log('🧹 Cache del navegador limpiado (desarrollo)');
            }
        },
        
        // Precargar recursos críticos
        preloadCriticalResources: function() {
            const criticalResources = [
                'css/index-styles.css',
                'js/index-main.js',
                'js/theme-color-polyfill.js'
            ];
            
            criticalResources.forEach(resource => {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = resource.endsWith('.css') ? 'style' : 'script';
                link.href = this.addCacheParams(resource);
                document.head.appendChild(link);
            });
            
            console.log('🚀 Recursos críticos precargados');
        },
        
        // Monitorear performance de cache
        monitorCachePerformance: function() {
            if ('performance' in window && 'getEntriesByType' in performance) {
                const resources = performance.getEntriesByType('resource');
                const cacheHits = resources.filter(r => r.transferSize === 0).length;
                const totalResources = resources.length;
                const cacheHitRatio = ((cacheHits / totalResources) * 100).toFixed(1);
                
                console.log(`📊 Cache Hit Ratio: ${cacheHitRatio}% (${cacheHits}/${totalResources})`);
            }
        },
        
        // Inicializar sistema de cache
        init: function() {
            console.log(`🚀 YAvoy Cache Manager v${this.version} iniciado`);
            console.log(`🔧 Modo: ${this.isDevelopment() ? 'Desarrollo' : 'Producción'}`);
            
            // Limpiar cache en desarrollo
            if (this.isDevelopment()) {
                this.clearBrowserCache();
            }
            
            // Precargar recursos críticos
            this.preloadCriticalResources();
            
            // Monitorear performance después de cargar
            window.addEventListener('load', () => {
                setTimeout(() => {
                    this.monitorCachePerformance();
                }, 1000);
            });
            
            // Exponer método global para actualización manual
            window.YAvoyCache = {
                refresh: () => {
                    this.updateCSSLinks();
                    this.updateJSScripts();
                },
                clear: () => this.clearBrowserCache(),
                version: this.version
            };
        }
    };
    
    // Auto-inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => CacheManager.init());
    } else {
        CacheManager.init();
    }
    
})();