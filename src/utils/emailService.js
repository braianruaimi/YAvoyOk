/**
 * ====================================
 * YAVOY v3.1 - SERVICIO DE EMAIL
 * ====================================
 * 
 * Gestiona el envío de emails de confirmación, notificaciones, etc.
 * Usa Nodemailer con Gmail o servicio SMTP configurado
 */

const nodemailer = require('nodemailer');
const crypto = require('crypto');

class EmailService {
    constructor() {
        this.transporter = this.initializeTransporter();
        this.emailTemplate = this.getEmailTemplate.bind(this);
    }

    /**
     * Inicializa el transportador de email
     * Usa Hostinger SMTP (puerto 465 SSL - configuración correcta)
     * @returns {nodemailer.Transporter|null}
     */
    initializeTransporter() {
        try {
            // Usar SIEMPRE Hostinger SMTP con puerto 465 (SSL directo)
            const smtpConfig = {
                host: process.env.SMTP_HOST || 'smtp.hostinger.com',
                port: parseInt(process.env.SMTP_PORT || 465),
                secure: true, // Puerto 465 requiere SSL directo
                auth: {
                    user: process.env.SMTP_USER || 'yavoyen5@yavoy.space',
                    pass: process.env.SMTP_PASS || 'BrainCesar26!'
                }
            };

            console.log(`📧 Inicializando transporter SMTP:`);
            console.log(`   Host: ${smtpConfig.host}`);
            console.log(`   Puerto: ${smtpConfig.port}`);
            console.log(`   Usuario: ${smtpConfig.auth.user}`);
            console.log(`   Secure (SSL): ${smtpConfig.secure}`);

            const transporter = nodemailer.createTransport(smtpConfig);

            // Verificar conexión
            transporter.verify((error, success) => {
                if (error) {
                    console.error('❌ Error verificando conexión SMTP:', error.message);
                } else {
                    console.log('✅ Conexión SMTP verificada exitosamente');
                }
            });

            return transporter;
        } catch (error) {
            console.error('❌ Error inicializando servicio de email:', error);
            return null;
        }
    }

    /**
     * Genera un código de confirmación aleatorio
     * @returns {string} Código de 6 dígitos
     */
    generateConfirmationCode() {
        return crypto.randomInt(100000, 999999).toString();
    }

    /**
     * Genera un token de verificación único
     * @returns {string} Token hex de 32 caracteres
     */
    generateVerificationToken() {
        return crypto.randomBytes(16).toString('hex');
    }

    /**
     * Envía email de confirmación de registro
     * @param {Object} userData - Datos del usuario
     * @param {string} userData.email - Email del usuario
     * @param {string} userData.nombre - Nombre del usuario
     * @param {string} userData.id - ID asignado del usuario
     * @param {string} tipo - Tipo de usuario: 'comercio', 'repartidor', 'cliente'
     * @returns {Promise<Object>} {success, confirmationCode, message}
     */
    async sendRegistrationEmail(userData, tipo = 'cliente') {
        try {
            if (!this.transporter) {
                console.warn('⚠️  Servicio de email no configurado. Simulando envío...');
                return this.mockEmailResponse(userData, tipo);
            }

            const { email, nombre, id } = userData;
            const confirmationCode = this.generateConfirmationCode();

            // Traducir tipos de usuario
            const tiposMap = {
                'comercio': 'Comercio',
                'repartidor': 'Repartidor',
                'cliente': 'Cliente'
            };

            const tipoLabel = tiposMap[tipo] || 'Usuario';

            // Generar template HTML
            const htmlContent = this.getEmailTemplate(nombre, confirmationCode, id, tipoLabel);

            const mailOptions = {
                from: 'YAvoy <yavoyen5@yavoy.space>',
                to: email,
                subject: `✅ Confirma tu registro en YAvoy - Código: ${confirmationCode}`,
                html: htmlContent,
                text: `
Hola ${nombre},

¡Bienvenido a YAvoy!

Tu número de usuario es: ${id}
Tu código de confirmación es: ${confirmationCode}

Por favor, ingresa este código en la plataforma para activar tu cuenta.
El código expira en 24 horas.

Si no fuiste tú quien se registró, ignora este mensaje.

Saludos,
El equipo de YAvoy
                `.trim()
            };

            // Enviar email
            const info = await this.transporter.sendMail(mailOptions);

            console.log(`✅ Email enviado a ${email}:`, info.messageId);

            return {
                success: true,
                message: 'Email de confirmación enviado exitosamente',
                confirmationCode,
                userId: id,
                expiresIn: '24 horas'
            };

        } catch (error) {
            console.error('❌ Error enviando email de confirmación:', error);
            
            // Retornar respuesta de fallo pero no bloquear el registro
            return {
                success: false,
                message: 'No se pudo enviar el email, pero la cuenta fue creada',
                error: error.message,
                userId: userData.id
            };
        }
    }

