/**
 * 🎨 UI Improvements - YAvoy
 * Loading states, animations, accessibility enhancements
 */

// === LOADING OVERLAY ===
const loadingOverlay = {
  element: null,
  
  init() {
    this.element = document.getElementById('loading-overlay');
  },
  
  show(text = 'Cargando...') {
    if (this.element) {
      const textElement = this.element.querySelector('.spinner-text');
      if (textElement) textElement.textContent = text;
      this.element.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },
  
  hide() {
    if (this.element) {
      this.element.classList.remove('active');
      document.body.style.overflow = '';
    }
  }
};

// === SKELETON LOADERS ===
function showSkeletons(containerId, count = 3) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton skeleton-card';
    skeleton.setAttribute('aria-hidden', 'true');
    container.appendChild(skeleton);
  }
}

function hideSkeletons(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    const skeletons = container.querySelectorAll('.skeleton');
    skeletons.forEach(s => s.remove());
  }
}

// === INTERSECTION OBSERVER PARA ANIMACIONES ===
const animateOnScroll = () => {
  const elements = document.querySelectorAll('[class*="animate-"]');
  
  // No animar si el usuario prefiere movimiento reducido
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'none';
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });
  
  elements.forEach(el => {
    // Estado inicial
    el.style.opacity = '0';
    observer.observe(el);
  });
};

// === RIPPLE EFFECT EN BOTONES ===
function createRipple(event) {
  const button = event.currentTarget;
  
  // Evitar si prefiere movimiento reducido
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }
  
  const ripple = document.createElement('span');
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;
  
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';
  ripple.className = 'ripple-effect';
  
  button.style.position = 'relative';
  button.style.overflow = 'hidden';
  
  // Eliminar ripples anteriores
  const oldRipple = button.querySelector('.ripple-effect');
  if (oldRipple) oldRipple.remove();
  
  button.appendChild(ripple);
  
  setTimeout(() => ripple.remove(), 600);
}

// === SMOOTH SCROLL MEJORADO ===
function smoothScrollTo(target, offset = 80) {
  const element = typeof target === 'string' ? document.querySelector(target) : target;
  if (!element) return;
  
  const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - offset;
  
  window.scrollTo({
    top: targetPosition,
    behavior: 'smooth'
  });
}

// === LAZY LOADING DE IMÁGENES ===
const lazyLoadImages = () => {
  const images = document.querySelectorAll('img[data-src]');
  
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        observer.unobserve(img);
        
        // Agregar animación al cargar
        img.onload = () => {
          img.classList.add('animate-fade-in');
        };
      }
    });
  });
  
  images.forEach(img => imageObserver.observe(img));
};

// === FOCUS TRAP PARA MODALES ===
function trapFocus(element) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  element.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  });
  
  // Focus inicial
  firstElement?.focus();
}

// === TOAST NOTIFICATIONS MEJORADAS ===
function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type} animate-slide-in-right`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
  
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  
  toast.innerHTML = `
    <span class="toast-icon" aria-hidden="true">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" aria-label="Cerrar notificación">×</button>
  `;
  
  document.body.appendChild(toast);
  
  // Posicionar
  const existingToasts = document.querySelectorAll('.toast');
  const offset = (existingToasts.length - 1) * 80;
  toast.style.bottom = `${20 + offset}px`;
  
  // Cerrar al hacer clic
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => removeToast(toast));
  
  // Auto-cerrar
  const timeout = setTimeout(() => removeToast(toast), duration);
  
  // Limpiar timeout si se cierra manualmente
  toast.dataset.timeout = timeout;
}

function removeToast(toast) {
  clearTimeout(toast.dataset.timeout);
  toast.classList.add('animate-slide-out-right');
  setTimeout(() => toast.remove(), 300);
}

// === VALIDACIÓN EN TIEMPO REAL ===
function setupRealtimeValidation(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  
  const inputs = form.querySelectorAll('input, textarea, select');
  
  inputs.forEach(input => {
    input.addEventListener('blur', () => validateField(input));
    input.addEventListener('input', () => {
      if (input.classList.contains('error')) {
        validateField(input);
      }
    });
  });
}

function validateField(field) {
  const value = field.value.trim();
  let isValid = true;
  let errorMessage = '';
  
  // Requerido
  if (field.hasAttribute('required') && !value) {
    isValid = false;
    errorMessage = 'Este campo es obligatorio';
  }
  
  // Email
  if (field.type === 'email' && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      isValid = false;
      errorMessage = 'Email inválido';
    }
  }
  
  // Teléfono argentino
  if (field.name === 'telefono' && value) {
    const phoneRegex = /^[\d\s\-\+\(\)]{8,}$/;
    if (!phoneRegex.test(value)) {
      isValid = false;
      errorMessage = 'Teléfono inválido';
    }
  }
  
  // Actualizar UI
  if (isValid) {
    field.classList.remove('error');
    field.classList.add('valid');
    field.setAttribute('aria-invalid', 'false');
    removeFieldError(field);
  } else {
    field.classList.add('error');
    field.classList.remove('valid');
    field.setAttribute('aria-invalid', 'true');
    showFieldError(field, errorMessage);
  }
  
  return isValid;
}

function showFieldError(field, message) {
  removeFieldError(field);
  
  const error = document.createElement('span');
  error.className = 'field-error';
  error.textContent = message;
  error.setAttribute('role', 'alert');
  
  field.parentElement.appendChild(error);
}

function removeFieldError(field) {
  const error = field.parentElement.querySelector('.field-error');
  if (error) error.remove();
}

// === INICIALIZACIÓN ===
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar loading overlay
  loadingOverlay.init();
  
  // Animaciones en scroll
  animateOnScroll();
  
  // Lazy loading de imágenes
  lazyLoadImages();
  
  // Ripple effect en botones
  const buttons = document.querySelectorAll('.btn-primario, .btn-secundario, .btn-role');
  buttons.forEach(btn => {
    btn.addEventListener('click', createRipple);
  });
  
  // Mejorar accesibilidad de enlaces externos
  const externalLinks = document.querySelectorAll('a[href^="http"]');
  externalLinks.forEach(link => {
    if (!link.hostname.includes(window.location.hostname)) {
      link.setAttribute('rel', 'noopener noreferrer');
      link.setAttribute('target', '_blank');
    }
  });
  
  console.log('✨ UI Improvements cargadas correctamente');
});

// Exportar funciones globales
window.loadingOverlay = loadingOverlay;
window.showSkeletons = showSkeletons;
window.hideSkeletons = hideSkeletons;
window.showToast = showToast;
window.smoothScrollTo = smoothScrollTo;
window.trapFocus = trapFocus;
window.setupRealtimeValidation = setupRealtimeValidation;
