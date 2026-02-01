/**
 * ====================================
 * YAVOY v3.1 - CONTROLADOR DE AUTENTICACIÓN
 * ====================================
 * 
 * Gestiona login, registro y autenticación de usuarios
 * Implementa bcrypt para hash seguro de contraseñas
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { generateToken, generateRefreshToken } = require('../middleware/auth');
const { sanitizeString } = require('../middleware/security');
const emailService = require('../utils/emailService');
const Usuario = require('../../models/Usuario');

// ========================================
// 🔐 HASH DE CONTRASEÑAS
// ========================================

/**
 * Hashea una contraseña usando bcrypt
 * @param {string} password - Contraseña en texto plano
 * @returns {Promise<string>} Hash de la contraseña
 */
async function hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

/**
 * Verifica una contraseña contra su hash
 * @param {string} password - Contraseña en texto plano
 * @param {string} hash - Hash almacenado
 * @returns {Promise<boolean>}
 */
async function verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

// ========================================
// 📁 HELPERS DE LECTURA/ESCRITURA
// ========================================

// ...eliminar helpers de lectura/escritura JSON...

// ========================================
// 📝 REGISTRO DE USUARIOS
// ========================================

class AuthController {
    // Registro de comercio
    async registerComercio(req, res) {
        try {
            const { nombre, email, telefono, direccion, password, rubro } = req.body;
            if (!nombre || !email || !password) {
                return res.status(400).json({ error: 'Datos incompletos', message: 'Nombre, email y contraseña son obligatorios' });
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ error: 'Email inválido', message: 'Por favor proporciona un email válido' });
            }
            if (password.length < 8) {
                return res.status(400).json({ error: 'Contraseña débil', message: 'La contraseña debe tener al menos 8 caracteres' });
            }
            const emailExiste = await Usuario.findOne({ where: { email } });
            if (emailExiste) {
                return res.status(409).json({ error: 'Email duplicado', message: 'Ya existe un comercio con este email' });
            }
            const nuevoComercio = await Usuario.create({
                id: `COM${Date.now()}`,
                nombre: sanitizeString(nombre),
                email: sanitizeString(email),
                password,
                telefono: sanitizeString(telefono) || '',
                metadata: { direccion: sanitizeString(direccion) || '', rubro: sanitizeString(rubro) || 'general', fechaRegistro: new Date().toISOString(), rating: 0, pedidosCompletados: 0 },
                tipo: 'COMERCIO',
                estado: 'activo',
                verificado: false
            });
            let emailEnviado = false;
            try {
                const emailResult = await emailService.sendRegistrationEmail({ email: nuevoComercio.email, nombre: nuevoComercio.nombre, id: nuevoComercio.id }, 'comercio');
                if (emailResult.success) {
                    nuevoComercio.confirmacionCode = emailResult.confirmationCode;
                    nuevoComercio.confirmacionExpira = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
                    await nuevoComercio.save();
                    emailEnviado = true;
                }
            } catch (emailError) {
                console.warn(`[EMAIL] Error enviando confirmación: ${emailError.message}`);
            }
            const token = generateToken({ id: nuevoComercio.id, email: nuevoComercio.email, rol: 'comercio' });
            const refreshToken = generateRefreshToken({ id: nuevoComercio.id, rol: 'comercio' });
            const { password: _, ...comercioSinPassword } = nuevoComercio.toJSON();
            res.status(201).json({ success: true, message: 'Comercio registrado exitosamente', comercio: comercioSinPassword, token, refreshToken, emailEnviado, instrucciones: 'Por favor verifica tu email para confirmar tu cuenta' });
        } catch (error) {
            console.error('[AUTH] Error en registerComercio:', error);
            res.status(500).json({ error: 'Error del servidor', message: 'No se pudo completar el registro' });
        }
    }

    // Registro de repartidor
    async registerRepartidor(req, res) {
        try {
            const { nombre, email, telefono, password, vehiculo, zonaCobertura } = req.body;
            if (!nombre || !email || !password) {
                return res.status(400).json({ error: 'Datos incompletos', message: 'Nombre, email y contraseña son obligatorios' });
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ error: 'Email inválido', message: 'Por favor proporciona un email válido' });
            }
            if (password.length < 8) {
                return res.status(400).json({ error: 'Contraseña débil', message: 'La contraseña debe tener al menos 8 caracteres' });
            }
            const emailExiste = await Usuario.findOne({ where: { email } });
            if (emailExiste) {
                return res.status(409).json({ error: 'Email duplicado', message: 'Ya existe un repartidor con este email' });
            }
            const nuevoRepartidor = await Usuario.create({
                id: `REP${Date.now()}`,
                nombre: sanitizeString(nombre),
                email: sanitizeString(email),
                password,
                telefono: sanitizeString(telefono) || '',
                metadata: { vehiculo: sanitizeString(vehiculo) || 'bicicleta', zonaCobertura: zonaCobertura || [], fechaRegistro: new Date().toISOString(), rating: 0, entregasCompletadas: 0, ubicacionActual: null },
                tipo: 'REPARTIDOR',
                estado: 'disponible',
                verificado: false
            });
            let emailEnviado = false;
            try {
                const emailResult = await emailService.sendRegistrationEmail({ email: nuevoRepartidor.email, nombre: nuevoRepartidor.nombre, id: nuevoRepartidor.id }, 'repartidor');
                if (emailResult.success) {
                    nuevoRepartidor.confirmacionCode = emailResult.confirmationCode;
                    nuevoRepartidor.confirmacionExpira = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
                    await nuevoRepartidor.save();
                    emailEnviado = true;
                }
            } catch (emailError) {
                console.warn(`[EMAIL] Error enviando confirmación: ${emailError.message}`);
            }
            const token = generateToken({ id: nuevoRepartidor.id, email: nuevoRepartidor.email, rol: 'repartidor' });
            const refreshToken = generateRefreshToken({ id: nuevoRepartidor.id, rol: 'repartidor' });
            const { password: _, ...repartidorSinPassword } = nuevoRepartidor.toJSON();
            res.status(201).json({ success: true, message: 'Repartidor registrado exitosamente', repartidor: repartidorSinPassword, token, refreshToken, emailEnviado, instrucciones: 'Por favor verifica tu email para confirmar tu cuenta' });
        } catch (error) {
            console.error('[AUTH] Error en registerRepartidor:', error);
            res.status(500).json({ error: 'Error del servidor', message: 'No se pudo completar el registro' });
        }
    }

    // Login universal
    async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ error: 'Datos incompletos', message: 'Email y contraseña son obligatorios' });
            }
            const usuario = await Usuario.findOne({ where: { email } });
            if (!usuario) {
                return res.status(401).json({ error: 'Credenciales inválidas', message: 'Email o contraseña incorrectos' });
            }
            const passwordValida = await bcrypt.compare(password, usuario.password);
            if (!passwordValida) {
                return res.status(401).json({ error: 'Credenciales inválidas', message: 'Email o contraseña incorrectos' });
            }
            if (usuario.estado === 'bloqueado' || usuario.estado === 'suspendido') {
                return res.status(403).json({ error: 'Cuenta bloqueada', message: 'Tu cuenta está bloqueada. Contacta al administrador' });
            }
            const token = generateToken({ id: usuario.id, email: usuario.email, rol: usuario.tipo });
            const refreshToken = generateRefreshToken({ id: usuario.id, rol: usuario.tipo });
            usuario.ultimoLogin = new Date().toISOString();
            await usuario.save();
            const { password: _, ...usuarioSinPassword } = usuario.toJSON();
            res.json({ success: true, message: 'Login exitoso', usuario: usuarioSinPassword, rol: usuario.tipo, token, refreshToken });
        } catch (error) {
            console.error('[AUTH] Error en login:', error);
            res.status(500).json({ error: 'Error del servidor', message: 'No se pudo completar el login' });
        }
    }
    
    /**
     * POST /api/auth/refresh
     * Renueva el token de acceso usando un refresh token
     */
    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;
            
            if (!refreshToken) {
                return res.status(400).json({
                    error: 'Token requerido',
                    message: 'Refresh token es obligatorio'
                });
            }
            
            const { verifyToken } = require('../middleware/auth');
            const decoded = verifyToken(refreshToken);
            
            if (!decoded) {
                return res.status(401).json({
                    error: 'Token inválido',
                    message: 'El refresh token es inválido o ha expirado'
                });
            }
            
            // Generar nuevo token de acceso
            const newToken = generateToken({
                id: decoded.id,
                email: decoded.email,
                rol: decoded.rol
            });
            
            res.json({
                success: true,
                token: newToken
            });
            
        } catch (error) {
            console.error('[AUTH] Error en refreshToken:', error);
            res.status(500).json({
                error: 'Error del servidor',
                message: 'No se pudo renovar el token'
            });
        }
    }
    
    /**
     * GET /api/auth/me
     * Obtiene información del usuario autenticado
     */
    async getMe(req, res) {
        try {
            const { id, rol } = req.user; // Del middleware requireAuth
            
            let usuario;
            
            if (rol === 'comercio') {
                const comercios = await readJSON(COMERCIOS_FILE);
                usuario = comercios.find(c => c.id === id);
            } else if (rol === 'repartidor') {
                const repartidores = await readJSON(REPARTIDORES_FILE);
                usuario = repartidores.find(r => r.id === id);
            }
            
            if (!usuario) {
                return res.status(404).json({
                    error: 'Usuario no encontrado',
                    message: 'El usuario no existe'
                });
            }
            
            // No enviar la contraseña
            const { password: _, ...usuarioSinPassword } = usuario;
            
            res.json({
                success: true,
                usuario: usuarioSinPassword,
                rol
            });
            
        } catch (error) {
            console.error('[AUTH] Error en getMe:', error);
            res.status(500).json({
                error: 'Error del servidor'
            });
        }
    }
    
    /**
     * POST /api/auth/change-password
     * Cambia la contraseña del usuario autenticado
     */
    async changePassword(req, res) {
        try {
            const { id, rol } = req.user;
            const { currentPassword, newPassword } = req.body;
            
            // Validaciones
            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    error: 'Datos incompletos',
                    message: 'Contraseña actual y nueva son obligatorias'
                });
            }
            
            if (newPassword.length < 8) {
                return res.status(400).json({
                    error: 'Contraseña débil',
                    message: 'La nueva contraseña debe tener al menos 8 caracteres'
                });
            }
            
            // Obtener usuario
            let usuarios, usuario, filePath;
            
            if (rol === 'comercio') {
                usuarios = await readJSON(COMERCIOS_FILE);
                usuario = usuarios.find(c => c.id === id);
                filePath = COMERCIOS_FILE;
            } else if (rol === 'repartidor') {
                usuarios = await readJSON(REPARTIDORES_FILE);
                usuario = usuarios.find(r => r.id === id);
                filePath = REPARTIDORES_FILE;
            }
            
            if (!usuario) {
                return res.status(404).json({
                    error: 'Usuario no encontrado'
                });
            }
            
            // Verificar contraseña actual
            const passwordValida = await verifyPassword(currentPassword, usuario.password);
            
            if (!passwordValida) {
                return res.status(401).json({
                    error: 'Contraseña incorrecta',
                    message: 'La contraseña actual es incorrecta'
                });
            }
            
            // Actualizar contraseña
            usuario.password = await hashPassword(newPassword);
            usuario.passwordCambiadoEn = new Date().toISOString();
            
            await writeJSON(filePath, usuarios);
            
            res.json({
                success: true,
                message: 'Contraseña actualizada exitosamente'
            });
            
        } catch (error) {
            console.error('[AUTH] Error en changePassword:', error);
            res.status(500).json({
                error: 'Error del servidor'
            });
        }
    }
    
    // ========================================
    // ✅ VERIFICACIÓN DE EMAIL
    // ========================================
    
    /**
     * POST /api/auth/verify-email
     * Verifica el código de confirmación enviado por email
     */
    async verifyEmail(req, res) {
        try {
            const { userId, confirmationCode } = req.body;
            
            if (!userId || !confirmationCode) {
                return res.status(400).json({
                    error: 'Datos incompletos',
                    message: 'userId y confirmationCode son requeridos'
                });
            }
            
            // Determinar tipo de usuario por el prefijo del ID
            let usuarios, filePath;
            
            if (userId.startsWith('COM')) {
                usuarios = await readJSON(COMERCIOS_FILE);
                filePath = COMERCIOS_FILE;
            } else if (userId.startsWith('REP')) {
                usuarios = await readJSON(REPARTIDORES_FILE);
                filePath = REPARTIDORES_FILE;
            } else {
                return res.status(400).json({
                    error: 'ID inválido',
                    message: 'El ID de usuario no tiene un formato válido'
                });
            }
            
            // Buscar usuario
            const usuarioIndex = usuarios.findIndex(u => u.id === userId);
            if (usuarioIndex === -1) {
                return res.status(404).json({
                    error: 'Usuario no encontrado',
                    message: 'El usuario no existe en el sistema'
                });
            }
            
            const usuario = usuarios[usuarioIndex];
            
            // Validar código de confirmación
            if (!usuario.confirmacionCode) {
                return res.status(400).json({
                    error: 'Sin código pendiente',
                    message: 'Este usuario ya fue verificado o no tiene código pendiente'
                });
            }
            
            if (usuario.confirmacionCode !== confirmationCode) {
                return res.status(401).json({
                    error: 'Código inválido',
                    message: 'El código de confirmación es incorrecto'
                });
            }
            
            // Validar expiración
            if (new Date(usuario.confirmacionExpira) < new Date()) {
                return res.status(401).json({
                    error: 'Código expirado',
                    message: 'El código de confirmación ha expirado. Solicita uno nuevo.',
                    requiresNewCode: true
                });
            }
            
            // Marcar como verificado
            usuario.verificado = true;
            usuario.confirmacionCode = null;
            usuario.confirmacionExpira = null;
            usuario.estado = 'activo';
            
            // Guardar cambios
            usuarios[usuarioIndex] = usuario;
            await writeJSON(filePath, usuarios);
            
            // Enviar email de bienvenida
            await emailService.sendWelcomeEmail(usuario.email, usuario.nombre, usuario.id);
            
            res.status(200).json({
                success: true,
                message: 'Email verificado exitosamente',
                usuario: {
                    id: usuario.id,
                    nombre: usuario.nombre,
                    email: usuario.email,
                    verificado: usuario.verificado
                }
            });
            
        } catch (error) {
            console.error('[AUTH] Error en verifyEmail:', error);
            res.status(500).json({
                error: 'Error del servidor',
                message: 'No se pudo verificar el email'
            });
        }
    }
    
    /**
     * POST /api/auth/resend-confirmation
     * Reenvía el código de confirmación si expiró
     */
    async resendConfirmation(req, res) {
        try {
            const { userId } = req.body;
            
            if (!userId) {
                return res.status(400).json({
                    error: 'ID requerido',
                    message: 'userId es requerido'
                });
            }
            
            // Determinar tipo de usuario
            let usuarios, filePath;
            
            if (userId.startsWith('COM')) {
                usuarios = await readJSON(COMERCIOS_FILE);
                filePath = COMERCIOS_FILE;
            } else if (userId.startsWith('REP')) {
                usuarios = await readJSON(REPARTIDORES_FILE);
                filePath = REPARTIDORES_FILE;
            } else {
                return res.status(400).json({
                    error: 'ID inválido',
                    message: 'El ID de usuario no tiene un formato válido'
                });
            }
            
            // Buscar usuario
            const usuarioIndex = usuarios.findIndex(u => u.id === userId);
            if (usuarioIndex === -1) {
                return res.status(404).json({
                    error: 'Usuario no encontrado',
                    message: 'El usuario no existe'
                });
            }
            
            const usuario = usuarios[usuarioIndex];
            
            // Validar que el usuario no esté ya verificado
            if (usuario.verificado) {
                return res.status(400).json({
                    error: 'Usuario ya verificado',
                    message: 'Este usuario ya fue verificado previamente'
                });
            }
            
            // Enviar nuevo email
            const tipoUsuario = userId.startsWith('COM') ? 'comercio' : 'repartidor';
            const emailResult = await emailService.sendRegistrationEmail(
                {
                    email: usuario.email,
                    nombre: usuario.nombre,
                    id: usuario.id
                },
                tipoUsuario
            );
            
            // Actualizar código
            if (emailResult.success) {
                usuario.confirmacionCode = emailResult.confirmationCode;
                usuario.confirmacionExpira = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
                usuarios[usuarioIndex] = usuario;
                await writeJSON(filePath, usuarios);
            }
            
            res.status(200).json({
                success: emailResult.success,
                message: 'Nuevo código de confirmación enviado',
                emailStatus: emailResult.success ? 'enviado' : 'pendiente'
            });
            
        } catch (error) {
            console.error('[AUTH] Error en resendConfirmation:', error);
            res.status(500).json({
                error: 'Error del servidor',
                message: 'No se pudo reenviar el código'
            });
        }
    }
    
    /**
     * POST /api/auth/forgot-password
     * Solicita recuperación de contraseña
     * @body { email }
     */
    async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            
            if (!email) {
                return res.status(400).json({
                    success: false,
                    error: 'Email requerido',
                    message: 'Por favor proporciona tu email'
                });
            }
            
            const usuario = await Usuario.findOne({ where: { email } });
            if (!usuario) {
                return res.status(404).json({
                    success: false,
                    error: 'Usuario no encontrado',
                    message: 'No existe una cuenta con este email'
                });
            }
            
            // Generar token aleatorio
            const resetToken = crypto.randomBytes(20).toString('hex');
            const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
            
            // Guardar token y expiración en la BD
            usuario.resetPasswordToken = resetToken;
            usuario.resetPasswordExpires = resetExpires;
            await usuario.save();
            
            // Construir URL de reset
            const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
            
            // Enviar email
            let emailEnviado = false;
            try {
                await emailService.sendPasswordResetEmail({
                    email: usuario.email,
                    nombre: usuario.nombre,
                    resetUrl
                });
                emailEnviado = true;
            } catch (emailError) {
                console.warn(`[EMAIL] Error enviando reset: ${emailError.message}`);
                // Limpiar token si el email falló
                usuario.resetPasswordToken = null;
                usuario.resetPasswordExpires = null;
                await usuario.save();
            }
            
            if (!emailEnviado) {
                return res.status(500).json({
                    success: false,
                    error: 'Error al enviar email',
                    message: 'No se pudo enviar el email de recuperación'
                });
            }
            
            res.json({
                success: true,
                message: 'Email de recuperación enviado exitosamente',
                info: 'Revisa tu correo para el enlace de reset (válido por 1 hora)'
            });
        } catch (error) {
            console.error('[AUTH] Error en forgotPassword:', error);
            res.status(500).json({
                success: false,
                error: 'Error del servidor',
                message: 'No se pudo procesar la solicitud'
            });
        }
    }
    
    /**
     * POST /api/auth/reset-password
     * Resetea la contraseña con token válido
     * @body { token, newPassword }
     */
    async resetPassword(req, res) {
        try {
            const { token, newPassword } = req.body;
            
            if (!token || !newPassword) {
                return res.status(400).json({
                    success: false,
                    error: 'Datos incompletos',
                    message: 'Token y nueva contraseña son obligatorios'
                });
            }
            
            if (newPassword.length < 8) {
                return res.status(400).json({
                    success: false,
                    error: 'Contraseña débil',
                    message: 'La contraseña debe tener al menos 8 caracteres'
                });
            }
            
            // Buscar usuario con token válido y no expirado
            const usuario = await Usuario.findOne({
                where: {
                    resetPasswordToken: token
                }
            });
            
            if (!usuario) {
                return res.status(404).json({
                    success: false,
                    error: 'Token inválido',
                    message: 'El token de reset no es válido'
                });
            }
            
            // Verificar que el token no haya expirado
            if (new Date() > usuario.resetPasswordExpires) {
                // Limpiar token expirado
                usuario.resetPasswordToken = null;
                usuario.resetPasswordExpires = null;
                await usuario.save();
                
                return res.status(410).json({
                    success: false,
                    error: 'Token expirado',
                    message: 'El enlace de reset ha expirado. Solicita uno nuevo'
                });
            }
            
            // Actualizar contraseña
            usuario.password = newPassword;
            usuario.resetPasswordToken = null;
            usuario.resetPasswordExpires = null;
            await usuario.save();
            
            res.json({
                success: true,
                message: 'Contraseña actualizada exitosamente',
                info: 'Ya puedes iniciar sesión con tu nueva contraseña'
            });
        } catch (error) {
            console.error('[AUTH] Error en resetPassword:', error);
            res.status(500).json({
                success: false,
                error: 'Error del servidor',
                message: 'No se pudo resetear la contraseña'
            });
        }
    }
}

// ========================================
// 📤 EXPORTACIONES
// ========================================
module.exports = new AuthController();