    /**
     * Envía email de bienvenida después de verificación
     * @param {string} email - Email del usuario
     * @param {string} nombre - Nombre del usuario
     * @param {string} id - ID del usuario
     */
    async sendWelcomeEmail(email, nombre, id) {
        try {
            if (!this.transporter) {
                console.warn('⚠️  Servicio de email no configurado.');
                return { success: false };
            }

            const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .header { color: #06b6d4; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
        .content { color: #333; line-height: 1.6; }
        .footer { color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">🎉 ¡Bienvenido a YAvoy!</div>
        <div class="content">
            <p>Hola ${nombre},</p>
            <p>Tu cuenta ha sido verificada exitosamente. Ya puedes usar todos los servicios de YAvoy.</p>
            <p><strong>Tu ID de usuario:</strong> ${id}</p>
            <p>Accede a tu panel: <a href="https://yavoy.com.ar/login">Inicia sesión aquí</a></p>
            <hr>
            <p>¿Preguntas? Contacta a nuestro soporte en support@yavoy.com.ar</p>
        </div>
        <div class="footer">
            <p>© 2026 YAvoy - Sistema de entregas inteligente</p>
        </div>
    </div>
</body>
</html>
            `.trim();

            const mailOptions = {
                from: 'YAvoy <yavoyen5@yavoy.space>',
                to: email,
                subject: '🎉 ¡Tu cuenta de YAvoy está lista!',
                html: htmlContent
            };

            await this.transporter.sendMail(mailOptions);
            return { success: true };

        } catch (error) {
            console.error('Error enviando email de bienvenida:', error);
            return { success: false };
        }
    }

    /**
     * Template HTML para email de confirmación
     * @private
     */
    getEmailTemplate(nombre, codigo, userId, tipoUsuario) {
        return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 100%);
            color: #333;
        }
        .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background: white; 
            border-radius: 12px; 
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
        }
        .logo { font-size: 32px; font-weight: 900; margin-bottom: 10px; }
        .subtitle { font-size: 14px; opacity: 0.9; }
        
        .content { padding: 40px 20px; }
        .greeting { font-size: 18px; font-weight: 600; color: #0c0c0c; margin-bottom: 15px; }
        .message { color: #666; line-height: 1.6; margin-bottom: 30px; }
        
        .info-box {
            background: #f0f9fa;
            border-left: 4px solid #06b6d4;
            padding: 20px;
            border-radius: 4px;
            margin: 20px 0;
        }
        .info-label { 
            font-size: 12px; 
            color: #999; 
            text-transform: uppercase; 
            font-weight: 600;
            letter-spacing: 0.5px;
        }
        .info-value { 
            font-size: 20px; 
            font-weight: bold; 
            color: #06b6d4;
            margin-top: 8px;
            font-family: 'Courier New', monospace;
        }
        
        .code-box {
            background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin: 30px 0;
        }
        .code-label { font-size: 12px; opacity: 0.9; margin-bottom: 10px; }
        .code-value { 
            font-size: 36px; 
            font-weight: bold; 
            letter-spacing: 5px;
            font-family: 'Courier New', monospace;
        }
        
        .expiry { 
            background: #fff3cd; 
            color: #856404;
            padding: 12px;
            border-radius: 4px;
            font-size: 13px;
            text-align: center;
            margin: 20px 0;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
            color: white;
            padding: 12px 30px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
        }
        
        .footer {
            background: #f8f8f8;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #eee;
        }
        .footer-links { margin: 10px 0; }
        .footer-links a { color: #06b6d4; text-decoration: none; margin: 0 10px; }
        
        .security-note {
            font-size: 11px;
            color: #999;
            margin-top: 15px;
            padding: 10px;
            background: #f5f5f5;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="logo">YAvoy</div>
            <div class="subtitle">Sistema de Entregas Inteligente</div>
        </div>
        
        <!-- Content -->
        <div class="content">
            <div class="greeting">¡Hola ${nombre}! 👋</div>
            
            <div class="message">
                Gracias por registrarte en <strong>YAvoy</strong>. Te estamos muy felices de tenerte como parte de nuestra comunidad.
                <br><br>
                Para activar tu cuenta de <strong>${tipoUsuario}</strong>, necesitas confirmar tu registro usando el código que aparece abajo.
            </div>
            
            <!-- User ID -->
            <div class="info-box">
                <div class="info-label">Tu número de usuario (ID)</div>
                <div class="info-value">${userId}</div>
            </div>
            
            <!-- Confirmation Code -->
            <div class="code-box">
                <div class="code-label">CÓDIGO DE CONFIRMACIÓN</div>
                <div class="code-value">${codigo}</div>
            </div>
            
            <!-- Expiry Warning -->
            <div class="expiry">
                ⏰ Este código expira en <strong>24 horas</strong>. No lo compartas con nadie.
            </div>
            
            <!-- Instructions -->
            <div style="margin: 30px 0; padding: 20px; background: #f9f9f9; border-radius: 8px;">
                <strong style="color: #0c0c0c;">¿Cómo confirmar tu cuenta?</strong>
                <ol style="margin: 10px 0 0 20px; color: #666;">
                    <li>Ingresa a tu panel de YAvoy</li>
                    <li>Ve a "Confirmar Registro" o "Verificación"</li>
                    <li>Ingresa el código de arriba</li>
                    <li>¡Tu cuenta estará lista para usar!</li>
                </ol>
            </div>
            
            <!-- Security Note -->
            <div class="security-note">
                🔒 <strong>Seguridad:</strong> Si no solicitaste este registro o tienes dudas, contacta a nuestro equipo de soporte.
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <div class="footer-links">
                <a href="https://yavoy.com.ar">YAvoy.com.ar</a> |
                <a href="https://yavoy.com.ar/soporte">Soporte</a> |
                <a href="https://yavoy.com.ar/privacidad">Privacidad</a>
            </div>
            <p style="margin-top: 10px;">
                © 2026 YAvoy Enterprise. Todos los derechos reservados.
            </p>
        </div>
    </div>
</body>
</html>
        `.trim();
    }

    /**
     * Envía email para resetear contraseña
     * @param {object} data - { email, nombre, resetUrl }
     */
    async sendPasswordResetEmail(data) {
        try {
            if (!this.transporter) {
                console.warn('⚠️  Servicio de email no configurado.');
                return { success: false };
            }

            const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .header { color: #f59e0b; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
        .content { color: #333; line-height: 1.6; }
        .reset-button { display: inline-block; background-color: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .warning { color: #ef4444; font-size: 12px; font-style: italic; margin-top: 10px; }
        .footer { color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">🔐 Recupera tu Contraseña</div>
        <div class="content">
            <p>Hola ${data.nombre},</p>
            <p>Hemos recibido una solicitud para resetear tu contraseña en YAvoy. Haz clic en el botón de abajo para crear una nueva contraseña.</p>
            <a href="${data.resetUrl}" class="reset-button">Resetear Contraseña</a>
            <p>O copia y pega este enlace en tu navegador:</p>
            <p><code>${data.resetUrl}</code></p>
            <p class="warning">⚠️ Este enlace expirará en 1 hora por seguridad.</p>
            <p>Si no solicitaste el reset de contraseña, puedes ignorar este email.</p>
            <hr>
            <p>¿Preguntas? Contacta a nuestro soporte en support@yavoy.com.ar</p>
        </div>
        <div class="footer">
            <p>© 2026 YAvoy - Sistema de entregas inteligente</p>
        </div>
    </div>
</body>
</html>
            `.trim();

            const mailOptions = {
                from: process.env.SMTP_USER || 'yavoyen5@yavoy.space',
                to: data.email,
                subject: '[YAvoy] Recupera tu contraseña',
                html: htmlContent
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log(`✅ Email de reset enviado a: ${data.email}`);
            return {
                success: true,
                message: 'Email de reset enviado',
                messageId: info.messageId
            };
        } catch (error) {
            console.error('❌ Error enviando email de reset:', error);
            return {
                success: false,
                message: 'No se pudo enviar el email de reset',
                error: error.message
            };
        }
    }

    /**
     * Respuesta simulada cuando no hay email configurado
     * Useful para desarrollo sin credenciales reales
     */
    mockEmailResponse(userData, tipo) {
        const confirmationCode = this.generateConfirmationCode();
        console.log(`
┌─────────────────────────────────────────┐
│  📧 SIMULACIÓN DE EMAIL (MODO DESARROLLO)
├─────────────────────────────────────────┤
│  Para: ${userData.email}
│  Nombre: ${userData.nombre}
│  Tipo: ${tipo}
│  ID Usuario: ${userData.id}
│  Código: ${confirmationCode}
└─────────────────────────────────────────┘
        `);
        return {
            success: true,
            message: 'Email simulado (modo desarrollo)',
            confirmationCode,
            userId: userData.id,
            isDeveloperMode: true
        };
    }
}

// Exportar singleton
module.exports = new EmailService();
