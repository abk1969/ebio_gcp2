# ⚠️ AVERTISSEMENT DE SÉCURITÉ - CLÉS API

## 🔐 Protection des Clés API LLM

**ATTENTION** : Ce projet utilise des clés API pour plusieurs fournisseurs LLM. Il est **CRUCIAL** de protéger ces clés.

### 🚨 Risques de Sécurité

Les clés API donnent accès à des services payants et peuvent être utilisées de manière malveillante si elles sont exposées :
- **Coûts financiers** : Utilisation non autorisée de vos quotas
- **Violation de données** : Accès à vos modèles et configurations
- **Abus de service** : Utilisation pour des activités malveillantes

### 📍 Où sont stockées les clés API

1. **localStorage du navigateur** (chiffrement XOR basique)
   - Clé : `ebios_llm_config`
   - Fichier : `services/configService.ts`
   - Chiffrement : `utils/encryption.ts`

2. **Variables d'environnement** (développement uniquement)
   - Fichiers `.env*`
   - Variables : `GEMINI_API_KEY`, `OPENAI_API_KEY`, etc.

3. **Interface utilisateur**
   - Composant : `components/Settings.tsx`
   - Champs de saisie des clés API

### ✅ Bonnes Pratiques

#### Pour les Développeurs
- ✅ **JAMAIS** commiter de clés API dans le code
- ✅ Utiliser `.env.example` avec des valeurs factices
- ✅ Vérifier le `.gitignore` avant chaque commit
- ✅ Utiliser des clés API de test/développement séparées
- ✅ Révoquer immédiatement toute clé exposée

#### Pour les Utilisateurs
- ✅ Utiliser des clés API avec des quotas limités
- ✅ Surveiller l'utilisation de vos clés API
- ✅ Révoquer les clés inutilisées
- ✅ Ne jamais partager vos clés API

### 🛡️ Protections Actuelles

#### Fichiers protégés par `.gitignore`
```
# Variables d'environnement
.env*

# Fichiers de configuration
*config*.json
*settings*.json
*.key
*.secret

# Stockage EBIOS RM
ebios_llm_config*
localStorage.json
sessionStorage.json

# Fichiers temporaires
temp-*.json
*.tmp
```

#### Chiffrement côté client
- Chiffrement XOR basique dans `utils/encryption.ts`
- ⚠️ **LIMITATION** : Sécurité limitée côté client
- 🎯 **RECOMMANDATION** : Implémenter un backend sécurisé

### 🔧 Améliorations de Sécurité Recommandées

1. **Backend API Proxy**
   ```
   Client → Backend Proxy → LLM Provider
   ```

2. **Authentification utilisateur**
   - JWT tokens
   - Sessions sécurisées
   - Gestion des permissions

3. **Stockage sécurisé côté serveur**
   - Base de données chiffrée
   - Variables d'environnement serveur
   - Secrets management (HashiCorp Vault, AWS Secrets Manager)

4. **Audit et monitoring**
   - Logs d'utilisation des API
   - Alertes sur usage anormal
   - Rotation automatique des clés

### 🚨 En cas d'exposition de clé API

1. **Révoquer immédiatement** la clé exposée
2. **Générer une nouvelle clé** sur la plateforme du fournisseur
3. **Vérifier les logs d'utilisation** pour détecter un usage malveillant
4. **Mettre à jour** la configuration avec la nouvelle clé
5. **Analyser** comment l'exposition s'est produite

### 📞 Contacts d'Urgence

- **Google Gemini** : https://aistudio.google.com/app/apikey
- **OpenAI** : https://platform.openai.com/api-keys
- **Anthropic** : https://console.anthropic.com/
- **Mistral** : https://console.mistral.ai/
- **Groq** : https://console.groq.com/
- **xAI** : https://console.x.ai/

### 📚 Ressources Supplémentaires

- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [Guide de sécurité des clés API](https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html)
- [Best Practices for API Key Safety](https://cloud.google.com/docs/authentication/api-keys)

---

**Rappel** : La sécurité est la responsabilité de tous. En cas de doute, demandez conseil à l'équipe de sécurité.
