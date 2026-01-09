/**
 * 📝 Validaciones Mejoradas - YAvoy
 * Validación de formularios con mensajes claros en español
 */

// === EXPRESIONES REGULARES ===
const REGEX = {
  // Email estándar
  email: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  
  // Teléfono argentino (flexible)
  // Acepta: +54, 011, (011), 221 504 7962, 2215047962, etc.
  telefono: /^(\+?54\s?)?(\(?\d{2,4}\)?[\s-]?)?\d{6,8}$/,
  
  // DNI argentino (7-8 dígitos, opcionalmente con puntos)
  dni: /^(\d{1,2}\.?\d{3}\.?\d{3}|\d{7,8})$/,
  
  // Dominio de vehículo argentino
  // Formato antiguo: ABC 123
  // Formato Mercosur: AB 123 CD o AB123CD
  dominio: /^([A-Z]{3}\s?\d{3})|([A-Z]{2}\s?\d{3}\s?[A-Z]{2})$/i,
  
  // Número de motor/chasis (alfanumérico, 6-17 caracteres)
  motorChasis: /^[A-Z0-9]{6,17}$/i,
  
  // Código postal argentino (4 dígitos o letra+4 dígitos)
  codigoPostal: /^([A-Z]\d{4}|\d{4})$/i,
  
  // Solo letras y espacios
  soloLetras: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
  
  // Solo números
  soloNumeros: /^\d+$/,
  
  // Alfanumérico
  alfanumerico: /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/
};

// === MENSAJES DE ERROR ===
const MENSAJES_ERROR = {
  required: 'Este campo es obligatorio',
  email: 'Ingresa un email válido (ej: usuario@ejemplo.com)',
  telefono: 'Ingresa un teléfono válido (ej: 221 504 7962 o 2215047962)',
  dni: 'Ingresa un DNI válido (7-8 dígitos)',
  dominio: 'Ingresa una patente válida (ej: ABC 123 o AB 123 CD)',
  motorChasis: 'Ingresa un número válido (6-17 caracteres alfanuméricos)',
  codigoPostal: 'Ingresa un código postal válido (4 dígitos)',
  soloLetras: 'Solo se permiten letras',
  soloNumeros: 'Solo se permiten números',
  minLength: 'Debe tener al menos {min} caracteres',
  maxLength: 'No puede exceder {max} caracteres',
  min: 'El valor mínimo es {min}',
  max: 'El valor máximo es {max}'
};

// === VALIDADORES ===
const Validators = {
  /**
   * Valida campo requerido
   */
  required(value) {
    return value.trim().length > 0;
  },

  /**
   * Valida email
   */
  email(value) {
    if (!value) return true; // Solo valida si hay valor
    return REGEX.email.test(value.trim());
  },

  /**
   * Valida teléfono argentino
   */
  telefono(value) {
    if (!value) return true;
    const cleaned = value.replace(/\s/g, '');
    return REGEX.telefono.test(cleaned);
  },

  /**
   * Valida DNI argentino
   */
  dni(value) {
    if (!value) return true;
    const cleaned = value.replace(/\./g, '');
    return REGEX.dni.test(cleaned) && cleaned.length >= 7 && cleaned.length <= 8;
  },

  /**
   * Valida dominio de vehículo argentino
   */
  dominio(value) {
    if (!value) return true;
    const cleaned = value.toUpperCase().replace(/\s/g, '');
    return REGEX.dominio.test(cleaned);
  },

  /**
   * Valida número de motor/chasis
   */
  motorChasis(value) {
    if (!value) return true;
    const cleaned = value.replace(/\s/g, '');
    return REGEX.motorChasis.test(cleaned);
  },

  /**
   * Valida código postal argentino
   */
  codigoPostal(value) {
    if (!value) return true;
    return REGEX.codigoPostal.test(value.trim());
  },

  /**
   * Valida que solo contenga letras
   */
  soloLetras(value) {
    if (!value) return true;
    return REGEX.soloLetras.test(value);
  },

  /**
   * Valida que solo contenga números
   */
  soloNumeros(value) {
    if (!value) return true;
    return REGEX.soloNumeros.test(value);
  },

  /**
   * Valida longitud mínima
   */
  minLength(value, min) {
    if (!value) return true;
    return value.trim().length >= min;
  },

  /**
   * Valida longitud máxima
   */
  maxLength(value, max) {
    if (!value) return true;
    return value.trim().length <= max;
  },

  /**
   * Valida valor mínimo (números)
   */
  min(value, min) {
    if (!value) return true;
    return parseFloat(value) >= min;
  },

  /**
   * Valida valor máximo (números)
   */
  max(value, max) {
    if (!value) return true;
    return parseFloat(value) <= max;
  }
};

