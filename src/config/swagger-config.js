/**
 * YAvoy v3.1 Enterprise - Configuración Swagger/OpenAPI 
 * Documentación automática de la API con validación de esquemas
 */

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Definición base de la API
const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'YAvoy v3.1 Enterprise API',
        version: '3.1.0',
        description: 'API completa para la plataforma de delivery YAvoy Enterprise',
        contact: {
            name: 'YAvoy Development Team',
            email: 'dev@yavoy.app'
        },
        license: {
            name: 'Proprietary',
            url: 'https://yavoy.app/license'
        },
        termsOfService: 'https://yavoy.app/terms'
    },
    servers: [
        {
            url: process.env.NODE_ENV === 'production' 
                ? 'https://yavoy.app/api' 
                : 'http://localhost:5502/api',
            description: process.env.NODE_ENV === 'production' 
                ? 'Servidor de Producción' 
                : 'Servidor de Desarrollo'
        }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Token JWT para autenticación'
            },
            webAuthn: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'WebAuthn',
                description: 'Autenticación biométrica WebAuthn'
            },
            ceoAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Token JWT con permisos CEO/Admin'
            }
        },
        schemas: {
            // ========================================
            // 📦 ESQUEMAS DE PEDIDOS
            // ========================================
            Pedido: {
                type: 'object',
                required: ['clienteId', 'items', 'direccion', 'total'],
                properties: {
                    id: {
                        type: 'string',
                        format: 'uuid',
                        description: 'ID único del pedido',
                        example: '550e8400-e29b-41d4-a716-446655440000'
                    },
                    clienteId: {
                        type: 'string',
                        description: 'ID del cliente que realizó el pedido',
                        example: 'cliente123'
                    },
                    comercioId: {
                        type: 'string',
                        description: 'ID del comercio que recibe el pedido',
                        example: 'comercio456'
                    },
                    repartidorId: {
                        type: 'string',
                        nullable: true,
                        description: 'ID del repartidor asignado',
                        example: 'repartidor789'
                    },
                    estado: {
                        type: 'string',
                        enum: ['pendiente', 'confirmado', 'preparando', 'en_camino', 'entregado', 'cancelado'],
                        description: 'Estado actual del pedido',
                        example: 'pendiente'
                    },
                    items: {
                        type: 'array',
                        description: 'Lista de productos del pedido',
                        items: {
                            $ref: '#/components/schemas/ItemPedido'
                        }
                    },
                    direccion: {
                        $ref: '#/components/schemas/Direccion'
                    },
                    total: {
                        type: 'number',
                        minimum: 0,
                        description: 'Total del pedido en pesos argentinos',
                        example: 1250.50
                    },
                    fechaCreacion: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Fecha y hora de creación del pedido',
                        example: '2024-01-15T10:30:00Z'
                    }
                }
            },
            ItemPedido: {
                type: 'object',
                required: ['productoId', 'cantidad', 'precio'],
                properties: {
                    productoId: {
                        type: 'string',
                        description: 'ID del producto',
                        example: 'prod123'
                    },
                    nombre: {
                        type: 'string',
                        description: 'Nombre del producto',
                        example: 'Pizza Margarita'
                    },
                    cantidad: {
                        type: 'integer',
                        minimum: 1,
                        description: 'Cantidad del producto',
                        example: 2
                    },
                    precio: {
                        type: 'number',
                        minimum: 0,
                        description: 'Precio unitario',
                        example: 625.25
                    },
                    observaciones: {
                        type: 'string',
                        nullable: true,
                        description: 'Observaciones especiales',
                        example: 'Sin cebolla'
                    }
                }
            },
            Direccion: {
                type: 'object',
                required: ['calle', 'ciudad', 'lat', 'lng'],
                properties: {
                    calle: {
                        type: 'string',
                        description: 'Dirección completa',
                        example: 'Av. Corrientes 1234, CABA'
                    },
                    ciudad: {
                        type: 'string',
                        description: 'Ciudad',
                        example: 'Buenos Aires'
                    },
                    provincia: {
                        type: 'string',
                        description: 'Provincia',
                        example: 'Buenos Aires'
                    },
                    codigoPostal: {
                        type: 'string',
                        pattern: '^[0-9]{4}$',
                        description: 'Código postal de 4 dígitos',
                        example: '1043'
                    },
                    lat: {
                        type: 'number',
                        minimum: -90,
                        maximum: 90,
                        description: 'Latitud GPS',
                        example: -34.6037
                    },
                    lng: {
                        type: 'number',
                        minimum: -180,
                        maximum: 180,
                        description: 'Longitud GPS',
                        example: -58.3816
                    },
                    observaciones: {
                        type: 'string',
                        nullable: true,
                        description: 'Observaciones de entrega',
                        example: 'Timbre 2B'
                    }
                }
            },
            // ========================================
            // 👥 ESQUEMAS DE USUARIOS
            // ========================================
            Usuario: {
                type: 'object',
                required: ['email', 'tipo'],
                properties: {
                    id: {
                        type: 'string',
                        description: 'ID único del usuario',
                        example: 'user123'
                    },
                    email: {
                        type: 'string',
                        format: 'email',
                        description: 'Correo electrónico',
                        example: 'usuario@ejemplo.com'
                    },
                    nombre: {
                        type: 'string',
                        description: 'Nombre completo',
                        example: 'Juan Pérez'
                    },
                    telefono: {
                        type: 'string',
                        pattern: '^[+]?[0-9]{10,15}$',
                        description: 'Teléfono con código de país',
                        example: '+541234567890'
                    },
                    tipo: {
                        type: 'string',
                        enum: ['cliente', 'comercio', 'repartidor', 'admin', 'ceo'],
                        description: 'Tipo de usuario',
                        example: 'cliente'
                    },
                    estado: {
                        type: 'string',
                        enum: ['activo', 'inactivo', 'suspendido', 'verificacion'],
                        description: 'Estado del usuario',
                        example: 'activo'
                    },
                    fechaRegistro: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Fecha de registro',
                        example: '2024-01-01T12:00:00Z'
                    }
                }
            },
            // ========================================
            // 🔐 ESQUEMAS DE AUTENTICACIÓN
            // ========================================
            LoginRequest: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: {
                        type: 'string',
                        format: 'email',
                        description: 'Correo electrónico',
                        example: 'usuario@ejemplo.com'
                    },
                    password: {
                        type: 'string',
                        minLength: 8,
                        description: 'Contraseña (mínimo 8 caracteres)',
                        example: 'miPassword123'
                    },
                    rememberMe: {
                        type: 'boolean',
                        description: 'Recordar sesión',
                        example: false
                    }
                }
            },
            LoginResponse: {
                type: 'object',
                properties: {
                    success: {
                        type: 'boolean',
                        description: 'Indica si el login fue exitoso',
                        example: true
                    },
                    token: {
                        type: 'string',
                        description: 'JWT Token de acceso',
                        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                    },
                    usuario: {
                        $ref: '#/components/schemas/Usuario'
                    },
                    expiresIn: {
                        type: 'integer',
                        description: 'Tiempo de expiración en segundos',
                        example: 3600
                    }
                }
            },
            // ========================================
            // 📊 ESQUEMAS DE RESPUESTA
            // ========================================
            ApiResponse: {
                type: 'object',
                properties: {
                    success: {
                        type: 'boolean',
                        description: 'Indica si la operación fue exitosa'
                    },
                    message: {
                        type: 'string',
                        description: 'Mensaje descriptivo'
                    },
                    data: {
                        type: 'object',
                        description: 'Datos de respuesta'
                    },
                    timestamp: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Timestamp de la respuesta'
                    }
                }
            },
            ErrorResponse: {
                type: 'object',
                properties: {
                    success: {
                        type: 'boolean',
                        description: 'Siempre false para errores',
                        example: false
                    },
                    error: {
                        type: 'string',
                        description: 'Tipo de error',
                        example: 'VALIDATION_ERROR'
                    },
                    message: {
                        type: 'string',
                        description: 'Mensaje de error descriptivo',
                        example: 'El campo email es requerido'
                    },
                    details: {
                        type: 'object',
                        description: 'Detalles adicionales del error'
                    },
                    timestamp: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Timestamp del error'
                    }
                }
            }
        },
        responses: {
            UnauthorizedError: {
                description: 'Token de acceso faltante o inválido',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/ErrorResponse'
                        },
                        example: {
                            success: false,
                            error: 'UNAUTHORIZED',
                            message: 'Token de acceso requerido'
                        }
                    }
                }
            },
            ForbiddenError: {
                description: 'Permisos insuficientes para acceder al recurso',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/ErrorResponse'
                        }
                    }
                }
            },
            NotFoundError: {
                description: 'Recurso no encontrado',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/ErrorResponse'
                        }
                    }
                }
            },
            ValidationError: {
                description: 'Error de validación de datos',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/ErrorResponse'
                        }
                    }
                }
            },
            InternalServerError: {
                description: 'Error interno del servidor',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/ErrorResponse'
                        }
                    }
                }
            }
        }
    },
    // ========================================
    // 🏷️ TAGS PARA ORGANIZACIÓN
    // ========================================
    tags: [
        {
            name: 'Auth',
            description: 'Autenticación y autorización'
        },
        {
            name: 'Pedidos',
            description: 'Gestión de pedidos y delivery'
        },
        {
            name: 'Usuarios',
            description: 'Gestión de usuarios (clientes, comercios, repartidores)'
        },
        {
            name: 'GPS',
            description: 'Tracking y geolocalización en tiempo real'
        },
        {
            name: 'Pagos',
            description: 'Procesamiento de pagos y billeteras virtuales'
        },
        {
            name: 'WebAuthn',
            description: 'Autenticación biométrica avanzada'
        },
        {
            name: 'CEO',
            description: 'Panel ejecutivo y analytics avanzados'
        },
        {
            name: 'Monitoring',
            description: 'Monitoreo del sistema y métricas'
        },
        {
            name: 'Diagnostics',
            description: 'Diagnósticos del sistema y salud'
        }
    ]
};

