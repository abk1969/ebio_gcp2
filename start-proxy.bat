@echo off
echo ============================================
echo   Démarrage du proxy pour Claude/Anthropic
echo ============================================
echo.
echo Ce proxy permet d'utiliser Claude en développement local
echo en contournant les restrictions CORS.
echo.
echo Installation des dépendances...
call npm install express cors
echo.
echo Démarrage du proxy sur le port 3001...
node proxy-server.js