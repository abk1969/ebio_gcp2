# API Proxy pour LLM Providers

Ce dossier contient les fonctions serverless Vercel qui servent de proxy pour contourner les restrictions CORS des providers LLM.

## 🎯 Pourquoi un proxy ?

La plupart des APIs LLM (Anthropic, OpenAI, Mistral, etc.) bloquent les appels directs depuis le navigateur pour des raisons de sécurité (CORS - Cross-Origin Resource Sharing). 

Le proxy backend permet de :
- ✅ Faire les appels API depuis le serveur (pas de CORS)
- ✅ Protéger les clés API (bien que dans notre cas elles soient encore côté client)
- ✅ Gérer les erreurs de manière centralisée
- ✅ Ajouter des logs et du monitoring

## 📁 Structure

```
api/
├── llm-proxy.ts       # Proxy principal pour tous les providers
└── README.md          # Cette documentation
```

## 🔧 Fonctionnement

### Endpoint

```
POST /api/llm-proxy?provider={provider}
```

### Providers supportés

- `anthropic` - Claude (Anthropic)
- `openai` - GPT-4o et modèles OpenAI
- `mistral` - Mistral Large
- `deepseek` - DeepSeek-V3
- `qwen` - Qwen Max (Alibaba)
- `xai` - Grok (xAI)
- `groq` - Llama via Groq

### Headers requis

```
Content-Type: application/json
x-api-key: YOUR_API_KEY
```

### Exemple d'utilisation

```typescript
const response = await fetch('/api/llm-proxy?provider=anthropic', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'sk-ant-...',
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    messages: [{ role: 'user', content: 'Hello!' }],
    max_tokens: 1000,
  }),
});
```

## 🚀 Déploiement

Le proxy est automatiquement déployé avec l'application sur Vercel. Aucune configuration supplémentaire n'est nécessaire.

### Configuration Vercel

Le fichier `vercel.json` contient la configuration pour router les requêtes `/api/*` vers les fonctions serverless :

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ]
}
```

## 🔒 Sécurité

⚠️ **Note importante** : Actuellement, les clés API sont stockées côté client (localStorage avec chiffrement XOR). 

Pour une sécurité optimale en production, il faudrait :
1. Stocker les clés API côté serveur (variables d'environnement Vercel)
2. Implémenter une authentification utilisateur
3. Associer chaque utilisateur à ses propres clés API
4. Ne jamais exposer les clés API au client

## 🧪 Tests

Pour tester le proxy localement :

```bash
# Installer Vercel CLI
npm i -g vercel

# Lancer le serveur de développement Vercel
vercel dev
```

Puis tester avec curl :

```bash
curl -X POST http://localhost:3000/api/llm-proxy?provider=anthropic \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{"model":"claude-sonnet-4-20250514","messages":[{"role":"user","content":"Hello"}],"max_tokens":100}'
```

## 📊 Monitoring

Les logs du proxy sont visibles dans :
- **Développement** : Console du terminal
- **Production** : Vercel Dashboard > Functions > Logs

## 🐛 Debugging

Si le proxy ne fonctionne pas :

1. Vérifier que le provider est supporté
2. Vérifier que l'API key est valide
3. Consulter les logs Vercel
4. Vérifier la configuration CORS dans `llm-proxy.ts`

## 📝 Providers qui ne nécessitent PAS de proxy

- ✅ **Google Gemini** - CORS configuré pour les appels directs
- ✅ **Ollama** - Serveur local
- ✅ **LM Studio** - Serveur local

Ces providers peuvent être appelés directement depuis le navigateur.

