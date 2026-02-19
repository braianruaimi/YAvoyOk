// ===========================================
// 2FA/TOTP AUTHENTICATION - YAVOY v3.1 ENTERPRISE
// Script de integración para dashboard-ceo.html
// ===========================================

class YAvoy2FA {
    constructor() {
        this.isEnabled = false;
        this.userId = null;
        this.secret = null;
        this.qrCodeData = null;
        this.debug = true;

        this.init();
    }

    // ===========================================
    // INICIALIZACIÓN
    // ===========================================

    init() {
        this.log('🔐 Inicializando sistema 2FA YAvoy...');
        this.createModal();
        this.bindEvents();
        this.log('✅ Sistema 2FA inicializado');
    }

    // ===========================================
    // CONFIGURACIÓN 2FA
    // ===========================================

    async setup2FA(userId, userEmail) {
        try {
            this.userId = userId;
            this.log(`🔐 Configurando 2FA para ${userEmail} (${userId})`);

            // Generar secreto en el servidor
            const setupData = await this.generateSecret(userId, userEmail);
            
            this.secret = setupData.secret;
            this.qrCodeData = setupData.qrCodeData;

            // Generar código QR
            const qrImageData = await this.generateQRCode(setupData.qrCodeData);

            // Mostrar modal de configuración
            this.showSetupModal(qrImageData, setupData.secret);

        } catch (error) {
            this.log('❌ Error configurando 2FA:', error);
            this.showError(`Error configurando 2FA: ${error.message}`);
            throw error;
        }
    }

