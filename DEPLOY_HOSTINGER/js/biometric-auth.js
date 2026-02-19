/**
 * YAvoy v3.1 Enterprise - Sistema de Autenticación Biométrica Elite
 * WebAuthn API con fallback inteligente a credenciales tradicionales
 * CTO: Implementación de seguridad biométrica de grado militar
 */

class YAvoyBiometricAuth {
    constructor() {
        this.isAvailable = false;
        this.isSupported = false;
        this.fallbackMode = false;
        this.authAttempts = 0;
        this.maxAttempts = 3;
        
        this.init();
    }

    /**
     * Inicializar sistema biométrico
     */
    async init() {
        console.log('🔐 Iniciando YAvoy Biometric Auth System v3.1');
        
        // Verificar soporte WebAuthn
        this.isSupported = await this.checkWebAuthnSupport();
        
        if (this.isSupported) {
            this.isAvailable = await this.checkBiometricAvailability();
            console.log(`✅ WebAuthn soportado: ${this.isAvailable ? 'Biométrica disponible' : 'Solo FIDO2'}`);
        } else {
            console.warn('⚠️ WebAuthn no soportado, usando fallback');
            this.fallbackMode = true;
        }

        this.setupUI();
    }

    /**
     * Verificar soporte WebAuthn en el navegador
     */
    async checkWebAuthnSupport() {
        if (!window.PublicKeyCredential) {
            return false;
        }

        try {
            const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            return available;
        } catch (error) {
            console.error('Error verificando WebAuthn:', error);
            return false;
        }
    }

    /**
     * Verificar disponibilidad de autenticación biométrica
     */
    async checkBiometricAvailability() {
        try {
            // Verificar si hay credenciales registradas
            const credentials = await navigator.credentials.get({
                publicKey: {
                    challenge: new Uint8Array(32),
                    timeout: 5000,
                    userVerification: 'preferred'
                }
            });
            
            return true;
        } catch (error) {
            // No hay credenciales registradas o no está disponible
            return false;
        }
    }

    /**
     * Configurar interfaz de usuario
     */
    setupUI() {
        const authContainer = document.querySelector('.auth-container, .login-container, .biometric-auth');
        
        if (!authContainer) {
            console.warn('⚠️ Container de autenticación no encontrado');
            return;
        }

        // Inyectar HTML del sistema biométrico
        this.injectBiometricUI(authContainer);
        
        // Configurar event listeners
        this.setupEventListeners();
    }

