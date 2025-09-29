# 🌐 CORS et Proxy Backend - Guide Utilisateur

## 🤔 Qu'est-ce que CORS ?

**CORS** (Cross-Origin Resource Sharing) est une sécurité du navigateur qui empêche un site web d'appeler des APIs externes directement depuis le navigateur.

### Pourquoi c'est important ?

La plupart des providers LLM (Anthropic, OpenAI, Mistral, etc.) bloquent les appels directs depuis le navigateur pour des raisons de sécurité. C'est **normal et attendu**.

## ✅ Solutions implémentées

### 1. Proxy Backend Vercel (Production)

En production sur Vercel, l'application utilise automatiquement un **proxy backend** qui :
- ✅ Contourne les restrictions CORS
- ✅ Fonctionne automatiquement sans configuration
- ✅ Supporte tous les providers

**Providers utilisant le proxy en production :**
- 🤖 Anthropic (Claude)
- 🤖 OpenAI (GPT-4o)
- 🤖 Mistral AI
- 🤖 DeepSeek
- 🤖 Qwen (Alibaba)
- 🤖 xAI (Grok)
- 🤖 Groq

### 2. Providers fonctionnant sans proxy

Certains providers ont des configurations CORS permissives et fonctionnent directement :
- ✅ **Google Gemini** - Fonctionne partout
- ✅ **Ollama** - Serveur local (http://localhost:11434)
- ✅ **LM Studio** - Serveur local (http://localhost:1234)

## 🏠 Développement Local

### Pour Anthropic (Claude)

En développement local, Anthropic nécessite un proxy local. Deux options :

#### Option 1 : Script automatique (Windows)
```bash
# Double-cliquer sur le fichier
start-proxy.bat
```

#### Option 2 : Commande npm
```bash
# Dans un terminal séparé
npm run dev:proxy
```

### Pour les autres providers

En développement local, les autres providers (OpenAI, Mistral, etc.) peuvent rencontrer des erreurs CORS. C'est **normal**.

**Solutions :**
1. ✅ **Utiliser Gemini** - Fonctionne sans proxy
2. ✅ **Utiliser Ollama/LM Studio** - Serveurs locaux
3. ⚠️ **Tester en production** - Le proxy Vercel fonctionne automatiquement

## 🎯 Recommandations par environnement

### 🌍 Production (Vercel)
- ✅ **Tous les providers fonctionnent** grâce au proxy backend
- ✅ Aucune configuration nécessaire
- ✅ Expérience utilisateur optimale

### 💻 Développement Local
- ✅ **Gemini** - Recommandé pour le développement
- ✅ **Ollama/LM Studio** - Pour les tests locaux
- ⚠️ **Anthropic** - Nécessite le proxy local
- ⚠️ **Autres providers** - Peuvent avoir des problèmes CORS

## 🔧 Configuration dans l'interface

L'application affiche automatiquement un message d'information pour les providers nécessitant un proxy :

```
ℹ️ Information importante

Ce provider utilise un proxy backend pour contourner les restrictions CORS.

✅ En production (Vercel) : Fonctionne automatiquement via le proxy Vercel
⚠️ En développement local : Lancez le proxy avec npm run dev:proxy
```

## 🐛 Résolution des problèmes

### Erreur : "Failed to fetch" ou "CORS policy"

**En production :**
- ✅ Le proxy devrait fonctionner automatiquement
- 🔍 Vérifier que l'API key est valide
- 🔍 Consulter les logs Vercel

**En développement local :**
- ✅ Utiliser Gemini à la place
- ✅ Lancer le proxy local pour Anthropic
- ✅ Tester en production pour les autres providers

### Erreur : "Proxy timeout" (Anthropic en local)

Le proxy local n'est pas lancé. Solutions :
1. Lancer `npm run dev:proxy` dans un terminal séparé
2. Double-cliquer sur `start-proxy.bat` (Windows)
3. Utiliser Gemini à la place

### Erreur : "API key is required"

L'API key n'est pas configurée ou invalide :
1. Aller dans **Settings**
2. Sélectionner le provider
3. Entrer une clé API valide
4. Cliquer sur **Sauvegarder**

## 📊 Tableau récapitulatif

| Provider | Production | Dev Local | Proxy Requis |
|----------|-----------|-----------|--------------|
| **Gemini** | ✅ Direct | ✅ Direct | ❌ Non |
| **Anthropic** | ✅ Proxy Vercel | ⚠️ Proxy Local | ✅ Oui |
| **OpenAI** | ✅ Proxy Vercel | ⚠️ CORS | ✅ Oui |
| **Mistral** | ✅ Proxy Vercel | ⚠️ CORS | ✅ Oui |
| **DeepSeek** | ✅ Proxy Vercel | ⚠️ CORS | ✅ Oui |
| **Qwen** | ✅ Proxy Vercel | ⚠️ CORS | ✅ Oui |
| **xAI** | ✅ Proxy Vercel | ⚠️ CORS | ✅ Oui |
| **Groq** | ✅ Proxy Vercel | ⚠️ CORS | ✅ Oui |
| **Ollama** | ✅ Direct | ✅ Direct | ❌ Non |
| **LM Studio** | ✅ Direct | ✅ Direct | ❌ Non |

## 🚀 Pour aller plus loin

### Amélioration de la sécurité

Pour une sécurité optimale en production, il faudrait :
1. Stocker les clés API côté serveur (variables d'environnement)
2. Implémenter une authentification utilisateur
3. Associer chaque utilisateur à ses propres clés API
4. Ne jamais exposer les clés API au client

### Architecture actuelle

```
┌─────────────┐
│  Navigateur │
│   (Client)  │
└──────┬──────┘
       │
       │ Appel API
       ▼
┌─────────────┐
│   Proxy     │
│  Vercel     │ ← Contourne CORS
└──────┬──────┘
       │
       │ Appel API
       ▼
┌─────────────┐
│  Provider   │
│  LLM API    │
└─────────────┘
```

### Architecture recommandée (future)

```
┌─────────────┐
│  Navigateur │
│   (Client)  │
└──────┬──────┘
       │
       │ Auth Token
       ▼
┌─────────────┐
│   Backend   │
│   + Auth    │ ← Clés API stockées ici
└──────┬──────┘
       │
       │ Appel API avec clé serveur
       ▼
┌─────────────┐
│  Provider   │
│  LLM API    │
└─────────────┘
```

## 📚 Ressources

- [Documentation CORS (MDN)](https://developer.mozilla.org/fr/docs/Web/HTTP/CORS)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [Anthropic API Documentation](https://docs.anthropic.com/)
- [OpenAI API Documentation](https://platform.openai.com/docs/)

