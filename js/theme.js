/**
 * Sistema de Temas Global para YaVoy
 * Soporta: Claro, Oscuro, Auto (según hora del sistema)
 * Sincronizado entre todas las páginas
 */

class ThemeManager {
  constructor() {
    this.THEMES = {
      LIGHT: 'light',
      DARK: 'dark',
      AUTO: 'auto'
    };
    
    this.STORAGE_KEY = 'yavoy-theme';
    this.SCHEDULE = {
      DARK_START: 20,  // 8 PM
      DARK_END: 6      // 6 AM
    };
    
    this.initTheme();
    this.setupListeners();
  }

  /**
   * Inicializa el tema al cargar la página
   */
  initTheme() {
    const savedTheme = this.getSavedTheme();
    const themeToApply = savedTheme || this.THEMES.AUTO;
    this.setTheme(themeToApply);
    
    // Auto-refresh cada minuto para cambio automático (modo AUTO)
    if (themeToApply === this.THEMES.AUTO) {
      setInterval(() => this.updateAutoTheme(), 60000);
    }
  }

  /**
   * Obtiene el tema guardado en localStorage
   */
  getSavedTheme() {
    try {
      return localStorage.getItem(this.STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  /**
   * Guarda la preferencia de tema
   */
  saveTheme(theme) {
    try {
      localStorage.setItem(this.STORAGE_KEY, theme);
    } catch (e) {
      console.warn('No se pudo guardar preferencia de tema');
    }
  }

  /**
   * Detecta si es hora de modo oscuro (basado en hora del sistema)
   */
  isDarkHour() {
    const hour = new Date().getHours();
    return hour >= this.SCHEDULE.DARK_START || hour < this.SCHEDULE.DARK_END;
  }

  /**
   * Actualiza tema automático según hora
   */
  updateAutoTheme() {
    const isDark = this.isDarkHour();
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const targetTheme = isDark ? this.THEMES.DARK : this.THEMES.LIGHT;
    
    if (currentTheme !== targetTheme) {
      this.applyTheme(targetTheme);
    }
  }

  /**
   * Establece y aplica el tema
   */
  setTheme(theme) {
    this.saveTheme(theme);
    
    if (theme === this.THEMES.AUTO) {
      const isDark = this.isDarkHour();
      this.applyTheme(isDark ? this.THEMES.DARK : this.THEMES.LIGHT);
    } else {
      this.applyTheme(theme);
    }
    
    // Notificar a componentes que escuchan
    window.dispatchEvent(new CustomEvent('themeChanged', { 
      detail: { theme } 
    }));
  }

  /**
   * Aplica el tema al DOM
   */
  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(`${theme}-theme`);
    
    // Actualizar meta-theme-color para móviles
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute(
        'content',
        theme === 'dark' ? '#1a1a2e' : '#667eea'
      );
    }
  }

  /**
   * Obtiene el tema actual (sin AUTO)
   */
  getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || this.THEMES.LIGHT;
  }

  /**
   * Toggle entre claro y oscuro
   */
  toggleTheme() {
    const current = this.getCurrentTheme();
    const newTheme = current === this.THEMES.LIGHT ? this.THEMES.DARK : this.THEMES.LIGHT;
    this.setTheme(newTheme);
  }

  /**
   * Configura listeners para cambios del sistema
   */
  setupListeners() {
    // Escuchar cambios de preferencia del sistema
    if (window.matchMedia) {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      darkModeQuery.addListener((e) => {
        const savedTheme = this.getSavedTheme();
        if (savedTheme === this.THEMES.AUTO) {
          this.updateAutoTheme();
        }
      });
    }
  }

  /**
   * Retorna los colores del tema actual
   */
  getThemeColors() {
    const isDark = this.getCurrentTheme() === this.THEMES.DARK;
    return {
      primary: isDark ? '#667eea' : '#667eea',
      secondary: isDark ? '#764ba2' : '#764ba2',
      background: isDark ? '#1a1a2e' : '#ffffff',
      surface: isDark ? '#16213e' : '#f5f5f5',
      text: isDark ? '#e0e0e0' : '#333333',
      textSecondary: isDark ? '#b0b0b0' : '#666666',
      border: isDark ? '#2d3561' : '#e0e0e0',
      success: isDark ? '#10b981' : '#10b981',
      warning: isDark ? '#f59e0b' : '#f59e0b',
      danger: isDark ? '#ef4444' : '#ef4444',
      info: isDark ? '#3b82f6' : '#3b82f6'
    };
  }
}

// Crear instancia global
const themeManager = new ThemeManager();

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeManager;
}