    /**
     * Inyectar UI del sistema biométrico
     */
    injectBiometricUI(container) {
        const biometricHTML = `
            <div class="yavoy-biometric-system" id="biometricSystem">
                <!-- Autenticación Biométrica Primary -->
                <div class="biometric-primary" id="biometricPrimary" ${!this.isAvailable ? 'style="display:none"' : ''}>
                    <div class="biometric-header">
                        <h3>🔐 Autenticación Biométrica</h3>
                        <p>YAvoy Enterprise Security</p>
                    </div>
                    
                    <div class="biometric-scanner">
                        <div class="scanner-animation" id="scannerAnimation">
                            <div class="fingerprint-icon">
                                <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 1C12 1 12 1 12 1C12 1 12 1 12 1Z" stroke="#06b6d4" stroke-width="2"/>
                                    <circle cx="12" cy="12" r="3" stroke="#06b6d4" stroke-width="2"/>
                                    <path d="M12 1C12 1 12 1 12 1C12 1 12 1 12 1Z" stroke="#fbbf24" stroke-width="2"/>
                                </svg>
                            </div>
                            <div class="scanner-pulse"></div>
                        </div>
                        
                        <p class="scanner-status" id="scannerStatus">Toca el sensor o coloca tu rostro frente a la cámara</p>
                    </div>
                    
                    <button class="biometric-btn primary" id="biometricLoginBtn" onclick="YAvoyBiometric.authenticate()">
                        <span class="btn-icon">👆</span>
                        <span class="btn-text">Autenticar con Biometría</span>
                    </button>
                    
                    <button class="fallback-btn" onclick="YAvoyBiometric.showFallback()" id="showFallbackBtn">
                        <span>🔑</span> Usar ID y Contraseña
                    </button>
                </div>

                <!-- Fallback: Credenciales Tradicionales -->
                <div class="biometric-fallback" id="biometricFallback" ${this.isAvailable ? 'style="display:none"' : ''}>
                    <div class="fallback-header">
                        <h3>🔑 Acceso Tradicional</h3>
                        <p>${this.isAvailable ? 'Modo de respaldo activado' : 'Autenticación estándar'}</p>
                    </div>
                    
                    <form class="fallback-form" id="fallbackForm">
                        <div class="input-group">
                            <label for="userId">ID de Usuario</label>
                            <input 
                                type="text" 
                                id="userId" 
                                name="userId" 
                                placeholder="Ingresa tu ID"
                                required
                                autocomplete="username"
                            >
                        </div>
                        
                        <div class="input-group">
                            <label for="password">Contraseña</label>
                            <input 
                                type="password" 
                                id="password" 
                                name="password" 
                                placeholder="Ingresa tu contraseña"
                                required
                                autocomplete="current-password"
                            >
                            <button type="button" class="toggle-password" onclick="YAvoyBiometric.togglePassword()">
                                👁️
                            </button>
                        </div>
                        
                        <button type="submit" class="biometric-btn secondary" id="fallbackLoginBtn">
                            <span class="btn-icon">🚀</span>
                            <span class="btn-text">Iniciar Sesión</span>
                        </button>
                    </form>
                    
                    ${this.isSupported ? `
                        <button class="back-to-biometric" onclick="YAvoyBiometric.showBiometric()" id="backToBiometricBtn">
                            <span>👆</span> Volver a Biometría
                        </button>
                    ` : ''}
                </div>

                <!-- Status y Alerts -->
                <div class="auth-alerts" id="authAlerts"></div>
            </div>
        `;

        // Agregar CSS específico si no existe
        if (!document.querySelector('#biometric-styles')) {
            this.injectBiometricCSS();
        }

        // Insertar HTML
        container.innerHTML = biometricHTML + container.innerHTML;
    }

