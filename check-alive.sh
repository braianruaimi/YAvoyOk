#!/bin/bash

# ========================================
# YAVOY v3.1 - Script de Monitoreo para Hosting Compartido
# ========================================
# Verifica si el proceso de Node.js está corriendo y lo reinicia si es necesario
# Diseñado para usarse en Cron Jobs de cPanel

# Configuración
NODE_PROCESS="server.js"
LOG_FILE="/home/tuusuario/logs/yavoy-monitor.log"
NODE_PATH="/usr/bin/node"  # Ajusta según tu hosting
PROJECT_DIR="/home/tuusuario/public_html"  # Ajusta a tu directorio real

# Función de logging
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Verificar si Node.js está corriendo
check_process() {
    if pgrep -f "$NODE_PROCESS" > /dev/null; then
        log "✅ Proceso Node.js está corriendo"
        return 0
    else
        log "❌ Proceso Node.js NO está corriendo"
        return 1
    fi
}

# Reiniciar el proceso
restart_process() {
    log "🔄 Intentando reiniciar Node.js..."

    # Cambiar al directorio del proyecto
    cd "$PROJECT_DIR" || {
        log "❌ Error: No se puede acceder al directorio $PROJECT_DIR"
        return 1
    }

    # Matar procesos existentes (por si acaso)
    pkill -f "$NODE_PROCESS" 2>/dev/null

    # Esperar un momento
    sleep 2

    # Iniciar el proceso en background
    nohup "$NODE_PATH" "$NODE_PROCESS" > /dev/null 2>&1 &

    # Verificar que se inició
    sleep 3
    if check_process; then
        log "✅ Proceso Node.js reiniciado exitosamente"
        return 0
    else
        log "❌ Error: No se pudo reiniciar el proceso Node.js"
        return 1
    fi
}

# Función principal
main() {
    log "=== Iniciando verificación de Yavoy ==="

    if ! check_process; then
        restart_process
    fi

    log "=== Verificación completada ==="
}

# Ejecutar
main