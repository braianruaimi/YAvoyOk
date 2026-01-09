/**
 * ⚡ Performance Optimizations - YAvoy
 * Lazy loading, resource hints, code splitting
 */

// === LAZY LOADING DE IMÁGENES ===
class LazyLoader {
  constructor(options = {}) {
    this.options = {
      rootMargin: options.rootMargin || '50px',
      threshold: options.threshold || 0.01,
      loadingClass: options.loadingClass || 'lazy-loading',
      loadedClass: options.loadedClass || 'lazy-loaded',
      errorClass: options.errorClass || 'lazy-error'
    };
    
    this.init();
  }
  
  init() {
    // Detectar soporte de IntersectionObserver
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        this.handleIntersection.bind(this),
        {
          rootMargin: this.options.rootMargin,
          threshold: this.options.threshold
        }
      );
      
      this.observeImages();
    } else {
      // Fallback: cargar todas las imágenes inmediatamente
      this.loadAllImages();
    }
  }
  
  observeImages() {
    const images = document.querySelectorAll('img[data-src], img[loading="lazy"]');
    images.forEach(img => this.observer.observe(img));
  }
  
  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this.loadImage(entry.target);
        this.observer.unobserve(entry.target);
      }
    });
  }
  
  loadImage(img) {
    const src = img.dataset.src || img.src;
    
    if (!src) return;
    
    img.classList.add(this.options.loadingClass);
    
    // Crear imagen temporal para precargar
    const tempImg = new Image();
    
    tempImg.onload = () => {
      img.src = src;
      img.removeAttribute('data-src');
      img.classList.remove(this.options.loadingClass);
      img.classList.add(this.options.loadedClass);
      
      // Disparar evento personalizado
      img.dispatchEvent(new CustomEvent('lazyloaded'));
    };
    
    tempImg.onerror = () => {
      img.classList.remove(this.options.loadingClass);
      img.classList.add(this.options.errorClass);
      
      // Disparar evento de error
      img.dispatchEvent(new CustomEvent('lazyerror'));
    };
    
    tempImg.src = src;
  }
  
  loadAllImages() {
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => this.loadImage(img));
  }
}

// === LAZY LOADING DE SECCIONES ===
class SectionLoader {
  constructor() {
    this.sections = document.querySelectorAll('[data-lazy-section]');
    this.init();
  }
  
  init() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        this.handleIntersection.bind(this),
        { rootMargin: '100px', threshold: 0 }
      );
      
      this.sections.forEach(section => this.observer.observe(section));
    }
  }
  
  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const section = entry.target;
        const loadFn = section.dataset.lazySection;
        
        if (window[loadFn] && typeof window[loadFn] === 'function') {
          window[loadFn]();
        }
        
        section.classList.add('section-loaded');
        this.observer.unobserve(section);
      }
    });
  }
}

// === PRECONNECT A DOMINIOS EXTERNOS ===
function preconnectToExternalDomains() {
  const domains = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://www.googletagmanager.com'
  ];
  
  domains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

// === DEFER DE SCRIPTS NO CRÍTICOS ===
function deferNonCriticalScripts() {
  const scripts = document.querySelectorAll('script[data-defer]');
  
  scripts.forEach(script => {
    const src = script.dataset.src;
    if (src) {
      const newScript = document.createElement('script');
      newScript.src = src;
      newScript.defer = true;
      document.body.appendChild(newScript);
    }
  });
}

