/**
 * ========================================
 * ESQUEMAS DE VALIDACIÓN JOI - YAvoy v3.1 Enterprise
 * ========================================
 * Validación exhaustiva de todas las entradas de datos
 * Body, Params y Query
 */

const Joi = require('joi');

// ============================================
// HELPERS Y PATRONES COMUNES
// ============================================

const patterns = {
    telefono: /^[+]?[0-9\s\-()]{10,20}$/,
    codigoPostal: /^[0-9]{4,10}$/,
    patente: /^[A-Z0-9]{6,8}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    dni: /^[0-9]{7,8}$/,
    letrasNumeros: /^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑ]+$/,
    codigoReferido: /^[A-Z0-9]{6,10}$/,
    alphanum: /^[a-zA-Z0-9_-]+$/
};

const coordenadas = Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required()
});

const direccion = Joi.object({
    calle: Joi.string().min(3).max(255).required(),
    barrio: Joi.string().min(2).max(100).required(),
    ciudad: Joi.string().min(2).max(100).required(),
    provincia: Joi.string().min(2).max(100).required(),
    codigoPostal: Joi.string().pattern(patterns.codigoPostal).required(),
    referencia: Joi.string().max(500).allow('', null),
    latitud: Joi.number().min(-90).max(90).allow(null),
    longitud: Joi.number().min(-180).max(180).allow(null)
});

// ============================================
// USUARIOS Y AUTENTICACIÓN
// ============================================

