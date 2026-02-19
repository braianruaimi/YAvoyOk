// ===========================================
// WEBAUTHN BIOMETRIC AUTH - YAVOY v3.1 ENTERPRISE
// Script de integración para panel-repartidor.html
// ===========================================

class YAvoyBiometricAuth {
    constructor() {
        this.isSupported = false;
        this.isRegistered = false;
        this.userId = null;
        this.userName = null;
        this.debug = true; // Cambiar a false en producción

        this.init();
    }

    // ===========================================
    // INICIALIZACIÓN
    // ===========================================

    async init() {
        this.log('🔐 Inicializando autenticación biométrica YAvoy...');
        
        // Verificar soporte del navegador
        this.isSupported = await this.checkSupport();
        
        if (!this.isSupported) {
            this.log('❌ WebAuthn no soportado en este navegador/dispositivo');
            return;
        }

        // Verificar disponibilidad del servidor
        await this.checkServerAvailability();
        
        this.log('✅ Sistema biométrico inicializado correctamente');
        this.updateUI();
    }

    // ===========================================
    // VERIFICACIONES DE SOPORTE
    // ===========================================

    async checkSupport() {
        // Verificar APIs necesarias
        if (!window.PublicKeyCredential || 
            !navigator.credentials || 
            !navigator.credentials.create ||
            !navigator.credentials.get) {
            this.log('❌ APIs de WebAuthn no disponibles');
            return false;
        }

        // Verificar disponibilidad de autenticadores
        try {
            const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            this.log(`🔍 Autenticador de plataforma disponible: ${available}`);
            return available;
        } catch (error) {
            this.log('❌ Error verificando autenticador:', error);
            return false;
        }
    }

