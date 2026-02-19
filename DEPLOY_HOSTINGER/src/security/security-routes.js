// ===========================================
// RUTAS DE SEGURIDAD AVANZADA - YAvoy v3.1 Enterprise
// ===========================================

const express = require('express');
const { 
    BiometricAuth, 
    TwoFactorAuth, 
    IPValidation, 
    SecurityUtils 
} = require('./advanced-security');

const router = express.Router();

// ===========================================
// MIDDLEWARE DE SEGURIDAD
// ===========================================

// Verificar conexión HTTPS para operaciones biométricas
const requireHTTPS = (req, res, next) => {
    if (!SecurityUtils.isSecureConnection(req)) {
        return res.status(400).json({
            success: false,
            error: 'HTTPS_REQUIRED',
            message: 'Esta operación requiere conexión segura (HTTPS)'
        });
    }
    next();
};

// Registrar actividad de sesión
const trackSession = (req, res, next) => {
    const sessionId = req.session?.id || req.headers['x-session-id'];
    if (sessionId) {
        IPValidation.updateSession(sessionId, req);
    }
    next();
};

// ===========================================
// RUTAS WebAuthn (BIOMETRÍA) PARA REPARTIDORES
// ===========================================

// Verificar disponibilidad de WebAuthn
router.get('/webauthn/available', (req, res) => {
    const availability = BiometricAuth.isWebAuthnAvailable(req);
    res.json({
        success: true,
        available: availability.available,
        reason: availability.reason,
        secure: SecurityUtils.isSecureConnection(req)
    });
});

// Iniciar registro biométrico
router.post('/webauthn/register/begin', requireHTTPS, (req, res) => {
    try {
        const { userId, userName } = req.body;

        if (!userId || !userName) {
            return res.status(400).json({
                success: false,
                error: 'MISSING_PARAMETERS',
                message: 'userId y userName son requeridos'
            });
        }

        const options = BiometricAuth.generateRegistrationOptions(userId, userName);

        res.json({
            success: true,
            options: options,
            message: 'Opciones de registro biométrico generadas'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'REGISTRATION_ERROR',
            message: error.message
        });
    }
});

// Completar registro biométrico
router.post('/webauthn/register/complete', requireHTTPS, (req, res) => {
    try {
        const { userId, credential } = req.body;

        if (!userId || !credential) {
            return res.status(400).json({
                success: false,
                error: 'MISSING_PARAMETERS',
                message: 'userId y credential son requeridos'
            });
        }

        const result = BiometricAuth.verifyRegistration(userId, credential);

        res.json({
            success: true,
            verified: result.verified,
            credentialId: result.credentialId,
            message: 'Registro biométrico completado exitosamente'
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            error: 'VERIFICATION_ERROR',
            message: error.message
        });
    }
});

// Iniciar autenticación biométrica
router.post('/webauthn/authenticate/begin', requireHTTPS, (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'MISSING_USER_ID',
                message: 'userId es requerido'
            });
        }

        const options = BiometricAuth.generateAuthenticationOptions(userId);

        res.json({
            success: true,
            options: options,
            message: 'Opciones de autenticación biométrica generadas'
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            error: 'AUTHENTICATION_ERROR',
            message: error.message
        });
    }
});

// Completar autenticación biométrica
router.post('/webauthn/authenticate/complete', requireHTTPS, trackSession, (req, res) => {
    try {
        const { userId, assertion } = req.body;

        if (!userId || !assertion) {
            return res.status(400).json({
                success: false,
                error: 'MISSING_PARAMETERS',
                message: 'userId y assertion son requeridos'
            });
        }

        const verified = BiometricAuth.verifyAuthentication(userId, assertion);

        if (verified) {
            // Registrar nueva sesión
            const sessionId = req.session?.id || Date.now().toString();
            IPValidation.registerSession(sessionId, req);

            res.json({
                success: true,
                verified: true,
                sessionId: sessionId,
                message: 'Autenticación biométrica exitosa'
            });
        } else {
            res.status(401).json({
                success: false,
                verified: false,
                message: 'Autenticación biométrica fallida'
            });
        }

    } catch (error) {
        res.status(400).json({
            success: false,
            error: 'AUTHENTICATION_ERROR',
            message: error.message
        });
    }
});

