/**
 * 🐛 Error Handling & Testing - YAvoy
 * Manejo centralizado de errores y utilities de testing
 */

// === MANEJO GLOBAL DE ERRORES ===
class ErrorHandler {
  constructor() {
    this.errors = [];
    this.setupGlobalHandlers();
  }

  setupGlobalHandlers() {
    // Capturar errores no manejados
    window.addEventListener('error', (event) => {
      this.logError({
        type: 'JavaScript Error',
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack,
        timestamp: new Date().toISOString()
      });
      
      // Mostrar mensaje amigable al usuario
      this.showUserFriendlyError('Ha ocurrido un error. Estamos trabajando en solucionarlo.');
    });

    // Capturar promesas rechazadas
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        type: 'Promise Rejection',
        message: event.reason?.message || event.reason,
        stack: event.reason?.stack,
        timestamp: new Date().toISOString()
      });
      
      this.showUserFriendlyError('Error al procesar la solicitud. Por favor intenta nuevamente.');
    });

    // Capturar errores de red
    window.addEventListener('offline', () => {
      this.showUserFriendlyError('Sin conexión a Internet. Verifica tu conexión.', 'warning');
    });

    window.addEventListener('online', () => {
      if (window.showToast) {
        window.showToast('Conexión restaurada', 'success');
      }
    });
  }

  logError(error) {
    this.errors.push(error);
    
    // Log en consola solo en desarrollo
    if (this.isDevelopment()) {
      console.error('Error capturado:', error);
    }

    // Enviar a servidor (implementar cuando esté disponible)
    this.sendToServer(error);
  }

  showUserFriendlyError(message, type = 'error') {
    if (window.showToast) {
      window.showToast(message, type, 5000);
    } else {
      alert(message);
    }
  }

  isDevelopment() {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1';
  }

  async sendToServer(error) {
    // Solo en producción
    if (this.isDevelopment()) return;

    try {
      await fetch('/api/logs/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(error)
      });
    } catch (e) {
      // Silenciar errores al enviar logs
    }
  }

  getErrors() {
    return this.errors;
  }

  clearErrors() {
    this.errors = [];
  }
}

// === VALIDACIÓN DE DATOS ===
const DataValidator = {
  /**
   * Valida que un objeto tenga las propiedades requeridas
   */
  validateRequired(obj, requiredFields) {
    const missing = [];
    
    for (const field of requiredFields) {
      if (!obj || obj[field] === undefined || obj[field] === null || obj[field] === '') {
        missing.push(field);
      }
    }
    
    if (missing.length > 0) {
      throw new Error(`Campos requeridos faltantes: ${missing.join(', ')}`);
    }
    
    return true;
  },

  /**
   * Sanitiza entrada de usuario
   */
  sanitize(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Eliminar < y >
      .replace(/javascript:/gi, '') // Eliminar javascript:
      .replace(/on\w+=/gi, ''); // Eliminar event handlers
  },

  /**
   * Valida formato de fecha
   */
  isValidDate(date) {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d);
  },

  /**
   * Valida que un número esté en rango
   */
  isInRange(num, min, max) {
    return num >= min && num <= max;
  }
};

// === API CLIENT CON MANEJO DE ERRORES ===
class APIClient {
  constructor(baseURL = '') {
    this.baseURL = baseURL;
    this.timeout = 10000; // 10 segundos
  }

  async request(endpoint, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(this.baseURL + endpoint, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };

    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error('La solicitud tardó demasiado. Verifica tu conexión.');
      }

