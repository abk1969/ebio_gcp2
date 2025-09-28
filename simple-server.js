const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5173;
const DIST_DIR = path.join(__dirname, 'dist');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);
  
  // Vérifier si le fichier existe
  if (!fs.existsSync(filePath)) {
    // Pour les routes SPA, servir index.html
    filePath = path.join(DIST_DIR, 'index.html');
  }
  
  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeType = mimeTypes[extname] || 'application/octet-stream';
  
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - Page non trouvée</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`Erreur serveur: ${error.code}`, 'utf-8');
      }
    } else {
      res.writeHead(200, { 
        'Content-Type': mimeType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur EBIOS RM démarré !`);
  console.log(`📱 Application disponible sur :`);
  console.log(`   - Local:   http://localhost:${PORT}`);
  console.log(`   - Réseau:  http://0.0.0.0:${PORT}`);
  console.log(`📁 Servant les fichiers depuis: ${DIST_DIR}`);
  console.log(`⏹️  Appuyez sur Ctrl+C pour arrêter le serveur`);
});

server.on('error', (err) => {
  console.error('❌ Erreur serveur:', err);
});
