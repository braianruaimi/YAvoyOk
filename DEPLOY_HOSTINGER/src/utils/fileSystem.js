/**
 * ========================================
 * UTILIDADES: Sistema de Archivos
 * ========================================
 * Funciones para gestionar carpetas y archivos
 */

const fs = require('fs');
const path = require('path');

/**
 * Crear directorios necesarios para la aplicación
 */
function ensureDirectoriesExist() {
    const directories = [
        'uploads',
        'uploads/images',
        'uploads/documents',
        'uploads/profiles',
        'uploads/shops',
        'registros',
        'logs'
    ];

    directories.forEach(dir => {
        const dirPath = path.join(process.cwd(), dir);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            console.log(`✅ Directorio creado: ${dir}`);
        }
    });
}

/**
 * Verificar permisos de escritura en un directorio
 * @param {string} dirPath - Ruta del directorio
 * @returns {boolean} - true si tiene permisos de escritura
 */
function hasWritePermission(dirPath) {
    try {
        fs.accessSync(dirPath, fs.constants.W_OK);
        return true;
    } catch (err) {
        console.error(`❌ Sin permisos de escritura en: ${dirPath}`);
        return false;
    }
}

/**
 * Limpiar archivos temporales antiguos
 * @param {string} dirPath - Ruta del directorio
 * @param {number} maxAgeHours - Edad máxima en horas
 */
function cleanOldFiles(dirPath, maxAgeHours = 24) {
    const now = Date.now();
    const maxAge = maxAgeHours * 60 * 60 * 1000;

    try {
        if (!fs.existsSync(dirPath)) return;

        const files = fs.readdirSync(dirPath);
        let deletedCount = 0;

        files.forEach(file => {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);

            if (now - stats.mtimeMs > maxAge) {
                fs.unlinkSync(filePath);
                deletedCount++;
            }
        });

        if (deletedCount > 0) {
            console.log(`🗑️  ${deletedCount} archivos temporales eliminados de ${dirPath}`);
        }
    } catch (err) {
        console.error(`Error limpiando archivos antiguos: ${err.message}`);
    }
}

/**
 * Obtener tamaño de un directorio
 * @param {string} dirPath - Ruta del directorio
 * @returns {number} - Tamaño en bytes
 */
function getDirectorySize(dirPath) {
    let totalSize = 0;

    try {
        if (!fs.existsSync(dirPath)) return 0;

        const files = fs.readdirSync(dirPath);
        files.forEach(file => {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);

            if (stats.isFile()) {
                totalSize += stats.size;
            } else if (stats.isDirectory()) {
                totalSize += getDirectorySize(filePath);
            }
        });
    } catch (err) {
        console.error(`Error calculando tamaño de directorio: ${err.message}`);
    }

    return totalSize;
}

/**
 * Formatear bytes a formato legible
 * @param {number} bytes - Tamaño en bytes
 * @returns {string} - Tamaño formateado
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

module.exports = {
    ensureDirectoriesExist,
    hasWritePermission,
    cleanOldFiles,
    getDirectorySize,
    formatBytes
};