// Verificar si usuario tiene biometría registrada
router.get('/webauthn/status/:userId', (req, res) => {
    const { userId } = req.params;
    const registered = BiometricAuth.hasBiometricRegistered(userId);

    res.json({
        success: true,
        registered: registered,
        available: BiometricAuth.isWebAuthnAvailable(req).available
    });
});

// ===========================================
// RUTAS 2FA (TOTP) PARA CEO
// ===========================================

// Generar secreto 2FA
router.post('/2fa/setup', (req, res) => {
    try {
        console.log('🔐 [2FA SETUP] Petición recibida:', {
            method: req.method,
            url: req.url,
            body: req.body
        });

        const { userId, userEmail } = req.body;

        console.log('🔐 [2FA SETUP] Datos recibidos:', { userId, userEmail });

        if (!userId || !userEmail) {
            console.log('❌ [2FA SETUP] Faltan datos requeridos');
            return res.status(400).json({
                success: false,
                error: 'MISSING_PARAMETERS',
                message: 'userId y userEmail son requeridos'
            });
        }

        console.log('🔐 [2FA SETUP] Generando secreto...');
        const secretData = TwoFactorAuth.generateSecret(userId, userEmail);

        res.json({
            success: true,
            secret: secretData.secret,
            otpauthUrl: secretData.otpauthUrl,
            qrCodeData: secretData.qrCodeData,
            message: 'Secreto 2FA generado. Escanea el código QR con tu authenticator.'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: '2FA_SETUP_ERROR',
            message: error.message
        });
    }
});

// Generar código QR
router.post('/2fa/qrcode', async (req, res) => {
    try {
        console.log('🎨 [QR CODE] Petición recibida:', {
            method: req.method,
            url: req.url,
            body: req.body
        });

        const { otpauthUrl } = req.body;

        console.log('🎨 [QR CODE] otpauthUrl recibida:', otpauthUrl);

        if (!otpauthUrl) {
            console.log('❌ [QR CODE] Falta otpauthUrl');
            return res.status(400).json({
                success: false,
                error: 'MISSING_URL',
                message: 'otpauthUrl es requerido'
            });
        }

        console.log('🎨 [QR CODE] Generando código QR...');
        const qrCodeImage = await TwoFactorAuth.generateQRCode(otpauthUrl);

        console.log('✅ [QR CODE] QR generado exitosamente, tamaño:', qrCodeImage ? qrCodeImage.length : 'null');

        res.json({
            success: true,
            qrCodeImage: qrCodeImage,
            message: 'Código QR generado'
        });

    } catch (error) {
        console.error('❌ [QR CODE] Error:', error);
        res.status(500).json({
            success: false,
            error: 'QR_GENERATION_ERROR',
            message: error.message
        });
    }
});

// Verificar token 2FA
router.post('/2fa/verify', trackSession, (req, res) => {
    try {
        const { userId, token, isBackupCode = false } = req.body;

        if (!userId || !token) {
            return res.status(400).json({
                success: false,
                error: 'MISSING_PARAMETERS',
                message: 'userId y token son requeridos'
            });
        }

        const result = TwoFactorAuth.verifyToken(userId, token, isBackupCode);

        res.json({
            success: true,
            verified: result.verified,
            method: result.method,
            message: result.verified ? 
                'Token 2FA verificado exitosamente' : 
                'Token 2FA inválido'
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            error: '2FA_VERIFICATION_ERROR',
            message: error.message
        });
    }
});

// Habilitar 2FA
router.post('/2fa/enable', (req, res) => {
    try {
        const { userId, token } = req.body;

        if (!userId || !token) {
            return res.status(400).json({
                success: false,
                error: 'MISSING_PARAMETERS',
                message: 'userId y token son requeridos'
            });
        }

        const enabled = TwoFactorAuth.enable2FA(userId, token);

        if (enabled) {
            res.json({
                success: true,
                enabled: true,
                message: '2FA habilitado exitosamente'
            });
        } else {
            res.status(400).json({
                success: false,
                enabled: false,
                message: 'Token inválido. No se pudo habilitar 2FA'
            });
        }

    } catch (error) {
        res.status(400).json({
            success: false,
            error: '2FA_ENABLE_ERROR',
            message: error.message
        });
    }
});

