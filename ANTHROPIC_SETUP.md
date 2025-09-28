# Configuration d'Anthropic Claude

## Problème CORS

Anthropic Claude ne permet pas les appels directs depuis le navigateur pour des raisons de sécurité. Un proxy local est nécessaire en développement.

## Installation rapide

### Option 1: Script Windows (Recommandé)
1. Double-cliquez sur `start-proxy.bat`
2. Laissez la fenêtre ouverte pendant l'utilisation
3. Le proxy sera disponible sur `http://localhost:3001`

### Option 2: Commande npm
```bash
# Terminal 1 - Lancer le proxy
npm run dev:proxy

# Terminal 2 - Lancer l'application
npm run dev
```

### Option 3: Tout lancer ensemble
```bash
npm install concurrently  # Une seule fois
npm run dev:all           # Lance le proxy ET l'application
```

## Vérification

Si Claude ne fonctionne pas, vérifiez :
1. ✅ Le proxy est lancé (fenêtre de terminal avec "Serveur proxy démarré")
2. ✅ Votre clé API Claude est correcte
3. ✅ Vous êtes sur `localhost` ou `127.0.0.1`

## En production

Pour la production, vous devez :
- Utiliser un backend serveur (Node.js, Python, etc.)
- Ou déployer via des services serverless (Vercel Functions, Netlify Functions)
- Ne JAMAIS exposer votre clé API côté client

## Dépannage

### Erreur "CORS blocked"
→ Le proxy n'est pas lancé. Lancez `start-proxy.bat` ou `npm run dev:proxy`

### Erreur "Failed to fetch"
→ Vérifiez que le proxy est bien sur le port 3001

### Erreur 401
→ Clé API invalide. Vérifiez votre clé dans les paramètres