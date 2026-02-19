/**
 * YAvoy v3.1 Enterprise - Rutas de Documentación API
 * Swagger UI y especificaciones OpenAPI
 */

const express = require('express');
const router = express.Router();
const { swaggerSpec, swaggerUi, swaggerUiOptions } = require('../config/swagger-config');

// ========================================
// 📚 SWAGGER UI - DOCUMENTACIÓN INTERACTIVA
// ========================================

/**
 * @swagger
 * /api/docs:
 *   get:
 *     summary: Documentación interactiva de la API
 *     description: |
 *       Interfaz web interactiva para explorar y probar la API de YAvoy.
 *       
 *       ### Características:
 *       - 🔍 Exploración interactiva de endpoints
 *       - 🧪 Pruebas en vivo de la API
 *       - 📝 Documentación completa con ejemplos
 *       - 🔐 Soporte para autenticación JWT y WebAuthn
 *       - 📊 Esquemas de datos detallados
 *       
 *       ### Autenticación:
 *       Para probar endpoints protegidos, usar el botón "Authorize" y proporcionar:
 *       - **Bearer Token**: JWT obtenido del endpoint `/auth/login`
 *       - **WebAuthn**: Token biométrico desde `/webauthn/authenticate`
 *       - **CEO Auth**: Token con permisos administrativos
 *       
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: Interfaz Swagger UI cargada correctamente
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               description: Página HTML con Swagger UI
 */
