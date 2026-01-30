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
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/userinfo.profile',
                'https://www.googleapis.com/auth/userinfo.email'
            ],
            prompt: 'select_account'
        });

        res.json({
            success: true,
            authUrl: authUrl
        });
    } catch (error) {
        console.error('Error Google OAuth Init:', error);
        res.status(500).json({
            success: false,
            message: 'Error al inicializar Google OAuth'
        });
    }
};

/**
 * Callback de Google OAuth
 */
exports.googleCallback = async (req, res) => {
    try {
        const { code } = req.query;

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

        // Intercambiar código por tokens
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Obtener información del usuario
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const { data } = await oauth2.userinfo.get();

        // Buscar o crear usuario
        let clientes = [];
        try {
            const clientesData = await fs.readFile(CLIENTES_FILE, 'utf8');
            clientes = JSON.parse(clientesData);
        } catch (error) {
            // Si no existe el archivo, crear array vacío
        }

        let usuario = clientes.find(c => c.email === data.email);

        if (!usuario) {
            // Crear nuevo usuario
            usuario = {
                id: Date.now().toString(),
                nombre: data.name,
                email: data.email,
                telefono: '',
                tipo_usuario: 'cliente',
                googleId: data.id,
                foto: data.picture,
                verificado: true,
                fecha_registro: new Date().toISOString(),
                auth_provider: 'google'
            };

            clientes.push(usuario);
            await fs.writeFile(CLIENTES_FILE, JSON.stringify(clientes, null, 2));
        } else {
            // Actualizar datos de Google si cambió
            usuario.googleId = data.id;
            usuario.foto = data.picture;
            usuario.verificado = true;
            await fs.writeFile(CLIENTES_FILE, JSON.stringify(clientes, null, 2));
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

        // Determinar redirección según tipo de usuario
        let redirectUrl = '/pedidos.html';
        if (usuario.tipo_usuario === 'comercio') {
            redirectUrl = '/panel-comercio.html';
        } else if (usuario.tipo_usuario === 'repartidor') {
            redirectUrl = '/panel-repartidor.html';
        }

        // Cerrar popup y notificar a la ventana principal
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
                    window.opener.postMessage({
                        type: 'google-auth-success',
                        token: '${token}',
                        user: ${JSON.stringify({
                            id: usuario.id,
                            nombre: usuario.nombre,
                            email: usuario.email,
                            foto: usuario.foto
                        })},
                        redirectUrl: '${redirectUrl}'
                    }, '*');

                    // Cerrar ventana después de 2 segundos
                    setTimeout(() => {
                        window.close();
                    }, 2000);
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
