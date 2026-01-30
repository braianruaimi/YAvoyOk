<?php
/**
 * Script de actualización automática para YAvoy
 * Sube este archivo a public_html/ y accede desde navegador
 * URL: https://yavoy.space/update-server.php?key=Yavoy2026
 */

// Clave de seguridad simple
$security_key = 'Yavoy2026';

if (!isset($_GET['key']) || $_GET['key'] !== $security_key) {
    die('❌ Acceso denegado');
}

echo "<h1>🚀 YAvoy - Actualización Automática</h1>";
echo "<pre>";

// Cambiar al directorio del proyecto
chdir('/home/u695828542/public_html');

echo "📂 Directorio actual: " . getcwd() . "\n\n";

// Ejecutar git pull
echo "🔄 Ejecutando git pull...\n";
$output = [];
$return_var = 0;

exec('git pull origin main 2>&1', $output, $return_var);

foreach ($output as $line) {
    echo $line . "\n";
}

if ($return_var === 0) {
    echo "\n✅ Actualización completada con éxito!\n";
    echo "\n🔄 Reiniciando servidor Node.js...\n";
    
    // Intentar reiniciar PM2
    exec('pm2 restart all 2>&1', $pm2_output);
    foreach ($pm2_output as $line) {
        echo $line . "\n";
    }
    
    echo "\n✅ Servidor actualizado y reiniciado!\n";
    echo "\n🌐 Cambios disponibles en: https://yavoy.space\n";
} else {
    echo "\n❌ Error en la actualización (código: $return_var)\n";
}

echo "</pre>";
echo "<p><a href='https://yavoy.space'>← Volver a YAvoy</a></p>";
?>
