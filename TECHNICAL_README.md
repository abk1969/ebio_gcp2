# EBIOS RM AI Assistant - Documentation Technique

## 🔒 Sécurité

### Problèmes de Sécurité Résolus
- ✅ Suppression de l'exposition des clés API dans les logs
- ✅ Chiffrement basique des données sensibles en localStorage
- ✅ Validation des entrées utilisateur
- ✅ Sanitisation des réponses LLM
- ✅ Détection d'injection dans les réponses IA
- ✅ Validation stricte des réponses d'atelier

### Problèmes de Sécurité Restants ⚠️
- **CRITIQUE**: Stockage côté client des clés API (même chiffrées)
- **CRITIQUE**: Pas de backend pour proxy des appels API
- **MOYEN**: Chiffrement XOR basique (non cryptographique)
- **MOYEN**: Pas de protection CSRF

### Recommandations de Sécurité
1. **Immédiat**: Implémenter un backend proxy pour les appels LLM
2. **Immédiat**: Utiliser un vrai chiffrement (AES) ou un service de secrets
3. **Court terme**: Ajouter une authentification utilisateur
4. **Court terme**: Implémenter des tokens JWT avec expiration

## 🏗️ Architecture

### Structure du Projet
```
ebios_rm_gcp/
├── src/
│   ├── components/          # Composants React
│   ├── context/            # Context API pour l'état global
│   ├── services/           # Services métier (LLM, config)
│   ├── utils/              # Utilitaires (validation, chiffrement, logging)
│   └── test/               # Tests unitaires
├── types.ts                # Définitions TypeScript
├── constants.ts            # Constantes de l'application
└── vite.config.ts          # Configuration Vite
```

### Patterns Utilisés
- **Context API**: Gestion d'état global du projet EBIOS
- **Factory Pattern**: Création des services LLM
- **Error Boundary**: Gestion des erreurs React
- **Singleton**: Logger et service de configuration
- **Observer Pattern**: Listeners de configuration

### Architecture LLM

#### Interface Commune
Tous les services LLM implémentent l'interface `LLMService`:
```typescript
interface LLMService {
  generateContent(prompt: string, systemInstruction?: string, responseSchema?: any): Promise<LLMResponse>;
  generateJSON(prompt: string, systemInstruction: string, responseSchema: any): Promise<any>;
}
```

#### Factory Pattern
Le `LLMServiceFactory` crée dynamiquement les services selon le fournisseur:
```typescript
const service = LLMServiceFactory.createService(provider, config);
```

#### Gestion des Erreurs
- Timeout automatique (5 secondes pour les tests de connexion)
- Gestion spécifique des codes d'erreur HTTP
- Messages d'erreur localisés en français
- Retry automatique pour certaines erreurs temporaires

#### Validation des Réponses
- Parsing JSON strict avec gestion d'erreurs
- Validation des schémas EBIOS RM
- Sanitisation des données d'entrée et de sortie

## 🧪 Tests

### Configuration
- **Framework**: Vitest + Testing Library
- **Environnement**: jsdom
- **Couverture**: Tests unitaires pour utilitaires et composants

### Commandes
```bash
npm test              # Lancer les tests
npm run test:ui       # Interface graphique des tests
npm run test:coverage # Rapport de couverture
```

### Tests Implémentés
- ✅ Validation des entrées utilisateur
- ✅ Composant Loader
- ✅ Composant ErrorNotification
- ❌ Tests d'intégration manquants
- ❌ Tests E2E manquants

## 📊 Performance

### Optimisations Implémentées
- ✅ React.memo pour les composants statiques
- ✅ useCallback optimisé avec dépendances spécifiques
- ✅ Lazy loading des modules Vite
- ✅ Timeouts pour les connexions réseau

### Métriques de Performance
- **Bundle size**: ~500KB (optimisable)
- **First Load**: ~2s (acceptable)
- **LLM Response**: 3-10s (dépend du modèle)

## 🔧 Configuration

### Variables d'Environnement
```bash
# Développement uniquement
GEMINI_API_KEY=your_key_here
NODE_ENV=development
```

### Providers LLM Supportés

