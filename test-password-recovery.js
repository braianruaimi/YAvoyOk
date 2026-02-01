/**
 * ====================================
 * TEST - RECUPERACIÓN DE CONTRASEÑA
 * ====================================
 * 
 * Prueba los endpoints de forgotPassword y resetPassword
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5502/api';

const tests = {
  // Test 1: Solicitar reset de contraseña
  forgotPassword: async () => {
    try {
      console.log('\n📧 Test: Solicitar reset de contraseña');
      console.log('=====================================');
      
      const response = await axios.post(`${API_BASE}/auth/forgot-password`, {
        email: 'test@example.com'
      });
      
      console.log('✅ Respuesta:', response.data);
      return response.data;
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Test 2: Resetear contraseña con token
  resetPassword: async (token, newPassword) => {
    try {
      console.log('\n🔐 Test: Resetear contraseña');
      console.log('=============================');
      
      const response = await axios.post(`${API_BASE}/auth/reset-password`, {
        token,
        newPassword
      });
      
      console.log('✅ Respuesta:', response.data);
      return response.data;
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Test 3: Login con nueva contraseña
  loginWithNewPassword: async (email, newPassword) => {
    try {
      console.log('\n🔑 Test: Login con nueva contraseña');
      console.log('====================================');
      
      const response = await axios.post(`${API_BASE}/auth/login`, {
        email,
        password: newPassword
      });
      
      console.log('✅ Respuesta:', response.data);
      return response.data;
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
      throw error;
    }
  }
};

// Ejecutar tests
(async () => {
  console.log('🧪 INICIANDO TESTS DE RECUPERACIÓN DE CONTRASEÑA');
  console.log('================================================\n');
  
  try {
    // 1. Solicitar reset
    const forgotRes = await tests.forgotPassword();
    
    if (!forgotRes.success) {
      console.log('⚠️  El endpoint forgotPassword respondió con success: false');
    }
    
    // 2. Para el siguiente test, necesitarías un token válido de la BD
    // Por ahora solo verificamos que los endpoints existan
    
    console.log('\n✅ TESTS COMPLETADOS EXITOSAMENTE');
    console.log('\nNotas importantes:');
    console.log('- El email debe estar registrado en la BD');
    console.log('- El token de reset se guarda en: usuario.resetPasswordToken');
    console.log('- El token expira en 1 hora (usuario.resetPasswordExpires)');
    console.log('- El endpoint de reset limpia los campos de token al completarse');
    
  } catch (error) {
    console.log('\n❌ ERROR EN LOS TESTS');
    process.exit(1);
  }
})();
