# Guide de résolution des problèmes LLM

## Problèmes courants et solutions

### 1. Anthropic Claude - Erreur CORS

**Problème:** `Access to fetch at 'https://api.anthropic.com/v1/messages' has been blocked by CORS policy`

**Cause:** Anthropic n'autorise pas les appels directs depuis le navigateur pour des raisons de sécurité.

**Solutions:**

#### Option A: Utiliser le serveur proxy local (Recommandé pour le développement)
1. Installez les dépendances du proxy:
   ```bash
   npm install express cors
   ```

2. Lancez le serveur proxy:
   ```bash
   node proxy-server.js
   ```

3. Le proxy sera disponible sur `http://localhost:3001`

#### Option B: Déployer en production
- En production, utilisez un backend qui fait les appels API côté serveur
- Considérez des services comme Vercel Functions, Netlify Functions, ou AWS Lambda

#### Option C: Utiliser un autre fournisseur
- Gemini, Mistral, Groq, et OpenAI fonctionnent directement depuis le navigateur

---

### 2. Qwen (Alibaba) - Model Access Denied

**Problème:** `Model.AccessDenied` ou `AccessDenied.Unpurchased`

**Cause:** Le modèle demandé n'est pas activé sur votre compte DashScope.

**Solutions:**

1. **Vérifier les modèles disponibles:**
   - Connectez-vous à [DashScope Console](https://dashscope.console.aliyun.com/)
   - Vérifiez les modèles activés dans votre compte

2. **Utiliser un modèle gratuit:**
   - Changez pour `qwen-turbo` (généralement gratuit)
   - Ou `qwen-plus` si vous avez des crédits

3. **Activer le modèle:**
   - Dans DashScope, activez le modèle souhaité
   - Certains modèles nécessitent une validation ou un paiement

4. **Vérifier la région:**
   - Pour l'international: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
   - Pour la Chine: `https://dashscope.aliyuncs.com/compatible-mode/v1`

---

### 3. xAI Grok - Rate Limiting (429)

**Problème:** `429 Too Many Requests`

**Cause:** Dépassement de la limite de taux de l'API xAI.

**Solutions:**

1. **Attendre avant de réessayer:**
   - L'application a un retry automatique avec backoff exponentiel
   - Attendez 30-60 secondes entre les tests

2. **Réduire la fréquence:**
   - Limitez le nombre d'appels par minute
   - Utilisez le mode batch si possible

3. **Vérifier votre plan:**
   - Connectez-vous à [x.ai](https://x.ai) pour voir vos limites
   - Considérez un plan supérieur si nécessaire

---

### 4. Google Gemini - Model Not Found

**Problème:** `Le modèle spécifié n'est pas disponible`

**Solutions:**

1. **Utiliser les modèles stables:**
   - `gemini-2.5-flash` (Recommandé)
   - `gemini-2.5-flash-lite`
   - `gemini-2.5-pro`

2. **Éviter les suffixes obsolètes:**
   - N'utilisez pas `-latest` ou `-exp`
   - Utilisez les versions stables sans suffixe

3. **Vérifier la clé API:**
   - Assurez-vous que votre clé est valide
   - Créez une nouvelle clé sur [Google AI Studio](https://aistudio.google.com/app/apikey)

---

## Configuration recommandée par fournisseur

### Fournisseurs sans problème CORS (Recommandés)
- ✅ **Google Gemini** - Fonctionne directement
- ✅ **Mistral AI** - Fonctionne directement
- ✅ **Groq** - Fonctionne directement
- ✅ **DeepSeek** - Fonctionne directement
- ✅ **OpenAI** - Fonctionne directement

### Fournisseurs nécessitant un proxy
- ⚠️ **Anthropic Claude** - Nécessite proxy ou backend
- ⚠️ **Qwen** - Peut nécessiter configuration spéciale

### Fournisseurs locaux
- 💻 **Ollama** - Nécessite Ollama installé localement
- 💻 **LM Studio** - Nécessite LM Studio en cours d'exécution

---

## Commandes de diagnostic

### Tester la configuration actuelle
```javascript
// Dans la console du navigateur
window.quickOpenAIDiagnostic()
```

### Voir les modèles OpenAI disponibles
```javascript
// Afficher la liste des modèles OpenAI
window.showOpenAIModels()
```

### Nettoyer les modèles obsolètes
```javascript
// Supprime automatiquement -latest des modèles Gemini
window.cleanObsoleteModels()
```

### Vérifier les clés API
1. Ouvrez les paramètres de l'application
2. Vérifiez que les clés sont correctement saisies
3. Testez chaque fournisseur individuellement

---

## Scripts de démarrage rapide

### Développement avec proxy (pour Anthropic)
```bash
# Terminal 1: Lancer le proxy
node proxy-server.js

# Terminal 2: Lancer l'application
npm run dev
```

### Production
```bash
# Build pour production
npm run build

# Preview local
npm run preview
```

---

## Messages d'erreur et significations

| Erreur | Signification | Solution |
|--------|--------------|----------|
| `401 Unauthorized` | Clé API invalide | Vérifier la clé API |
| `403 Forbidden` | Accès refusé au modèle | Changer de modèle ou activer l'accès |
| `429 Too Many Requests` | Limite de taux dépassée | Attendre avant de réessayer |
| `CORS blocked` | Appel navigateur non autorisé | Utiliser un proxy ou backend |
| `Network Error` | Problème de connexion | Vérifier la connexion internet |
| `Model not found` | Modèle inexistant | Utiliser un modèle valide |

---

## Support

Pour plus d'aide:
1. Consultez la documentation officielle de chaque fournisseur
2. Vérifiez les logs dans la console du navigateur (F12)
3. Créez une issue sur le repo GitHub avec les détails de l'erreur