    async generateSecret(userId, userEmail) {
        const response = await fetch('/api/security/2fa/setup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: userId,
                userEmail: userEmail
            })
        });

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Error generando secreto 2FA');
        }

        return data;
    }

    async generateQRCode(otpauthUrl) {
        const response = await fetch('/api/security/2fa/qrcode', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                otpauthUrl: otpauthUrl
            })
        });

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Error generando código QR');
        }

        return data.qrCodeImage;
    }

    // ===========================================
    // VERIFICACIÓN 2FA
    // ===========================================

    async verify2FA(userId, token, isBackupCode = false) {
        try {
            this.log(`🔐 Verificando código 2FA para ${userId}`);

            const response = await fetch('/api/security/2fa/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: userId,
                    token: token.toString(),
                    isBackupCode: isBackupCode
                })
            });

            const data = await response.json();
            
            if (data.success && data.verified) {
                this.log('✅ Código 2FA verificado exitosamente');
                this.showSuccess(`Código ${data.method === 'backup' ? 'de respaldo' : 'TOTP'} verificado`);
                return { success: true, method: data.method };
            } else {
                this.log('❌ Código 2FA inválido');
                this.showError('Código 2FA inválido');
                return { success: false, error: 'Código inválido' };
            }

        } catch (error) {
            this.log('❌ Error verificando 2FA:', error);
            this.showError(`Error verificando 2FA: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    async enable2FA(userId, token) {
        try {
            const response = await fetch('/api/security/2fa/enable', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: userId,
                    token: token.toString()
                })
            });

            const data = await response.json();
            
            if (data.success && data.enabled) {
                this.isEnabled = true;
                this.save2FAStatus(userId, true);
                this.log('✅ 2FA habilitado exitosamente');
                this.showSuccess('¡2FA habilitado exitosamente!');
                this.hideSetupModal();
                this.updateUI();
                return true;
            } else {
                this.showError('Token inválido. Verifica el código de tu authenticator');
                return false;
            }

        } catch (error) {
            this.log('❌ Error habilitando 2FA:', error);
            this.showError(`Error habilitando 2FA: ${error.message}`);
            return false;
        }
    }

    async disable2FA(userId, token) {
        try {
            const response = await fetch('/api/security/2fa/disable', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: userId,
                    token: token.toString()
                })
            });

            const data = await response.json();
            
            if (data.success && data.disabled) {
                this.isEnabled = false;
                this.save2FAStatus(userId, false);
                this.log('✅ 2FA deshabilitado');
                this.showSuccess('2FA deshabilitado exitosamente');
                this.updateUI();
                return true;
            } else {
                this.showError('Token inválido');
                return false;
            }

        } catch (error) {
            this.log('❌ Error deshabilitando 2FA:', error);
            this.showError(`Error deshabilitando 2FA: ${error.message}`);
            return false;
        }
    }

    async check2FAStatus(userId) {
        try {
            const response = await fetch(`/api/security/2fa/status/${userId}`);
            const data = await response.json();
            
            if (data.success) {
                this.isEnabled = data.enabled;
                this.save2FAStatus(userId, data.enabled);
                return data.enabled;
            }
            
            return false;
        } catch (error) {
            this.log('❌ Error verificando estado 2FA:', error);
            return this.getLocal2FAStatus(userId);
        }
    }

    // ===========================================
    // GESTIÓN DE ESTADO LOCAL
    // ===========================================

    save2FAStatus(userId, isEnabled) {
        localStorage.setItem(`yavoy_2fa_${userId}`, isEnabled.toString());
    }

    getLocal2FAStatus(userId) {
        return localStorage.getItem(`yavoy_2fa_${userId}`) === 'true';
    }

    // ===========================================
    // INTERFAZ DE USUARIO
    // ===========================================

    createModal() {
        if (document.getElementById('modal2FA')) {
            return; // Modal ya existe
        }

        const modal = document.createElement('div');
        modal.id = 'modal2FA';
        modal.innerHTML = `
            <div class="modal-2fa-overlay">
                <div class="modal-2fa-content">
                    <!-- Setup Modal -->
                    <div id="setup2FA" class="modal-2fa-step active">
                        <div class="modal-2fa-header">
                            <h2>🔐 Configurar Autenticación de Dos Factores</h2>
                            <button class="modal-2fa-close" onclick="YAvoy2FA.hideSetupModal()">&times;</button>
                        </div>
                        
                        <div class="modal-2fa-body">
                            <div class="setup-step">
                                <h3>📱 Paso 1: Escanear código QR</h3>
                                <p>Abre Google Authenticator, Microsoft Authenticator o cualquier app TOTP y escanea este código:</p>
                                <div class="qr-container">
                                    <img id="qrCodeImage" src="" alt="Código QR 2FA" style="max-width: 200px;" />
                                </div>
                            </div>
                            
                            <div class="setup-step">
                                <h3>🔑 Paso 2: Clave secreta (alternativa)</h3>
                                <p>Si no puedes escanear, ingresa manualmente esta clave:</p>
                                <div class="secret-key">
                                    <code id="secretKey"></code>
                                    <button onclick="YAvoy2FA.copySecret()" class="btn-copy">📋 Copiar</button>
                                </div>
                            </div>
                            
                            <div class="setup-step">
                                <h3>✅ Paso 3: Verificar configuración</h3>
                                <p>Ingresa el código de 6 dígitos que muestra tu authenticator:</p>
                                <div class="verification-form">
                                    <input type="text" id="verificationCode" placeholder="123456" maxlength="6" pattern="[0-9]{6}" />
                                    <button onclick="YAvoy2FA.completeSetup()" class="btn-verify">Verificar y Activar</button>
                                </div>
                            </div>
                            
                            <div class="backup-codes" id="backupCodes" style="display: none;">
                                <h3>🔒 Códigos de Respaldo</h3>
                                <p>Guarda estos códigos en un lugar seguro. Cada uno solo se puede usar una vez:</p>
                                <div class="codes-grid" id="codesGrid"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Verification Modal -->
                    <div id="verify2FA" class="modal-2fa-step">
                        <div class="modal-2fa-header">
                            <h2>🔐 Verificación de Dos Factores</h2>
                        </div>
                        
                        <div class="modal-2fa-body">
                            <div class="verification-prompt">
                                <p>Ingresa el código de 6 dígitos de tu authenticator:</p>
                                <div class="verification-form">
                                    <input type="text" id="login2FACode" placeholder="123456" maxlength="6" pattern="[0-9]{6}" />
                                    <button onclick="YAvoy2FA.verifyLogin()" class="btn-verify">Verificar</button>
                                </div>
                                
                                <div class="backup-option">
                                    <p><a href="#" onclick="YAvoy2FA.showBackupOption()">¿Perdiste tu dispositivo? Usa código de respaldo</a></p>
                                </div>
                                
                                <div id="backupCodeInput" style="display: none;">
                                    <input type="text" id="backupCode" placeholder="Código de respaldo" />
                                    <button onclick="YAvoy2FA.verifyBackupCode()" class="btn-verify">Verificar Respaldo</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        modal.innerHTML += `
            <style>
                .modal-2fa-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    backdrop-filter: blur(5px);
                }
                
                .modal-2fa-content {
                    background: #0f1724;
                    border-radius: 20px;
                    max-width: 500px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                    border: 1px solid rgba(6, 182, 212, 0.3);
                    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
                }
                
                .modal-2fa-header {
                    padding: 25px 30px 15px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .modal-2fa-header h2 {
                    color: #06b6d4;
                    margin: 0;
                    font-size: 1.5rem;
                }
                
                .modal-2fa-close {
                    background: none;
                    border: none;
                    color: #94a3b8;
                    font-size: 2rem;
                    cursor: pointer;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .modal-2fa-body {
                    padding: 25px 30px 30px;
                    color: #ffffff;
                }
                
                .modal-2fa-step {
                    display: none;
                }
                
                .modal-2fa-step.active {
                    display: block;
                }
                
                .setup-step {
                    margin-bottom: 25px;
                    padding-bottom: 20px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }
                
                .setup-step:last-child {
                    border-bottom: none;
                }
                
                .setup-step h3 {
                    color: #fbbf24;
                    margin-bottom: 10px;
                    font-size: 1.2rem;
                }
                
                .setup-step p {
                    color: #94a3b8;
                    margin-bottom: 15px;
                    line-height: 1.6;
                }
                
                .qr-container {
                    text-align: center;
                    padding: 20px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                    margin: 15px 0;
                }
                
                .secret-key {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                    background: rgba(255, 255, 255, 0.05);
                    padding: 15px;
                    border-radius: 10px;
                    margin: 10px 0;
                }
                
                .secret-key code {
                    background: rgba(6, 182, 212, 0.1);
                    color: #06b6d4;
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-family: 'Courier New', monospace;
                    font-size: 0.9rem;
                    flex: 1;
                    word-break: break-all;
                }
                
                .btn-copy {
                    background: #06b6d4;
                    color: white;
                    border: none;
                    padding: 8px 15px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    transition: all 0.3s;
                }
                
                .btn-copy:hover {
                    background: #0891b2;
                    transform: scale(1.05);
                }
                
                .verification-form {
                    display: flex;
                    gap: 15px;
                    align-items: center;
                    margin: 15px 0;
                }
                
                .verification-form input {
                    flex: 1;
                    padding: 15px;
                    border: 2px solid rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    background: rgba(255, 255, 255, 0.05);
                    color: #ffffff;
                    font-size: 1.2rem;
                    text-align: center;
                    font-family: 'Courier New', monospace;
                }
                
                .verification-form input:focus {
                    outline: none;
                    border-color: #06b6d4;
                    box-shadow: 0 0 20px rgba(6, 182, 212, 0.3);
                }
                
                .btn-verify {
                    background: linear-gradient(135deg, #10b981, #059669);
                    color: white;
                    border: none;
                    padding: 15px 25px;
                    border-radius: 10px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.3s;
                }
                
                .btn-verify:hover {
                    transform: scale(1.05);
                    filter: brightness(1.1);
                }
                
                .backup-codes {
                    margin-top: 25px;
                    padding-top: 20px;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .codes-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 10px;
                    margin-top: 15px;
                }
                
                .backup-code {
                    background: rgba(251, 191, 36, 0.1);
                    color: #fbbf24;
                    padding: 10px;
                    border-radius: 6px;
                    text-align: center;
                    font-family: 'Courier New', monospace;
                    font-weight: 600;
                }
                
                .verification-prompt {
                    text-align: center;
                }
                
                .backup-option {
                    margin-top: 20px;
                    padding-top: 15px;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .backup-option a {
                    color: #06b6d4;
                    text-decoration: none;
                    font-size: 0.9rem;
                }
                
                .backup-option a:hover {
                    text-decoration: underline;
                }
            </style>
        `;

        document.body.appendChild(modal);
    }

    showSetupModal(qrImageData, secret) {
        const modal = document.getElementById('modal2FA');
        const qrImage = document.getElementById('qrCodeImage');
        const secretKey = document.getElementById('secretKey');
        
        qrImage.src = qrImageData;
        secretKey.textContent = secret;
        
        document.getElementById('setup2FA').classList.add('active');
        document.getElementById('verify2FA').classList.remove('active');
        
        modal.style.display = 'block';
        
        // Focus en el input de verificación
        setTimeout(() => {
            document.getElementById('verificationCode').focus();
        }, 100);
    }

    hideSetupModal() {
        const modal = document.getElementById('modal2FA');
        modal.style.display = 'none';
    }

    showVerificationModal() {
        const modal = document.getElementById('modal2FA');
        
        document.getElementById('setup2FA').classList.remove('active');
        document.getElementById('verify2FA').classList.add('active');
        
        modal.style.display = 'block';
        
        // Focus en el input de login
        setTimeout(() => {
            document.getElementById('login2FACode').focus();
        }, 100);
    }

    updateUI() {
        const btn2FA = document.getElementById('btn2FA');
        const status2FA = document.getElementById('status2FA');
        
        if (btn2FA) {
            btn2FA.innerHTML = this.isEnabled ? 
                '🔐 Configurar 2FA' : 
                '🔓 Desactivar 2FA';
        }
        
        if (status2FA) {
            status2FA.innerHTML = this.isEnabled ? 
                '✅ 2FA Habilitado' : 
                '⚠️ 2FA No configurado';
            status2FA.className = this.isEnabled ? 
                'security-status enabled' : 
                'security-status disabled';
        }
    }

    // ===========================================
    // EVENTOS Y UTILIDADES
    // ===========================================

    bindEvents() {
        // Enter en inputs de verificación
        document.addEventListener('keypress', (e) => {
            if (e.target.id === 'verificationCode' && e.key === 'Enter') {
                this.completeSetup();
            }
            if (e.target.id === 'login2FACode' && e.key === 'Enter') {
                this.verifyLogin();
            }
            if (e.target.id === 'backupCode' && e.key === 'Enter') {
                this.verifyBackupCode();
            }
        });

        // Auto-format códigos 2FA
        document.addEventListener('input', (e) => {
            if (e.target.matches('#verificationCode, #login2FACode')) {
                e.target.value = e.target.value.replace(/\D/g, '');
            }
        });
    }

    copySecret() {
        const secretElement = document.getElementById('secretKey');
        const secret = secretElement.textContent;
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(secret).then(() => {
                this.showSuccess('Clave secreta copiada al portapapeles');
            });
        } else {
            // Fallback para navegadores sin Clipboard API
            const textArea = document.createElement('textarea');
            textArea.value = secret;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showSuccess('Clave secreta copiada al portapapeles');
        }
    }

    showBackupOption() {
        document.getElementById('backupCodeInput').style.display = 'block';
        document.getElementById('backupCode').focus();
    }

    // ===========================================
    // MÉTODOS PÚBLICOS PARA UI
    // ===========================================

    async completeSetup() {
        const code = document.getElementById('verificationCode').value.trim();
        
        if (code.length !== 6) {
            this.showError('El código debe tener 6 dígitos');
            return;
        }
        
        const success = await this.enable2FA(this.userId, code);
        if (success) {
            // Aquí mostrarías los códigos de respaldo si el servidor los proporciona
            // this.showBackupCodes(backupCodes);
        }
    }

    async verifyLogin() {
        const code = document.getElementById('login2FACode').value.trim();
        
        if (code.length !== 6) {
            this.showError('El código debe tener 6 dígitos');
            return;
        }
        
        const result = await this.verify2FA(this.userId, code);
        if (result.success) {
            this.hideSetupModal();
            // Continuar con el login
            if (window.completeCEOLogin) {
                window.completeCEOLogin();
            }
        }
    }

    async verifyBackupCode() {
        const code = document.getElementById('backupCode').value.trim();
        
        if (!code) {
            this.showError('Ingresa un código de respaldo');
            return;
        }
        
        const result = await this.verify2FA(this.userId, code, true);
        if (result.success) {
            this.hideSetupModal();
            if (window.completeCEOLogin) {
                window.completeCEOLogin();
            }
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
        
        const notification = document.createElement('div');
        notification.className = `notification-2fa ${type}`;
        notification.innerHTML = `
            <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
            <span>${message}</span>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#06b6d4'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            z-index: 10001;
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 600;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    log(message, ...args) {
        if (this.debug) {
            console.log(`[YAvoy 2FA] ${message}`, ...args);
        }
    }

    // ===========================================
    // API PÚBLICA
    // ===========================================

    async login(userId) {
        this.userId = userId;
        const enabled = await this.check2FAStatus(userId);
        
        if (enabled) {
            this.showVerificationModal();
            return { success: false, requires2FA: true };
        }
        
        return { success: true, requires2FA: false };
    }

    async setup(userId, userEmail) {
        try {
            await this.setup2FA(userId, userEmail);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    is2FAEnabled() {
        return this.isEnabled;
    }

    async checkStatus(userId) {
        return await this.check2FAStatus(userId);
    }
}

// ===========================================
// INSTANCIA GLOBAL
// ===========================================

window.YAvoy2FA = new YAvoy2FA();

// ===========================================
// EVENTOS
// ===========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🔐 YAvoy 2FA cargado y listo');
    
    window.dispatchEvent(new CustomEvent('yavoy-2fa-ready', {
        detail: { twoFactor: window.YAvoy2FA }
    }));
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = YAvoy2FA;
}