import React, { useState } from 'react';
import { LLMTester } from '../utils/llmTester';
import type { LLMProvider } from '../types';

interface TestResult {
  success: boolean;
  error?: string;
  duration?: number;
}

interface LLMTesterProps {
  onClose: () => void;
}

/**
 * Composant pour tester les fournisseurs LLM depuis l'interface
 */
const LLMTesterComponent: React.FC<LLMTesterProps> = ({ onClose }) => {
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, TestResult>>({});

  const providers: { id: LLMProvider; name: string }[] = [
    { id: 'gemini', name: 'Google Gemini' },
    { id: 'openai', name: 'OpenAI GPT' },
    { id: 'mistral', name: 'Mistral AI' },
    { id: 'anthropic', name: 'Anthropic Claude' },
    { id: 'deepseek', name: 'DeepSeek' },
    { id: 'qwen', name: 'Qwen (Alibaba)' },
    { id: 'xai', name: 'xAI Grok' },
    { id: 'groq', name: 'Groq' },
    { id: 'ollama', name: 'Ollama (Local)' },
    { id: 'lmstudio', name: 'LM Studio (Local)' }
  ];

  const handleTestProvider = async (provider: LLMProvider) => {
    setTestingProvider(provider);
    setResults(prev => ({ ...prev, [provider]: { success: false } }));

    try {
      const result = await LLMTester.testProvider(provider);
      setResults(prev => ({ ...prev, [provider]: result }));
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        [provider]: { 
          success: false, 
          error: error instanceof Error ? error.message : 'Erreur inconnue' 
        } 
      }));
    } finally {
      setTestingProvider(null);
    }
  };

  const handleTestAll = async () => {
    setIsTestingAll(true);
    setResults({});

    try {
      const allResults = await LLMTester.testConfiguredProviders();
      setResults(allResults);
    } catch (error) {
      console.error('Erreur lors du test de tous les fournisseurs:', error);
    } finally {
      setIsTestingAll(false);
    }
  };

  const getStatusIcon = (provider: string) => {
    const result = results[provider];
    if (testingProvider === provider || (isTestingAll && !result)) {
      return <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>;
    }
    if (result?.success) {
      return <span className="text-green-500">✅</span>;
    }
    if (result && !result.success) {
      return <span className="text-red-500">❌</span>;
    }
    return <span className="text-gray-400">⚪</span>;
  };

  const getStatusText = (provider: string) => {
    const result = results[provider];
    if (testingProvider === provider || (isTestingAll && !result)) {
      return 'Test en cours...';
    }
    if (result?.success) {
      return `Succès (${result.duration}ms)`;
    }
    if (result && !result.success) {
      // Message spécial pour Anthropic CORS
      if (provider === 'anthropic' && result.error?.includes('CORS')) {
        return 'Erreur CORS - Lancez le proxy (voir ANTHROPIC_SETUP.md)';
      }
      return result.error || 'Échec';
    }
    return 'Non testé';
  };

  const successCount = Object.values(results).filter(r => r.success).length;
  const totalTested = Object.keys(results).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Test des fournisseurs LLM</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600">
                Testez la connectivité et le fonctionnement de vos fournisseurs LLM configurés.
              </p>
              <button
                onClick={handleTestAll}
                disabled={isTestingAll}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isTestingAll ? 'Test en cours...' : 'Tester tous'}
              </button>
            </div>

            {totalTested > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="text-sm text-gray-600">
                  Résultats: {successCount}/{totalTested} fournisseurs fonctionnels
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${totalTested > 0 ? (successCount / totalTested) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{provider.name}</h3>
                  {getStatusIcon(provider.id)}
                </div>
                
                <div className="text-sm text-gray-600 mb-3">
                  {getStatusText(provider.id)}
                </div>

                <button
                  onClick={() => handleTestProvider(provider.id)}
                  disabled={testingProvider === provider.id || isTestingAll}
                  className="w-full px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {testingProvider === provider.id ? 'Test en cours...' : 'Tester'}
                </button>
              </div>
            ))}
          </div>

          {Object.keys(results).length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Détails des résultats</h3>
              <div className="space-y-2 text-sm">
                {Object.entries(results).map(([provider, result]) => (
                  <div key={provider} className="flex items-center justify-between">
                    <span className="font-medium">{provider.toUpperCase()}:</span>
                    <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                      {result.success ? `✅ OK (${result.duration}ms)` : `❌ ${result.error}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default LLMTesterComponent;