#### Fournisseurs Cloud (API)
1. **Google Gemini**
   - Configuration: Clé API requise
   - Modèles: gemini-2.5-pro, gemini-2.5-flash, gemini-2.0-flash
   - URL: https://generativelanguage.googleapis.com

2. **Mistral AI**
   - Configuration: Clé API requise
   - Modèles: mistral-large-2411, mistral-medium-2508, codestral-2508
   - URL: https://api.mistral.ai

3. **Anthropic Claude**
   - Configuration: Clé API requise
   - Modèles: claude-sonnet-4-20250514, claude-opus-4-1-20250805
   - URL: https://api.anthropic.com

4. **DeepSeek**
   - Configuration: Clé API requise
   - Modèles: deepseek-v3, deepseek-reasoner
   - URL: https://api.deepseek.com

5. **Qwen (Alibaba)**
   - Configuration: Clé API requise
   - Modèles: qwen3-235b-a22b-instruct-2507, qwen3-235b-a22b-thinking-2507
   - URL: https://dashscope.aliyuncs.com

6. **xAI Grok**
   - Configuration: Clé API requise
   - Modèles: grok-4-0709, grok-code-fast-1, grok-3
   - URL: https://api.x.ai

7. **Groq**
   - Configuration: Clé API requise
   - Modèles: llama-3.3-70b-versatile, openai/gpt-oss-120b, groq-compound
   - URL: https://api.groq.com/openai

8. **OpenAI**
   - Configuration: Clé API requise
   - Modèles: gpt-5, gpt-4o, gpt-4o-mini, gpt-4-turbo
   - URL: https://api.openai.com

#### Fournisseurs Locaux
9. **Ollama**
   - Configuration: URL de base + nom du modèle
   - Modèles: llama3.2, mistral, codellama, etc.
   - URL par défaut: http://localhost:11434
   - Recommandé pour la confidentialité

10. **LM Studio**
    - Configuration: URL de base + nom du modèle
    - Compatible avec tous les modèles GGUF
    - URL par défaut: http://localhost:1234
    - Interface utilisateur conviviale

## 🐛 Debugging

### Logging
Le système de logging capture:
- Actions utilisateur
- Appels d'agents IA
- Événements de sécurité
- Métriques de performance
- Erreurs système

### Accès aux Logs
```javascript
// Console développeur
import logger from './utils/logger';
logger.getLogs();                    // Tous les logs
logger.getLogsForLevel(LogLevel.ERROR); // Logs d'erreur uniquement
```

### Logs en Production
- Stockage en localStorage (100 dernières entrées)
- Prêt pour intégration avec services externes (Sentry, LogRocket)

## 🚀 Déploiement

### Build de Production
```bash
npm run build
npm run preview  # Prévisualisation locale
```

### Checklist Pré-Déploiement
- [ ] Tests passent (npm test)
- [ ] Build réussit sans warnings
- [ ] Configuration de sécurité vérifiée
- [ ] Variables d'environnement configurées
- [ ] Monitoring configuré

### Environnements Recommandés
- **Développement**: Vite dev server
- **Staging**: Netlify, Vercel
- **Production**: CDN + Backend sécurisé

## 🔄 Maintenance

### Mise à Jour des Dépendances
```bash
npm audit                    # Vérifier les vulnérabilités
npm update                   # Mettre à jour les dépendances
npm run lint                 # Vérifier le code
```

### Monitoring Recommandé
- Erreurs JavaScript (Sentry)
- Performance (Web Vitals)
- Utilisation API (quotas LLM)
- Sécurité (tentatives d'injection)

## 📝 Contribution

### Standards de Code
- TypeScript strict activé
- ESLint + Prettier configurés
- Tests requis pour nouvelles fonctionnalités
- Documentation JSDoc pour fonctions publiques

### Workflow Git
1. Feature branch depuis main
2. Tests passent
3. Code review requis
4. Merge après approbation

## 🆘 Support

### Problèmes Connus
1. **Clés API exposées**: Utiliser uniquement en développement
2. **Timeout LLM**: Augmenter les timeouts si nécessaire
3. **Quota API**: Surveiller l'utilisation Gemini

### Contact
- Issues GitHub pour bugs
- Discussions pour questions
- Documentation technique dans ce fichier
