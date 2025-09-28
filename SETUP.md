# Configuration de l'environnement - EBIOS RM AI Assistant

## 🔑 Configuration des variables d'environnement

### 1. Créer le fichier de configuration

Copiez le fichier d'exemple et configurez vos variables :

```bash
cp .env.example .env
```

### 2. Obtenir votre clé API Google Gemini

1. Rendez-vous sur [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Connectez-vous avec votre compte Google
3. Cliquez sur "Create API Key"
4. Copiez la clé générée

### 3. Configurer votre fichier .env

Ouvrez le fichier `.env` et remplacez `your_gemini_api_key_here` par votre vraie clé API :

```env
# Clé API Google Gemini
GEMINI_API_KEY=AIzaSyC-votre-vraie-cle-api-ici
API_KEY=AIzaSyC-votre-vraie-cle-api-ici
```

### 4. Démarrer l'application

```bash
npm run dev
```

## ⚠️ Sécurité

- **JAMAIS** commiter le fichier `.env` dans Git
- Le fichier `.env` est déjà ajouté au `.gitignore`
- Utilisez `.env.example` comme modèle pour les autres développeurs
- Ne partagez jamais votre clé API publiquement

## 🔧 Variables disponibles

| Variable | Description | Requis |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Clé API Google Gemini | ✅ Oui |
| `API_KEY` | Alias pour compatibilité | ✅ Oui |
| `NODE_ENV` | Environnement (development/production) | ❌ Non |
| `PORT` | Port du serveur de développement | ❌ Non |

## 🚀 Démarrage rapide

1. `npm install`
2. `cp .env.example .env`
3. Configurez votre clé API dans `.env`
4. `npm run dev`
5. Ouvrez http://localhost:5173 (ou le port affiché)
