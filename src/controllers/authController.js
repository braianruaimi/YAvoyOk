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
                refreshToken
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
                refreshToken
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
}

// ========================================
// 📤 EXPORTACIONES
// ========================================
module.exports = new AuthController();
