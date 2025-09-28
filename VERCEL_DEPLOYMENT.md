# 🚀 Déploiement EBIOS RM sur Vercel

## 📋 Prérequis

1. **Compte Vercel** : [Créer un compte](https://vercel.com/signup)
2. **Vercel CLI** (optionnel) : `npm i -g vercel`
3. **Repository GitHub** : Code déjà poussé sur GitHub

## 🔧 Méthodes de déploiement

### Méthode 1 : Interface Web Vercel (Recommandée)

#### 1. **Connecter le repository**
1. Aller sur [vercel.com](https://vercel.com)
2. Cliquer sur "New Project"
3. Importer depuis GitHub : `abk1969/ebio_gcp2`
4. Configurer le projet

#### 2. **Configuration du projet**
```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
Development Command: npm run dev
```

#### 3. **Variables d'environnement** (IMPORTANT)
⚠️ **Ne PAS ajouter de clés API dans Vercel** - L'application utilise le stockage côté client

Variables optionnelles :
```
NODE_ENV=production
VITE_APP_NAME=EBIOS RM AI Assistant
VITE_APP_VERSION=1.0.0
```

### Méthode 2 : Vercel CLI

#### 1. **Installation et connexion**
```bash
npm i -g vercel
vercel login
```

#### 2. **Déploiement**
```bash
# Depuis le répertoire du projet
vercel

# Ou déploiement direct
vercel --prod
```

#### 3. **Configuration automatique**
Le CLI détectera automatiquement Vite et configurera le projet.

## 🔐 Sécurité et Clés API

### ⚠️ IMPORTANT : Gestion des clés API

L'application EBIOS RM utilise un stockage côté client pour les clés API :

1. **Pas de variables d'environnement Vercel** pour les clés API
2. **Configuration via l'interface web** après déploiement
3. **Stockage localStorage** avec chiffrement XOR basique

### 🛡️ Recommandations de sécurité

Pour une sécurité optimale en production :

1. **Backend API Proxy** (recommandé)
   ```
   Client → Vercel Edge Functions → LLM APIs
   ```

2. **Variables d'environnement sécurisées**
   - Utiliser Vercel Environment Variables
   - Créer des Edge Functions pour les appels API
   - Masquer les clés API côté serveur

## 📁 Structure de déploiement

```
ebios_rm_gcp/
├── vercel.json          # Configuration Vercel
├── package.json         # Scripts de build
├── vite.config.ts       # Configuration Vite
├── dist/               # Build de production (généré)
├── src/                # Code source
└── public/             # Assets statiques
```

## 🚀 Processus de déploiement

### 1. **Build local** (test)
```bash
npm run build
npm run preview
```

### 2. **Commit et push**
```bash
git add vercel.json VERCEL_DEPLOYMENT.md
git commit -m "feat: Configuration Vercel pour déploiement"
git push origin main
```

### 3. **Déploiement automatique**
- Vercel détecte automatiquement les nouveaux commits
- Build et déploiement automatiques
- URL de production générée

## 🔗 URLs de déploiement

Après déploiement, vous obtiendrez :

- **Production** : `https://ebios-rm-ai-assistant.vercel.app`
- **Preview** : `https://ebios-rm-ai-assistant-git-main-abk1969.vercel.app`
- **Domaine personnalisé** : Configurable dans Vercel

## 📊 Monitoring et Analytics

### Vercel Analytics
```bash
npm install @vercel/analytics
```

Ajouter dans `src/main.tsx` :
```typescript
import { Analytics } from '@vercel/analytics/react';

// Dans le composant racine
<Analytics />
```

### Vercel Speed Insights
```bash
npm install @vercel/speed-insights
```

## 🐛 Dépannage

### Erreurs communes

1. **Build failed**
   ```bash
   # Vérifier localement
   npm run build
   npm run lint
   ```

2. **Variables d'environnement**
   - Vérifier la configuration Vercel
   - Redéployer après modification

3. **Routing SPA**
   - Le `vercel.json` configure le routing pour SPA
   - Toutes les routes redirigent vers `index.html`

### Logs de déploiement
- Accessible dans l'interface Vercel
- CLI : `vercel logs <deployment-url>`

## 🔄 Mises à jour

### Déploiement automatique
- Push sur `main` → Déploiement automatique
- Pull requests → Preview deployments

### Déploiement manuel
```bash
vercel --prod
```

## 📈 Performance

### Optimisations Vite incluses
- **Code splitting** : vendor/genai chunks
- **Minification** : esbuild
- **Tree shaking** : Modules inutilisés supprimés
- **Assets optimization** : Images et fonts optimisés

### Métriques Vercel
- **First Contentful Paint** : < 1.5s
- **Largest Contentful Paint** : < 2.5s
- **Time to Interactive** : < 3.5s

## 🌐 Domaine personnalisé

1. **Ajouter un domaine** dans Vercel
2. **Configurer DNS** chez votre registrar
3. **SSL automatique** via Vercel

## 📞 Support

- **Documentation Vercel** : [vercel.com/docs](https://vercel.com/docs)
- **Support Vercel** : [vercel.com/support](https://vercel.com/support)
- **Issues GitHub** : Repository du projet