      throw new Error(error.message || 'Error al conectar con el servidor');
    }
  }

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// === RETRY LOGIC ===
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = baseDelay * Math.pow(2, i);
      console.log(`Reintentando en ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// === LOCAL STORAGE CON MANEJO DE ERRORES ===
const SafeStorage = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error al leer localStorage:', error);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error al escribir localStorage:', error);
      
      // Si el error es por cuota excedida, limpiar items viejos
      if (error.name === 'QuotaExceededError') {
        this.cleanOldItems();
        try {
          localStorage.setItem(key, JSON.stringify(value));
          return true;
        } catch (e) {
          return false;
        }
      }
      
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      return false;
    }
  },

  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      return false;
    }
  },

  cleanOldItems() {
    // Implementar lógica para limpiar items antiguos
    // Por ahora, limpiar todo excepto items críticos
    const critical = ['comercios', 'repartidores'];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!critical.includes(key)) {
        localStorage.removeItem(key);
      }
    }
  }
};

// === TESTING UTILITIES ===
const TestUtils = {
  /**
   * Simula un delay
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Genera datos de prueba
   */
  generateTestData: {
    comercio() {
      return {
        id: `COM${Date.now()}`,
        nombre: 'Comercio de Prueba',
        categoria: 'Test',
        telefono: '2215047962',
        email: 'test@yavoy.com',
        direccion: 'Calle Test 123'
      };
    },

    pedido() {
      return {
        id: `PED${Date.now()}`,
        comercio: 'Comercio Test',
        producto: 'Producto Test',
        destino: 'Destino Test',
        telefono: '2215047962',
        precio: 1000,
        estado: 'pendiente',
        fecha: new Date().toISOString()
      };
    },

    repartidor() {
      return {
        id: `REP${Date.now()}`,
        nombre: 'Repartidor Test',
        dni: '12345678',
        telefono: '2215047962',
        email: 'repartidor@test.com',
        vehiculo: 'Moto'
      };
    }
  },

  /**
   * Verifica funcionalidad básica
   */
  async runBasicTests() {
    console.log('🧪 Ejecutando tests básicos...');
    
    const tests = [
      {
        name: 'LocalStorage funcionando',
        test: () => {
          SafeStorage.set('test', { value: 'test' });
          const result = SafeStorage.get('test');
          SafeStorage.remove('test');
          return result?.value === 'test';
        }
      },
      {
        name: 'Validaciones funcionando',
        test: () => {
          try {
            DataValidator.validateRequired({ name: 'Test' }, ['name']);
            return true;
          } catch {
            return false;
          }
        }
      },
      {
        name: 'Sanitización funcionando',
        test: () => {
          const input = '<script>alert("test")</script>';
          const sanitized = DataValidator.sanitize(input);
          return !sanitized.includes('<') && !sanitized.includes('>');
        }
      },
      {
        name: 'Detección de conexión',
        test: () => {
          return typeof navigator.onLine === 'boolean';
        }
      }
    ];

    const results = [];
    
    for (const { name, test } of tests) {
      try {
        const passed = await test();
        results.push({ name, passed, error: null });
        console.log(`${passed ? '✅' : '❌'} ${name}`);
      } catch (error) {
        results.push({ name, passed: false, error: error.message });
        console.log(`❌ ${name}: ${error.message}`);
      }
    }

    const allPassed = results.every(r => r.passed);
    console.log(`\n${allPassed ? '✅' : '⚠️'} Tests completados: ${results.filter(r => r.passed).length}/${results.length} pasaron`);
    
    return results;
  }
};

// === MONITOR DE PERFORMANCE ===
const PerformanceMonitor = {
  marks: {},

  start(label) {
    this.marks[label] = performance.now();
  },

  end(label) {
    if (!this.marks[label]) {
      console.warn(`No se encontró marca de inicio para: ${label}`);
      return;
    }

    const duration = performance.now() - this.marks[label];
    console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
    delete this.marks[label];
    
    return duration;
  },

  measure(label, fn) {
    return async (...args) => {
      this.start(label);
      try {
        const result = await fn(...args);
        this.end(label);
        return result;
      } catch (error) {
        this.end(label);
        throw error;
      }
    };
  }
};

// === INICIALIZACIÓN ===
const errorHandler = new ErrorHandler();
const apiClient = new APIClient('/api');

// Exportar globalmente
window.ErrorHandler = errorHandler;
window.APIClient = apiClient;
window.DataValidator = DataValidator;
window.SafeStorage = SafeStorage;
window.TestUtils = TestUtils;
window.PerformanceMonitor = PerformanceMonitor;
window.retryWithBackoff = retryWithBackoff;

// Auto-test en desarrollo
if (errorHandler.isDevelopment()) {
  console.log('🔧 Modo desarrollo detectado');
  
  // Ejecutar tests básicos
  setTimeout(() => {
    TestUtils.runBasicTests();
  }, 1000);
}

console.log('✅ Error handling & testing inicializado');
