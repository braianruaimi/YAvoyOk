#!/bin/bash

# ==========================================
# 🚀 EJEMPLOS DE PRUEBA - Sistema de Email
# ==========================================
# Guía de uso del sistema de registro con verificación de email
# Ejecuta desde terminal: bash test-curl-examples.sh

API="http://localhost:5502/api/auth"
EMAIL_TIMESTAMP=$(date +%s)

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  🧪 Tests CURL - Sistema de Registro con Email - YAvoy        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# ========================================
# TEST 1: Registrar un comercio
# ========================================
echo "📝 TEST 1: Registrando un comercio..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

COMERCIO_RESPONSE=$(curl -s -X POST "$API/register/comercio" \
  -H "Content-Type: application/json" \
  -d "{
    \"nombre\": \"Pizzería Test ${EMAIL_TIMESTAMP}\",
    \"email\": \"comercio-test-${EMAIL_TIMESTAMP}@yavoy.test\",
    \"password\": \"TestPassword123\",
    \"telefono\": \"+5491234567890\",
    \"rubro\": \"pizza\"
  }")

echo "$COMERCIO_RESPONSE" | jq '.'
COMERCIO_ID=$(echo "$COMERCIO_RESPONSE" | jq -r '.comercio.id' 2>/dev/null)

if [ "$COMERCIO_ID" != "null" ] && [ ! -z "$COMERCIO_ID" ]; then
  echo ""
  echo "✅ Comercio registrado exitosamente!"
  echo "🆔 ID asignado: $COMERCIO_ID"
  echo ""
else
  echo ""
  echo "❌ Error en registro"
  echo ""
fi

# ========================================
# TEST 2: Registrar un repartidor
# ========================================
echo "📝 TEST 2: Registrando un repartidor..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

REPARTIDOR_RESPONSE=$(curl -s -X POST "$API/register/repartidor" \
  -H "Content-Type: application/json" \
  -d "{
    \"nombre\": \"Juan Repartidor Test\",
    \"email\": \"repartidor-test-${EMAIL_TIMESTAMP}@yavoy.test\",
    \"password\": \"TestPassword123\",
    \"telefono\": \"+5492345678901\",
    \"vehiculo\": \"moto\"
  }")

echo "$REPARTIDOR_RESPONSE" | jq '.'
REPARTIDOR_ID=$(echo "$REPARTIDOR_RESPONSE" | jq -r '.repartidor.id' 2>/dev/null)

if [ "$REPARTIDOR_ID" != "null" ] && [ ! -z "$REPARTIDOR_ID" ]; then
  echo ""
  echo "✅ Repartidor registrado exitosamente!"
  echo "🆔 ID asignado: $REPARTIDOR_ID"
  echo ""
else
  echo ""
  echo "❌ Error en registro"
  echo ""
fi

# ========================================
# TEST 3: Verificar email (Comercio)
# ========================================
if [ ! -z "$COMERCIO_ID" ]; then
  echo "✅ TEST 3: Verificando email del comercio..."
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "📌 IMPORTANTE:"
  echo "   En MODO DESARROLLO, verifica la consola del servidor para"
  echo "   ver el código de confirmación que se 'envió'"
  echo ""
  echo "   En PRODUCCIÓN, el código llega al email del usuario"
  echo ""
  echo "🔧 Para este test usaremos código: 123456"
  echo ""
  
  VERIFY_RESPONSE=$(curl -s -X POST "$API/verify-email" \
    -H "Content-Type: application/json" \
    -d "{
      \"userId\": \"$COMERCIO_ID\",
      \"confirmationCode\": \"123456\"
    }")
  
  echo "Respuesta de verifyEmail:"
  echo "$VERIFY_RESPONSE" | jq '.'
  echo ""
fi

# ========================================
# TEST 4: Reenviar código
# ========================================
if [ ! -z "$REPARTIDOR_ID" ]; then
  echo "📝 TEST 4: Reenviando código de confirmación..."
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  RESEND_RESPONSE=$(curl -s -X POST "$API/resend-confirmation" \
    -H "Content-Type: application/json" \
    -d "{
      \"userId\": \"$REPARTIDOR_ID\"
    }")
  
  echo "$RESEND_RESPONSE" | jq '.'
  echo ""
fi

# ========================================
# INFORMACIÓN DE ENDPOINTS
# ========================================
echo "📚 REFERENCIA DE ENDPOINTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔵 Registro - POST /api/auth/register/comercio"
echo "   Body:"
echo "   {\"nombre\", \"email\", \"password\", \"telefono\", \"rubro\"}"
echo ""
echo "🔵 Registro - POST /api/auth/register/repartidor"
echo "   Body:"
echo "   {\"nombre\", \"email\", \"password\", \"telefono\", \"vehiculo\"}"
echo ""
echo "🟢 Verificación - POST /api/auth/verify-email"
echo "   Body:"
echo "   {\"userId\", \"confirmationCode\"}"
echo ""
echo "🟡 Reenvío - POST /api/auth/resend-confirmation"
echo "   Body:"
echo "   {\"userId\"}"
echo ""

# ========================================
# INFORMACIÓN ÚTIL
# ========================================
echo "💡 INFORMACIÓN ÚTIL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📧 Frontend de verificación:"
echo "   http://localhost:5502/verificar-email.html"
echo ""
echo "📖 Documentación completa:"
echo "   Ver archivo: SISTEMA_REGISTRO_EMAIL.md"
echo ""
echo "⚙️  Configuración de email:"
echo "   Variable SMTP_USER y SMTP_PASS en .env"
echo ""
echo "🧪 Script de test Node.js:"
echo "   node test-email-registration.js"
echo ""
echo "✅ Tests completados!"
echo ""
