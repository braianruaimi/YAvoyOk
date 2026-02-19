/**
 * ====================================
 * YAVOY v3.1 - GOOGLE OAUTH CONTROLLER
 * ====================================
 * Autenticación con Google Sign-In
 */

const { google } = require('googleapis');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');
const nodemailer = require('nodemailer');

// Configuración de Google OAuth
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID || 'TU_GOOGLE_CLIENT_ID',
    process.env.GOOGLE_CLIENT_SECRET || 'TU_GOOGLE_CLIENT_SECRET',
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5502/api/auth/google/callback'
);

const CLIENTES_FILE = path.join(__dirname, '../../registros/clientes.json');
const JWT_SECRET = process.env.JWT_SECRET || 'yavoy-2026-secret-key-ultra-segura';

/**
 * Iniciar autenticación con Google
 */
exports.initGoogleAuth = async (req, res) => {
    try {
        console.log('Iniciando Google Auth Init');
        const { tipo_usuario } = req.body;
        console.log('Tipo usuario:', tipo_usuario);
        
        // Guardar el tipo de usuario en la sesión/estado
        const state = Buffer.from(JSON.stringify({
            tipo_usuario: tipo_usuario || 'cliente',
            timestamp: Date.now()
        })).toString('base64');
        
        console.log('Client ID:', process.env.GOOGLE_CLIENT_ID);
        console.log('Client Secret:', process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not set');
        console.log('Redirect URI:', process.env.GOOGLE_REDIRECT_URI);
        
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'openid',
                'profile',
                'email'
            ],
            prompt: 'select_account',
            state: state
        });

        console.log('Auth URL generated:', authUrl);

        res.json({
            success: true,
            authUrl: authUrl
        });
    } catch (error) {
        console.error('Error Google OAuth Init:', error);
        res.status(500).json({
            success: false,
            message: 'Error al inicializar Google OAuth',
            error: error.message
        });
    }
};

/**
 * Callback de Google OAuth
 */
