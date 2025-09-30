import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Proxy API pour contourner les restrictions CORS des providers LLM
 * Ce proxy permet d'appeler les APIs LLM depuis le navigateur en production
 */

// Configuration CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key, anthropic-version',
};

// Mapping des providers vers leurs URLs
const PROVIDER_URLS: Record<string, string> = {
  anthropic: 'https://api.anthropic.com/v1/messages',
  openai: 'https://api.openai.com/v1/chat/completions',
  mistral: 'https://api.mistral.ai/v1/chat/completions',
  deepseek: 'https://api.deepseek.com/v1/chat/completions',
  qwen: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions',
  xai: 'https://api.x.ai/v1/chat/completions',
  groq: 'https://api.groq.com/openai/v1/chat/completions',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[Proxy] ===== REQUÊTE PROXY =====');
  console.log('[Proxy] Requête reçue:', {
    method: req.method,
    url: req.url,
    query: req.query,
    headers: Object.keys(req.headers),
    body: req.body ? 'présent' : 'absent'
  });

  // Ajouter les headers CORS à toutes les réponses
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Gérer les requêtes OPTIONS (preflight CORS)
  if (req.method === 'OPTIONS') {
    console.log('[Proxy] Réponse OPTIONS (preflight)');
    return res.status(200).end();
  }

  // Seules les requêtes POST sont autorisées
  if (req.method !== 'POST') {
    console.error('[Proxy] Méthode non autorisée:', req.method);
    return res.status(405).json({ error: 'Method not allowed', method: req.method });
  }

  try {
    // Extraire le provider depuis l'URL ou le body
    const { provider } = req.query;

    if (!provider || typeof provider !== 'string') {
      console.error('[Proxy] Provider manquant dans la requête');
      return res.status(400).json({ error: 'Provider parameter is required' });
    }

    console.log('[Proxy] Provider détecté:', provider);

    // Vérifier que le provider est supporté
    const targetUrl = PROVIDER_URLS[provider];
    if (!targetUrl) {
      console.error('[Proxy] Provider non supporté:', provider);
      return res.status(400).json({
        error: `Unsupported provider: ${provider}`,
        supportedProviders: Object.keys(PROVIDER_URLS)
      });
    }

    // Vérifier que le body existe
    if (!req.body) {
      console.error('[Proxy] Body manquant dans la requête');
      return res.status(400).json({ error: 'Request body is required' });
    }

    // Extraire les headers nécessaires
    const apiKey = req.headers['x-api-key'] || req.headers['authorization'];
    if (!apiKey) {
      return res.status(401).json({ error: 'API key is required' });
    }

    // Préparer les headers pour l'API cible
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Ajouter les headers spécifiques au provider
    if (provider === 'anthropic') {
      headers['x-api-key'] = apiKey as string;
      headers['anthropic-version'] = '2023-06-01';
    } else {
      headers['Authorization'] = apiKey.toString().startsWith('Bearer ') 
        ? apiKey as string 
        : `Bearer ${apiKey}`;
    }

    console.log(`[Proxy] Forwarding request to ${provider}:`, {
      targetUrl,
      headers: Object.keys(headers),
      bodySize: JSON.stringify(req.body).length,
      bodyPreview: JSON.stringify(req.body).substring(0, 200)
    });

    // Faire l'appel à l'API cible
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(req.body),
    });

    console.log(`[Proxy] Response from ${provider}:`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    // Récupérer la réponse
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('[Proxy] Failed to parse response as JSON:', jsonError);
      const textResponse = await response.text();
      console.error('[Proxy] Response text:', textResponse.substring(0, 500));
      throw new Error(`Invalid JSON response from ${provider}`);
    }

    // Retourner la réponse avec les headers CORS
    if (!response.ok) {
      console.error(`[Proxy] Error from ${provider}:`, data);
      return res.status(response.status).json(data);
    }

    console.log(`[Proxy] Success from ${provider}`);
    return res.status(200).json(data);

  } catch (error) {
    console.error('[Proxy] Error:', error);
    return res.status(500).json({ 
      error: 'Internal proxy error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Configuration Vercel pour les headers CORS
export const config = {
  api: {
    bodyParser: true,
  },
};

