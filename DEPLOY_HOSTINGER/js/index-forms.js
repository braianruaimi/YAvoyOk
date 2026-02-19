/**
 * ==========================================
 * YAVOY v3.1 ENTERPRISE - SISTEMA DE FORMULARIOS
 * Gestión completa de formularios con validación
 * ==========================================
 */

class FormManager {
    constructor() {
        // Mapeo de formularios del sistema
        this.forms = {
            registroRepartidor: document.getElementById('formRegistrarRepartidorInicio'),
            registroComercio: document.getElementById('formRegistrarComercioInicio'),
            crearPedido: document.getElementById('formCrearPedido'),
        };

        // Configuración de validación
        this.validationRules = {
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            telefono: /^[+]?[\d\s\-()]+$/,
            dni: /^\d{7,10}$/,
        };

        this.init();
        console.log('✅ FormManager inicializado');
    }

    /**
     * Inicializar event listeners de formularios
     */
    init() {
        Object.entries(this.forms).forEach(([key, form]) => {
            if (!form) {
                console.warn(`Formulario "${key}" no encontrado`);
                return;
            }

            // Event listener para submit
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubmit(key, form);
            });

            // Validación en tiempo real
            this.setupRealtimeValidation(form);
        });
    }

    /**
     * Configurar validación en tiempo real
     * @param {HTMLFormElement} form - Formulario a configurar
     */
    setupRealtimeValidation(form) {
        const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');

        inputs.forEach(input => {
            // Validar al perder el foco
            input.addEventListener('blur', () => {
                this.validateField(input);
            });

            // Limpiar error al escribir
            input.addEventListener('input', () => {
                if (input.classList.contains('error-input')) {
                    this.clearFieldError(input);
                }
            });
        });
    }

    /**
     * Manejar envío de formulario
     * @param {string} formType - Tipo de formulario
     * @param {HTMLFormElement} form - Elemento del formulario
     */
    async handleSubmit(formType, form) {
        console.log(`Enviando formulario: ${formType}`);

        // Validar todos los campos
        if (!this.validateForm(form)) {
            this.showError(form, 'Por favor completa todos los campos correctamente');
            return;
        }

        // Obtener datos del formulario
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        // Agregar metadata
        data.timestamp = new Date().toISOString();
        data.formType = formType;

        try {
            this.showLoading(form);

            // Simular envío (reemplazar con llamada real a API)
            const response = await this.submitToAPI(formType, data);

            if (response.success) {
                this.handleSuccess(formType, response, form);
            } else {
                this.showError(form, response.message || 'Error al procesar la solicitud');
            }
        } catch (error) {
            console.error('Error en envío:', error);
            this.showError(form, 'Error de conexión. Intenta nuevamente.');
        } finally {
            this.hideLoading(form);
        }
    }

    /**
     * Enviar datos a la API
     * @param {string} formType - Tipo de formulario
     * @param {Object} data - Datos a enviar
     * @returns {Promise<Object>} - Respuesta de la API
     */
    async submitToAPI(formType, data) {
        // Mapeo de endpoints
        const endpoints = {
            registroRepartidor: '/api/repartidores/registro',
            registroComercio: '/api/comercios/registro',
            crearPedido: '/api/pedidos/crear',
        };

        const endpoint = endpoints[formType];

        if (!endpoint) {
            throw new Error(`Endpoint no definido para: ${formType}`);
        }

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            return await response.json();
        } catch (error) {
            // Modo demo: generar respuesta simulada
            console.warn('Modo demo: generando respuesta simulada');
            return this.generateMockResponse(formType, data);
        }
    }

    /**
     * Generar respuesta simulada (modo demo)
     * @param {string} formType - Tipo de formulario
     * @param {Object} data - Datos enviados
     * @returns {Object} - Respuesta simulada
     */
    generateMockResponse(formType, data) {
        const generateId = () => {
            const prefixes = {
                registroRepartidor: 'REP',
                registroComercio: 'COM',
                crearPedido: 'PED',
            };

            const prefix = prefixes[formType] || 'ID';
            const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');

            return `${prefix}-${random}`;
        };

        return {
            success: true,
            id: generateId(),
            message: 'Registro exitoso',
            data: data
        };
    }

    /**
     * Validar formulario completo
     * @param {HTMLFormElement} form - Formulario a validar
     * @returns {boolean} - True si es válido
     */
    validateForm(form) {
        const inputs = form.querySelectorAll('[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        return isValid;
    }

    /**
     * Validar un campo individual
     * @param {HTMLElement} input - Campo a validar
     * @returns {boolean} - True si es válido
     */
    validateField(input) {
        const value = input.value.trim();
        const fieldName = input.name || input.id;

        // Verificar si está vacío
        if (input.hasAttribute('required') && !value) {
            this.showFieldError(input, 'Este campo es requerido');
            return false;
        }

        // Validaciones específicas por tipo
        if (value) {
            // Email
            if (input.type === 'email' && !this.validationRules.email.test(value)) {
                this.showFieldError(input, 'Email inválido');
                return false;
            }

            // Teléfono
            if (fieldName.toLowerCase().includes('telefono') && !this.validationRules.telefono.test(value)) {
                this.showFieldError(input, 'Teléfono inválido');
                return false;
            }

            // DNI
            if (fieldName.toLowerCase().includes('dni') && !this.validationRules.dni.test(value)) {
                this.showFieldError(input, 'DNI inválido (7-10 dígitos)');
                return false;
            }

            // Longitud mínima
            const minLength = input.getAttribute('minlength');
            if (minLength && value.length < parseInt(minLength)) {
                this.showFieldError(input, `Mínimo ${minLength} caracteres`);
                return false;
            }
        }

        // Si llegó aquí, es válido
        this.clearFieldError(input);
        return true;
    }

    /**
     * Mostrar error en un campo
     * @param {HTMLElement} input - Campo con error
     * @param {string} message - Mensaje de error
     */
    showFieldError(input, message) {
        // Agregar clase de error al input
        input.classList.add('error-input');

        // Buscar o crear div de error
        let errorDiv = input.parentElement.querySelector('.error');

        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'error';
            input.parentElement.appendChild(errorDiv);
        }

        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    /**
     * Limpiar error de un campo
     * @param {HTMLElement} input - Campo a limpiar
     */
    clearFieldError(input) {
        input.classList.remove('error-input');

        const errorDiv = input.parentElement.querySelector('.error');
        if (errorDiv) {
            errorDiv.style.display = 'none';
            errorDiv.textContent = '';
        }
    }

    /**
     * Mostrar indicador de carga
     * @param {HTMLFormElement} form - Formulario
     */
    showLoading(form) {
        const btn = form.querySelector('button[type="submit"]');

        if (btn) {
            btn.disabled = true;
            btn.dataset.originalText = btn.textContent;
            btn.innerHTML = '<span class="spinner" style="display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite;"></span> Procesando...';
        }
    }

    /**
     * Ocultar indicador de carga
     * @param {HTMLFormElement} form - Formulario
     */
    hideLoading(form) {
        const btn = form.querySelector('button[type="submit"]');

        if (btn && btn.dataset.originalText) {
            btn.disabled = false;
            btn.textContent = btn.dataset.originalText;
            delete btn.dataset.originalText;
        }
    }

    /**
     * Mostrar mensaje de error general
     * @param {HTMLFormElement} form - Formulario
     * @param {string} message - Mensaje de error
     */
    showError(form, message) {
        // Buscar contenedor de error o crearlo
        let errorContainer = form.querySelector('.form-error-message');

        if (!errorContainer) {
            errorContainer = document.createElement('div');
            errorContainer.className = 'form-error-message';
            errorContainer.style.cssText = `
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid #ef4444;
        color: #ef4444;
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 16px;
        font-size: 0.9rem;
      `;

            form.insertBefore(errorContainer, form.firstChild);
        }

        errorContainer.textContent = '⚠️ ' + message;
        errorContainer.style.display = 'block';

        // Auto-ocultar después de 5 segundos
        setTimeout(() => {
            errorContainer.style.display = 'none';
        }, 5000);
    }

    /**
     * Manejar éxito según tipo de formulario
     * @param {string} formType - Tipo de formulario
     * @param {Object} response - Respuesta de la API
     * @param {HTMLFormElement} form - Formulario
     */
    handleSuccess(formType, response, form) {
        console.log(`✅ Formulario ${formType} enviado exitosamente`, response);

        // Limpiar formulario
        form.reset();

        // Acciones específicas según tipo
        switch (formType) {
            case 'registroRepartidor':
                if (window.mostrarModalVerificacion) {
                    window.mostrarModalVerificacion(response.id);
                }
                break;

            case 'registroComercio':
                if (window.mostrarModalVerificacionComercio) {
                    window.mostrarModalVerificacionComercio(response.id);
                }
                break;

            case 'crearPedido':
                if (window.mostrarModalVerificacionPedido) {
                    window.mostrarModalVerificacionPedido(response.id);
                }
                break;

            default:
                alert('¡Registro exitoso! ID: ' + response.id);
        }
    }

    /**
     * Resetear un formulario
     * @param {string} formType - Tipo de formulario
     */
    resetForm(formType) {
        const form = this.forms[formType];

        if (form) {
            form.reset();

            // Limpiar todos los errores
            form.querySelectorAll('.error-input').forEach(input => {
                this.clearFieldError(input);
            });

            // Limpiar mensaje de error general
            const errorContainer = form.querySelector('.form-error-message');
            if (errorContainer) {
                errorContainer.style.display = 'none';
            }
        }
    }
}

