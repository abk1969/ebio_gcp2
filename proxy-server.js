const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// Configuration CORS permissive pour le développement
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));

// Route de test pour vérifier que le proxy est actif
app.get('/api/anthropic/test', (req, res) => {
  res.json({ status: 'ok', message: 'Proxy Anthropic actif' });
});

// Proxy pour Anthropic Claude
app.post('/api/anthropic/*', async (req, res) => {
  try {
    const endpoint = req.params[0] || 'messages';
    const response = await fetch(`https://api.anthropic.com/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': req.headers['x-api-key'],
        'anthropic-version': req.headers['anthropic-version'] || '2023-06-01'
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Erreur proxy Anthropic:', error);
    res.status(500).json({ error: 'Erreur proxy', details: error.message });
  }
});

// Proxy pour autres APIs si nécessaire
app.post('/api/proxy', async (req, res) => {
  try {
    const { url, headers, body } = req.body;

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Erreur proxy générique:', error);
    res.status(500).json({ error: 'Erreur proxy', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur proxy démarré sur http://localhost:${PORT}`);
  console.log('📡 Routes disponibles:');
  console.log('  - POST /api/anthropic/* pour Anthropic Claude');
  console.log('  - POST /api/proxy pour requêtes génériques');
});