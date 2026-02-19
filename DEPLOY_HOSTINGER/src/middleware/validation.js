/**
 * ====================================
 * YAVOY v3.1 - VALIDACIÓN DE INPUTS
 * ====================================
 * 
 * Esquemas de validación con Joi
 * Previene inyección y datos malformados
 */

const Joi = require('joi');

// ========================================
// 🔐 VALIDACIÓN DE AUTENTICACIÓN
// ========================================

const authSchemas = {
    // Registro de comercio
    registerComercio: Joi.object({
        nombre: Joi.string()
            .min(3)
            .max(100)
            .required()
            .messages({
                'string.empty': 'El nombre es obligatorio',
                'string.min': 'El nombre debe tener al menos 3 caracteres',
                'string.max': 'El nombre no puede exceder 100 caracteres'
            }),
        
        email: Joi.string()
            .email()
            .required()
            .messages({
                'string.email': 'Email inválido',
                'string.empty': 'El email es obligatorio'
            }),
        
        password: Joi.string()
            .min(8)
            .max(100)
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .required()
            .messages({
                'string.min': 'La contraseña debe tener al menos 8 caracteres',
                'string.pattern.base': 'La contraseña debe contener mayúsculas, minúsculas y números',
                'string.empty': 'La contraseña es obligatoria'
            }),
        
        telefono: Joi.string()
            .pattern(/^[0-9+\-\s()]+$/)
            .max(20)
            .optional()
            .messages({
                'string.pattern.base': 'Teléfono inválido'
            }),
        
        direccion: Joi.string()
            .max(200)
            .optional(),
        
        rubro: Joi.string()
            .valid('restaurante', 'farmacia', 'supermercado', 'kiosco', 'otros')
            .optional()
    }),
    
    // Registro de repartidor
    registerRepartidor: Joi.object({
        nombre: Joi.string()
            .min(3)
            .max(100)
            .required()
            .messages({
                'string.empty': 'El nombre es obligatorio',
                'string.min': 'El nombre debe tener al menos 3 caracteres'
            }),
        
        email: Joi.string()
            .email()
            .required()
            .messages({
                'string.email': 'Email inválido',
                'string.empty': 'El email es obligatorio'
            }),
        
        password: Joi.string()
            .min(8)
            .max(100)
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .required()
            .messages({
                'string.min': 'La contraseña debe tener al menos 8 caracteres',
                'string.pattern.base': 'La contraseña debe contener mayúsculas, minúsculas y números'
            }),
        
        telefono: Joi.string()
            .pattern(/^[0-9+\-\s()]+$/)
            .max(20)
            .optional(),
        
        vehiculo: Joi.string()
            .valid('bicicleta', 'moto', 'auto', 'a_pie')
            .optional(),
        
        zonaCobertura: Joi.array()
            .items(Joi.string())
            .optional()
    }),
    
    // Login
    login: Joi.object({
        email: Joi.string()
            .email()
            .required()
            .messages({
                'string.email': 'Email inválido',
                'string.empty': 'El email es obligatorio'
            }),
        
        password: Joi.string()
            .required()
            .messages({
                'string.empty': 'La contraseña es obligatoria'
            })
    }),
    
    // Cambio de contraseña
    changePassword: Joi.object({
        currentPassword: Joi.string()
            .required()
            .messages({
                'string.empty': 'La contraseña actual es obligatoria'
            }),
        
        newPassword: Joi.string()
            .min(8)
            .max(100)
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .required()
            .messages({
                'string.min': 'La nueva contraseña debe tener al menos 8 caracteres',
                'string.pattern.base': 'La contraseña debe contener mayúsculas, minúsculas y números'
            })
    })
};

// ========================================
// 📦 VALIDACIÓN DE PEDIDOS
// ========================================

const pedidoSchemas = {
    // Crear pedido
    create: Joi.object({
        comercioId: Joi.string()
            .required()
            .messages({
                'string.empty': 'El ID del comercio es obligatorio'
            }),
        
        productos: Joi.array()
            .items(
                Joi.object({
                    nombre: Joi.string().required(),
                    cantidad: Joi.number().integer().min(1).required(),
                    precio: Joi.number().positive().required()
                })
            )
            .min(1)
            .required()
            .messages({
                'array.min': 'El pedido debe tener al menos un producto'
            }),
        
        direccionEntrega: Joi.object({
            calle: Joi.string().required(),
            numero: Joi.string().required(),
            ciudad: Joi.string().required(),
            provincia: Joi.string().optional(),
            codigoPostal: Joi.string().optional(),
            referencia: Joi.string().optional()
        }).required(),
        
        metodoPago: Joi.string()
            .valid('efectivo', 'tarjeta', 'mercadopago', 'transferencia')
            .required(),
        
        notas: Joi.string()
            .max(500)
            .optional()
    }),
    
    // Actualizar estado
    updateEstado: Joi.object({
        estado: Joi.string()
            .valid('pendiente', 'confirmado', 'preparando', 'en_camino', 'entregado', 'cancelado')
            .required()
            .messages({
                'any.only': 'Estado inválido'
            }),
        
        notas: Joi.string()
            .max(200)
            .optional()
    }),
    
    // Asignar repartidor
    asignarRepartidor: Joi.object({
        repartidorId: Joi.string()
            .required()
            .messages({
                'string.empty': 'El ID del repartidor es obligatorio'
            })
    })
};

