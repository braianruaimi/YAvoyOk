# ============================================

# ALTERNATIVAS PARA DEPLOY A HOSTINGER

# ============================================

## OPCION 1: Recuperar/Resetear Contraseña SSH

1. Ve a: https://hpanel.hostinger.com
2. Login con tu cuenta de Hostinger
3. Ve a: VPS > Acceso SSH
4. Resetea la contraseña SSH
5. Usa la nueva contraseña

## OPCION 2: Deploy via File Manager (Panel Hostinger)

1. Ve a: https://hpanel.hostinger.com
2. Abre el File Manager
3. Ve a la carpeta: public_html
4. Elimina todo el contenido
5. Sube estos archivos desde tu PC:
   - Todos los archivos del proyecto YAvoyOk
   - O usa la opción "Importar desde GitHub"

## OPCION 3: Deploy via Git desde Panel Hostinger

1. Ve a: https://hpanel.hostinger.com
2. Busca la sección "Git"
3. Configura el repositorio:
   - URL: https://github.com/braianruaimi/YAvoyOk.git
   - Rama: main
   - Carpeta destino: public_html
4. Click en "Deploy"

## OPCION 4: SFTP (Más fácil que SSH)

1. Descarga FileZilla: https://filezilla-project.org/
2. Conecta con estas credenciales:
   - Host: sftp://147.79.84.219
   - Puerto: 65002
   - Usuario: u695828542
   - Contraseña: (la misma que SSH)
3. Arrastra y suelta los archivos

## CREDENCIALES ACTUALES

SSH/SFTP:

- Host: 147.79.84.219
- Puerto: 65002
- Usuario: u695828542
- Password SSH: Yavoy25! o Yavoy26! (probar ambas)

Base de Datos MySQL:

- Host: localhost (desde el servidor)
- DB: u695828542_yavoy_web
- User: u695828542_yavoyen5
- Pass: Yavoy26!

## SIGUIENTE PASO RECOMENDADO

Usa la OPCION 1 para resetear la contraseña SSH desde el panel de Hostinger.
O usa la OPCION 3 para deploy directo desde Git sin necesidad de SSH.
