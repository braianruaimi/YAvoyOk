// ====================================
// YAVOY v3.1 ENTERPRISE - EMAIL CONFIG
// ====================================
// Configuración de email Hostinger para notificaciones

const nodemailer = require('nodemailer');

// ========================================
// 📧 CONFIGURACIÓN SMTP HOSTINGER
// ========================================
const emailConfig = {
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true' || false,
    auth: {
        user: process.env.SMTP_USER || 'univerzasite@gmail.com',
        pass: process.env.SMTP_PASS || 'Univerzasite25!'
    },
    tls: {
        rejectUnauthorized: false
    }
};

// ========================================
// 🚀 CREAR TRANSPORTER
// ========================================
let transporter;

try {
    transporter = nodemailer.createTransporter(emailConfig);
    console.log('📧 Transporter de email Hostinger configurado');
} catch (error) {
    console.error('❌ Error configurando email:', error.message);
}

// ========================================
// 📨 FUNCIÓN PARA ENVIAR EMAILS
// ========================================
async function sendEmail(options) {
    try {
        const mailOptions = {
            from: `${options.fromName || 'YAvoy Enterprise'} <${emailConfig.auth.user}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email enviado:', info.messageId);
        return { success: true, messageId: info.messageId };

    } catch (error) {
        console.error('❌ Error enviando email:', error.message);
        return { success: false, error: error.message };
    }
}

// ========================================
// 🎯 TEMPLATES DE EMAILS
// ========================================

// Email de bienvenida
async function sendWelcomeEmail(userEmail, userName) {
    const html = `
        <div style="background: linear-gradient(135deg, #020617, #1e293b); color: #ffffff; padding: 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; background: rgba(2, 6, 23, 0.95); border: 1px solid #fbbf24; border-radius: 16px; padding: 32px; backdrop-filter: blur(10px);">
                <div style="text-align: center; margin-bottom: 32px;">
                    <h1 style="color: #fbbf24; margin: 0; font-size: 32px;">🚀 ¡Bienvenido a YAvoy!</h1>
                    <p style="color: #e5e7eb; font-size: 18px; margin: 16px 0;">Enterprise v3.1</p>
                </div>
                
                <div style="margin-bottom: 32px;">
                    <h2 style="color: #ffffff; margin-bottom: 16px;">Hola ${userName},</h2>
                    <p style="color: #e5e7eb; line-height: 1.6; font-size: 16px;">
                        Tu cuenta en YAvoy Enterprise ha sido creada exitosamente. Ahora puedes acceder a nuestra plataforma líder de entregas con tecnología de vanguardia.
                    </p>
                </div>
                
                <div style="background: rgba(251, 191, 36, 0.1); border: 1px solid #fbbf24; border-radius: 8px; padding: 24px; margin: 24px 0;">
                    <h3 style="color: #fbbf24; margin-top: 0;">🔐 Características Premium Activadas:</h3>
                    <ul style="color: #e5e7eb; list-style: none; padding: 0;">
                        <li>✅ Autenticación biométrica</li>
                        <li>✅ Dashboard en tiempo real</li>
                        <li>✅ GPS tracking avanzado</li>
                        <li>✅ Analytics empresariales</li>
                        <li>✅ Soporte 24/7</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin: 32px 0;">
                    <a href="https://yavoy.com/login" style="background: linear-gradient(135deg, #fbbf24, #f59e0b); color: #1f2937; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                        Acceder a mi Dashboard
                    </a>
                </div>
                
                <div style="text-align: center; color: #9ca3af; font-size: 14px;">
                    <p>Si tienes alguna pregunta, contacta a nuestro equipo:</p>
                    <p>📧 uniwersasite@gmail.com | 📞 Soporte 24/7</p>
                    <p style="margin-top: 24px; border-top: 1px solid #374151; padding-top: 16px;">
                        © 2026 YAvoy Enterprise. Todos los derechos reservados.
                    </p>
                </div>
            </div>
        </div>
    `;

    return await sendEmail({
        to: userEmail,
        subject: '🚀 ¡Bienvenido a YAvoy Enterprise!',
        html,
        fromName: 'YAvoy Enterprise'
    });
}

// Email de recuperación de contraseña
async function sendPasswordResetEmail(userEmail, resetToken) {
    const resetUrl = `https://yavoy.com/reset-password?token=${resetToken}`;

    const html = `
        <div style="background: linear-gradient(135deg, #020617, #1e293b); color: #ffffff; padding: 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; background: rgba(2, 6, 23, 0.95); border: 1px solid #fbbf24; border-radius: 16px; padding: 32px;">
                <div style="text-align: center; margin-bottom: 32px;">
                    <h1 style="color: #fbbf24; margin: 0;">🔐 Recuperar Contraseña</h1>
                    <p style="color: #e5e7eb;">YAvoy Enterprise</p>
                </div>
                
                <div style="margin-bottom: 32px;">
                    <p style="color: #e5e7eb; line-height: 1.6;">
                        Recibimos una solicitud para restablecer la contraseña de tu cuenta en YAvoy Enterprise.
                    </p>
                    <p style="color: #e5e7eb; line-height: 1.6;">
                        Haz clic en el botón de abajo para crear una nueva contraseña:
                    </p>
                </div>
                
                <div style="text-align: center; margin: 32px 0;">
                    <a href="${resetUrl}" style="background: linear-gradient(135deg, #fbbf24, #f59e0b); color: #1f2937; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                        Restablecer Contraseña
                    </a>
                </div>
                
                <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: 8px; padding: 16px; margin: 24px 0;">
                    <p style="color: #fbbf24; margin: 0; font-size: 14px;">
                        ⚠️ Este enlace expirará en 1 hora. Si no solicitaste este cambio, puedes ignorar este email.
                    </p>
                </div>
                
                <div style="text-align: center; color: #9ca3af; font-size: 14px;">
                    <p>© 2026 YAvoy Enterprise</p>
                </div>
            </div>
        </div>
    `;

    return await sendEmail({
        to: userEmail,
        subject: '🔐 Restablecer Contraseña - YAvoy Enterprise',
        html,
        fromName: 'YAvoy Enterprise Security'
    });
}

// Email de notificación de pedido
async function sendOrderNotification(userEmail, orderDetails) {
    const html = `
        <div style="background: linear-gradient(135deg, #020617, #1e293b); color: #ffffff; padding: 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; background: rgba(2, 6, 23, 0.95); border: 1px solid #fbbf24; border-radius: 16px; padding: 32px;">
                <div style="text-align: center; margin-bottom: 32px;">
                    <h1 style="color: #fbbf24; margin: 0;">📦 Nuevo Pedido</h1>
                    <p style="color: #e5e7eb;">YAvoy Enterprise</p>
                </div>
                
                <div style="margin-bottom: 24px;">
                    <h2 style="color: #ffffff;">Detalles del Pedido #${orderDetails.id}</h2>
                    <div style="background: rgba(251, 191, 36, 0.1); border: 1px solid #fbbf24; border-radius: 8px; padding: 16px;">
                        <p style="color: #e5e7eb; margin: 8px 0;"><strong>Cliente:</strong> ${orderDetails.cliente}</p>
                        <p style="color: #e5e7eb; margin: 8px 0;"><strong>Dirección:</strong> ${orderDetails.direccion}</p>
                        <p style="color: #e5e7eb; margin: 8px 0;"><strong>Total:</strong> $${orderDetails.total}</p>
                        <p style="color: #e5e7eb; margin: 8px 0;"><strong>Estado:</strong> ${orderDetails.estado}</p>
                    </div>
                </div>
                
                <div style="text-align: center; margin: 32px 0;">
                    <a href="https://yavoy.com/pedidos/${orderDetails.id}" style="background: linear-gradient(135deg, #fbbf24, #f59e0b); color: #1f2937; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                        Ver Pedido Completo
                    </a>
                </div>
                
                <div style="text-align: center; color: #9ca3af; font-size: 14px;">
                    <p>© 2026 YAvoy Enterprise</p>
                </div>
            </div>
        </div>
    `;

    return await sendEmail({
        to: userEmail,
        subject: `📦 Nuevo Pedido #${orderDetails.id} - YAvoy Enterprise`,
        html,
        fromName: 'YAvoy Enterprise Notificaciones'
    });
}

// ========================================
// 🔍 VERIFICAR CONEXIÓN
// ========================================
async function verifyEmailConnection() {
    try {
        await transporter.verify();
        console.log('✅ Conexión de email Hostinger verificada exitosamente');
        return true;
    } catch (error) {
        console.error('❌ Error verificando conexión de email:', error.message);
        return false;
    }
}

module.exports = {
    sendEmail,
    sendWelcomeEmail,
    sendPasswordResetEmail,
    sendOrderNotification,
    verifyEmailConnection,
    transporter
};

// ====================================
// CTO: Email Config Hostinger Listo
// ====================================