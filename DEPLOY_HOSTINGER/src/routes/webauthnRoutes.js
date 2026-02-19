/**
 * YAvoy v3.1 Enterprise - WebAuthn API Routes
 * Rutas de autenticación biométrica con seguridad avanzada
 */

const express = require('express');
const router = express.Router();
const WebAuthnSecurityEnhanced = require('../../middleware/webauthn-security');

// Instanciar el middleware de seguridad
const webauthnSecurity = new WebAuthnSecurityEnhanced();

// ========================================
// 🔐 REGISTRO BIOMÉTRICO
// ========================================

/**
 * POST /api/webauthn/register/begin
 * Iniciar proceso de registro biométrico
 */
router.post('/register/begin', async (req, res) => {
    try {
        const { userId, userName, platform = false } = req.body;
        
        if (!userId || !userName) {
            return res.status(400).json({
                success: false,
                message: 'userId y userName son requeridos'
            });
        }

        // Validar que el usuario no esté en blacklist
        const deviceFingerprint = generateDeviceFingerprint(req);
        if (webauthnSecurity.blacklistedDevices.has(deviceFingerprint)) {
            return res.status(429).json({
                success: false,
                message: 'Dispositivo temporalmente bloqueado'
            });
        }

        // Generar opciones de registro
        const { options, challengeId } = webauthnSecurity.validateRegistrationOptions(
            userId, userName, { platform }
        );

        // Registrar intento
        webauthnSecurity.recordAttempt(userId, true, {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            deviceFingerprint,
            type: 'registration_begin'
        });

        res.json({
            success: true,
            options,
            challengeId,
            message: 'Opciones de registro generadas'
        });

    } catch (error) {
        console.error('Error en register/begin:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/webauthn/register/complete
 * Completar proceso de registro biométrico
 */
router.post('/register/complete', async (req, res) => {
    try {
        const { userId, challengeId, credential } = req.body;

        if (!userId || !challengeId || !credential) {
            return res.status(400).json({
                success: false,
                message: 'Datos incompletos para completar registro'
            });
        }

        // Validar challenge
        webauthnSecurity.validateChallenge(challengeId, credential.response.clientDataJSON);

        // Verificar credencial
        const isValidCredential = webauthnSecurity.verifySignature(
            credential.id,
            credential.response.attestationObject,
            credential.response.clientDataJSON,
            null
        );

        if (!isValidCredential) {
            throw new Error('Credencial no válida');
        }

        // Almacenar credencial
        webauthnSecurity.storeCredential(
            userId,
            credential.id,
            credential.response.publicKey,
            0
        );

        // Registrar éxito
        const deviceFingerprint = generateDeviceFingerprint(req);
        webauthnSecurity.recordAttempt(userId, true, {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            deviceFingerprint,
            type: 'registration_complete'
        });

        res.json({
            success: true,
            verified: true,
            message: 'Registro biométrico completado exitosamente'
        });

    } catch (error) {
        console.error('Error en register/complete:', error);
        
        // Registrar fallo
        if (req.body.userId) {
            const deviceFingerprint = generateDeviceFingerprint(req);
            webauthnSecurity.recordAttempt(req.body.userId, false, {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                deviceFingerprint,
                type: 'registration_complete',
                error: error.message
            });
        }

        res.status(400).json({
            success: false,
            verified: false,
            message: error.message || 'Error completando registro'
        });
    }
});

// ========================================
// 🔓 AUTENTICACIÓN BIOMÉTRICA
// ========================================

/**
 * POST /api/webauthn/authenticate/begin
 * Iniciar proceso de autenticación biométrica
 */
router.post('/authenticate/begin', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'userId es requerido'
            });
        }

        // Verificar que el usuario tenga credenciales registradas
        const userCredentials = webauthnSecurity.getUserCredentials(userId);
        if (userCredentials.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No hay credenciales biométricas registradas para este usuario'
            });
        }

        // Generar opciones de autenticación
        const { options, challengeId } = webauthnSecurity.validateAuthenticationOptions(userId);

        // Registrar intento
        const deviceFingerprint = generateDeviceFingerprint(req);
        webauthnSecurity.recordAttempt(userId, true, {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            deviceFingerprint,
            type: 'auth_begin'
        });

        res.json({
            success: true,
            options,
            challengeId,
            message: 'Opciones de autenticación generadas'
        });

    } catch (error) {
        console.error('Error en authenticate/begin:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/webauthn/authenticate/complete
 * Completar proceso de autenticación biométrica
 */
router.post('/authenticate/complete', async (req, res) => {
    try {
        const { userId, challengeId, credential } = req.body;

        if (!userId || !challengeId || !credential) {
            return res.status(400).json({
                success: false,
                message: 'Datos incompletos para completar autenticación'
            });
        }

        // Validar challenge
        webauthnSecurity.validateChallenge(challengeId, credential.response.clientDataJSON);

        // Verificar firma
        const isValidSignature = webauthnSecurity.verifySignature(
            credential.id,
            credential.response.signature,
            credential.response.clientDataJSON,
            credential.response.authenticatorData
        );

        if (!isValidSignature) {
            throw new Error('Firma no válida');
        }

        // Autenticación exitosa
        const deviceFingerprint = generateDeviceFingerprint(req);
        webauthnSecurity.recordAttempt(userId, true, {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            deviceFingerprint,
            type: 'auth_complete'
        });

        res.json({
            success: true,
            verified: true,
            message: 'Autenticación biométrica exitosa'
        });

    } catch (error) {
        console.error('Error en authenticate/complete:', error);
        
        // Registrar fallo
        if (req.body.userId) {
            const deviceFingerprint = generateDeviceFingerprint(req);
            webauthnSecurity.recordAttempt(req.body.userId, false, {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                deviceFingerprint,
                type: 'auth_complete',
                error: error.message
            });
        }

        res.status(400).json({
            success: false,
            verified: false,
            message: error.message || 'Error en autenticación'
        });
    }
});

// ========================================
// 📊 ENDPOINTS DE DIAGNÓSTICO
// ========================================

/**
 * GET /api/webauthn/status
 * Obtener estado del sistema WebAuthn
 */
router.get('/status', (req, res) => {
    try {
        const metrics = webauthnSecurity.getSecurityMetrics();
        
        res.json({
            success: true,
            status: 'active',
            metrics,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error obteniendo status WebAuthn:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * POST /api/webauthn/cleanup
 * Limpiar datos obsoletos (solo para administradores)
 */
router.post('/cleanup', (req, res) => {
    try {
        webauthnSecurity.cleanup();
        
        res.json({
            success: true,
            message: 'Limpieza completada',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error en cleanup:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ========================================
// 🛠️ FUNCIONES AUXILIARES
// ========================================

function generateDeviceFingerprint(req) {
    const components = [
        req.ip,
        req.get('User-Agent') || '',
        req.get('Accept-Language') || '',
        req.get('Accept-Encoding') || ''
    ].join('|');
    
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(components).digest('hex');
}

module.exports = router;