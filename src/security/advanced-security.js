// ===========================================
// YAVOY v3.1 ENTERPRISE - MÓDULO DE SEGURIDAD AVANZADA
// Especialista en Ciberseguridad
// ===========================================

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const UAParser = require('ua-parser-js');
// const geoip = require('geoip-lite'); // Temporalmente comentado para iniciar servidor
const crypto = require('crypto');

// ===========================================
// CONFIGURACIÓN DE SEGURIDAD
// ===========================================

const SECURITY_CONFIG = {
    // WebAuthn
    webauthn: {
        enabled: process.env.NODE_ENV === 'production' || process.env.FORCE_HTTPS === 'true',
        rpName: 'YAvoy Enterprise',
        rpId: process.env.WEBAUTHN_RP_ID || 'localhost',
        origin: process.env.WEBAUTHN_ORIGIN || 'https://localhost:3000',
        timeout: 60000,
        attestation: 'none',
        userVerification: 'preferred',
        authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'preferred',
            residentKey: 'preferred',
            requireResidentKey: false
        }
    },
    
    // 2FA/TOTP
    totp: {
        issuer: 'YAvoy Enterprise',
        length: 6,
        step: 30,
        window: 2,
        encoding: 'base32'
    },
    
    // Validación de IP
    ipValidation: {
        enabled: true,
        maxDistance: 100, // km
        alertThreshold: 500, // km para alerta
        trustedNetworks: ['127.0.0.1', '::1', '10.0.0.0/8', '192.168.0.0/16'],
        sessionTimeout: 24 * 60 * 60 * 1000 // 24 horas
    }
};

// ===========================================
// ALMACENAMIENTO TEMPORAL (EN PRODUCCIÓN USAR DB)
// ===========================================

let webauthnUsers = new Map(); // userId -> {credentials, userHandle}
let totpSecrets = new Map(); // userId -> secret
let sessionData = new Map(); // sessionId -> {ip, location, userAgent, timestamp}
let securityLogs = [];

// ===========================================
// 1. BIOMETRÍA WebAuthn PARA REPARTIDORES
// ===========================================

class BiometricAuth {
    // Verificar si WebAuthn está disponible
    static isWebAuthnAvailable(req) {
        const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https' || 
                        req.hostname === 'localhost' || SECURITY_CONFIG.webauthn.enabled;
        
        return {
            available: isSecure,
            reason: isSecure ? 'WebAuthn disponible' : 'Requiere HTTPS para biometría'
        };
    }

    // Generar opciones para registro biométrico
    static generateRegistrationOptions(userId, userName) {
        const challenge = crypto.randomBytes(32);
        const userHandle = crypto.randomBytes(64);

        const options = {
            challenge: challenge.toString('base64url'),
            rp: {
                name: SECURITY_CONFIG.webauthn.rpName,
                id: SECURITY_CONFIG.webauthn.rpId
            },
            user: {
                id: userHandle.toString('base64url'),
                name: userName,
                displayName: `Repartidor ${userName}`
            },
            pubKeyCredParams: [
                { alg: -7, type: 'public-key' },  // ES256
                { alg: -257, type: 'public-key' } // RS256
            ],
            authenticatorSelection: SECURITY_CONFIG.webauthn.authenticatorSelection,
            timeout: SECURITY_CONFIG.webauthn.timeout,
            attestation: SECURITY_CONFIG.webauthn.attestation
        };

        // Almacenar datos temporales
        webauthnUsers.set(userId, {
            challenge: challenge,
            userHandle: userHandle,
            userName: userName,
            registered: false
        });

        return options;
    }

    // Verificar registro biométrico
    static async verifyRegistration(userId, credential) {
        const userData = webauthnUsers.get(userId);
        if (!userData) {
            throw new Error('Datos de registro no encontrados');
        }

        try {
            // En un entorno real, aquí verificarías la firma criptográfica
            // Por ahora, simulamos la verificación
            const verified = credential.id && credential.rawId && credential.response;

            if (verified) {
                userData.registered = true;
                userData.credential = credential;
                webauthnUsers.set(userId, userData);

                // Log de seguridad
                securityLogs.push({
                    timestamp: new Date().toISOString(),
                    event: 'BIOMETRIC_REGISTRATION',
                    userId: userId,
                    success: true,
                    details: 'Registro biométrico completado'
                });

                return { verified: true, credentialId: credential.id };
            }

            throw new Error('Verificación biométrica fallida');
        } catch (error) {
            securityLogs.push({
                timestamp: new Date().toISOString(),
                event: 'BIOMETRIC_REGISTRATION',
                userId: userId,
                success: false,
                error: error.message
            });
            throw error;
        }
    }

