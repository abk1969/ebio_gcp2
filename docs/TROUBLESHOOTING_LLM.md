# Guide de dépannage LLM - EBIOS RM

## 🚨 Problèmes courants et solutions

### 1. **Erreur Qwen 403 (Accès refusé)**

#### Symptômes
```
Erreur Qwen: 403
Failed to load resource: the server responded with a status of 403
```

#### Causes possibles
- **Clé API invalide ou manquante**
- **Clé API sans accès au modèle demandé**
- **Quota dépassé**
- **Région non supportée**

#### Solutions
1. **Vérifier la clé API**
   - Aller dans **Paramètres** → **Qwen**
   - S'assurer que la clé API est correctement saisie
   - Obtenir une nouvelle clé sur [Alibaba Cloud DashScope](https://dashscope.console.aliyun.com/)

2. **Changer de modèle**
   - Essayer `qwen-max` au lieu de `qwen3-max`
   - Utiliser `qwen2.5-72b-instruct` comme alternative

3. **Vérifier les quotas**
   - Consulter votre tableau de bord Alibaba Cloud
   - Vérifier les limites de votre compte

### 2. **Erreur OpenAI CORS**

#### Symptômes
```
Access to fetch at 'https://api.openai.com/compatible-mode/v1/chat/completions' 
from origin 'http://localhost:5176' has been blocked by CORS policy
```

#### Cause
- **URL incorrecte** : L'URL contient `/compatible-mode/` qui est spécifique à Qwen

#### Solution
1. **Vider le cache du navigateur**
   - Ctrl+Shift+R (Windows/Linux) ou Cmd+Shift+R (Mac)
   - Ou aller dans les outils développeur → Application → Storage → Clear storage

2. **Redémarrer l'application**
   ```bash
   # Arrêter le serveur de développement
   Ctrl+C
   
   # Relancer
   npm run dev
   ```

3. **Vérifier la configuration OpenAI**
   - Aller dans **Paramètres** → **OpenAI**
   - S'assurer que l'URL de base est `https://api.openai.com` (ou vide)

### 3. **Problèmes d'authentification généraux**

#### Erreur 401 (Non autorisé)
- **Clé API invalide** : Vérifier et régénérer la clé
- **Format incorrect** : S'assurer qu'il n'y a pas d'espaces avant/après

#### Erreur 429 (Trop de requêtes)
- **Quota dépassé** : Attendre ou upgrader le plan
- **Rate limiting** : Réduire la fréquence des appels

### 4. **Problèmes de connectivité**

#### Services locaux (Ollama, LM Studio)
```
Failed to fetch
TypeError: Failed to fetch
```

**Solutions :**
1. **Vérifier que le service est démarré**
   ```bash
   # Pour Ollama
   ollama serve
   
   # Pour LM Studio
   # Démarrer LM Studio et activer le serveur local
   ```

2. **Vérifier l'URL**
   - Ollama : `http://localhost:11434`
   - LM Studio : `http://localhost:1234`

3. **Tester la connectivité**
   ```bash
   # Test Ollama
   curl http://localhost:11434/api/tags
   
   # Test LM Studio
   curl http://localhost:1234/v1/models
   ```

### 5. **Problèmes de modèles**

#### Modèle non trouvé
- **Vérifier la disponibilité** du modèle sur la plateforme
- **Utiliser un modèle alternatif** de la liste

#### Modèles recommandés par fournisseur
- **Gemini** : `gemini-2.5-pro-latest`
- **OpenAI** : `gpt-5` ou `gpt-4o`
- **Anthropic** : `claude-sonnet-4-20250514`
- **Qwen** : `qwen-max` (plus stable que `qwen3-max`)

## 🔧 Outils de diagnostic

### 1. **Testeur LLM intégré**
1. Aller dans **Paramètres**
2. Cliquer sur **🧪 Tester tous les LLM**
3. Voir les résultats détaillés pour chaque fournisseur

### 2. **Console du navigateur**
1. Ouvrir les outils développeur (F12)
2. Aller dans l'onglet **Console**
3. Chercher les logs détaillés :
   ```
   [LLM] Initialisation du service pour le fournisseur: qwen
   [Qwen] Appel API vers: https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
   [Qwen] Modèle utilisé: qwen-max
   [Qwen] Clé API configurée: Oui
   ```

### 3. **Onglet Network**
1. Ouvrir les outils développeur (F12)
2. Aller dans l'onglet **Network**
3. Reproduire l'erreur
4. Examiner les requêtes HTTP pour voir les détails

## 📋 Checklist de dépannage

### Avant de commencer
- [ ] Vérifier la connexion internet
- [ ] S'assurer que les clés API sont valides
- [ ] Vérifier les quotas des services cloud

### Pour chaque fournisseur
- [ ] Clé API correctement configurée
- [ ] Modèle disponible et accessible
- [ ] URL de base correcte
- [ ] Pas de caractères spéciaux dans la configuration

### Tests de validation
- [ ] Test de connectivité individuel
- [ ] Test de génération JSON
- [ ] Vérification des logs de la console
- [ ] Test avec un modèle alternatif

## 🆘 Solutions d'urgence

### Si aucun LLM ne fonctionne
1. **Utiliser Gemini** (généralement le plus stable)
2. **Vérifier la configuration par défaut**
3. **Réinitialiser les paramètres** (bouton Réinitialiser)
4. **Redémarrer l'application**

### Si seul Gemini fonctionne
1. **C'est normal** - Gemini est le plus stable
2. **Configurer les autres progressivement**
3. **Utiliser le testeur pour valider**

### Configuration minimale fonctionnelle
```json
{
  "provider": "gemini",
  "gemini": {
    "apiKey": "VOTRE_CLE_GEMINI",
    "model": "gemini-2.5-pro-latest",
    "baseUrl": "https://generativelanguage.googleapis.com"
  }
}
```

## 📞 Support supplémentaire

### Logs utiles à fournir
1. **Messages d'erreur complets** de la console
2. **Configuration utilisée** (sans les clés API)
3. **Étapes pour reproduire** le problème
4. **Résultats du testeur LLM**

### Ressources externes
- [Documentation Gemini](https://ai.google.dev/docs)
- [Documentation OpenAI](https://platform.openai.com/docs)
- [Documentation Anthropic](https://docs.anthropic.com/)
- [Documentation Qwen/DashScope](https://help.aliyun.com/zh/model-studio/)

### Communauté
- Vérifier les status des services sur leurs pages officielles
- Consulter les forums de développeurs
- Vérifier les mises à jour des modèles
