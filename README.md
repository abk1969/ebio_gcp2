# EBIOS RM AI Assistant

Assistant IA pour la méthode EBIOS Risk Manager (EBIOS RM) - Méthodologie française d'analyse de risques cybersécurité.

## 🚀 Fonctionnalités

- **5 Ateliers EBIOS RM** : Implémentation complète de la méthodologie
- **Support multi-LLM** : Compatible avec 9 fournisseurs de modèles de langage
- **Interface intuitive** : Interface web moderne et responsive
- **Génération automatique** : Création automatisée des livrables EBIOS RM
- **Validation intégrée** : Vérification de la cohérence des données

## 🤖 Fournisseurs LLM Supportés

### Fournisseurs Cloud
- **Google Gemini** - Gemini 2.5 Pro, 2.5 Flash, 2.0 Flash
- **Mistral AI** - Mistral Large 2.1, Medium 3.1, Codestral 2508
- **Anthropic Claude** - Claude Sonnet 4, Claude Opus 4.1
- **DeepSeek** - DeepSeek V3, DeepSeek Reasoner
- **Qwen (Alibaba)** - Qwen3 235B Instruct/Thinking, Qwen3 8B
- **xAI Grok** - Grok 4, Grok Code Fast 1, Grok 3
- **Groq** - Llama 3.3 70B Versatile, OpenAI GPT-OSS 120B

### Fournisseurs Locaux
- **Ollama** - Modèles locaux (Llama, Mistral, CodeLlama, etc.)
- **LM Studio** - Interface locale pour modèles open source

## 📋 Prérequis

- **Node.js** (version 18 ou supérieure)
- **npm** ou **yarn**
- **Clé API** d'au moins un fournisseur LLM cloud (optionnel si utilisation locale)

## 🛠️ Installation

1. **Cloner le repository**
   ```bash
   git clone <repository-url>
   cd ebios_rm_gcp
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configuration (optionnel)**
   - Créer un fichier `.env.local` pour les clés API de développement
   - Les clés API peuvent aussi être configurées via l'interface web

4. **Lancer l'application**
   ```bash
   npm run dev
   ```

5. **Accéder à l'application**
   - Ouvrir http://localhost:5173 dans votre navigateur

## ⚙️ Configuration des Fournisseurs LLM

### Google Gemini
```
Clé API : Obtenir sur https://aistudio.google.com/app/apikey
Modèles recommandés : gemini-2.5-pro, gemini-2.5-flash
```

### Mistral AI
```
Clé API : Obtenir sur https://console.mistral.ai/
Modèles recommandés : mistral-large-2411, mistral-medium-2508
```

### Anthropic Claude
```
Clé API : Obtenir sur https://console.anthropic.com/
Modèles recommandés : claude-sonnet-4-20250514, claude-opus-4-1-20250805
```

### DeepSeek
```
Clé API : Obtenir sur https://platform.deepseek.com/
Modèles recommandés : deepseek-v3, deepseek-reasoner
```

### Qwen (Alibaba)
```
Clé API : Obtenir sur https://dashscope.console.aliyun.com/
Modèles recommandés : qwen3-235b-a22b-instruct-2507, qwen3-235b-a22b-thinking-2507
```

### xAI Grok
```
Clé API : Obtenir sur https://console.x.ai/
Modèles recommandés : grok-4-0709, grok-code-fast-1
```

### Groq
```
Clé API : Obtenir sur https://console.groq.com/
Modèles recommandés : llama-3.3-70b-versatile, openai/gpt-oss-120b
```

### Ollama (Local)
```
Installation : https://ollama.ai/
URL par défaut : http://localhost:11434
Modèles populaires : llama3.2, mistral, codellama
```

### LM Studio (Local)
```
Installation : https://lmstudio.ai/
URL par défaut : http://localhost:1234
Compatible avec tous les modèles GGUF
```

## 🏗️ Architecture EBIOS RM

L'application implémente les 5 ateliers de la méthode EBIOS RM :

1. **Atelier 1 - Cadrage** : Définition des valeurs métier et événements redoutés
2. **Atelier 2 - Sources de risque** : Identification des sources de risque
3. **Atelier 3 - Scénarios stratégiques** : Élaboration des scénarios stratégiques
4. **Atelier 4 - Scénarios opérationnels** : Détail des scénarios opérationnels
5. **Atelier 5 - Mesures de sécurité** : Définition des mesures de sécurité

## 🧪 Tests

```bash
# Lancer les tests
npm test

# Tests avec couverture
npm run test:coverage
```

## 📚 Documentation Technique

Voir [TECHNICAL_README.md](TECHNICAL_README.md) pour les détails techniques complets.

## 🤝 Contribution

Les contributions sont les bienvenues ! Veuillez consulter les guidelines de contribution.

## 📄 Licence

Ce projet est sous licence [MIT](LICENSE).