    async checkServerAvailability() {
        try {
            const response = await fetch('/api/security/webauthn/available', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (data.success && data.available) {
                this.log('✅ Servidor WebAuthn disponible');
                return true;
            } else {
                this.log('⚠️ Servidor WebAuthn no disponible:', data.reason);
                this.showError('Biometría requiere conexión HTTPS');
                return false;
            }
        } catch (error) {
            this.log('❌ Error verificando servidor:', error);
            this.showError('Error de conexión con el servidor');
            return false;
        }
    }

    // ===========================================
    // REGISTRO BIOMÉTRICO
    // ===========================================

    async registerBiometric(userId, userName) {
        if (!this.isSupported) {
            throw new Error('WebAuthn no soportado');
        }

        this.userId = userId;
        this.userName = userName;

        try {
            this.log(`🔐 Iniciando registro biométrico para ${userName} (${userId})`);

            // 1. Obtener opciones de registro del servidor
            const options = await this.getRegistrationOptions(userId, userName);
            this.log('📝 Opciones de registro obtenidas:', options);

            // 2. Crear credential con WebAuthn
            const credential = await this.createCredential(options);
            this.log('🔑 Credential creada:', credential);

            // 3. Verificar en el servidor
            const verification = await this.verifyRegistration(userId, credential);
            
            if (verification.verified) {
                this.isRegistered = true;
                this.saveRegistrationStatus(userId, true);
                this.log('✅ Registro biométrico completado exitosamente');
                this.showSuccess('¡Biometría configurada! Ya puedes usar tu huella/Face ID');
                this.updateUI();
                return true;
            } else {
                throw new Error('Verificación del servidor falló');
            }

        } catch (error) {
            this.log('❌ Error en registro biométrico:', error);
            this.showError(`Error configurando biometría: ${error.message}`);
            throw error;
        }
    }

    async getRegistrationOptions(userId, userName) {
        const response = await fetch('/api/security/webauthn/register/begin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: userId,
                userName: userName
            })
        });

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Error obteniendo opciones de registro');
        }

        return data.options;
    }

    async createCredential(options) {
        // Convertir strings base64url a Uint8Array
        const challengeBuffer = this.base64urlToBuffer(options.challenge);
        const userIdBuffer = this.base64urlToBuffer(options.user.id);

        const credentialCreationOptions = {
            publicKey: {
                ...options,
                challenge: challengeBuffer,
                user: {
                    ...options.user,
                    id: userIdBuffer
                }
            }
        };

        this.log('🚀 Iniciando creación de credential...');
        const credential = await navigator.credentials.create(credentialCreationOptions);
        
        if (!credential) {
            throw new Error('No se pudo crear la credential');
        }

        // Convertir a formato serializable
        return {
            id: credential.id,
            rawId: this.bufferToBase64url(credential.rawId),
            response: {
                clientDataJSON: this.bufferToBase64url(credential.response.clientDataJSON),
                attestationObject: this.bufferToBase64url(credential.response.attestationObject)
            },
            type: credential.type
        };
    }

    async verifyRegistration(userId, credential) {
        const response = await fetch('/api/security/webauthn/register/complete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: userId,
                credential: credential
            })
        });

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Error en verificación');
        }

        return data;
    }

    // ===========================================
    // AUTENTICACIÓN BIOMÉTRICA
    // ===========================================

    async authenticateBiometric(userId) {
        if (!this.isSupported) {
            throw new Error('WebAuthn no soportado');
        }

        if (!await this.checkRegistrationStatus(userId)) {
            throw new Error('No hay biometría registrada para este usuario');
        }

        try {
            this.log(`🔐 Iniciando autenticación biométrica para ${userId}`);

            // 1. Obtener opciones de autenticación
            const options = await this.getAuthenticationOptions(userId);
            this.log('📝 Opciones de autenticación obtenidas:', options);

            // 2. Obtener assertion del autenticador
            const assertion = await this.getAssertion(options);
            this.log('🔑 Assertion obtenida:', assertion);

            // 3. Verificar en el servidor
            const verification = await this.verifyAuthentication(userId, assertion);
            
            if (verification.verified) {
                this.log('✅ Autenticación biométrica exitosa');
                this.showSuccess('¡Autenticación biométrica exitosa!');
                return {
                    success: true,
                    sessionId: verification.sessionId,
                    userId: userId
                };
            } else {
                throw new Error('Verificación biométrica falló');
            }

        } catch (error) {
            this.log('❌ Error en autenticación biométrica:', error);
            
            if (error.name === 'NotAllowedError') {
                this.showError('Autenticación cancelada o falló');
            } else if (error.name === 'InvalidStateError') {
                this.showError('El autenticador ya está en uso');
            } else {
                this.showError(`Error de autenticación: ${error.message}`);
            }
            
            throw error;
        }
    }

    async getAuthenticationOptions(userId) {
        const response = await fetch('/api/security/webauthn/authenticate/begin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: userId
            })
        });

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Error obteniendo opciones de autenticación');
        }

        return data.options;
    }

    async getAssertion(options) {
        // Convertir strings a buffers
        const challengeBuffer = this.base64urlToBuffer(options.challenge);
        
        const credentialRequestOptions = {
            publicKey: {
                ...options,
                challenge: challengeBuffer,
                allowCredentials: options.allowCredentials?.map(cred => ({
                    ...cred,
                    id: this.base64urlToBuffer(cred.id)
                }))
            }
        };

        this.log('🚀 Solicitando assertion...');
        
        const assertion = await navigator.credentials.get(credentialRequestOptions);
        
        if (!assertion) {
            throw new Error('No se pudo obtener la assertion');
        }

        // Convertir a formato serializable
        return {
            id: assertion.id,
            rawId: this.bufferToBase64url(assertion.rawId),
            response: {
                authenticatorData: this.bufferToBase64url(assertion.response.authenticatorData),
                clientDataJSON: this.bufferToBase64url(assertion.response.clientDataJSON),
                signature: this.bufferToBase64url(assertion.response.signature),
                userHandle: assertion.response.userHandle ? 
                           this.bufferToBase64url(assertion.response.userHandle) : null
            },
            type: assertion.type
        };
    }

    async verifyAuthentication(userId, assertion) {
        const response = await fetch('/api/security/webauthn/authenticate/complete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: userId,
                assertion: assertion
            })
        });

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Error en verificación de autenticación');
        }

        return data;
    }

    // ===========================================
    // GESTIÓN DE ESTADO
    // ===========================================

    async checkRegistrationStatus(userId) {
        try {
            const response = await fetch(`/api/security/webauthn/status/${userId}`);
            const data = await response.json();
            
            if (data.success) {
                this.isRegistered = data.registered;
                this.saveRegistrationStatus(userId, data.registered);
                return data.registered;
            }
            
            return false;
        } catch (error) {
            this.log('❌ Error verificando estado de registro:', error);
            return this.getLocalRegistrationStatus(userId);
        }
    }

    saveRegistrationStatus(userId, isRegistered) {
        localStorage.setItem(`yavoy_biometric_${userId}`, isRegistered.toString());
    }

    getLocalRegistrationStatus(userId) {
        return localStorage.getItem(`yavoy_biometric_${userId}`) === 'true';
    }

    // ===========================================
    // UTILIDADES DE CONVERSIÓN
    // ===========================================

    base64urlToBuffer(base64url) {
        const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
        const padding = base64.length % 4;
        const padded = padding ? base64 + '='.repeat(4 - padding) : base64;
        
        const binary = atob(padded);
        const buffer = new Uint8Array(binary.length);
        
        for (let i = 0; i < binary.length; i++) {
            buffer[i] = binary.charCodeAt(i);
        }
        
        return buffer;
    }

    bufferToBase64url(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        
        return btoa(binary)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }

    // ===========================================
    // UI Y MENSAJES
    // ===========================================

    updateUI() {
        const biometricBtn = document.getElementById('btnBiometric');
        const biometricStatus = document.getElementById('biometricStatus');
        
        if (!this.isSupported) {
            if (biometricBtn) biometricBtn.style.display = 'none';
            if (biometricStatus) {
                biometricStatus.innerHTML = '❌ Biometría no disponible';
                biometricStatus.className = 'biometric-status unavailable';
            }
            return;
        }

        if (biometricBtn) {
            biometricBtn.style.display = 'block';
            biometricBtn.innerHTML = this.isRegistered ? 
                '🔐 Iniciar con Biometría' : 
                '📱 Configurar Biometría';
        }

        if (biometricStatus) {
            biometricStatus.innerHTML = this.isRegistered ? 
                '✅ Biometría configurada' : 
                '⚠️ Biometría no configurada';
            biometricStatus.className = this.isRegistered ? 
                'biometric-status registered' : 
                'biometric-status not-registered';
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        console.log(`🔔 ${type.toUpperCase()}: ${message}`);
        
        // Crear notificación visual si hay container
        const container = document.getElementById('notificationContainer') || document.body;
        const notification = document.createElement('div');
        
        notification.className = `biometric-notification ${type}`;
        notification.innerHTML = `
            <span class="notification-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
            <span class="notification-message">${message}</span>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#06b6d4'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 600;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        container.appendChild(notification);
        
        // Animar entrada
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remover después de 5 segundos
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    log(message, ...args) {
        if (this.debug) {
            console.log(`[YAvoy Biometric] ${message}`, ...args);
        }
    }

    // ===========================================
    // API PÚBLICA
    // ===========================================

    async login(userId, userName) {
        try {
            if (!await this.checkRegistrationStatus(userId)) {
                // Si no está registrado, ofrecer registro
                const shouldRegister = confirm(
                    '¿Deseas configurar tu huella dactilar o Face ID para futuros inicios de sesión?'
                );
                
                if (shouldRegister) {
                    await this.registerBiometric(userId, userName);
                }
                return { success: false, needsRegistration: !shouldRegister };
            }

            // Autenticar con biometría
            const result = await this.authenticateBiometric(userId);
            return result;
            
        } catch (error) {
            this.log('❌ Error en login biométrico:', error);
            return { success: false, error: error.message };
        }
    }

    async register(userId, userName) {
        try {
            await this.registerBiometric(userId, userName);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    isAvailable() {
        return this.isSupported;
    }

    isUserRegistered() {
        return this.isRegistered;
    }
}

// ===========================================
// INSTANCIA GLOBAL
// ===========================================

window.YAvoyBiometric = new YAvoyBiometricAuth();

// ===========================================
// EVENTOS PARA INTEGRACIÓN
// ===========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🔐 YAvoy Biometric Auth cargado y listo');
    
    // Dispatch evento personalizado
    window.dispatchEvent(new CustomEvent('yavoy-biometric-ready', {
        detail: { biometric: window.YAvoyBiometric }
    }));
});

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = YAvoyBiometricAuth;
}