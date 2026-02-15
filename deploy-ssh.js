const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();

const commands = `
cd ~/public_html
rm -rf * .[^.]*
git clone https://github.com/braianruaimi/YAvoyOk.git .
npm install
cat > .env << 'EOF'
DB_HOST=localhost
DB_PORT=3306
DB_NAME=u695828542_yavoy_web
DB_USER=u695828542_yavoyen5
DB_PASSWORD=Yavoy26!
DB_POOL_MIN=2
DB_POOL_MAX=20
NODE_ENV=production
PORT=5502
JWT_SECRET=YAvoy_Enterprise_JWT_Secret_2024_Ultra_Secure_MySQL
SESSION_SECRET=YAvoy_Session_Secret_2024_MySQL_Enterprise
CSRF_SECRET=YAvoy2026_CSRF_Enterprise_Protection
ENCRYPT_SECRET=YAvoy2026_Encryption_Master_Key
ALLOWED_ORIGINS=https://yavoy.space,https://www.yavoy.space,http://yavoy.space
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=yavoyen5@yavoy.space
SMTP_PASS=BrainCesar26!
SMTP_SECURE=false
SMTP_TLS=true
VAPID_PUBLIC_KEY=BL4P9zTOxEkQBAmTV3XiyK9305PJDZKoPr52a0NNedpV5OVfuZGlf9SL21zVE9D4AwNfgWzKw8bHA-peL_g-qZs
VAPID_PRIVATE_KEY=SmZvfO1ZhLtbCrewuGFDnG0gfuTeV5DT9vRBjmWlBL4
VAPID_SUBJECT=mailto:yavoyen5@yavoy.space
CEO_USERNAME=admin
CEO_PASSWORD=admin123
EOF
npm list -g pm2 || npm install -g pm2
pm2 delete yavoy 2>/dev/null || true
pm2 start server.js --name yavoy
pm2 save
pm2 logs yavoy --lines 50
`;

console.log('🚀 Iniciando deployment a Hostinger...\n');

conn.on('ready', () => {
  console.log('✅ Conectado al servidor SSH\n');
  
  conn.exec(commands, (err, stream) => {
    if (err) {
      console.error('❌ Error ejecutando comandos:', err);
      conn.end();
      process.exit(1);
    }
    
    stream.on('close', (code, signal) => {
      console.log('\n✅ Deployment completado con código:', code);
      conn.end();
      process.exit(code);
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).connect({
  host: '147.79.84.219',
  port: 65002,
  username: 'u695828542',
  password: 'Yavoy25!'
});

conn.on('error', (err) => {
  console.error('❌ Error de conexión SSH:', err.message);
  process.exit(1);
});