// Crear instancia global
const formManager = new FormManager();

// Exportar para uso en otros módulos
window.formManager = formManager;

// ==========================================
// FUNCIONES AUXILIARES GLOBALES
// ==========================================

/**
 * Validar imagen cargada
 * @param {HTMLInputElement} input - Input file
 * @param {string} previewId - ID del contenedor de vista previa
 */
window.validarImagen = (input, previewId) => {
    const archivo = input.files[0];
    const preview = document.getElementById(previewId);

    if (!archivo) {
        if (preview) preview.innerHTML = '';
        return;
    }

    // Validar tamaño (5MB máximo)
    const maxSize = 5 * 1024 * 1024;
    if (archivo.size > maxSize) {
        if (preview) {
            preview.innerHTML = '<p style="color: #ef4444; font-size: 13px;">❌ Archivo muy grande. Máximo 5MB</p>';
        }
        input.value = '';
        return;
    }

    // Validar tipo
    if (!archivo.type.match(/image\/(jpeg|jpg|png)/)) {
        if (preview) {
            preview.innerHTML = '<p style="color: #ef4444; font-size: 13px;">❌ Solo JPG o PNG</p>';
        }
        input.value = '';
        return;
    }

    // Mostrar previsualización
    if (preview) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML = `
        <div style="border: 2px solid var(--cyan); border-radius: 8px; padding: 10px; background: var(--bg-card);">
          <img src="${e.target.result}" style="max-width: 100%; max-height: 200px; border-radius: 6px; display: block; margin: 0 auto;">
          <p style="color: #10b981; font-size: 12px; margin-top: 8px; text-align: center;">✓ Imagen cargada (${(archivo.size / 1024).toFixed(1)} KB)</p>
        </div>
      `;
        };
        reader.readAsDataURL(archivo);
    }
};

