/**
 * ========================================
 * YAVOY v3.1 ENTERPRISE - PM2 ECOSYSTEM
 * ========================================
 * CTO: Configuración optimizada para Hostinger VPS
 * Cluster mode, auto-restart, monitoring avanzado
 * @version 3.1 Enterprise
 */

module.exports = {
    apps: [
        {
            name: 'yavoy-enterprise-v3.1',
            script: './server-enterprise.js',

            // ========================================
            // 🚀 CONFIGURACIÓN DE CLUSTER
            // ========================================
            instances: 'max', // Usar todos los cores disponibles
            exec_mode: 'cluster',

            // ========================================
            // 🔄 AUTO-RESTART Y MONITOREO
            // ========================================
            autorestart: true,
            watch: false, // Desactivar en producción
            max_memory_restart: '1G',
            max_restarts: 10,
            min_uptime: '10s',
            restart_delay: 4000,

            // ========================================
            // 📊 CONFIGURACIÓN DE LOGS
            // ========================================
            log_file: './logs/yavoy-combined.log',
            out_file: './logs/yavoy-out.log',
            error_file: './logs/yavoy-error.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,
            log_type: 'json',

            // ========================================
            // 🌍 VARIABLES DE ENTORNO - DESARROLLO
            // ========================================
            env: {
                NODE_ENV: 'development',
                PORT: 3000,
                HOST: '0.0.0.0',

                // Base de datos
                DB_HOST: 'localhost',
                DB_PORT: 5432,
                DB_NAME: 'yavoy_enterprise',
                DB_USER: 'yavoy_user',
                DB_PASSWORD: 'YAvoy2024!',

                // JWT y Seguridad
                JWT_SECRET: 'YAvoy_Enterprise_JWT_Secret_2024_Ultra_Secure',
                JWT_EXPIRES_IN: '24h',

                // Redis Cache
                REDIS_URL: 'redis://localhost:6379',

                // Configuración API
                API_RATE_LIMIT: '100',
                API_TIMEOUT: '30000',

                // Logs
                LOG_LEVEL: 'info',

                // Features
                BIOMETRIC_ENABLED: 'true',
                GPS_TRACKING: 'true',
                ANALYTICS_ENABLED: 'true',

                // Email Configuration Hostinger
                SMTP_HOST: 'smtp.hostinger.com',
                SMTP_PORT: '587',
                SMTP_USER: 'univerzasite@gmail.com',
                SMTP_PASS: 'Univerzasite25!',
                SMTP_SECURE: 'false',
                SMTP_TLS: 'true',

                // Performance
                UV_THREADPOOL_SIZE: 128,
                NODE_OPTIONS: '--max-old-space-size=4096'
            },

            // ========================================
            // 🏭 VARIABLES DE ENTORNO - PRODUCCIÓN
            // ========================================
            env_production: {
                NODE_ENV: 'production',
                PORT: 3000,
                HOST: '0.0.0.0',

                // Hostinger VPS Database
                DB_HOST: 'localhost',
                DB_PORT: 5432,
                DB_NAME: 'yavoy_prod',
                DB_USER: 'yavoy_prod_user',
                DB_PASSWORD: 'YAvoy_Prod_2024_Ultra_Secure',

                // Security Production
                JWT_SECRET: 'YAvoy_Production_JWT_Secret_2024_Enterprise_Grade',
                JWT_EXPIRES_IN: '8h',

                // Redis Production
                REDIS_URL: 'redis://localhost:6379',

                // Performance Production
                API_RATE_LIMIT: '1000',
                API_TIMEOUT: '10000',

                // Logs Production
                LOG_LEVEL: 'warn',

                // Email Configuration Hostinger Production
                SMTP_HOST: 'smtp.hostinger.com',
                SMTP_PORT: '587',
                SMTP_USER: 'univerzasite@gmail.com',
                SMTP_PASS: 'Univerzasite25!',
                SMTP_SECURE: 'false',
                SMTP_TLS: 'true',

                // SSL y Security
                HTTPS_ENABLED: 'true',
                FORCE_HTTPS: 'true',

                // Performance optimizations
                UV_THREADPOOL_SIZE: 256,
                NODE_OPTIONS: '--max-old-space-size=8192 --optimize-for-size'
            },

            // ========================================
            // 📈 CONFIGURACIÓN AVANZADA
            // ========================================

            // Configuración de CPU y memoria
            node_args: [
                '--max-old-space-size=4096',
                '--optimize-for-size'
            ],

            // Configuración de red
            listen_timeout: 8000,
            kill_timeout: 5000,

            // Health checks
            health_check_grace_period: 3000,
            health_check_fatal: true,

            // Configuración de clustering
            wait_ready: true,
            ready_timeout: 10000,

            // Configuración de errores
            exp_backoff_restart_delay: 100
        },

        // ========================================
        // 📊 WORKER PARA ANALYTICS
        // ========================================
        {
            name: 'yavoy-analytics-worker',
            script: './workers/analytics-worker.js',
            instances: 1,
            exec_mode: 'fork',
            autorestart: true,
            max_memory_restart: '512M',

            env: {
                NODE_ENV: 'development',
                WORKER_TYPE: 'analytics',
                DB_HOST: 'localhost',
                DB_PORT: 5432,
                LOG_LEVEL: 'info'
            },

            env_production: {
                NODE_ENV: 'production',
                WORKER_TYPE: 'analytics',
                DB_HOST: 'localhost',
                DB_PORT: 5432,
                LOG_LEVEL: 'warn'
            }
        },

        // ========================================
        // 🔔 WORKER PARA NOTIFICACIONES
        // ========================================
        {
            name: 'yavoy-notifications-worker',
            script: './workers/notification-worker.js',
            instances: 1,
            exec_mode: 'fork',
            autorestart: true,
            max_memory_restart: '256M',

            env: {
                NODE_ENV: 'development',
                WORKER_TYPE: 'notifications',
                REDIS_URL: 'redis://localhost:6379',
                LOG_LEVEL: 'info'
            },

            env_production: {
                NODE_ENV: 'production',
                WORKER_TYPE: 'notifications',
                REDIS_URL: 'redis://localhost:6379',
                LOG_LEVEL: 'warn'
            }
        }
    ],

    // ========================================
    // 🚀 DEPLOY CONFIGURATION
    // ========================================
    deploy: {
        production: {
            user: 'yavoy',
            host: ['138.197.71.83'], // IP Hostinger VPS
            ref: 'origin/main',
            repo: 'git@github.com:yavoy/yavoy-enterprise.git',
            path: '/var/www/yavoy-enterprise',

            'pre-deploy-local': 'echo "🚀 Preparando deploy YAvoy Enterprise..."',
            'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production && echo "✅ Deploy completado"',
            'pre-setup': 'mkdir -p /var/www/yavoy-enterprise',

            env: {
                NODE_ENV: 'production'
            }
        },

        staging: {
            user: 'yavoy',
            host: '138.197.71.83',
            ref: 'origin/develop',
            repo: 'git@github.com:yavoy/yavoy-enterprise.git',
            path: '/var/www/yavoy-staging',

            'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging',

            env: {
                NODE_ENV: 'staging',
                PORT: 3001
            }
        }
    }
};

