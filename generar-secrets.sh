#!/bin/bash
# ====================================
# YAVOY v3.1 - GENERADOR DE SECRETS
# ====================================
# Script para generar todas las claves necesarias

echo "🔑 Generando secrets para YAvoy v3.1 Enterprise..."
echo ""

# Verificar que Node.js esté disponible
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js no está instalado"
    exit 1
fi

# Crear archivo .env.secrets con todas las claves
cat > .env.secrets << EOF
# ====================================
# SECRETS GENERADOS AUTOMÁTICAMENTE
# ====================================
# Fecha: $(date)

# JWT SECRETS (64 caracteres cada uno)
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# CSRF Y ENCRYPTION (32 caracteres cada uno)
CSRF_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ENCRYPT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# WEBHOOK SECRET (48 caracteres)
MERCADOPAGO_WEBHOOK_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")

# UUID ÚNICO PARA ESTA INSTALACIÓN
INSTALL_UUID=$(node -e "console.log(require('crypto').randomUUID())")
EOF

echo "✅ Secrets generados en archivo: .env.secrets"
echo ""
echo "📋 Contenido generado:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat .env.secrets
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Instrucciones:"
echo "1. Copiar estos valores a tu archivo .env"
echo "2. Reemplazar los valores TU_PASSWORD con credenciales reales"
echo "3. Eliminar .env.secrets después de copiar: rm .env.secrets"
echo ""
echo "⚠️  IMPORTANTE: Estos secrets son únicos y no se pueden regenerar."
echo "   Guárdalos en un lugar seguro antes de eliminar este archivo."