const schemas = {
    // Registro de usuario
    registroUsuario: Joi.object({
        nombre: Joi.string().min(2).max(100).required(),
        apellido: Joi.string().min(2).max(100).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(8).max(100).required(),
        whatsapp: Joi.string().pattern(patterns.telefono).required(),
        tipo: Joi.string().valid('cliente', 'repartidor', 'comercio').default('cliente'),
        direccion: direccion.optional()
    }),

    // Login
    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    }),

    // Actualización de perfil
    actualizarPerfil: Joi.object({
        nombre: Joi.string().min(2).max(100),
        apellido: Joi.string().min(2).max(100),
        whatsapp: Joi.string().pattern(patterns.telefono),
        direccion: direccion,
        fotoPerfil: Joi.string().uri().allow('', null),
        metodoPagoPreferido: Joi.string().valid('efectivo', 'mercadopago', 'tarjeta'),
        notificacionesPush: Joi.boolean()
    }).min(1), // Al menos un campo debe estar presente

    // ============================================
    // COMERCIOS
    // ============================================

    registroComercio: Joi.object({
        nombreComercio: Joi.string().min(3).max(255).required(),
        nombrePropietario: Joi.string().min(3).max(255).required(),
        email: Joi.string().email().required(),
        telefono: Joi.string().pattern(patterns.telefono).required(),
        categoria: Joi.string().valid(
            'alimentacion', 'bazar', 'indumentaria', 'kiosco', 
            'otros', 'prioridad', 'salud'
        ).required(),
        direccion: direccion.required(),
        coordenadas: coordenadas.required(),
        horarios: Joi.object({
            lunes: Joi.object({ abre: Joi.string(), cierra: Joi.string(), cerrado: Joi.boolean() }),
            martes: Joi.object({ abre: Joi.string(), cierra: Joi.string(), cerrado: Joi.boolean() }),
            miercoles: Joi.object({ abre: Joi.string(), cierra: Joi.string(), cerrado: Joi.boolean() }),
            jueves: Joi.object({ abre: Joi.string(), cierra: Joi.string(), cerrado: Joi.boolean() }),
            viernes: Joi.object({ abre: Joi.string(), cierra: Joi.string(), cerrado: Joi.boolean() }),
            sabado: Joi.object({ abre: Joi.string(), cierra: Joi.string(), cerrado: Joi.boolean() }),
            domingo: Joi.object({ abre: Joi.string(), cierra: Joi.string(), cerrado: Joi.boolean() })
        }).optional(),
        descripcion: Joi.string().max(1000).allow('', null),
        logo: Joi.string().uri().allow('', null)
    }),

    actualizarComercio: Joi.object({
        nombreComercio: Joi.string().min(3).max(255),
        telefono: Joi.string().pattern(patterns.telefono),
        direccion: direccion,
        coordenadas: coordenadas,
        horarios: Joi.object().pattern(Joi.string(), Joi.object({
            abre: Joi.string(),
            cierra: Joi.string(),
            cerrado: Joi.boolean()
        })),
        descripcion: Joi.string().max(1000).allow('', null),
        logo: Joi.string().uri().allow('', null),
        activo: Joi.boolean()
    }).min(1),

    // ============================================
    // REPARTIDORES
    // ============================================

    registroRepartidor: Joi.object({
        nombre: Joi.string().min(2).max(100).required(),
        apellido: Joi.string().min(2).max(100).required(),
        email: Joi.string().email().required(),
        whatsapp: Joi.string().pattern(patterns.telefono).required(),
        direccion: direccion.required(),
        tipoVehiculo: Joi.string().valid('Moto', 'Auto', 'Bicicleta', 'A pie').required(),
        modeloVehiculo: Joi.string().max(100).allow('', null),
        patente: Joi.string().pattern(patterns.patente).required(),
        zonaOperacion: Joi.string().max(255).required(),
        documentos: Joi.object({
            dni: Joi.string().pattern(patterns.dni).required(),
            licencia: Joi.string().allow('', null),
            seguro: Joi.string().allow('', null),
            vtv: Joi.string().allow('', null)
        }).required()
    }),

    actualizarRepartidor: Joi.object({
        disponible: Joi.boolean(),
        zonaOperacion: Joi.string().max(255),
        ubicacionActual: coordenadas,
        tipoVehiculo: Joi.string().valid('Moto', 'Auto', 'Bicicleta', 'A pie'),
        modeloVehiculo: Joi.string().max(100)
    }).min(1),

    actualizarUbicacion: Joi.object({
        lat: Joi.number().min(-90).max(90).required(),
        lng: Joi.number().min(-180).max(180).required()
    }),

    // ============================================
    // PEDIDOS
    // ============================================

    crearPedido: Joi.object({
        nombreCliente: Joi.string().min(2).max(255).required(),
        telefonoCliente: Joi.string().pattern(patterns.telefono).required(),
        direccionEntrega: Joi.string().min(10).max(500).required(),
        descripcion: Joi.string().min(5).max(2000).required(),
        destinatario: Joi.string().min(2).max(255).optional(),
        telefonoDestinatario: Joi.string().pattern(patterns.telefono).optional(),
        notas: Joi.string().max(1000).allow('', null),
        monto: Joi.number().min(0).max(1000000).required(),
        clienteId: Joi.string().allow(null),
        comercioId: Joi.string().allow(null),
        metodoPago: Joi.string().valid('efectivo', 'mercadopago', 'transferencia').default('efectivo'),
        ubicacionEntrega: coordenadas.optional()
    }),

    actualizarEstadoPedido: Joi.object({
        estado: Joi.string().valid(
            'pendiente', 'aceptado', 'preparando', 'en_camino', 
            'entregado', 'cancelado', 'rechazado'
        ).required(),
        repartidorId: Joi.string().when('estado', {
            is: 'aceptado',
            then: Joi.required(),
            otherwise: Joi.optional()
        }),
        motivoCancelacion: Joi.string().max(500).when('estado', {
            is: Joi.valid('cancelado', 'rechazado'),
            then: Joi.required(),
            otherwise: Joi.optional()
        }),
        ubicacionActual: coordenadas.optional()
    }),

    // ============================================
    // PRODUCTOS (INVENTARIO)
    // ============================================

    crearProducto: Joi.object({
        comercioId: Joi.string().required(),
        nombre: Joi.string().min(2).max(255).required(),
        categoria: Joi.string().max(100).required(),
        precio: Joi.number().min(0).max(1000000).required(),
        stock: Joi.number().integer().min(0).default(0),
        stockMinimo: Joi.number().integer().min(0).default(5),
        descripcion: Joi.string().max(1000).allow('', null),
        imagen: Joi.string().uri().allow('', null),
        activo: Joi.boolean().default(true)
    }),

    actualizarProducto: Joi.object({
        nombre: Joi.string().min(2).max(255),
        categoria: Joi.string().max(100),
        precio: Joi.number().min(0).max(1000000),
        stock: Joi.number().integer().min(0),
        stockMinimo: Joi.number().integer().min(0),
        descripcion: Joi.string().max(1000).allow('', null),
        imagen: Joi.string().uri().allow('', null),
        activo: Joi.boolean()
    }).min(1),

    actualizarStock: Joi.object({
        cantidad: Joi.number().integer().min(0).required(),
        operacion: Joi.string().valid('sumar', 'restar', 'establecer').required(),
        motivo: Joi.string().max(500).allow('', null)
    }),

    // ============================================
    // CALIFICACIONES
    // ============================================

    crearCalificacion: Joi.object({
        pedidoId: Joi.string().required(),
        ratingRepartidor: Joi.number().integer().min(1).max(5).optional(),
        ratingComercio: Joi.number().integer().min(1).max(5).optional(),
        ratingGeneral: Joi.number().integer().min(1).max(5).required(),
        comentarioRepartidor: Joi.string().max(500).allow('', null),
        comentarioComercio: Joi.string().max(500).allow('', null),
        comentarioGeneral: Joi.string().max(1000).allow('', null),
        recomendaria: Joi.boolean().default(true)
    }),

    // ============================================
    // CHAT
    // ============================================

    enviarMensaje: Joi.object({
        pedidoId: Joi.string().required(),
        mensaje: Joi.string().min(1).max(2000).required(),
        tipoUsuario: Joi.string().valid('cliente', 'repartidor', 'comercio', 'sistema').required(),
        nombreUsuario: Joi.string().max(255).required(),
        archivoAdjunto: Joi.string().uri().allow(null)
    }),

    // ============================================
    // REFERIDOS
    // ============================================

    registrarReferido: Joi.object({
        codigoReferidor: Joi.string().pattern(patterns.codigoReferido).required(),
        nuevoUsuarioId: Joi.string().required(),
        nuevoUsuarioNombre: Joi.string().min(2).max(255).required()
    }),

    // ============================================
    // RECOMPENSAS
    // ============================================

    otorgarRecompensa: Joi.object({
        usuarioId: Joi.string().required(),
        tipo: Joi.string().valid('logro', 'medalla', 'credito', 'puntos').required(),
        nombre: Joi.string().max(255).required(),
        descripcion: Joi.string().max(500).allow('', null),
        valor: Joi.number().min(0).optional()
    }),

    // ============================================
    // PROPINAS
    // ============================================

    agregarPropina: Joi.object({
        pedidoId: Joi.string().required(),
        monto: Joi.number().min(0).max(10000).required(),
        tipo: Joi.string().valid('porcentaje', 'monto_fijo').default('monto_fijo'),
        metodoPago: Joi.string().valid('efectivo', 'mercadopago').default('efectivo')
    }),

    // ============================================
    // PEDIDOS GRUPALES
    // ============================================

    crearPedidoGrupal: Joi.object({
        titulo: Joi.string().min(3).max(255).required(),
        comercioId: Joi.string().required(),
        comercioNombre: Joi.string().required(),
        direccion: Joi.string().min(10).max(500).required(),
        horaLimite: Joi.date().iso().greater('now').optional()
    }),

    unirseAPedidoGrupal: Joi.object({
        pedidoGrupalId: Joi.string().required(),
        usuarioNombre: Joi.string().min(2).max(255).required()
    }),

    agregarItemGrupal: Joi.object({
        pedidoGrupalId: Joi.string().required(),
        nombre: Joi.string().min(2).max(255).required(),
        precio: Joi.number().min(0).max(100000).required(),
        cantidad: Joi.number().integer().min(1).max(100).required(),
        notas: Joi.string().max(500).allow('', null)
    }),

    // ============================================
    // PARAMS (IDs en URL)
    // ============================================

    params: {
        id: Joi.object({
            id: Joi.string().pattern(patterns.alphanum).required()
        }),
        
        pedidoId: Joi.object({
            pedidoId: Joi.string().pattern(/^PED-[0-9]+$/).required()
        }),

        comercioId: Joi.object({
            comercioId: Joi.string().required()
        }),

        repartidorId: Joi.object({
            repartidorId: Joi.string().required()
        }),

        productoId: Joi.object({
            productoId: Joi.string().pattern(/^PROD-[0-9]+$/).required()
        })
    },

    // ============================================
    // QUERY (Paginación, Filtros, Búsqueda)
    // ============================================

    query: {
        paginacion: Joi.object({
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(20),
            sortBy: Joi.string().valid('createdAt', 'updatedAt', 'nombre', 'rating', 'precio'),
            order: Joi.string().valid('asc', 'desc').default('desc')
        }),

        filtroEstado: Joi.object({
            estado: Joi.string().valid(
                'pendiente', 'aceptado', 'preparando', 'en_camino', 
                'entregado', 'cancelado', 'rechazado', 'todos'
            ).default('todos')
        }),

        filtroCategoria: Joi.object({
            categoria: Joi.string().valid(
                'alimentacion', 'bazar', 'indumentaria', 'kiosco', 
                'otros', 'prioridad', 'salud', 'todos'
            ).default('todos')
        }),

        busqueda: Joi.object({
            q: Joi.string().min(1).max(255).required(),
            tipo: Joi.string().valid('comercio', 'producto', 'usuario').default('comercio')
        }),

        fechas: Joi.object({
            fechaInicio: Joi.date().iso().required(),
            fechaFin: Joi.date().iso().min(Joi.ref('fechaInicio')).required()
        }),

        ubicacion: Joi.object({
            lat: Joi.number().min(-90).max(90).required(),
            lng: Joi.number().min(-180).max(180).required(),
            radio: Joi.number().min(1).max(50).default(10) // km
        })
    }
};