router.use('/docs', swaggerUi.serve);
router.get('/docs', swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// ========================================
// 📄 ESPECIFICACIÓN OPENAPI JSON
// ========================================

/**
 * @swagger
 * /api/docs/json:
 *   get:
 *     summary: Especificación OpenAPI en formato JSON
 *     description: |
 *       Obtener la especificación completa de la API en formato JSON OpenAPI 3.0.
 *       
 *       ### Casos de uso:
 *       - 🔧 Generación de clientes SDK
 *       - 📋 Importación a Postman/Insomnia
 *       - 🧪 Validación automática de esquemas
 *       - 📊 Análisis de cobertura de API
 *       
 *       ### Formato:
 *       Especificación completa OpenAPI 3.0 con:
 *       - Todos los endpoints documentados
 *       - Esquemas de datos completos
 *       - Ejemplos y validaciones
 *       - Configuración de seguridad
 *       
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: Especificación OpenAPI en JSON
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Especificación OpenAPI 3.0 completa
 *               properties:
 *                 openapi:
 *                   type: string
 *                   example: "3.0.0"
 *                 info:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       example: "YAvoy v3.1 Enterprise API"
 *                     version:
 *                       type: string
 *                       example: "3.1.0"
 *                 paths:
 *                   type: object
 *                   description: Todos los endpoints de la API
 *                 components:
 *                   type: object
 *                   description: Esquemas, respuestas y configuración de seguridad
 *       500:
 *         description: Error interno generando la especificación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/docs/json', (req, res) => {
    try {
        const advancedLogger = req.app.get('logger');
        
        // Log de acceso a documentación
        advancedLogger?.logAPI('info', '/api/docs/json', 'OpenAPI specification requested', {
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            timestamp: new Date().toISOString()
        });

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache por 1 hora
        
        res.json(swaggerSpec);
        
    } catch (error) {
        const advancedLogger = req.app.get('logger');
        
        advancedLogger?.error('Error generando especificación OpenAPI', {
            module: 'Documentation',
            error: error.message,
            stack: error.stack,
            endpoint: '/api/docs/json'
        });

        res.status(500).json({
            success: false,
            error: 'DOCUMENTATION_ERROR',
            message: 'Error generando la especificación de la API',
            timestamp: new Date().toISOString()
        });
    }
});

// ========================================
// 📊 ESTADÍSTICAS DE DOCUMENTACIÓN
// ========================================

/**
 * @swagger
 * /api/docs/stats:
 *   get:
 *     summary: Estadísticas de la documentación API
 *     description: |
 *       Obtener métricas y estadísticas sobre la documentación de la API.
 *       
 *       ### Métricas incluidas:
 *       - 📈 Número total de endpoints documentados
 *       - 🏷️ Endpoints por categoría/tag
 *       - 🔐 Endpoints protegidos vs públicos  
 *       - 📝 Cobertura de documentación
 *       - 🧪 Endpoints con ejemplos
 *       
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: Estadísticas de documentación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalEndpoints:
 *                       type: integer
 *                       description: Total de endpoints documentados
 *                       example: 45
 *                     endpointsByTag:
 *                       type: object
 *                       description: Endpoints agrupados por categoría
 *                       example: {
 *                         "Auth": 8,
 *                         "Pedidos": 15,
 *                         "GPS": 6
 *                       }
 *                     securityLevel:
 *                       type: object
 *                       properties:
 *                         public:
 *                           type: integer
 *                           example: 5
 *                         authenticated:
 *                           type: integer
 *                           example: 35
 *                         admin:
 *                           type: integer
 *                           example: 5
 *                     coverageStats:
 *                       type: object
 *                       properties:
 *                         documented:
 *                           type: integer
 *                           example: 45
 *                         withExamples:
 *                           type: integer
 *                           example: 42
 *                         withSchemas:
 *                           type: integer
 *                           example: 40
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/docs/stats', (req, res) => {
    try {
        const advancedLogger = req.app.get('logger');
        
        // Analizar especificación para generar estadísticas
        const paths = swaggerSpec.paths || {};
        const totalEndpoints = Object.keys(paths).length;
        
        // Contar endpoints por método HTTP
        const endpointsByMethod = {};
        const endpointsByTag = {};
        const securityLevels = { public: 0, authenticated: 0, admin: 0 };
        
        Object.entries(paths).forEach(([path, methods]) => {
            Object.entries(methods).forEach(([method, spec]) => {
                // Contar métodos
                endpointsByMethod[method.toUpperCase()] = (endpointsByMethod[method.toUpperCase()] || 0) + 1;
                
                // Contar por tags
                const tags = spec.tags || ['Untagged'];
                tags.forEach(tag => {
                    endpointsByTag[tag] = (endpointsByTag[tag] || 0) + 1;
                });
                
                // Analizar seguridad
                if (!spec.security || spec.security.length === 0) {
                    securityLevels.public++;
                } else if (spec.security.some(s => s.ceoAuth)) {
                    securityLevels.admin++;
                } else {
                    securityLevels.authenticated++;
                }
            });
        });
        
        // Estadísticas de cobertura
        const coverageStats = {
            documented: totalEndpoints,
            withExamples: Object.values(paths).reduce((count, methods) => {
                return count + Object.values(methods).filter(spec => 
                    spec.responses && Object.values(spec.responses).some(response => 
                        response.content && Object.values(response.content).some(content => content.example)
                    )
                ).length;
            }, 0),
            withSchemas: Object.values(paths).reduce((count, methods) => {
                return count + Object.values(methods).filter(spec => 
                    spec.requestBody || spec.responses
                ).length;
            }, 0)
        };
        
        const stats = {
            success: true,
            data: {
                totalEndpoints,
                endpointsByMethod,
                endpointsByTag,
                securityLevel: securityLevels,
                coverageStats,
                apiVersion: swaggerSpec.info?.version || '3.1.0',
                lastUpdated: new Date().toISOString()
            },
            timestamp: new Date().toISOString()
        };
        
        // Log de acceso a estadísticas
        advancedLogger?.logAPI('info', '/api/docs/stats', 'Documentation stats requested', {
            totalEndpoints,
            userAgent: req.get('User-Agent'),
            ip: req.ip
        });
        
        res.json(stats);
        
    } catch (error) {
        const advancedLogger = req.app.get('logger');
        
        advancedLogger?.error('Error generando estadísticas de documentación', {
            module: 'Documentation',
            error: error.message,
            stack: error.stack,
            endpoint: '/api/docs/stats'
        });

        res.status(500).json({
            success: false,
            error: 'STATS_ERROR',
            message: 'Error calculando estadísticas de documentación',
            timestamp: new Date().toISOString()
        });
    }
});

// ========================================
// 🔄 REDIRECCIÓN A DOCUMENTACIÓN
// ========================================

/**
 * @swagger
 * /api:
 *   get:
 *     summary: Redirección a documentación
 *     description: Redirige al usuario a la documentación interactiva de la API
 *     tags: [Documentation]
 *     responses:
 *       302:
 *         description: Redirección a /api/docs
 */
router.get('/', (req, res) => {
    res.redirect('/api/docs');
});

module.exports = router;