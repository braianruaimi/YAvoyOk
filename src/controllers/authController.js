/**
 * ====================================
 * YAVOY v3.1 - CONTROLADOR DE AUTENTICACIÓN
 * ====================================
 * 
 * Gestiona login, registro y autenticación de usuarios
 * Implementa bcrypt para hash seguro de contraseñas
 */

const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const path = require('path');
const { generateToken, generateRefreshToken } = require('../middleware/auth');
const { sanitizeString } = require('../middleware/security');
const emailService = require('../utils/emailService');

// Rutas a archivos de datos
const REGISTROS_PATH = path.join(__dirname, '../../registros');
const COMERCIOS_FILE = path.join(REGISTROS_PATH, 'comercios/comercios.json');
const REPARTIDORES_FILE = path.join(REGISTROS_PATH, 'repartidores/repartidores.json');
const CLIENTES_FILE = path.join(REGISTROS_PATH, 'clientes/clientes.json');

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

async function readJSON(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error leyendo ${filePath}:`, error);
        return [];
    }
}

async function writeJSON(filePath, data) {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error(`Error escribiendo ${filePath}:`, error);
        return false;
    }
}

// ========================================
// 📝 REGISTRO DE USUARIOS
// ========================================

class AuthController {
    
    /**
     * POST /api/auth/register/comercio
     * Registra un nuevo comercio
     */
    async registerComercio(req, res) {
        try {
            const { nombre, email, telefono, direccion, password, rubro } = req.body;
            
            // Validaciones básicas
            if (!nombre || !email || !password) {
                return res.status(400).json({
                    error: 'Datos incompletos',
                    message: 'Nombre, email y contraseña son obligatorios'
                });
            }
            
            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    error: 'Email inválido',
                    message: 'Por favor proporciona un email válido'
                });
            }
            
            // Validar longitud de contraseña
            if (password.length < 8) {
                return res.status(400).json({
                    error: 'Contraseña débil',
                    message: 'La contraseña debe tener al menos 8 caracteres'
                });
            }
            
            // Leer comercios existentes
            const comercios = await readJSON(COMERCIOS_FILE);
            
            // Verificar si el email ya existe
            const emailExiste = comercios.some(c => c.email === email);
            if (emailExiste) {
                return res.status(409).json({
                    error: 'Email duplicado',
                    message: 'Ya existe un comercio con este email'
                });
            }
            
            // Hash de la contraseña
            const hashedPassword = await hashPassword(password);
            
            // Crear nuevo comercio
            const nuevoComercio = {
                id: `COM${Date.now()}`,
                nombre: sanitizeString(nombre),
                email: sanitizeString(email),
                password: hashedPassword, // Almacenar hash
                telefono: sanitizeString(telefono) || '',
                direccion: sanitizeString(direccion) || '',
                rubro: sanitizeString(rubro) || 'general',
                estado: 'activo',
                verificado: false,
                fechaRegistro: new Date().toISOString(),
                rating: 0,
                pedidosCompletados: 0
            };
            
            comercios.push(nuevoComercio);
            await writeJSON(COMERCIOS_FILE, comercios);
            
            // Enviar email de confirmación
            let emailEnviado = false;
            try {
                const emailResult = await emailService.sendRegistrationEmail(
                    {
                        email: nuevoComercio.email,
                        nombre: nuevoComercio.nombre,
                        id: nuevoComercio.id
                    },
                    'comercio'
                );
                
                if (emailResult.success) {
                    nuevoComercio.confirmacionCode = emailResult.confirmationCode;
                    nuevoComercio.confirmacionExpira = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
                    comercios[comercios.length - 1] = nuevoComercio;
                    await writeJSON(COMERCIOS_FILE, comercios);
                    emailEnviado = true;
                    console.log(`[EMAIL] Confirmación enviada a ${nuevoComercio.email} (${nuevoComercio.id})`);
                }
            } catch (emailError) {
                console.warn(`[EMAIL] Error enviando confirmación: ${emailError.message}`);
            }
            
            // Generar token JWT
            const token = generateToken({
                id: nuevoComercio.id,
                email: nuevoComercio.email,
                rol: 'comercio'
            });
            
            const refreshToken = generateRefreshToken({
                id: nuevoComercio.id,
                rol: 'comercio'
            });
            
            // No enviar la contraseña en la respuesta
            const { password: _, ...comercioSinPassword } = nuevoComercio;
            
            res.status(201).json({
                success: true,
                message: 'Comercio registrado exitosamente',
                comercio: comercioSinPassword,
                token,
                refreshToken,
                emailEnviado: emailEnviado,
                instrucciones: 'Por favor verifica tu email para confirmar tu cuenta'
            });
            
        } catch (error) {
            console.error('[AUTH] Error en registerComercio:', error);
            res.status(500).json({
                error: 'Error del servidor',
                message: 'No se pudo completar el registro'
            });
        }
    }
    
    /**
     * POST /api/auth/register/repartidor
     * Registra un nuevo repartidor
     */
    async registerRepartidor(req, res) {
        try {
            const { nombre, email, telefono, password, vehiculo, zonaCobertura } = req.body;
            
            // Validaciones básicas
            if (!nombre || !email || !password) {
                return res.status(400).json({
                    error: 'Datos incompletos',
                    message: 'Nombre, email y contraseña son obligatorios'
                });
            }
            
            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    error: 'Email inválido',
                    message: 'Por favor proporciona un email válido'
                });
            }
            
            // Validar longitud de contraseña
            if (password.length < 8) {
                return res.status(400).json({
                    error: 'Contraseña débil',
                    message: 'La contraseña debe tener al menos 8 caracteres'
                });
            }
            
            // Leer repartidores existentes
            const repartidores = await readJSON(REPARTIDORES_FILE);
            
            // Verificar si el email ya existe
            const emailExiste = repartidores.some(r => r.email === email);
            if (emailExiste) {
                return res.status(409).json({
                    error: 'Email duplicado',
                    message: 'Ya existe un repartidor con este email'
                });
            }
            
            // Hash de la contraseña
            const hashedPassword = await hashPassword(password);
            
            // Crear nuevo repartidor
            const nuevoRepartidor = {
                id: `REP${Date.now()}`,
                nombre: sanitizeString(nombre),
                email: sanitizeString(email),
                password: hashedPassword,
                telefono: sanitizeString(telefono) || '',
                vehiculo: sanitizeString(vehiculo) || 'bicicleta',
                zonaCobertura: zonaCobertura || [],
                estado: 'disponible',
                verificado: false,
                fechaRegistro: new Date().toISOString(),
                rating: 0,
                entregasCompletadas: 0,
                ubicacionActual: null
            };
            
            repartidores.push(nuevoRepartidor);
            await writeJSON(REPARTIDORES_FILE, repartidores);
            
            // Enviar email de confirmación
            let emailEnviado = false;
            try {
                const emailResult = await emailService.sendRegistrationEmail(
                    {
                        email: nuevoRepartidor.email,
                        nombre: nuevoRepartidor.nombre,
                        id: nuevoRepartidor.id
                    },
                    'repartidor'
                );
                
                if (emailResult.success) {
                    nuevoRepartidor.confirmacionCode = emailResult.confirmationCode;
                    nuevoRepartidor.confirmacionExpira = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
                    repartidores[repartidores.length - 1] = nuevoRepartidor;
                    await writeJSON(REPARTIDORES_FILE, repartidores);
                    emailEnviado = true;
                    console.log(`[EMAIL] Confirmación enviada a ${nuevoRepartidor.email} (${nuevoRepartidor.id})`);
                }
            } catch (emailError) {
                console.warn(`[EMAIL] Error enviando confirmación: ${emailError.message}`);
            }
            
            // Generar token JWT
            const token = generateToken({
                id: nuevoRepartidor.id,
                email: nuevoRepartidor.email,
                rol: 'repartidor'
            });
            
            const refreshToken = generateRefreshToken({
                id: nuevoRepartidor.id,
                rol: 'repartidor'
            });
            
            // No enviar la contraseña en la respuesta
            const { password: _, ...repartidorSinPassword } = nuevoRepartidor;
            
            res.status(201).json({
                success: true,
                message: 'Repartidor registrado exitosamente',
                repartidor: repartidorSinPassword,
                token,
                refreshToken,
                emailEnviado: emailEnviado,
                instrucciones: 'Por favor verifica tu email para confirmar tu cuenta'
            });
            
        } catch (error) {
            console.error('[AUTH] Error en registerRepartidor:', error);
            res.status(500).json({
                error: 'Error del servidor',
                message: 'No se pudo completar el registro'
            });
        }
    }
    
    // ========================================
    // 🔓 LOGIN DE USUARIOS
    // ========================================
    
    /**
     * POST /api/auth/login
     * Login universal (detecta tipo de usuario automáticamente)
     */
    async login(req, res) {
        try {
            const { email, password } = req.body;
            
            // Validaciones básicas
            if (!email || !password) {
                return res.status(400).json({
                    error: 'Datos incompletos',
                    message: 'Email y contraseña son obligatorios'
                });
            }
            
            // Buscar usuario en comercios
            const comercios = await readJSON(COMERCIOS_FILE);
            let usuario = comercios.find(c => c.email === email);
            let tipoUsuario = 'comercio';
            
            // Si no es comercio, buscar en repartidores
            if (!usuario) {
                const repartidores = await readJSON(REPARTIDORES_FILE);
                usuario = repartidores.find(r => r.email === email);
                tipoUsuario = 'repartidor';
            }
            
            // Usuario no encontrado
            if (!usuario) {
                return res.status(401).json({
                    error: 'Credenciales inválidas',
                    message: 'Email o contraseña incorrectos'
                });
            }
            
            // Verificar contraseña
            const passwordValida = await verifyPassword(password, usuario.password);
            
            if (!passwordValida) {
                return res.status(401).json({
                    error: 'Credenciales inválidas',
                    message: 'Email o contraseña incorrectos'
                });
            }
            
            // Verificar si está activo
            if (usuario.estado === 'bloqueado' || usuario.estado === 'suspendido') {
                return res.status(403).json({
                    error: 'Cuenta bloqueada',
                    message: 'Tu cuenta está bloqueada. Contacta al administrador'
                });
            }
            
            // Generar tokens
            const token = generateToken({
                id: usuario.id,
                email: usuario.email,
                rol: tipoUsuario
            });
            
            const refreshToken = generateRefreshToken({
                id: usuario.id,
                rol: tipoUsuario
            });
            
            // Actualizar último login
            usuario.ultimoLogin = new Date().toISOString();
            
            // Guardar cambios
            if (tipoUsuario === 'comercio') {
                await writeJSON(COMERCIOS_FILE, comercios);
            } else {
                const repartidores = await readJSON(REPARTIDORES_FILE);
                await writeJSON(REPARTIDORES_FILE, repartidores);
            }
            
            // No enviar la contraseña en la respuesta
            const { password: _, ...usuarioSinPassword } = usuario;
            
            res.json({
                success: true,
                message: 'Login exitoso',
                usuario: usuarioSinPassword,
                rol: tipoUsuario,
                token,
                refreshToken
            });
            
        } catch (error) {
            console.error('[AUTH] Error en login:', error);
            res.status(500).json({
                error: 'Error del servidor',
                message: 'No se pudo completar el login'
            });
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
}

// ========================================
// 📤 EXPORTACIONES
// ========================================
module.exports = new AuthController();