// === FUNCIÓN PRINCIPAL DE VALIDACIÓN ===
/**
 * Valida un campo con múltiples reglas
 * @param {HTMLElement} field - Campo a validar
 * @param {Object} rules - Reglas de validación
 * @returns {Object} - {isValid: boolean, errors: string[]}
 */
function validateField(field, rules = {}) {
  const value = field.value;
  const errors = [];

  // Detectar reglas desde atributos HTML5
  if (field.hasAttribute('required')) rules.required = true;
  if (field.type === 'email') rules.email = true;
  if (field.hasAttribute('minlength')) rules.minLength = parseInt(field.getAttribute('minlength'));
  if (field.hasAttribute('maxlength')) rules.maxLength = parseInt(field.getAttribute('maxlength'));
  if (field.hasAttribute('min')) rules.min = parseFloat(field.getAttribute('min'));
  if (field.hasAttribute('max')) rules.max = parseFloat(field.getAttribute('max'));
  
  // Detectar tipo por nombre de campo
  const fieldName = field.name.toLowerCase();
  if (fieldName.includes('telefono') || fieldName.includes('celular')) rules.telefono = true;
  if (fieldName.includes('dni')) rules.dni = true;
  if (fieldName.includes('dominio') || fieldName.includes('patente')) rules.dominio = true;
  if (fieldName.includes('motor') || fieldName.includes('chasis')) rules.motorChasis = true;

  // Validar cada regla
  for (const [rule, param] of Object.entries(rules)) {
    if (rule === 'required' && param) {
      if (!Validators.required(value)) {
        errors.push(MENSAJES_ERROR.required);
      }
    } else if (rule === 'email' && param) {
      if (!Validators.email(value)) {
        errors.push(MENSAJES_ERROR.email);
      }
    } else if (rule === 'telefono' && param) {
      if (!Validators.telefono(value)) {
        errors.push(MENSAJES_ERROR.telefono);
      }
    } else if (rule === 'dni' && param) {
      if (!Validators.dni(value)) {
        errors.push(MENSAJES_ERROR.dni);
      }
    } else if (rule === 'dominio' && param) {
      if (!Validators.dominio(value)) {
        errors.push(MENSAJES_ERROR.dominio);
      }
    } else if (rule === 'motorChasis' && param) {
      if (!Validators.motorChasis(value)) {
        errors.push(MENSAJES_ERROR.motorChasis);
      }
    } else if (rule === 'minLength') {
      if (!Validators.minLength(value, param)) {
        errors.push(MENSAJES_ERROR.minLength.replace('{min}', param));
      }
    } else if (rule === 'maxLength') {
      if (!Validators.maxLength(value, param)) {
        errors.push(MENSAJES_ERROR.maxLength.replace('{max}', param));
      }
    } else if (rule === 'min') {
      if (!Validators.min(value, param)) {
        errors.push(MENSAJES_ERROR.min.replace('{min}', param));
      }
    } else if (rule === 'max') {
      if (!Validators.max(value, param)) {
        errors.push(MENSAJES_ERROR.max.replace('{max}', param));
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

// === ACTUALIZAR UI CON RESULTADOS ===
/**
 * Muestra u oculta errores en el campo
 */
function updateFieldUI(field, validationResult) {
  const { isValid, errors } = validationResult;
  
  // Limpiar errores anteriores
  clearFieldErrors(field);
  
  if (isValid) {
    field.classList.remove('error', 'invalid');
    field.classList.add('valid');
    field.setAttribute('aria-invalid', 'false');
  } else {
    field.classList.remove('valid');
    field.classList.add('error', 'invalid');
    field.setAttribute('aria-invalid', 'true');
    
    // Mostrar primer error
    if (errors.length > 0) {
      showFieldError(field, errors[0]);
    }
  }
  
  return isValid;
}

/**
 * Muestra mensaje de error bajo el campo
 */
function showFieldError(field, message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'field-error';
  errorDiv.textContent = message;
  errorDiv.setAttribute('role', 'alert');
  errorDiv.setAttribute('aria-live', 'polite');
  
  const parent = field.closest('.formulario-grupo') || field.parentElement;
  parent.appendChild(errorDiv);
}

/**
 * Elimina mensajes de error del campo
 */
function clearFieldErrors(field) {
  const parent = field.closest('.formulario-grupo') || field.parentElement;
  const errors = parent.querySelectorAll('.field-error');
  errors.forEach(error => error.remove());
}

// === VALIDACIÓN DE FORMULARIO COMPLETO ===
/**
 * Valida todos los campos de un formulario
 */
function validateForm(formElement) {
  const fields = formElement.querySelectorAll('input, textarea, select');
  let isFormValid = true;
  let firstInvalidField = null;
  
  fields.forEach(field => {
    // Saltar campos disabled o hidden
    if (field.disabled || field.type === 'hidden') return;
    
    const result = validateField(field);
    const isValid = updateFieldUI(field, result);
    
    if (!isValid) {
      isFormValid = false;
      if (!firstInvalidField) {
        firstInvalidField = field;
      }
    }
  });
  
  // Enfocar primer campo inválido
  if (firstInvalidField) {
    firstInvalidField.focus();
    firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  
  return isFormValid;
}

// === CONFIGURAR VALIDACIÓN EN TIEMPO REAL ===
/**
 * Activa validación en tiempo real para un formulario
 */
function setupFormValidation(formElement) {
  const fields = formElement.querySelectorAll('input, textarea, select');
  
  fields.forEach(field => {
    // Validar al perder foco
    field.addEventListener('blur', () => {
      const result = validateField(field);
      updateFieldUI(field, result);
    });
    
    // Revalidar mientras escribe si ya hay error
    field.addEventListener('input', () => {
      if (field.classList.contains('error')) {
        const result = validateField(field);
        updateFieldUI(field, result);
      }
    });
  });
  
  // Validar al enviar
  formElement.addEventListener('submit', (e) => {
    if (!validateForm(formElement)) {
      e.preventDefault();
      
      if (window.showToast) {
        window.showToast('Por favor corrige los errores en el formulario', 'error');
      }
    }
  });
}

// === FORMATEO AUTOMÁTICO ===
/**
 * Formatea automáticamente campos mientras se escriben
 */
function setupAutoFormat(formElement) {
  const fields = formElement.querySelectorAll('input');
  
  fields.forEach(field => {
    const fieldName = field.name.toLowerCase();
    
    // Formatear DNI (agregar puntos)
    if (fieldName.includes('dni')) {
      field.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 8) value = value.slice(0, 8);
        
        if (value.length > 6) {
          value = value.slice(0, 2) + '.' + value.slice(2, 5) + '.' + value.slice(5);
        } else if (value.length > 3) {
          value = value.slice(0, 2) + '.' + value.slice(2);
        }
        
        e.target.value = value;
      });
    }
    
    // Formatear teléfono
    if (fieldName.includes('telefono') || fieldName.includes('celular')) {
      field.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 10) value = value.slice(0, 10);
        e.target.value = value;
      });
    }
    
    // Mayúsculas en dominio
    if (fieldName.includes('dominio') || fieldName.includes('patente')) {
      field.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
      });
    }
  });
}

// === INICIALIZACIÓN AUTOMÁTICA ===
document.addEventListener('DOMContentLoaded', () => {
  // Buscar todos los formularios con data-validate="true"
  const forms = document.querySelectorAll('form[data-validate="true"], form.validate');
  
  forms.forEach(form => {
    setupFormValidation(form);
    setupAutoFormat(form);
  });
  
  console.log('✅ Validaciones mejoradas cargadas');
});

// === EXPORTAR ===
window.validateField = validateField;
window.validateForm = validateForm;
window.setupFormValidation = setupFormValidation;
window.Validators = Validators;