// ============================================
// MIDDLEWARE DE VALIDACIÓN
// ============================================

/**
 * Middleware de validación genérico
 * @param {Joi.Schema} schema - Schema de Joi a validar
 * @param {string} property - 'body', 'params' o 'query'
 */
function validate(schema, property = 'body') {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false, // Mostrar todos los errores
            stripUnknown: true, // Eliminar campos no definidos
            convert: true // Convertir tipos automáticamente
        });

        if (error) {
            const errores = error.details.map(detail => ({
                campo: detail.path.join('.'),
                mensaje: detail.message,
                tipo: detail.type
            }));

            return res.status(400).json({
                success: false,
                error: 'Validación fallida',
                errores
            });
        }

        // Reemplazar req[property] con valores validados y sanitizados
        req[property] = value;
        next();
    };
}

/**
 * Validación combinada de body + params + query
 */
function validateAll(bodySchema, paramsSchema, querySchema) {
    return (req, res, next) => {
        const errores = [];

        // Validar body
        if (bodySchema) {
            const { error: bodyError, value: bodyValue } = bodySchema.validate(req.body, {
                abortEarly: false,
                stripUnknown: true
            });
            if (bodyError) {
                errores.push(...bodyError.details.map(d => ({ 
                    ubicacion: 'body', 
                    campo: d.path.join('.'), 
                    mensaje: d.message 
                })));
            } else {
                req.body = bodyValue;
            }
        }

        // Validar params
        if (paramsSchema) {
            const { error: paramsError, value: paramsValue } = paramsSchema.validate(req.params, {
                abortEarly: false
            });
            if (paramsError) {
                errores.push(...paramsError.details.map(d => ({ 
                    ubicacion: 'params', 
                    campo: d.path.join('.'), 
                    mensaje: d.message 
                })));
            } else {
                req.params = paramsValue;
            }
        }

        // Validar query
        if (querySchema) {
            const { error: queryError, value: queryValue } = querySchema.validate(req.query, {
                abortEarly: false
            });
            if (queryError) {
                errores.push(...queryError.details.map(d => ({ 
                    ubicacion: 'query', 
                    campo: d.path.join('.'), 
                    mensaje: d.message 
                })));
            } else {
                req.query = queryValue;
            }
        }

        if (errores.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Validación fallida',
                errores
            });
        }

        next();
    };
}

module.exports = {
    schemas,
    validate,
    validateAll,
    patterns
};