// ========================================
// 📋 COMANDOS ÚTILES PM2 - YAVOY ENTERPRISE
// ========================================

/*
  🚀 INICIAR APLICACIONES:
  pm2 start ecosystem.config.js --env production
  pm2 start ecosystem.config.js (desarrollo)
  
  🔄 GESTIÓN:
  pm2 reload yavoy-enterprise-v3.1      # Reload sin downtime
  pm2 restart yavoy-enterprise-v3.1     # Restart completo
  pm2 stop yavoy-enterprise-v3.1        # Detener
  pm2 delete yavoy-enterprise-v3.1      # Eliminar
  
  📊 MONITOREO:
  pm2 monit                              # Monitor en tiempo real
  pm2 logs yavoy-enterprise-v3.1        # Ver logs
  pm2 logs --lines 100                  # Últimas 100 líneas
  pm2 flush                              # Limpiar logs
  
  📈 INFORMACIÓN:
  pm2 list                               # Lista de procesos
  pm2 show yavoy-enterprise-v3.1        # Detalles del proceso
  pm2 describe yavoy-enterprise-v3.1    # Información completa
  
  💾 PERSISTENCIA:
  pm2 save                               # Guardar configuración actual
  pm2 resurrect                          # Restaurar después de reboot
  pm2 startup                            # Configurar inicio automático
  
  ⚡ DEPLOY:
  pm2 deploy production                  # Deploy a producción
  pm2 deploy staging                     # Deploy a staging
  
  🔧 CLUSTER:
  pm2 scale yavoy-enterprise-v3.1 4     # Escalar a 4 instancias
  pm2 scale yavoy-enterprise-v3.1 max   # Usar todos los cores
  
  📋 WORKERS:
  pm2 start yavoy-analytics-worker
  pm2 start yavoy-notifications-worker
  
  🧹 MANTENIMIENTO:
  pm2 kill                               # Matar daemon PM2
  pm2 update                             # Actualizar PM2
  
*/

// ========================================
// CTO: Configuración PM2 Enterprise Lista
// ====================================
PORT: 3000,
    WS_PORT: 5501,
        LOG_LEVEL: 'debug'
            },

// Variables de entorno PRODUCCIÓN
env_production: {
    NODE_ENV: 'production',
        PORT: 3000,
            WS_PORT: 5501,
                LOG_LEVEL: 'error'
},

// Sistema de Logs optimizado
error_file: './logs/yavoy-error.log',
    out_file: './logs/yavoy-out.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss',
            merge_logs: true,
                time: true,

                    // Rotación de logs (evita logs gigantes)
                    log_type: 'json',

                        // Auto-restart inteligente
                        autorestart: true,
                            max_restarts: 15,
                                min_uptime: '30s',
                                    restart_delay: 4000,

                                        // Gestión de errores avanzada
                                        kill_timeout: 5000,
                                            listen_timeout: 10000,
                                                shutdown_with_message: true,
                                                    wait_ready: true,

                                                        // Restart programado (4 AM diario para mantenimiento)
                                                        cron_restart: '0 4 * * *',

                                                            // Monitoreo de rendimiento
                                                            instance_var: 'INSTANCE_ID',

                                                                // Señales de proceso
                                                                kill_retry_time: 5000

// Configuración avanzada
node_args: '--max-old-space-size=512',

    // Timeouts
    wait_ready: true,

        // Post-deploy hooks
        post_update: ['npm install', 'npm run migrate:postgresql'],

            // Ignorar archivos para watch (si watch: true)
            ignore_watch: [
                'node_modules',
                'logs',
                '.git',
                '*.log',
                'data'
            ],

                // Health check
                exp_backoff_restart_delay: 100
        }
    ],

// Configuración de deploy (opcional)
deploy: {
    production: {
        user: 'root',
            host: 'tu_servidor_hostinger.com',
                ref: 'origin/main',
                    repo: 'git@github.com:tu-usuario/yavoy.git',
                        path: '/var/www/yavoy',
                            'post-deploy': 'npm install && npm run migrate:postgresql && pm2 reload ecosystem.config.js --env production'
    }
}
};