// Deshabilitar 2FA
router.post('/2fa/disable', (req, res) => {
    try {
        const { userId, token } = req.body;

        if (!userId || !token) {
            return res.status(400).json({
                success: false,
                error: 'MISSING_PARAMETERS',
                message: 'userId y token son requeridos'
            });
        }

        const disabled = TwoFactorAuth.disable2FA(userId, token);

        if (disabled) {
            res.json({
                success: true,
                disabled: true,
                message: '2FA deshabilitado exitosamente'
            });
        } else {
            res.status(400).json({
                success: false,
                disabled: false,
                message: 'Token inválido. No se pudo deshabilitar 2FA'
            });
        }

    } catch (error) {
        res.status(400).json({
            success: false,
            error: '2FA_DISABLE_ERROR',
            message: error.message
        });
    }
});

// Verificar estado 2FA
router.get('/2fa/status/:userId', (req, res) => {
    const { userId } = req.params;
    const enabled = TwoFactorAuth.is2FAEnabled(userId);

    res.json({
        success: true,
        enabled: enabled,
        message: enabled ? '2FA habilitado' : '2FA no habilitado'
    });
});

// ===========================================
// RUTAS DE VALIDACIÓN DE IP Y SESIONES
// ===========================================

// Validar sesión actual
router.post('/session/validate', (req, res) => {
    try {
        const { userId, sessionId } = req.body;

        if (!userId || !sessionId) {
            return res.status(400).json({
                success: false,
                error: 'MISSING_PARAMETERS',
                message: 'userId y sessionId son requeridos'
            });
        }

        const validation = IPValidation.validateSession(userId, sessionId, req);

        res.json({
            success: true,
            valid: validation.valid,
            reason: validation.reason,
            requireReauth: validation.requireReauth || false,
            distance: validation.distance,
            timeDiff: validation.timeDiff
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'VALIDATION_ERROR',
            message: error.message
        });
    }
});

// Obtener sesiones activas
router.get('/session/active/:userId', (req, res) => {
    const { userId } = req.params;
    const sessions = IPValidation.getActiveSessions(userId);

    res.json({
        success: true,
        sessions: sessions,
        count: sessions.length
    });
});

// Registrar nueva sesión
router.post('/session/register', (req, res) => {
    const { sessionId, userId } = req.body;

    if (!sessionId) {
        return res.status(400).json({
            success: false,
            error: 'MISSING_SESSION_ID',
            message: 'sessionId es requerido'
        });
    }

    const sessionInfo = IPValidation.registerSession(sessionId, req);
    sessionInfo.userId = userId;

    res.json({
        success: true,
        sessionInfo: sessionInfo,
        message: 'Sesión registrada exitosamente'
    });
});

// ===========================================
// RUTAS DE ESTADÍSTICAS Y LOGS (SOLO CEO)
// ===========================================

// Obtener logs de seguridad
router.get('/logs', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const logs = SecurityUtils.getSecurityLogs(limit);

        res.json({
            success: true,
            logs: logs,
            count: logs.length,
            total: logs.length
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'LOGS_ERROR',
            message: error.message
        });
    }
});

// Obtener estadísticas de seguridad
router.get('/stats', (req, res) => {
    try {
        const stats = SecurityUtils.getSecurityStats();

        res.json({
            success: true,
            stats: stats,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'STATS_ERROR',
            message: error.message
        });
    }
});

// Limpiar sesiones expiradas manualmente
router.post('/cleanup', (req, res) => {
    try {
        const cleaned = IPValidation.cleanupExpiredSessions();

        res.json({
            success: true,
            cleaned: cleaned,
            message: `${cleaned} sesiones expiradas limpiadas`
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'CLEANUP_ERROR',
            message: error.message
        });
    }
});

module.exports = router;