    // Generar opciones para autenticación
    static generateAuthenticationOptions(userId) {
        const userData = webauthnUsers.get(userId);
        if (!userData || !userData.registered) {
            throw new Error('Usuario no registrado para autenticación biométrica');
        }

        const challenge = crypto.randomBytes(32);

        const options = {
            challenge: challenge.toString('base64url'),
            timeout: SECURITY_CONFIG.webauthn.timeout,
            rpId: SECURITY_CONFIG.webauthn.rpId,
            allowCredentials: [{
                id: userData.credential.rawId,
                type: 'public-key',
                transports: ['internal', 'usb', 'nfc', 'ble']
            }],
            userVerification: SECURITY_CONFIG.webauthn.userVerification
        };

        userData.authChallenge = challenge;
        webauthnUsers.set(userId, userData);

        return options;
    }

    // Verificar autenticación biométrica
    static async verifyAuthentication(userId, assertion) {
        const userData = webauthnUsers.get(userId);
        if (!userData || !userData.registered) {
            throw new Error('Usuario no registrado');
        }

        try {
            // Verificación simulada - en producción verificar firma criptográfica
            const verified = assertion.id && assertion.rawId && assertion.response;

            securityLogs.push({
                timestamp: new Date().toISOString(),
                event: 'BIOMETRIC_LOGIN',
                userId: userId,
                success: verified,
                details: verified ? 'Login biométrico exitoso' : 'Fallo en verificación biométrica'
            });

            return verified;
        } catch (error) {
            securityLogs.push({
                timestamp: new Date().toISOString(),
                event: 'BIOMETRIC_LOGIN',
                userId: userId,
                success: false,
                error: error.message
            });
            return false;
        }
    }

    // Verificar si usuario tiene biometría registrada
    static hasBiometricRegistered(userId) {
        const userData = webauthnUsers.get(userId);
        return userData && userData.registered;
    }
}

// ===========================================
// 2. SEGUNDO FACTOR (2FA/TOTP) PARA CEO
// ===========================================

class TwoFactorAuth {
    // Generar secreto TOTP para un CEO
    static generateSecret(userId, userEmail) {
        const secret = speakeasy.generateSecret({
            name: `${SECURITY_CONFIG.totp.issuer} (${userEmail})`,
            issuer: SECURITY_CONFIG.totp.issuer,
            length: 32
        });

        totpSecrets.set(userId, {
            secret: secret.base32,
            tempSecret: secret.base32,
            enabled: false,
            backupCodes: this.generateBackupCodes(),
            createdAt: new Date()
        });

        return {
            secret: secret.base32,
            otpauthUrl: secret.otpauth_url,
            qrCodeData: secret.otpauth_url
        };
    }

    // Generar códigos de respaldo
    static generateBackupCodes() {
        const codes = [];
        for (let i = 0; i < 8; i++) {
            codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
        }
        return codes;
    }

    // Generar QR Code para configurar authenticator
    static async generateQRCode(otpauthUrl) {
        try {
            return await QRCode.toDataURL(otpauthUrl);
        } catch (error) {
            throw new Error('Error generando código QR: ' + error.message);
        }
    }

