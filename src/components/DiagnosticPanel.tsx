import React, { useState } from 'react';
import configService from '../services/configService';

/**
 * Panneau de diagnostic pour vérifier l'état de la configuration
 */
const DiagnosticPanel: React.FC = () => {
  const [showDiag, setShowDiag] = useState(false);
  const config = configService.getConfig();

  if (!showDiag) {
    return (
      <button
        onClick={() => setShowDiag(true)}
        className="fixed bottom-4 left-4 z-50 px-3 py-2 bg-purple-600 text-white text-sm rounded-lg shadow-lg hover:bg-purple-700 transition-colors"
        title="Ouvrir le diagnostic de configuration"
      >
        🔍 Diagnostic
      </button>
    );
  }

  const provider = config.provider;
  const providerConfig = config[provider];
  const hasApiKey = !!providerConfig.apiKey;
  const apiKeyLength = providerConfig.apiKey?.length || 0;
  const apiKeyPreview = providerConfig.apiKey
    ? providerConfig.apiKey.substring(0, 15) + '...'
    : 'EMPTY';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">🔍 Diagnostic de Configuration</h2>
            <button
              onClick={() => setShowDiag(false)}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            {/* Provider actuel */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Provider LLM Actuel</h3>
              <p className="text-blue-800 text-lg font-mono">{provider}</p>
            </div>

            {/* État de la clé API */}
            <div className={`p-4 rounded-lg ${hasApiKey ? 'bg-green-50' : 'bg-red-50'}`}>
              <h3 className={`font-semibold mb-2 ${hasApiKey ? 'text-green-900' : 'text-red-900'}`}>
                État de la Clé API
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`text-2xl ${hasApiKey ? 'text-green-600' : 'text-red-600'}`}>
                    {hasApiKey ? '✅' : '❌'}
                  </span>
                  <span className={hasApiKey ? 'text-green-800' : 'text-red-800'}>
                    {hasApiKey ? 'Clé API configurée' : 'Clé API manquante'}
                  </span>
                </div>
                <div className="text-sm font-mono bg-white p-2 rounded">
                  <div><strong>Longueur:</strong> {apiKeyLength} caractères</div>
                  <div><strong>Aperçu:</strong> {apiKeyPreview}</div>
                </div>
              </div>
            </div>

            {/* Configuration du provider */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Configuration {provider}</h3>
              <div className="space-y-2 text-sm font-mono bg-white p-2 rounded">
                <div><strong>Modèle:</strong> {providerConfig.model || 'NON CONFIGURÉ'}</div>
                {providerConfig.baseUrl && (
                  <div><strong>Base URL:</strong> {providerConfig.baseUrl}</div>
                )}
              </div>
            </div>

            {/* État localStorage */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-900 mb-2">État localStorage</h3>
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <span className={typeof window !== 'undefined' && localStorage ? 'text-green-600' : 'text-red-600'}>
                    {typeof window !== 'undefined' && localStorage ? '✅' : '❌'}
                  </span>
                  <span>localStorage disponible</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={typeof document !== 'undefined' ? 'text-green-600' : 'text-red-600'}>
                    {typeof document !== 'undefined' ? '✅' : '❌'}
                  </span>
                  <span>document disponible (côté client)</span>
                </div>
              </div>
            </div>

            {/* Instructions */}
            {!hasApiKey && (
              <div className="bg-orange-50 border-l-4 border-orange-500 p-4">
                <h3 className="font-semibold text-orange-900 mb-2">⚠️ Action requise</h3>
                <p className="text-orange-800 text-sm mb-2">
                  Votre clé API n'est pas configurée. Pour utiliser l'application :
                </p>
                <ol className="list-decimal list-inside text-sm text-orange-800 space-y-1">
                  <li>Allez dans <strong>Paramètres</strong> (sidebar)</li>
                  <li>Sélectionnez votre provider LLM préféré</li>
                  <li>Entrez votre clé API</li>
                  <li>Cliquez sur <strong>Sauvegarder</strong></li>
                  <li>Testez à nouveau</li>
                </ol>
              </div>
            )}

            {/* Bouton de fermeture */}
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setShowDiag(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticPanel;
