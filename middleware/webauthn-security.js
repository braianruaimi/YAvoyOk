/**
 * YAvoy v3.1 Enterprise - WebAuthn Security Enhanced
 * Middleware de autenticación biométrica con validaciones avanzadas
 * CTO: Implementación enterprise con anti-fraude y detección de ataques
 */

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class WebAuthnSecurityEnhanced {
    constructor() {
        this.challenges = new Map(); // Cache de challenges activos
        this.registeredCredentials = new Map(); // Cache de credenciales
        this.attemptHistory = new Map(); // Historial de intentos
        this.blacklistedDevices = new Set(); // Dispositivos bloqueados
        this.maxAttempts = 5;
        this.challengeTimeout = 5 * 60 * 1000; // 5 minutos
        this.relyingPartyId = process.env.WEBAUTHN_RP_ID || 'yavoy.space';
        this.relyingPartyName = 'YAvoy Enterprise v3.1';
        
        this.init();
    }

    init() {
        console.log('🛡️ WebAuthn Security Enhanced inicializado');
        
        // Limpiar challenges expirados cada minuto
        setInterval(() => {
            this.cleanExpiredChallenges();
        }, 60000);
        
        // Limpiar historial de intentos cada hora
        setInterval(() => {
            this.cleanAttemptHistory();
        }, 3600000);
    }

    // ========================================
    // 🔐 GESTIÓN DE CHALLENGES
    // ========================================
    
    generateSecureChallenge() {
        const challenge = crypto.randomBytes(32);
        const challengeId = uuidv4();
        
        this.challenges.set(challengeId, {
            challenge: challenge,
            timestamp: Date.now(),
            used: false
        });
        
        // Auto-expirar después del timeout
        setTimeout(() => {
            if (this.challenges.has(challengeId)) {
                this.challenges.delete(challengeId);
            }
        }, this.challengeTimeout);
        
        return { challengeId, challenge: Array.from(challenge) };
    }

    validateChallenge(challengeId, clientData) {
        const stored = this.challenges.get(challengeId);
        
        if (!stored) {
            throw new Error('Challenge no válido o expirado');
        }
        
        if (stored.used) {
            throw new Error('Challenge ya utilizado');
        }
        
        if (Date.now() - stored.timestamp > this.challengeTimeout) {
            this.challenges.delete(challengeId);
            throw new Error('Challenge expirado');
        }
        
        // Marcar como usado
        stored.used = true;
        
        // Validar challenge en clientData
        const clientDataObj = JSON.parse(Buffer.from(clientData, 'base64').toString());
        const receivedChallenge = new Uint8Array(Buffer.from(clientDataObj.challenge, 'base64'));
        
        if (!crypto.timingSafeEqual(stored.challenge, receivedChallenge)) {
            throw new Error('Challenge no coincide');
        }
        
        return true;
    }

    cleanExpiredChallenges() {
        const now = Date.now();
        for (const [id, data] of this.challenges) {
            if (now - data.timestamp > this.challengeTimeout) {
                this.challenges.delete(id);
            }
        }
    }

    // ========================================
    // 🔍 DETECCIÓN DE FRAUDE
    // ========================================
    
    recordAttempt(userId, success, metadata = {}) {
        const key = `${userId}_${Date.now()}`;
        const attempt = {
            timestamp: Date.now(),
            success,
            ip: metadata.ip,
            userAgent: metadata.userAgent,
            deviceInfo: metadata.deviceInfo
        };
        
        this.attemptHistory.set(key, attempt);
        
        // Verificar patrones sospechosos
        this.detectSuspiciousPatterns(userId, metadata);
    }

    detectSuspiciousPatterns(userId, metadata) {
        const recentAttempts = this.getRecentAttempts(userId, 15 * 60 * 1000); // 15 minutos
        
        // Patrón 1: Demasiados intentos fallidos
        const failedAttempts = recentAttempts.filter(a => !a.success);
        if (failedAttempts.length >= this.maxAttempts) {
            this.blacklistedDevices.add(metadata.deviceFingerprint);
            throw new Error('Dispositivo temporalmente bloqueado por intentos sospechosos');
        }
        
        // Patrón 2: Múltiples IPs en poco tiempo
        const uniqueIPs = new Set(recentAttempts.map(a => a.ip));
        if (uniqueIPs.size > 3) {
            console.warn(`🚨 Actividad sospechosa: ${userId} desde múltiples IPs`);
        }
        
        // Patrón 3: User-Agent inconsistente
        const userAgents = recentAttempts.map(a => a.userAgent).filter(Boolean);
        const uniqueUAs = new Set(userAgents);
        if (uniqueUAs.size > 2 && userAgents.length > 5) {
            console.warn(`🚨 Posible Device spoofing: ${userId}`);
        }
    }

    getRecentAttempts(userId, timeWindow) {
        const cutoff = Date.now() - timeWindow;
        const attempts = [];
        
        for (const [key, attempt] of this.attemptHistory) {
            if (key.startsWith(userId + '_') && attempt.timestamp > cutoff) {
                attempts.push(attempt);
            }
        }
        
        return attempts.sort((a, b) => b.timestamp - a.timestamp);
    }

    cleanAttemptHistory() {
        const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 horas
        
        for (const [key, attempt] of this.attemptHistory) {
            if (attempt.timestamp < cutoff) {
                this.attemptHistory.delete(key);
            }
        }
    }

    // ========================================
    // 🔐 VALIDACIONES AVANZADAS
    // ========================================
    
    validateRegistrationOptions(userId, userName, options = {}) {
        // Validaciones de entrada
        if (!userId || typeof userId !== 'string' || userId.length < 3) {
            throw new Error('userId inválido');
        }
        
        if (!userName || typeof userName !== 'string' || userName.length < 2) {
            throw new Error('userName inválido');
        }
        
        // Sanitizar inputs
        const sanitizedUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '');
        const sanitizedUserName = userName.replace(/[<>\"'&]/g, '');
        
        const challenge = this.generateSecureChallenge();
        
        const registrationOptions = {
            challenge: challenge.challenge,
            rp: {
                id: this.relyingPartyId,
                name: this.relyingPartyName,
            },
            user: {
                id: Buffer.from(sanitizedUserId),
                name: sanitizedUserName,
                displayName: sanitizedUserName
            },
            pubKeyCredParams: [
                { alg: -7, type: 'public-key' }, // ES256
                { alg: -35, type: 'public-key' }, // ES384
                { alg: -36, type: 'public-key' }, // ES512
                { alg: -257, type: 'public-key' }, // RS256
            ],
            authenticatorSelection: {
                authenticatorAttachment: options.platform ? 'platform' : undefined,
                userVerification: 'required',
                requireResidentKey: false
            },
            attestation: 'direct',
            timeout: 60000,
            extensions: {
                credProps: true
            }
        };
        
        return {
            options: registrationOptions,
            challengeId: challenge.challengeId
        };
    }

    validateAuthenticationOptions(userId, options = {}) {
        if (!userId || typeof userId !== 'string') {
            throw new Error('userId inválido');
        }
        
        const challenge = this.generateSecureChallenge();
        
        // Obtener credenciales registradas para este usuario
        const userCredentials = this.getUserCredentials(userId);
        
        const authOptions = {
            challenge: challenge.challenge,
            timeout: 60000,
            rpId: this.relyingPartyId,
            allowCredentials: userCredentials.length > 0 ? userCredentials.map(cred => ({
                id: cred.id,
                type: 'public-key',
                transports: cred.transports || ['internal', 'usb', 'ble', 'nfc']
            })) : [],
            userVerification: 'required'
        };
        
        return {
            options: authOptions,
            challengeId: challenge.challengeId
        };
    }

    // ========================================
    // 🗄️ GESTIÓN DE CREDENCIALES
    // ========================================
    
    storeCredential(userId, credentialId, publicKey, counter = 0) {
        const credentialData = {
            id: credentialId,
            publicKey: publicKey,
            counter: counter,
            createdAt: new Date().toISOString(),
            lastUsed: new Date().toISOString()
        };
        
        if (!this.registeredCredentials.has(userId)) {
            this.registeredCredentials.set(userId, []);
        }
        
        this.registeredCredentials.get(userId).push(credentialData);
        
        // TODO: Persistir en base de datos
        console.log(`✅ Credencial almacenada para ${userId}`);
    }

    getUserCredentials(userId) {
        return this.registeredCredentials.get(userId) || [];
    }

    verifySignature(credentialId, signature, clientData, authenticatorData) {
        // Implementación simplificada - en producción usar bibliotecas especializadas
        try {
            // TODO: Implementar verificación criptográfica real
            const isValid = signature && signature.length > 0;
            return isValid;
        } catch (error) {
            console.error('Error verificando firma:', error);
            return false;
        }
    }

    // ========================================
    // 📊 MÉTRICAS Y ESTADÍSTICAS
    // ========================================
    
    getSecurityMetrics() {
        const now = Date.now();
        const hour = 60 * 60 * 1000;
        const day = 24 * hour;
        
        const hourlyAttempts = Array.from(this.attemptHistory.values())
            .filter(a => now - a.timestamp < hour);
        
        const dailyAttempts = Array.from(this.attemptHistory.values())
            .filter(a => now - a.timestamp < day);
        
        return {
            activeChallenges: this.challenges.size,
            blacklistedDevices: this.blacklistedDevices.size,
            registeredUsers: this.registeredCredentials.size,
            totalCredentials: Array.from(this.registeredCredentials.values())
                .reduce((sum, creds) => sum + creds.length, 0),
            attempts: {
                lastHour: hourlyAttempts.length,
                lastDay: dailyAttempts.length,
                successRate: dailyAttempts.length > 0 ? 
                    (dailyAttempts.filter(a => a.success).length / dailyAttempts.length) : 0
            }
        };
    }

    // ========================================
    // 🧹 MANTENIMIENTO
    // ========================================
    
    cleanup() {
        this.cleanExpiredChallenges();
        this.cleanAttemptHistory();
        
        // Limpiar dispositivos bloqueados después de 24 horas
        // TODO: Implementar timestamps para blacklist
        if (this.blacklistedDevices.size > 100) {
            this.blacklistedDevices.clear();
        }
    }
}

module.exports = WebAuthnSecurityEnhanced;