// === RESOURCE HINTS ===
function addResourceHints() {
  const hints = [
    { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
    { rel: 'dns-prefetch', href: '//fonts.gstatic.com' },
    { rel: 'prefetch', href: '/panel-repartidor.html', as: 'document' },
    { rel: 'prefetch', href: '/panel-comercio.html', as: 'document' }
  ];
  
  hints.forEach(hint => {
    const link = document.createElement('link');
    link.rel = hint.rel;
    link.href = hint.href;
    if (hint.as) link.as = hint.as;
    document.head.appendChild(link);
  });
}

// === DEBOUNCE PARA EVENTOS ===
function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// === THROTTLE PARA SCROLL ===
function throttle(func, limit = 100) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// === REQUEST IDLE CALLBACK POLYFILL ===
window.requestIdleCallback = window.requestIdleCallback || function(cb) {
  const start = Date.now();
  return setTimeout(function() {
    cb({
      didTimeout: false,
      timeRemaining: function() {
        return Math.max(0, 50 - (Date.now() - start));
      }
    });
  }, 1);
};

window.cancelIdleCallback = window.cancelIdleCallback || function(id) {
  clearTimeout(id);
};

// === EJECUTAR TAREAS EN IDLE ===
function runWhenIdle(tasks) {
  if (!Array.isArray(tasks)) tasks = [tasks];
  
  tasks.forEach(task => {
    requestIdleCallback(() => {
      if (typeof task === 'function') {
        task();
      }
    });
  });
}

// === OPTIMIZAR EVENTOS DE SCROLL ===
let scrollTimeout;
function optimizeScrollEvents() {
  const scrollHandlers = [];
  
  // Throttled scroll handler
  const handleScroll = throttle(() => {
    scrollHandlers.forEach(handler => handler());
  }, 100);
  
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  return {
    add: (handler) => scrollHandlers.push(handler),
    remove: (handler) => {
      const index = scrollHandlers.indexOf(handler);
      if (index > -1) scrollHandlers.splice(index, 1);
    }
  };
}

// === DETECTAR CONEXIÓN LENTA ===
function isSlowConnection() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  if (connection) {
    // Si el usuario está en 2G o save-data está activado
    if (connection.effectiveType === '2g' || connection.saveData) {
      return true;
    }
  }
  
  return false;
}

// === CARGAR RECURSOS BAJO DEMANDA ===
function loadResourceOnDemand(url, type = 'script') {
  return new Promise((resolve, reject) => {
    let element;
    
    if (type === 'script') {
      element = document.createElement('script');
      element.src = url;
      element.async = true;
    } else if (type === 'style') {
      element = document.createElement('link');
      element.rel = 'stylesheet';
      element.href = url;
    }
    
    element.onload = resolve;
    element.onerror = reject;
    
    document.head.appendChild(element);
  });
}

// === MONITOREO DE PERFORMANCE ===
function logPerformanceMetrics() {
  if ('performance' in window && 'getEntriesByType' in performance) {
    const perfData = performance.getEntriesByType('navigation')[0];
    
    if (perfData) {
      const metrics = {
        'DNS Lookup': Math.round(perfData.domainLookupEnd - perfData.domainLookupStart),
        'TCP Connection': Math.round(perfData.connectEnd - perfData.connectStart),
        'Request': Math.round(perfData.responseStart - perfData.requestStart),
        'Response': Math.round(perfData.responseEnd - perfData.responseStart),
        'DOM Processing': Math.round(perfData.domComplete - perfData.domLoading),
        'Total Load': Math.round(perfData.loadEventEnd - perfData.fetchStart)
      };
      
      console.table(metrics);
      return metrics;
    }
  }
}

// === INICIALIZACIÓN ===
document.addEventListener('DOMContentLoaded', () => {
  // Lazy loading de imágenes
  new LazyLoader();
  
  // Lazy loading de secciones
  new SectionLoader();
  
  // Resource hints
  addResourceHints();
  
  // Preconnect a dominios externos
  preconnectToExternalDomains();
  
  // Tareas no críticas en idle
  runWhenIdle([
    () => console.log('⚡ Performance optimizations activas'),
    logPerformanceMetrics
  ]);
  
  // Optimizar scroll events
  window.scrollManager = optimizeScrollEvents();
});

// === EXPORTAR ===
window.lazyLoad = {
  images: () => new LazyLoader(),
  resource: loadResourceOnDemand
};
window.debounce = debounce;
window.throttle = throttle;
window.runWhenIdle = runWhenIdle;
window.isSlowConnection = isSlowConnection;
