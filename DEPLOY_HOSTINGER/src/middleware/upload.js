/**
 * ========================================
 * MIDDLEWARE: Configuración de Multer
 * ========================================
 * Manejo de uploads de archivos (imágenes, documentos)
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

/**
 * Validar tipo de archivo permitido
 */
const imageFileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes (jpg, jpeg, png, gif, webp)'));
    }
};

const documentFileFilter = (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    if (extname) {
        return cb(null, true);
    } else {
        cb(new Error('Solo se permiten documentos (pdf, doc, docx, txt)'));
    }
};

/**
 * Configuración de almacenamiento para imágenes de perfil
 */
const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(process.cwd(), 'uploads', 'profiles');
        
        // Crear directorio si no existe
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Generar nombre único: userid_timestamp_random.ext
        const userId = req.user?.id || req.body?.userId || 'anonymous';
        const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
        const ext = path.extname(file.originalname);
        cb(null, `profile_${userId}_${uniqueSuffix}${ext}`);
    }
});

/**
 * Configuración de almacenamiento para imágenes de tiendas
 */
const shopStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(process.cwd(), 'uploads', 'shops');
        
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const shopId = req.params?.shopId || req.body?.shopId || 'shop';
        const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
        const ext = path.extname(file.originalname);
        cb(null, `shop_${shopId}_${uniqueSuffix}${ext}`);
    }
});

/**
 * Configuración de almacenamiento para documentos
 */
const documentStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(process.cwd(), 'uploads', 'documents');
        
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const userId = req.user?.id || 'anonymous';
        const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
        const ext = path.extname(file.originalname);
        cb(null, `doc_${userId}_${uniqueSuffix}${ext}`);
    }
});

/**
 * Middleware de upload para imágenes de perfil
 * Límite: 5MB, 1 archivo
 */
const uploadProfileImage = multer({
    storage: profileStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: imageFileFilter
}).single('foto'); // Campo 'foto' en el form

/**
 * Middleware de upload para imágenes de tienda
 * Límite: 10MB, hasta 5 archivos
 */
const uploadShopImages = multer({
    storage: shopStorage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB por archivo
    },
    fileFilter: imageFileFilter
}).array('imagenes', 5); // Hasta 5 imágenes

/**
 * Middleware de upload para documentos
 * Límite: 10MB, 1 archivo
 */
const uploadDocument = multer({
    storage: documentStorage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: documentFileFilter
}).single('documento');

/**
 * Handler global de errores de multer
 */
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'El archivo es demasiado grande. Tamaño máximo: 10MB'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                error: 'Demasiados archivos. Máximo permitido: 5'
            });
        }
        return res.status(400).json({
            success: false,
            error: 'Error al subir archivo: ' + err.message
        });
    }
    
    if (err) {
        return res.status(400).json({
            success: false,
            error: err.message
        });
    }
    
    next();
};

/**
 * Eliminar archivo del servidor
 * @param {string} filePath - Ruta absoluta del archivo
 */
const deleteFile = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`🗑️  Archivo eliminado: ${filePath}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error(`Error eliminando archivo: ${error.message}`);
        return false;
    }
};

module.exports = {
    uploadProfileImage,
    uploadShopImages,
    uploadDocument,
    handleMulterError,
    deleteFile
};
