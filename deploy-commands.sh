cd ~/public_html
git pull origin main
npm install --production
pm2 restart yavoy || pm2 start server.js --name yavoy
pm2 save
pm2 status
pm2 logs yavoy --lines 15