    /**
     * Inyectar estilos CSS para el sistema biométrico
     */
    injectBiometricCSS() {
        const styles = `
            <style id="biometric-styles">
                .yavoy-biometric-system {
                    max-width: 400px;
                    margin: 2rem auto;
                    padding: 2rem;
                    background: rgba(15, 23, 36, 0.95);
                    backdrop-filter: blur(20px);
                    border-radius: 20px;
                    border: 1px solid rgba(6, 182, 212, 0.3);
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                }

                .biometric-header, .fallback-header {
                    text-align: center;
                    margin-bottom: 2rem;
                }

                .biometric-header h3, .fallback-header h3 {
                    color: #ffffff;
                    font-size: 1.4rem;
                    margin-bottom: 0.5rem;
                }

                .biometric-header p, .fallback-header p {
                    color: #94a3b8;
                    font-size: 0.9rem;
                }

                .biometric-scanner {
                    text-align: center;
                    margin: 2rem 0;
                }

                .scanner-animation {
                    position: relative;
                    display: inline-block;
                    margin-bottom: 1rem;
                }

                .fingerprint-icon {
                    position: relative;
                    z-index: 2;
                }

                .scanner-pulse {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 100px;
                    height: 100px;
                    border: 2px solid #06b6d4;
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                    z-index: 1;
                }

                @keyframes pulse {
                    0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
                }

                .scanner-status {
                    color: #94a3b8;
                    font-size: 0.9rem;
                    margin: 1rem 0;
                }

                .biometric-btn {
                    width: 100%;
                    padding: 1rem;
                    border: none;
                    border-radius: 12px;
                    font-size: 1.1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    margin-bottom: 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                }

                .biometric-btn.primary {
                    background: linear-gradient(135deg, #06b6d4 0%, #fbbf24 100%);
                    color: #ffffff;
                    box-shadow: 0 10px 20px rgba(6, 182, 212, 0.3);
                }

                .biometric-btn.primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 15px 30px rgba(6, 182, 212, 0.4);
                }

                .biometric-btn.secondary {
                    background: rgba(6, 182, 212, 0.2);
                    color: #06b6d4;
                    border: 1px solid #06b6d4;
                }

                .biometric-btn.secondary:hover {
                    background: rgba(6, 182, 212, 0.3);
                    transform: translateY(-1px);
                }

                .fallback-btn, .back-to-biometric {
                    background: transparent;
                    color: #94a3b8;
                    border: 1px solid rgba(148, 163, 184, 0.3);
                    padding: 0.75rem;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    width: 100%;
                    margin-top: 0.5rem;
                }

                .fallback-btn:hover, .back-to-biometric:hover {
                    color: #06b6d4;
                    border-color: #06b6d4;
                }

                .fallback-form {
                    margin: 1.5rem 0;
                }

                .input-group {
                    position: relative;
                    margin-bottom: 1.5rem;
                }

                .input-group label {
                    display: block;
                    color: #94a3b8;
                    font-size: 0.9rem;
                    margin-bottom: 0.5rem;
                }

                .input-group input {
                    width: 100%;
                    padding: 1rem;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 8px;
                    color: #ffffff;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                }

                .input-group input:focus {
                    outline: none;
                    border-color: #06b6d4;
                    box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
                }

                .toggle-password {
                    position: absolute;
                    right: 1rem;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    color: #94a3b8;
                    cursor: pointer;
                    font-size: 1rem;
                }

                .auth-alerts {
                    margin-top: 1rem;
                    min-height: 2rem;
                }

                .alert {
                    padding: 0.75rem;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    margin-bottom: 0.5rem;
                }

                .alert.success {
                    background: rgba(16, 185, 129, 0.2);
                    color: #10b981;
                    border: 1px solid rgba(16, 185, 129, 0.3);
                }

                .alert.error {
                    background: rgba(239, 68, 68, 0.2);
                    color: #ef4444;
                    border: 1px solid rgba(239, 68, 68, 0.3);
                }

                .alert.warning {
                    background: rgba(251, 191, 36, 0.2);
                    color: #fbbf24;
                    border: 1px solid rgba(251, 191, 36, 0.3);
                }

                /* Responsive */
                @media (max-width: 480px) {
                    .yavoy-biometric-system {
                        margin: 1rem;
                        padding: 1.5rem;
                    }
                }

                /* Animaciones de transición */
                .biometric-primary, .biometric-fallback {
                    transition: all 0.3s ease;
                }

                .biometric-primary.hiding, .biometric-fallback.hiding {
                    opacity: 0;
                    transform: translateY(-20px);
                }

                .biometric-primary.showing, .biometric-fallback.showing {
                    opacity: 1;
                    transform: translateY(0);
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Form de fallback
        const fallbackForm = document.getElementById('fallbackForm');
        if (fallbackForm) {
            fallbackForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFallbackLogin();
            });
        }

        // Auto-focus en inputs
        const userIdInput = document.getElementById('userId');
        if (userIdInput && !this.isAvailable) {
            userIdInput.focus();
        }
    }

    /**
     * Autenticación biométrica principal
     */
    async authenticate() {
        if (!this.isSupported) {
            this.showAlert('Autenticación biométrica no disponible', 'warning');
            this.showFallback();
            return;
        }

        this.updateStatus('Iniciando autenticación biométrica...', 'info');
        this.setButtonLoading('biometricLoginBtn', true);

        try {
            const credential = await this.performBiometricAuth();
            
            if (credential) {
                this.updateStatus('✅ Autenticación exitosa', 'success');
                await this.processBiometricSuccess(credential);
            } else {
                throw new Error('Credencial biométrica inválida');
            }

        } catch (error) {
            console.error('Error en autenticación biométrica:', error);
            this.handleBiometricError(error);
        } finally {
            this.setButtonLoading('biometricLoginBtn', false);
        }
    }

    /**
     * Realizar autenticación biométrica WebAuthn
     */
    async performBiometricAuth() {
        const publicKeyCredentialRequestOptions = {
            challenge: new TextEncoder().encode('yavoy-challenge-' + Date.now()),
            timeout: 60000,
            userVerification: 'required',
            authenticatorSelection: {
                authenticatorAttachment: 'platform',
                userVerification: 'required'
            }
        };

        const credential = await navigator.credentials.get({
            publicKey: publicKeyCredentialRequestOptions
        });

        return credential;
    }

    /**
     * Procesar autenticación biométrica exitosa
     */
    async processBiometricSuccess(credential) {
        // Simular validación con el servidor
        const authData = {
            credentialId: credential.id,
            authenticatorData: credential.response.authenticatorData,
            clientDataJSON: credential.response.clientDataJSON,
            signature: credential.response.signature,
            userHandle: credential.response.userHandle
        };

        // Aquí normalmente harías una petición al servidor
        // Por ahora, simularemos una respuesta exitosa
        const mockToken = this.generateMockJWT('ceo'); // Para demo
        
        this.handleAuthSuccess(mockToken, 'biometric');
    }

    /**
     * Manejar errores de autenticación biométrica
     */
    handleBiometricError(error) {
        this.authAttempts++;

        let message = 'Error en autenticación biométrica';
        
        if (error.name === 'NotAllowedError') {
            message = 'Autenticación cancelada o denegada';
        } else if (error.name === 'AbortError') {
            message = 'Tiempo de espera agotado';
        } else if (error.name === 'NotSupportedError') {
            message = 'Autenticación biométrica no soportada';
        }

        this.showAlert(message, 'error');

        if (this.authAttempts >= this.maxAttempts) {
            this.showAlert('Máximo de intentos alcanzado. Usando modo tradicional.', 'warning');
            this.showFallback();
        } else {
            this.updateStatus(`Intento ${this.authAttempts}/${this.maxAttempts}. Inténtalo de nuevo.`, 'warning');
        }
    }

    /**
     * Manejar login con fallback (credenciales tradicionales)
     */
    async handleFallbackLogin() {
        const userId = document.getElementById('userId').value.trim();
        const password = document.getElementById('password').value;

        if (!userId || !password) {
            this.showAlert('Por favor completa todos los campos', 'error');
            return;
        }

        this.setButtonLoading('fallbackLoginBtn', true);
        this.showAlert('Validando credenciales...', 'info');

        try {
            // Simular validación con servidor
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Validación mock (reemplazar con API real)
            if (await this.validateCredentials(userId, password)) {
                const userRole = this.determineUserRole(userId);
                const token = this.generateMockJWT(userRole);
                
                this.handleAuthSuccess(token, 'credential');
            } else {
                throw new Error('Credenciales inválidas');
            }

        } catch (error) {
            console.error('Error en fallback login:', error);
            this.showAlert('Credenciales incorrectas. Verifica tu ID y contraseña.', 'error');
        } finally {
            this.setButtonLoading('fallbackLoginBtn', false);
        }
    }

    /**
     * Validar credenciales (mock - reemplazar con API real)
     */
    async validateCredentials(userId, password) {
        // Mock validation - reemplazar con llamada real al servidor
        const mockUsers = {
            'admin001': { password: 'admin123', role: 'ceo' },
            'ceo001': { password: 'ceo123', role: 'ceo' },
            'comercio001': { password: 'comercio123', role: 'comercio' },
            'repartidor001': { password: 'repartidor123', role: 'repartidor' },
            'cliente001': { password: 'cliente123', role: 'cliente' }
        };

        const user = mockUsers[userId.toLowerCase()];
        return user && user.password === password;
    }

    /**
     * Determinar rol del usuario basado en ID
     */
    determineUserRole(userId) {
        const lowerUserId = userId.toLowerCase();
        
        if (lowerUserId.includes('admin') || lowerUserId.includes('ceo')) {
            return 'ceo';
        } else if (lowerUserId.includes('comercio')) {
            return 'comercio';
        } else if (lowerUserId.includes('repartidor')) {
            return 'repartidor';
        } else if (lowerUserId.includes('cliente')) {
            return 'cliente';
        }
        
        return 'cliente'; // Default
    }

    /**
     * Generar JWT mock (reemplazar con token real del servidor)
     */
    generateMockJWT(role) {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify({
            userId: Date.now().toString(),
            role: role,
            email: `user@yavoy.com`,
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 horas
            iat: Math.floor(Date.now() / 1000)
        }));
        const signature = btoa('mock-signature');
        
        return `${header}.${payload}.${signature}`;
    }

    /**
     * Manejar autenticación exitosa
     */
    handleAuthSuccess(token, method) {
        console.log(`✅ Autenticación exitosa via ${method}`);
        
        // Almacenar token
        sessionStorage.setItem('yavoy_token', token);
        
        // Disparar evento para el router
        window.dispatchEvent(new CustomEvent('yavoy:login', { 
            detail: { token, method } 
        }));
        
        this.showAlert('✅ Acceso autorizado. Redirigiendo...', 'success');
        
        // El router inteligente manejará la redirección
    }

    /**
     * Mostrar/Ocultar secciones
     */
    showBiometric() {
        this.switchSection('biometricFallback', 'biometricPrimary');
    }

    showFallback() {
        this.switchSection('biometricPrimary', 'biometricFallback');
        
        // Focus en el primer input
        setTimeout(() => {
            const userIdInput = document.getElementById('userId');
            if (userIdInput) userIdInput.focus();
        }, 300);
    }

    switchSection(hideId, showId) {
        const hideElement = document.getElementById(hideId);
        const showElement = document.getElementById(showId);

        if (hideElement && showElement) {
            hideElement.style.display = 'none';
            showElement.style.display = 'block';
        }
    }

    /**
     * Utilidades de UI
     */
    updateStatus(message, type = 'info') {
        const statusElement = document.getElementById('scannerStatus');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `scanner-status ${type}`;
        }
    }

    showAlert(message, type = 'info') {
        const alertsContainer = document.getElementById('authAlerts');
        if (!alertsContainer) return;

        const alert = document.createElement('div');
        alert.className = `alert ${type}`;
        alert.textContent = message;
        
        alertsContainer.innerHTML = '';
        alertsContainer.appendChild(alert);

        // Auto-hide después de 5 segundos
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }

    setButtonLoading(buttonId, loading) {
        const button = document.getElementById(buttonId);
        if (!button) return;

        if (loading) {
            button.disabled = true;
            button.innerHTML = `
                <div style="width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 8px;"></div>
                Autenticando...
            `;
        } else {
            button.disabled = false;
            // Restaurar texto original basado en el botón
            if (buttonId === 'biometricLoginBtn') {
                button.innerHTML = `<span class="btn-icon">👆</span><span class="btn-text">Autenticar con Biometría</span>`;
            } else if (buttonId === 'fallbackLoginBtn') {
                button.innerHTML = `<span class="btn-icon">🚀</span><span class="btn-text">Iniciar Sesión</span>`;
            }
        }
    }

    togglePassword() {
        const passwordInput = document.getElementById('password');
        const toggleBtn = document.querySelector('.toggle-password');
        
        if (passwordInput && toggleBtn) {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleBtn.textContent = '🙈';
            } else {
                passwordInput.type = 'password';
                toggleBtn.textContent = '👁️';
            }
        }
    }
}

// Inicializar sistema biométrico automáticamente
document.addEventListener('DOMContentLoaded', () => {
    window.YAvoyBiometric = new YAvoyBiometricAuth();
});

// Exponer funciones globalmente para uso desde HTML
window.YAvoyBiometric = window.YAvoyBiometric || {};

console.log('🔐 YAvoy Biometric Authentication System v3.1 cargado');