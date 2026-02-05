require('dotenv').config();
const { checkConnection } = require('./src/config/database');

console.log('🔍 Testing Hostinger MySQL Connection...');
console.log('');
console.log('📋 Configuration:');
console.log(`   Host: ${process.env.DB_HOST}`);
console.log(`   Port: ${process.env.DB_PORT}`);
console.log(`   Database: ${process.env.DB_NAME}`);
console.log(`   User: ${process.env.DB_USER}`);
console.log(`   Password: ${process.env.DB_PASSWORD ? '***configured***' : '❌ NOT SET'}`);
console.log('');

(async () => {
    try {
        const result = await checkConnection();
        if (result) {
            console.log('🎉 CONNECTION SUCCESS!');
            console.log('✅ Hostinger MySQL is accessible');
            console.log('✅ Credentials are correct');
            console.log('✅ Ready to start server');
        }
    } catch (error) {
        console.error('❌ CONNECTION FAILED');
        console.error(`   Error: ${error.message}`);
        
        if (error.message.includes('ENOTFOUND')) {
            console.error('');
            console.error('🔧 SOLUTION: Incorrect hostname');
            console.error('   Check your Hostinger panel for the correct MySQL hostname');
        } else if (error.message.includes('ECONNREFUSED')) {
            console.error('');
            console.error('🔧 SOLUTION: Connection refused');
            console.error('   1. Enable Remote MySQL in Hostinger panel');
            console.error('   2. Add your IP address to allowed connections');
        } else if (error.message.includes('ER_ACCESS_DENIED_ERROR')) {
            console.error('');
            console.error('🔧 SOLUTION: Invalid credentials');
            console.error('   Username or password is incorrect');
        }
    }
    
    process.exit();
})();