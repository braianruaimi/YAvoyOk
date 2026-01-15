/**
 * YAvoy v3.1 Enterprise - Database Manager
 * Sistema híbrido PostgreSQL + JSON con failover automático
 * CTO: Manejo robusto de errores y sincronización de datos
 */

const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

class DatabaseManager {
    constructor() {
        this.pool = null;
        this.isPostgresAvailable = false;
        this.jsonFallbackPath = './registros';
        this.retryAttempts = 0;
        this.maxRetries = 3;
        this.retryInterval = 5000; // 5 segundos
        this.initializationComplete = false;
        
        // Inicializar de forma asíncrona sin bloquear
        this.initAsync();
    }

    async initAsync() {
        try {
            console.log('🗄️  Iniciando Database Manager...');
            await this.ensureJsonDirectories(); // Esto siempre debe funcionar
            await this.initPostgreSQL(); // Esto puede fallar sin problema
            this.setupHealthCheck();
            this.initializationComplete = true;
            console.log('✅ Database Manager inicializado exitosamente');
        } catch (error) {
            console.log('⚠️  Database Manager iniciado en modo JSON-only:', error.message);
            this.initializationComplete = true;
        }
    }

    async init() {
        // Método legacy para compatibilidad
        await this.initAsync();
    }

    async initPostgreSQL() {
        if (!process.env.DATABASE_URL) {
            console.log('⚠️  DATABASE_URL no configurado, usando solo JSON fallback');
            return;
        }

        try {
            this.pool = new Pool({
                connectionString: process.env.DATABASE_URL,
                ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
                max: 20,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 5000,
                acquireTimeoutMillis: 10000
            });

            // Test de conexión
            const client = await this.pool.connect();
            await client.query('SELECT 1');
            client.release();
            
            this.isPostgresAvailable = true;
            this.retryAttempts = 0;
            console.log('✅ PostgreSQL conectado exitosamente');

            // Configurar eventos
            this.pool.on('error', (err) => {
                console.error('❌ Error inesperado en PostgreSQL pool:', err.message);
                this.isPostgresAvailable = false;
                this.scheduleReconnection();
            });

        } catch (error) {
            console.error('❌ Error conectando PostgreSQL:', error.message);
            this.isPostgresAvailable = false;
            this.scheduleReconnection();
        }
    }

    async ensureJsonDirectories() {
        const dirs = [
            this.jsonFallbackPath,
            `${this.jsonFallbackPath}/comercios`,
            `${this.jsonFallbackPath}/repartidores`,
            `${this.jsonFallbackPath}/pedidos`,
            `${this.jsonFallbackPath}/usuarios`,
            `${this.jsonFallbackPath}/calificaciones`,
            `${this.jsonFallbackPath}/sync`
        ];

        for (const dir of dirs) {
            try {
                await fs.access(dir);
            } catch {
                await fs.mkdir(dir, { recursive: true });
                console.log(`✓ Directorio JSON creado: ${dir}`);
            }
        }
    }

    scheduleReconnection() {
        if (this.retryAttempts >= this.maxRetries) {
            console.log('⚠️  Máximo de reintentos alcanzado, continuando solo con JSON');
            this.isPostgresAvailable = false;
            return;
        }

        this.retryAttempts++;
        console.log(`🔄 Programando reintento de conexión ${this.retryAttempts}/${this.maxRetries} en ${this.retryInterval/1000}s...`);
        
        setTimeout(async () => {
            try {
                await this.initPostgreSQL();
            } catch (error) {
                console.log(`⚠️  Reintento ${this.retryAttempts} falló, continuando...`);
            }
        }, this.retryInterval);
    }

    setupHealthCheck() {
        // Health check cada 30 segundos
        setInterval(async () => {
            if (this.pool && this.isPostgresAvailable) {
                try {
                    const client = await this.pool.connect();
                    await client.query('SELECT 1');
                    client.release();
                } catch (error) {
                    console.warn('⚠️  Health check PostgreSQL falló:', error.message);
                    this.isPostgresAvailable = false;
                    this.scheduleReconnection();
                }
            }
        }, 30000);
    }

