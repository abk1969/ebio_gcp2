# Corrections des problèmes LLM - EBIOS RM

## 🎯 Objectif
Corriger les problèmes qui empêchaient les LLM autres que Gemini de fonctionner correctement, tout en préservant le fonctionnement de Gemini.

## 🔍 Problèmes identifiés

### 1. **Parsing JSON défaillant**
- **Problème** : La fonction `parseJsonFromText` était trop basique et échouait souvent
- **Solution** : Amélioration de l'algorithme de parsing avec plusieurs stratégies de fallback

### 2. **Instructions système insuffisantes**
- **Problème** : Les instructions pour forcer le format JSON n'étaient pas assez strictes
- **Solution** : Instructions renforcées et spécifiques pour chaque type de LLM

### 3. **Gestion d'erreurs incomplète**
- **Problème** : Erreurs génériques sans détails pour diagnostiquer les problèmes
- **Solution** : Logs détaillés et messages d'erreur spécifiques par fournisseur

### 4. **API Anthropic mal configurée**
- **Problème** : Anthropic utilise un format différent (paramètre `system` séparé)
- **Solution** : Adaptation du format de requête pour Anthropic

### 5. **Modèles obsolètes**
- **Problème** : Certains modèles par défaut n'existaient plus
- **Solution** : Mise à jour des modèles par défaut

## 🛠️ Corrections apportées

### 1. **Amélioration du parsing JSON** (`services/llmService.ts`)
```typescript
// Nouvelle fonction parseJsonFromText avec :
- Logs détaillés pour le debugging
- Nettoyage automatique des candidats
- Multiples stratégies d'extraction
- Messages d'erreur informatifs
```

### 2. **Instructions système renforcées**
```typescript
// buildJsonUserPrompt et buildJsonSystemInstruction améliorées
- Instructions plus strictes et détaillées
- Règles spécifiques pour chaque LLM
- Gestion des schémas JSON
```

### 3. **Correction spécifique Anthropic**
```typescript
// Format de requête corrigé pour Claude
- Paramètre `system` séparé des messages
- Gestion correcte de l'API Anthropic
```

### 4. **Gestion d'erreurs améliorée**
```typescript
// Dans agentOrchestrator.ts et llmService.ts
- Logs détaillés par fournisseur
- Messages d'erreur spécifiques
- Validation des configurations
- Conseils de dépannage
```

### 5. **Services locaux optimisés**
```typescript
// Ollama et LM Studio
- Messages d'erreur spécifiques pour les services locaux
- Vérification de connectivité améliorée
- Conseils de configuration
```

## 🧪 Outils de test ajoutés

### 1. **LLMTester** (`utils/llmTester.ts`)
- Classe utilitaire pour tester tous les fournisseurs
- Tests automatisés avec rapports détaillés
- Validation de la génération JSON

### 2. **Composant de test UI** (`components/LLMTester.tsx`)
- Interface graphique pour tester les LLM
- Tests individuels ou en lot
- Affichage des résultats en temps réel

### 3. **Script de test CLI** (`scripts/test-llm.js`)
- Test en ligne de commande
- Intégration possible dans CI/CD
- Rapports formatés

## 📋 Utilisation

### Test depuis l'interface
1. Aller dans **Paramètres**
2. Cliquer sur **🧪 Tester tous les LLM**
3. Voir les résultats en temps réel

### Test en ligne de commande
```bash
# Tester un fournisseur spécifique
node scripts/test-llm.js gemini

# Tester tous les fournisseurs configurés
node scripts/test-llm.js
```

## ✅ Validation

### Tests effectués
- [x] Gemini : Fonctionnement préservé
- [x] OpenAI : Correction du parsing JSON
- [x] Anthropic : Correction du format API
- [x] Mistral : Amélioration gestion d'erreurs
- [x] DeepSeek : Logs ajoutés
- [x] Autres fournisseurs : Optimisations générales

### Régressions évitées
- ✅ Gemini continue de fonctionner normalement
- ✅ Pas de changement dans l'interface utilisateur existante
- ✅ Compatibilité ascendante maintenue

## 🔧 Configuration recommandée

### Fournisseurs cloud
- Vérifier que les clés API sont valides
- Utiliser les modèles recommandés
- Surveiller les quotas

### Fournisseurs locaux
- S'assurer qu'Ollama/LM Studio sont démarrés
- Vérifier les URLs de connexion
- Tester la connectivité réseau

## 📊 Monitoring

### Logs à surveiller
```
[LLM] Initialisation du service pour le fournisseur: {provider}
[Agent] Appel de l'agent avec le fournisseur: {provider}
[{provider}] Tentative de parsing JSON
[{provider}] JSON parsé avec succès
```

### Erreurs communes
- `Clé API manquante` : Configurer la clé dans les paramètres
- `Impossible de se connecter` : Vérifier la connectivité
- `JSON attendu` : Problème de parsing, voir les logs détaillés

## 🚀 Prochaines étapes

1. **Monitoring en production** : Surveiller les logs pour détecter les problèmes
2. **Tests réguliers** : Utiliser le testeur LLM périodiquement
3. **Optimisations** : Améliorer les performances selon les retours
4. **Nouveaux fournisseurs** : Ajouter d'autres LLM si nécessaire

## 📝 Notes techniques

- Toutes les modifications sont rétrocompatibles
- Les logs peuvent être désactivés en production si nécessaire
- Le cache des services LLM est maintenu pour les performances
- La validation des configurations est renforcée
