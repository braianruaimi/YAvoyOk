const { google } = require('googleapis');

// Configura tus credenciales
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '521213707768-fmrrlk5f1lhkm5qloceb7uqn2679jpns.apps.googleusercontent.com';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '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';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground'; // O tu URI de redireccionamiento

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// Genera la URL de autorización
const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://mail.google.com/'],
});

console.log('Autoriza esta app visitando esta URL:', authUrl);
console.log('Después de autorizar, copia el código y pégalo aquí para obtener los tokens.');

// Nota: Para automatizar, puedes usar un servidor local para capturar el código.
// Este script solo genera la URL. Ejecuta: node generate-oauth-token.js