// ========================================
// 💰 VALIDACIÓN DE PAGOS
// ========================================

const pagoSchemas = {
    // Crear pago
    create: Joi.object({
        pedidoId: Joi.string()
            .required(),
        
        monto: Joi.number()
            .positive()
            .required()
            .messages({
                'number.positive': 'El monto debe ser mayor a 0'
            }),
        
        metodoPago: Joi.string()
            .valid('efectivo', 'tarjeta', 'mercadopago', 'transferencia')
            .required(),
        
        detallesPago: Joi.object().optional()
    }),
    
    // Webhook de MercadoPago
    webhook: Joi.object({
        action: Joi.string().required(),
        api_version: Joi.string().optional(),
        data: Joi.object({
            id: Joi.string().required()
        }).required(),
        date_created: Joi.string().optional(),
        id: Joi.number().optional(),
        live_mode: Joi.boolean().optional(),
        type: Joi.string().optional(),
        user_id: Joi.string().optional()
    })
};

// ========================================
// 🚚 VALIDACIÓN DE REPARTIDORES
// ========================================

const repartidorSchemas = {
    // Actualizar ubicación
    updateUbicacion: Joi.object({
        latitud: Joi.number()
            .min(-90)
            .max(90)
            .required()
            .messages({
                'number.min': 'Latitud inválida',
                'number.max': 'Latitud inválida'
            }),
        
        longitud: Joi.number()
            .min(-180)
            .max(180)
            .required()
            .messages({
                'number.min': 'Longitud inválida',
                'number.max': 'Longitud inválida'
            })
    }),
    
    // Actualizar disponibilidad
    updateDisponibilidad: Joi.object({
        disponible: Joi.boolean()
            .required()
    }),
    
    // Actualizar perfil
    updatePerfil: Joi.object({
        nombre: Joi.string().min(3).max(100).optional(),
        telefono: Joi.string().pattern(/^[0-9+\-\s()]+$/).max(20).optional(),
        vehiculo: Joi.string().valid('bicicleta', 'moto', 'auto', 'a_pie').optional(),
        zonaCobertura: Joi.array().items(Joi.string()).optional()
    })
};

// ========================================
// 🏪 VALIDACIÓN DE COMERCIOS
// ========================================

const comercioSchemas = {
    // Actualizar perfil
    updatePerfil: Joi.object({
        nombre: Joi.string().min(3).max(100).optional(),
        telefono: Joi.string().pattern(/^[0-9+\-\s()]+$/).max(20).optional(),
        direccion: Joi.string().max(200).optional(),
        rubro: Joi.string().valid('restaurante', 'farmacia', 'supermercado', 'kiosco', 'otros').optional(),
        horarios: Joi.object({
            apertura: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
            cierre: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional()
        }).optional()
    })
};

// ========================================
// 🛠️ MIDDLEWARE DE VALIDACIÓN
// ========================================

/**
 * Crea un middleware de validación para un esquema Joi
 * @param {Joi.Schema} schema - Esquema de validación
 * @param {string} source - Fuente de datos ('body', 'params', 'query')
 * @returns {Function} Middleware de Express
 */
function validate(schema, source = 'body') {
    return (req, res, next) => {
        const dataToValidate = req[source];
        
        const { error, value } = schema.validate(dataToValidate, {
            abortEarly: false, // Retorna todos los errores, no solo el primero
            stripUnknown: true // Elimina campos no definidos en el esquema
        });
        
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            
            return res.status(400).json({
                error: 'Datos inválidos',
                validationErrors: errors
            });
        }
        
        // Reemplazar datos con valores validados (ya sanitizados)
        req[source] = value;
        next();
    };
}

/**
 * Valida parámetros de URL
 */
function validateParams(schema) {
    return validate(schema, 'params');
}

/**
 * Valida query strings
 */
function validateQuery(schema) {
    return validate(schema, 'query');
}

// ========================================
// 📤 EXPORTACIONES
// ========================================
module.exports = {
    // Esquemas
    authSchemas,
    pedidoSchemas,
    pagoSchemas,
    repartidorSchemas,
    comercioSchemas,
    
    // Middlewares
    validate,
    validateParams,
    validateQuery
};