    // Verificar código TOTP
    static verifyToken(userId, token, isBackupCode = false) {
        const userData = totpSecrets.get(userId);
        if (!userData) {
            throw new Error('2FA no configurado para este usuario');
        }

        try {
            if (isBackupCode) {
                const codeIndex = userData.backupCodes.indexOf(token.toUpperCase());
                if (codeIndex !== -1) {
                    // Usar código de respaldo (solo una vez)
                    userData.backupCodes.splice(codeIndex, 1);
                    totpSecrets.set(userId, userData);

                    securityLogs.push({
                        timestamp: new Date().toISOString(),
                        event: '2FA_BACKUP_CODE_USED',
                        userId: userId,
                        success: true,
                        remaining: userData.backupCodes.length
                    });

                    return { verified: true, method: 'backup' };
                }
                return { verified: false, method: 'backup' };
            }

            // Verificar TOTP normal
            const verified = speakeasy.totp.verify({
                secret: userData.secret,
                encoding: SECURITY_CONFIG.totp.encoding,
                token: token,
                step: SECURITY_CONFIG.totp.step,
                window: SECURITY_CONFIG.totp.window
            });

            securityLogs.push({
                timestamp: new Date().toISOString(),
                event: '2FA_TOKEN_VERIFICATION',
                userId: userId,
                success: verified,
                method: 'totp'
            });

            return { verified, method: 'totp' };
        } catch (error) {
            securityLogs.push({
                timestamp: new Date().toISOString(),
                event: '2FA_ERROR',
                userId: userId,
                error: error.message
            });
            return { verified: false, error: error.message };
        }
    }

    // Habilitar 2FA después de verificar configuración inicial
    static enable2FA(userId, token) {
        const result = this.verifyToken(userId, token);
        if (result.verified) {
            const userData = totpSecrets.get(userId);
            userData.enabled = true;
            userData.enabledAt = new Date();
            totpSecrets.set(userId, userData);

            securityLogs.push({
                timestamp: new Date().toISOString(),
                event: '2FA_ENABLED',
                userId: userId,
                success: true
            });

            return true;
        }
        return false;
    }

    // Verificar si 2FA está habilitado
    static is2FAEnabled(userId) {
        const userData = totpSecrets.get(userId);
        return userData && userData.enabled;
    }

    // Deshabilitar 2FA
    static disable2FA(userId, token) {
        const result = this.verifyToken(userId, token);
        if (result.verified) {
            totpSecrets.delete(userId);

            securityLogs.push({
                timestamp: new Date().toISOString(),
                event: '2FA_DISABLED',
                userId: userId,
                success: true
            });

            return true;
        }
        return false;
    }
}

// ===========================================
// 3. VALIDACIÓN DE SESIÓN POR IP
// ===========================================

class IPValidation {
    // Registrar nueva sesión
    static registerSession(sessionId, req) {
        const ip = this.getClientIP(req);
        const userAgent = req.headers['user-agent'] || '';
        const location = geoip.lookup(ip);
        const parser = new UAParser(userAgent);
        const deviceInfo = parser.getResult();

        const sessionInfo = {
            ip: ip,
            location: location,
            userAgent: userAgent,
            device: deviceInfo,
            timestamp: new Date(),
            suspicious: false,
            country: location ? location.country : 'Unknown',
            city: location ? location.city : 'Unknown',
            timezone: location ? location.timezone : 'Unknown'
        };

        sessionData.set(sessionId, sessionInfo);
        return sessionInfo;
    }

    // Validar sesión por ubicación
    static validateSession(userId, sessionId, req) {
        const currentSession = sessionData.get(sessionId);
        if (!currentSession) {
            return { valid: false, reason: 'Sesión no encontrada' };
        }

        const newIp = this.getClientIP(req);
        const newLocation = geoip.lookup(newIp);

        // Verificar cambio de IP
        if (currentSession.ip !== newIp) {
            const distance = this.calculateDistance(currentSession.location, newLocation);
            const timeDiff = new Date() - currentSession.timestamp;
            const hoursPasseed = timeDiff / (1000 * 60 * 60);

            // Verificar si el cambio de ubicación es sospechoso
            if (distance > SECURITY_CONFIG.ipValidation.alertThreshold && hoursPasseed < 1) {
                securityLogs.push({
                    timestamp: new Date().toISOString(),
                    event: 'SUSPICIOUS_LOCATION_CHANGE',
                    userId: userId,
                    sessionId: sessionId,
                    oldIP: currentSession.ip,
                    newIP: newIp,
                    oldLocation: currentSession.location,
                    newLocation: newLocation,
                    distance: distance,
                    timeHours: hoursPasseed,
                    severity: 'HIGH'
                });

                return {
                    valid: false,
                    reason: 'Ubicación sospechosa',
                    requireReauth: true,
                    distance: distance,
                    timeDiff: hoursPasseed
                };
            }

            // Actualizar información de sesión
            this.updateSession(sessionId, req);
        }

        return { valid: true };
    }