exports.googleCallback = async (req, res) => {
    try {
        const { code, state } = req.query;

        if (!code) {
            return res.status(400).send(`
                <script>
                    window.opener.postMessage({
                        type: 'google-auth-error',
                        message: 'No se recibió código de autorización'
                    }, '*');
                    window.close();
                </script>
            `);
        }

        // Decodificar el estado para obtener tipo_usuario
        let tipo_usuario = 'cliente';
        if (state) {
            try {
                const decodedState = JSON.parse(Buffer.from(state, 'base64').toString());
                tipo_usuario = decodedState.tipo_usuario || 'cliente';
            } catch (e) {
                console.log('Estado no válido, usando tipo por defecto');
            }
        }

        // Intercambiar código por tokens
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        console.log('✅ Tokens obtenidos de Google');

        // Obtener información del usuario
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const { data } = await oauth2.userinfo.get();
        console.log('✅ Información de usuario obtenida:', data.email);

        // Determinar archivo según tipo de usuario
        let archivoUsuarios = CLIENTES_FILE;
        if (tipo_usuario === 'comercio') {
            archivoUsuarios = path.join(__dirname, '../../registros/comercios.json');
        } else if (tipo_usuario === 'repartidor') {
            archivoUsuarios = path.join(__dirname, '../../registros/repartidores.json');
        }

        // Buscar o crear usuario
        let usuarios = [];
        try {
            const usuariosData = await fs.readFile(archivoUsuarios, 'utf8');
            usuarios = JSON.parse(usuariosData);
        } catch (error) {
            // Si no existe el archivo, crear array vacío
        }

        let usuario = usuarios.find(u => u.email === data.email);

        if (!usuario) {
            // Crear nuevo usuario
            usuario = {
                id: Date.now().toString(),
                nombre: data.name,
                email: data.email,
                telefono: '',
                tipo_usuario: tipo_usuario,
                googleId: data.id,
                foto: data.picture,
                verificado: true,
                fecha_registro: new Date().toISOString(),
                auth_provider: 'google',
                activo: true
            };

            usuarios.push(usuario);
            await fs.writeFile(archivoUsuarios, JSON.stringify(usuarios, null, 2));
            console.log('✅ Nuevo usuario creado:', usuario.email);

            // Enviar email de bienvenida para usuarios de Google OAuth
            try {
                const transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
                    port: process.env.SMTP_PORT || 587,
                    secure: false,
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS
                    },
                    tls: {
                        ciphers: 'SSLv3'
                    }
                });

                const mailOptions = {
                    from: `"YAvoy" <${process.env.SMTP_USER}>`,
                    to: usuario.email,
                    subject: '🎉 ¡Bienvenido a YAvoy! - Cuenta Google vinculada',
                    html: `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="UTF-8">
                            <title>Bienvenido a YAvoy</title>
                            <style>
                                body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
                                .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
                                .header { text-align: center; color: #06b6d4; margin-bottom: 30px; }
                                .content { line-height: 1.6; color: #333; }
                                .highlight { background: #e0f2fe; padding: 15px; border-radius: 5px; margin: 20px 0; }
                                .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <div class="header">
                                    <h1>🎉 ¡Bienvenido a YAvoy!</h1>
                                    <h2>Cuenta Google vinculada exitosamente</h2>
                                </div>
                                
                                <div class="content">
                                    <p>Hola <strong>${usuario.nombre}</strong>,</p>
                                    
                                    <p>¡Tu cuenta de Google se ha vinculado correctamente a YAvoy! Ya puedes comenzar a disfrutar de nuestros servicios.</p>
                                    
                                    <div class="highlight">
                                        <h3>🔐 Sobre tu autenticación:</h3>
                                        <p>• <strong>No necesitas contraseña</strong> - Inicia sesión directamente con tu cuenta de Google</p>
                                        <p>• Tu cuenta está <strong>verificada automáticamente</strong> por Google</p>
                                        <p>• Puedes acceder desde cualquier dispositivo con tu cuenta Google</p>
                                    </div>
                                    
                                    <p><strong>¿Qué puedes hacer ahora?</strong></p>
                                    <ul>
                                        <li>📍 Hacer pedidos a comercios cercanos</li>
                                        <li>🏪 Registrarte como comercio si quieres vender</li>
                                        <li>🚴 Conviértete en repartidor para ganar dinero</li>
                                        <li>⭐ Calificar servicios y ganar recompensas</li>
                                    </ul>
                                    
                                    <p>¡Esperamos que disfrutes de YAvoy! 🚀</p>
                                    
                                    <p style="text-align: center; margin: 30px 0;">
                                        <a href="http://localhost:3000" style="background: #06b6d4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Ir a YAvoy</a>
                                    </p>
                                </div>
                                
                                <div class="footer">
                                    <p>Este es un email automático, por favor no respondas a esta dirección.</p>
                                    <p>YAvoy v3.1 Enterprise - Tu delivery inteligente</p>
                                </div>
                            </div>
                        </body>
                        </html>
                    `
                };

                await transporter.sendMail(mailOptions);
                console.log('📧 Email de bienvenida enviado a:', usuario.email);
            } catch (emailError) {
                console.error('❌ Error enviando email de bienvenida:', emailError.message);
                // No fallar el registro por error de email
            }
        } else {
            // Actualizar datos de Google si cambió
            usuario.googleId = data.id;
            usuario.foto = data.picture;
            usuario.verificado = true;
            usuario.tipo_usuario = tipo_usuario; // Actualizar tipo si cambió
            await fs.writeFile(archivoUsuarios, JSON.stringify(usuarios, null, 2));
            console.log('✅ Usuario existente actualizado:', usuario.email);
        }

        // Generar JWT
        const token = jwt.sign(
            {
                id: usuario.id,
                email: usuario.email,
                tipo: usuario.tipo_usuario
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        console.log('✅ JWT generado para:', usuario.email);

        // Determinar redirección según tipo de usuario
        let redirectUrl = '/pedidos.html';
        if (tipo_usuario === 'comercio') {
            redirectUrl = '/panel-comercio.html';
        } else if (tipo_usuario === 'repartidor') {
            redirectUrl = '/panel-repartidor.html';
        }
        console.log('🔄 Redirigiendo a:', redirectUrl);

        // Cerrar popup y notificar a la ventana principal
        console.log('📤 Enviando respuesta HTML con postMessage');
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Autenticación exitosa</title>
                <style>
                    body {
                        font-family: 'Segoe UI', sans-serif;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        margin: 0;
                        background: linear-gradient(135deg, #06b6d4, #0891b2);
                        color: white;
                    }
                    .success {
                        text-align: center;
                        animation: fadeIn 0.5s;
                    }
                    @keyframes fadeIn {
                        from { opacity: 0; transform: scale(0.9); }
                        to { opacity: 1; transform: scale(1); }
                    }
                    .checkmark {
                        font-size: 4rem;
                        margin-bottom: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="success">
                    <div class="checkmark">✅</div>
                    <h1>¡Autenticación exitosa!</h1>
                    <p>Redirigiendo...</p>
                </div>
                <script>
                    // Enviar datos a la ventana principal
                    if (window.opener) {
                        window.opener.postMessage({
                            type: 'google-auth-success',
                            token: '${token}',
                            user: ${JSON.stringify({
                                id: usuario.id,
                                nombre: usuario.nombre,
                                email: usuario.email,
                                foto: usuario.foto,
                                tipo: usuario.tipo_usuario
                            })},
                            redirectUrl: '${redirectUrl}'
                        }, '*');
                        
                        // Cerrar ventana después de 2 segundos
                        setTimeout(() => {
                            window.close();
                        }, 2000);
                    } else {
                        // Fallback: guardar en sessionStorage y redirigir
                        sessionStorage.setItem('google_auth_success', JSON.stringify({
                            token: '${token}',
                            user: ${JSON.stringify({
                                id: usuario.id,
                                nombre: usuario.nombre,
                                email: usuario.email,
                                foto: usuario.foto,
                                tipo: usuario.tipo_usuario
                            })},
                            redirectUrl: '${redirectUrl}'
                        }));
                        
                        // Redirigir a la página principal
                        window.location.href = 'http://localhost:3000/?google_auth=success';
                    }
                </script>
            </body>
            </html>
        `);

    } catch (error) {
        console.error('Error Google OAuth Callback:', error);
        res.status(500).send(`
            <script>
                window.opener.postMessage({
                    type: 'google-auth-error',
                    message: 'Error en la autenticación con Google'
                }, '*');
                window.close();
            </script>
        `);
    }
};

module.exports = {
    initGoogleAuth: exports.initGoogleAuth,
    googleCallback: exports.googleCallback
};