/**
 * Mostrar/ocultar campos según tipo de vehículo
 * @param {string} tipoVehiculo - Tipo de vehículo seleccionado
 */
window.mostrarCamposVehiculo = (tipoVehiculo) => {
    const camposVehiculo = document.getElementById('camposVehiculo');
    const mensajeBicicleta = document.getElementById('mensajeBicicleta');
    const cedulaFrente = document.getElementById('repCedulaFrente');
    const cedulaDorso = document.getElementById('repCedulaDorso');

    if (tipoVehiculo === 'moto' || tipoVehiculo === 'auto') {
        if (camposVehiculo) camposVehiculo.style.display = 'block';
        if (mensajeBicicleta) mensajeBicicleta.style.display = 'none';
        if (cedulaFrente) cedulaFrente.required = true;
        if (cedulaDorso) cedulaDorso.required = true;
    } else if (tipoVehiculo === 'bicicleta' || tipoVehiculo === 'a-pie') {
        if (camposVehiculo) camposVehiculo.style.display = 'none';
        if (mensajeBicicleta) mensajeBicicleta.style.display = 'block';
        if (cedulaFrente) cedulaFrente.required = false;
        if (cedulaDorso) cedulaDorso.required = false;
    } else {
        if (camposVehiculo) camposVehiculo.style.display = 'none';
        if (mensajeBicicleta) mensajeBicicleta.style.display = 'none';
        if (cedulaFrente) cedulaFrente.required = false;
        if (cedulaDorso) cedulaDorso.required = false;
    }
};

/**
 * Mostrar modal de términos y condiciones
 */
window.mostrarTerminos = () => {
    const terminosHTML = `
    <div style="max-width: 900px; max-height: 80vh; overflow-y: auto; padding: 35px; background: var(--bg-card); border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
      <h2 style="color: var(--cyan); margin-bottom: 25px; font-size: 22px; border-bottom: 2px solid var(--cyan); padding-bottom: 10px;">
        📜 Términos y Condiciones de Uso - YAvoy
      </h2>
      
      <div style="color: var(--white); line-height: 1.8; font-size: 14px;">
        <p>Al utilizar YAvoy, aceptas los siguientes términos y condiciones...</p>
        <!-- Contenido completo de términos aquí -->
      </div>

      <button onclick="cerrarTerminos()" class="btn-primario" style="margin-top: 30px; width: 100%; padding: 15px; font-size: 16px;">
        He Leído y Comprendido - Cerrar
      </button>
    </div>
  `;

    const modalTerminos = document.createElement('div');
    modalTerminos.id = 'modalTerminos';
    modalTerminos.className = 'modal-overlay';
    modalTerminos.style.display = 'flex';
    modalTerminos.innerHTML = terminosHTML;
    document.body.appendChild(modalTerminos);
    document.body.style.overflow = 'hidden';
};

/**
 * Cerrar modal de términos
 */
window.cerrarTerminos = () => {
    const modal = document.getElementById('modalTerminos');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
};