    // Método principal de query con fallback automático
    async query(sql, params = []) {
        const operation = sql.trim().split(' ')[0].toUpperCase();
        
        // Intentar PostgreSQL primero
        if (this.isPostgresAvailable && this.pool) {
            try {
                const result = await this.pool.query(sql, params);
                
                // Sincronizar a JSON si es una operación de escritura
                if (['INSERT', 'UPDATE', 'DELETE'].includes(operation)) {
                    await this.syncToJson(operation, sql, params, result);
                }
                
                return result;
            } catch (error) {
                console.error('❌ Error en query PostgreSQL:', error.message);
                this.isPostgresAvailable = false;
                this.scheduleReconnection();
                
                // Fallback a JSON
                return await this.fallbackToJson(operation, sql, params);
            }
        }
        
        // Usar JSON fallback
        return await this.fallbackToJson(operation, sql, params);
    }

    async syncToJson(operation, sql, params, result) {
        try {
            const timestamp = new Date().toISOString();
            const syncData = {
                timestamp,
                operation,
                sql,
                params,
                affectedRows: result.rowCount
            };

            const syncFile = `${this.jsonFallbackPath}/sync/sync_${Date.now()}.json`;
            await fs.writeFile(syncFile, JSON.stringify(syncData, null, 2));
            
        } catch (error) {
            console.warn('⚠️  Error sincronizando a JSON:', error.message);
        }
    }

    async fallbackToJson(operation, sql, params) {
        console.log(`📄 Usando JSON fallback para operación: ${operation}`);
        
        // Lógica simplificada de fallback
        // En un caso real, aquí implementarías parsing SQL básico
        if (operation === 'SELECT') {
            return await this.readFromJson(sql, params);
        } else if (['INSERT', 'UPDATE', 'DELETE'].includes(operation)) {
            return await this.writeToJson(operation, sql, params);
        }
        
        return { rows: [], rowCount: 0 };
    }

    async readFromJson(sql, params) {
        // Implementación básica - en producción necesitarías un parser SQL más sofisticado
        try {
            if (sql.includes('usuarios') || sql.includes('comercios')) {
                const filePath = `${this.jsonFallbackPath}/comercios/data.json`;
                try {
                    const data = await fs.readFile(filePath, 'utf8');
                    const records = JSON.parse(data);
                    return { rows: Array.isArray(records) ? records : [records], rowCount: Array.isArray(records) ? records.length : 1 };
                } catch {
                    return { rows: [], rowCount: 0 };
                }
            }
            
            return { rows: [], rowCount: 0 };
        } catch (error) {
            console.error('❌ Error leyendo JSON fallback:', error.message);
            return { rows: [], rowCount: 0 };
        }
    }

    async writeToJson(operation, sql, params) {
        // Implementación básica de escritura
        try {
            const timestamp = new Date().toISOString();
            const record = {
                id: Date.now(),
                timestamp,
                operation,
                data: params,
                sql: sql.substring(0, 100) + '...' // SQL truncado para log
            };

            const logFile = `${this.jsonFallbackPath}/operations.json`;
            let operations = [];
            
            try {
                const data = await fs.readFile(logFile, 'utf8');
                operations = JSON.parse(data);
            } catch {
                // Archivo no existe o está corrupto
            }

            operations.push(record);
            
            // Mantener solo las últimas 1000 operaciones
            if (operations.length > 1000) {
                operations = operations.slice(-1000);
            }

            await fs.writeFile(logFile, JSON.stringify(operations, null, 2));
            return { rowCount: 1, insertId: record.id };

        } catch (error) {
            console.error('❌ Error escribiendo JSON fallback:', error.message);
            return { rowCount: 0 };
        }
    }

    // Método para obtener estadísticas de la base de datos
    getStatus() {
        return {
            postgresql: {
                available: this.isPostgresAvailable,
                connected: this.pool !== null,
                retryAttempts: this.retryAttempts
            },
            jsonFallback: {
                enabled: true,
                path: this.jsonFallbackPath
            }
        };
    }

    // Método para cerrar conexiones limpiamente
    async close() {
        if (this.pool) {
            try {
                await this.pool.end();
                console.log('✅ PostgreSQL pool cerrado correctamente');
            } catch (error) {
                console.error('❌ Error cerrando PostgreSQL pool:', error.message);
            }
        }
    }
}

module.exports = DatabaseManager;