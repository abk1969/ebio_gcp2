const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Démarrage du serveur EBIOS RM...');
console.log('📁 Répertoire:', process.cwd());

const viteProcess = spawn('npx', ['vite', '--host', '0.0.0.0', '--port', '5173'], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd()
});

viteProcess.on('error', (error) => {
  console.error('❌ Erreur lors du démarrage:', error);
});

viteProcess.on('exit', (code) => {
  console.log(`🔚 Processus terminé avec le code: ${code}`);
});

console.log('⏳ Serveur en cours de démarrage...');