    // Actualizar información de sesión
    static updateSession(sessionId, req) {
        const sessionInfo = sessionData.get(sessionId);
        if (sessionInfo) {
            sessionInfo.ip = this.getClientIP(req);
            sessionInfo.location = geoip.lookup(sessionInfo.ip);
            sessionInfo.lastActivity = new Date();
            sessionData.set(sessionId, sessionInfo);
        }
    }

    // Obtener IP real del cliente
    static getClientIP(req) {
        return req.ip ||
               req.connection.remoteAddress ||
               req.socket.remoteAddress ||
               (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
               req.headers['x-forwarded-for']?.split(',')[0] ||
               req.headers['x-real-ip'] ||
               '127.0.0.1';
    }

    // Calcular distancia entre ubicaciones (Haversine)
    static calculateDistance(loc1, loc2) {
        if (!loc1 || !loc2 || !loc1.ll || !loc2.ll) return 0;

        const [lat1, lon1] = loc1.ll;
        const [lat2, lon2] = loc2.ll;
        
        const R = 6371; // Radio de la Tierra en km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    static toRad(Value) {
        return Value * Math.PI / 180;
    }

    // Limpiar sesiones expiradas
    static cleanupExpiredSessions() {
        const now = new Date();
        const expiredSessions = [];

        sessionData.forEach((sessionInfo, sessionId) => {
            const age = now - sessionInfo.timestamp;
            if (age > SECURITY_CONFIG.ipValidation.sessionTimeout) {
                expiredSessions.push(sessionId);
            }
        });

        expiredSessions.forEach(sessionId => {
            sessionData.delete(sessionId);
        });

        return expiredSessions.length;
    }

    // Obtener sesiones activas para un usuario
    static getActiveSessions(userId) {
        const activeSessions = [];
        sessionData.forEach((sessionInfo, sessionId) => {
            if (sessionInfo.userId === userId) {
                activeSessions.push({
                    sessionId: sessionId,
                    ...sessionInfo
                });
            }
        });
        return activeSessions;
    }
}

// ===========================================
// FUNCIONES DE UTILIDAD
// ===========================================

class SecurityUtils {
    // Verificar si la conexión es segura
    static isSecureConnection(req) {
        return req.secure || 
               req.headers['x-forwarded-proto'] === 'https' || 
               req.hostname === 'localhost' ||
               process.env.NODE_ENV === 'development';
    }

    // Generar hash de sesión
    static generateSessionHash(data) {
        return crypto.createHash('sha256')
                    .update(JSON.stringify(data))
                    .digest('hex');
    }

    // Obtener logs de seguridad recientes
    static getSecurityLogs(limit = 100) {
        return securityLogs
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }

    // Obtener estadísticas de seguridad
    static getSecurityStats() {
        const now = new Date();
        const last24h = new Date(now - 24 * 60 * 60 * 1000);

        const recentLogs = securityLogs.filter(log => new Date(log.timestamp) > last24h);

        return {
            biometricUsers: webauthnUsers.size,
            twoFactorUsers: Array.from(totpSecrets.values()).filter(u => u.enabled).length,
            activeSessions: sessionData.size,
            securityEvents24h: recentLogs.length,
            suspiciousEvents24h: recentLogs.filter(log => 
                log.event.includes('SUSPICIOUS') || log.success === false
            ).length,
            lastCleanup: new Date()
        };
    }
}

// ===========================================
// EXPORTAR MÓDULOS
// ===========================================

module.exports = {
    BiometricAuth,
    TwoFactorAuth,
    IPValidation,
    SecurityUtils,
    SECURITY_CONFIG
};

// ===========================================
// LIMPIEZA AUTOMÁTICA CADA HORA
// ===========================================

setInterval(() => {
    const cleaned = IPValidation.cleanupExpiredSessions();
    if (cleaned > 0) {
        console.log(`🔒 Seguridad: ${cleaned} sesiones expiradas limpiadas`);
    }
}, 60 * 60 * 1000); // Cada hora

console.log('🔐 Módulo de Seguridad Avanzada YAvoy v3.1 Enterprise inicializado');