// Opciones de configuración para swagger-jsdoc
const swaggerOptions = {
    definition: swaggerDefinition,
    apis: [
        './src/routes/*.js',           // Rutas principales
        './middleware/*.js',           // Middleware con documentación
        './src/controllers/*.js',      // Controladores
        './server-enterprise.js'      // Rutas del servidor principal
    ]
};

// Generar especificación de Swagger
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Opciones de configuración para Swagger UI
const swaggerUiOptions = {
    explorer: true,
    swaggerOptions: {
        filter: true,
        showRequestHeaders: true,
        showCommonExtensions: true,
        tryItOutEnabled: true
    },
    customCss: `
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info .title { color: #2c5aa0; }
        .swagger-ui .scheme-container { background: #fafafa; }
        .swagger-ui .operation-tag-content { max-width: none; }
        .swagger-ui .btn.authorize { 
            background-color: #4caf50; 
            border-color: #4caf50; 
        }
        .swagger-ui .btn.execute { 
            background-color: #2196f3; 
            border-color: #2196f3; 
        }
    `,
    customSiteTitle: 'YAvoy v3.1 Enterprise API Documentation',
    customfavIcon: '/favicon.ico'
};

module.exports = {
    swaggerSpec,
    swaggerUi,
    swaggerUiOptions
};