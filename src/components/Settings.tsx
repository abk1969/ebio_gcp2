import React, { useState, useEffect } from 'react';
import configService from '../services/configService';
import type { LLMConfig, LLMProvider } from '../types';
import { validateApiKey, validateUrl } from '../utils/validation';
import LLMTesterComponent from './LLMTester';
import { quickOpenAIDiagnostic } from '../utils/quickDiagnostic';

const Settings: React.FC = () => {
  const [config, setConfig] = useState<LLMConfig>(configService.getConfig());
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showLLMTester, setShowLLMTester] = useState(false);


  useEffect(() => {
    const unsubscribe = configService.addListener((newConfig) => {
      setConfig(newConfig);
      setHasUnsavedChanges(false);
    });

    return unsubscribe;
  }, []);

  const handleProviderChange = (provider: LLMProvider) => {
    const newConfig = { ...config, provider };
    setConfig(newConfig);
    setHasUnsavedChanges(true);
    setConnectionResult(null);
  };

  const handleConfigChange = (provider: LLMProvider, field: string, value: string) => {
    // Validation en temps réel
    const errors = { ...validationErrors };
    const errorKey = `${provider}.${field}`;

    if (field === 'apiKey') {
      const validation = validateApiKey(value);
      if (!validation.isValid) {
        errors[errorKey] = validation.error!;
      } else {
        delete errors[errorKey];
      }
    } else if (field === 'baseUrl') {
      const validation = validateUrl(value);
      if (!validation.isValid) {
        errors[errorKey] = validation.error!;
      } else {
        delete errors[errorKey];
      }
    }

    setValidationErrors(errors);

    const newConfig = {
      ...config,
      [provider]: {
        ...config[provider],
        [field]: value
      }
    };
    setConfig(newConfig);
    setHasUnsavedChanges(true);
    setConnectionResult(null);
  };

  const handleSave = () => {
    configService.updateConfig(config);
    setHasUnsavedChanges(false);
  };

  const handleReset = () => {
    configService.resetToDefaults();
    setConnectionResult(null);
  };

  const handleTestConnection = async () => {
    if (hasUnsavedChanges) {
      configService.updateConfig(config);
      setHasUnsavedChanges(false);
    }

    setIsTestingConnection(true);
    setConnectionResult(null);

    try {
      const result = await configService.testConnection();
      setConnectionResult(result);
    } catch (error) {
      setConnectionResult({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const renderProviderConfig = () => {
    const { provider } = config;
    const providerConfig = config[provider];

    switch (provider) {
      case 'gemini':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clé API Gemini *
              </label>
              <input
                type="password"
                value={providerConfig.apiKey}
                onChange={(e) => handleConfigChange('gemini', 'apiKey', e.target.value)}
                placeholder="Entrez votre clé API Gemini"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Obtenez votre clé API sur <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">Google AI Studio</a>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modèle
              </label>
              <select
                value={providerConfig.model}
                onChange={(e) => handleConfigChange('gemini', 'model', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommandé)</option>
                <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                <option value="gemini-1.5-flash-8b">Gemini 1.5 Flash 8B</option>
              </select>
            </div>
          </div>
        );

      case 'ollama':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL de base Ollama *
              </label>
              <input
                type="url"
                value={providerConfig.baseUrl}
                onChange={(e) => handleConfigChange('ollama', 'baseUrl', e.target.value)}
                placeholder="http://localhost:11434"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                URL de votre instance Ollama locale
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modèle *
              </label>
              <input
                type="text"
                value={providerConfig.model}
                onChange={(e) => handleConfigChange('ollama', 'model', e.target.value)}
                placeholder="llama3.3, qwen2.5, mistral, codellama..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Nom du modèle installé dans Ollama
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clé API (optionnel)
              </label>
              <input
                type="password"
                value={providerConfig.apiKey || ''}
                onChange={(e) => handleConfigChange('ollama', 'apiKey', e.target.value)}
                placeholder="Clé API si requise"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
            </div>
          </div>
        );

      case 'mistral':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clé API Mistral *
              </label>
              <input
                type="password"
                value={providerConfig.apiKey}
                onChange={(e) => handleConfigChange('mistral', 'apiKey', e.target.value)}
                placeholder="Entrez votre clé API Mistral"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Obtenez votre clé API sur <a href="https://console.mistral.ai/" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">Mistral AI Console</a>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modèle
              </label>
              <select
                value={providerConfig.model}
                onChange={(e) => handleConfigChange('mistral', 'model', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              >
                <option value="mistral-large-2407">Mistral Large 2407 (Recommandé)</option>
                <option value="mistral-large-latest">Mistral Large (latest)</option>
                <option value="mistral-small-latest">Mistral Small (latest)</option>
                <option value="codestral-latest">Codestral (latest)</option>
              </select>
            </div>
          </div>
        );

      case 'anthropic':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clé API Anthropic *
              </label>
              <input
                type="password"
                value={providerConfig.apiKey}
                onChange={(e) => handleConfigChange('anthropic', 'apiKey', e.target.value)}
                placeholder="Entrez votre clé API Anthropic"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Obtenez votre clé API sur <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">Anthropic Console</a>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modèle
              </label>
              <select
                value={providerConfig.model}
                onChange={(e) => handleConfigChange('anthropic', 'model', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              >
                <option value="claude-sonnet-4-20250514">Claude Sonnet 4.5 (Recommandé)</option>
                <option value="claude-opus-4-20250514">Claude Opus 4</option>
                <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (2024-10-22)</option>
                <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (2024-10-22)</option>
              </select>
            </div>
          </div>
        );

      case 'deepseek':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clé API DeepSeek *
              </label>
              <input
                type="password"
                value={providerConfig.apiKey}
                onChange={(e) => handleConfigChange('deepseek', 'apiKey', e.target.value)}
                placeholder="Entrez votre clé API DeepSeek"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Obtenez votre clé API sur <a href="https://platform.deepseek.com/" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">DeepSeek Platform</a>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modèle
              </label>
              <select
                value={providerConfig.model}
                onChange={(e) => handleConfigChange('deepseek', 'model', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              >
                <option value="deepseek-chat">DeepSeek Chat (Recommandé)</option>
                <option value="deepseek-reasoner">DeepSeek Reasoner</option>
              </select>
            </div>
          </div>
        );

      case 'qwen':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clé API Qwen *
              </label>
              <input
                type="password"
                value={providerConfig.apiKey}
                onChange={(e) => handleConfigChange('qwen', 'apiKey', e.target.value)}
                placeholder="Entrez votre clé API Qwen"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Obtenez votre clé API sur <a href="https://dashscope.console.aliyun.com/" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">Alibaba Cloud DashScope</a>
                <br />Note: Utilise l'endpoint international. Pour la Chine, changez le base URL en settings avancés.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modèle
              </label>
              <select
                value={providerConfig.model}
                onChange={(e) => handleConfigChange('qwen', 'model', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              >
                <option value="qwen-max">Qwen Max (Recommandé)</option>
                <option value="qwen-plus">Qwen Plus</option>
                <option value="qwen-turbo">Qwen Turbo</option>
                <option value="qwen2.5-72b-instruct">Qwen 2.5 72B Instruct</option>
              </select>
            </div>
          </div>
        );

      case 'xai':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clé API xAI *
              </label>
              <input
                type="password"
                value={providerConfig.apiKey}
                onChange={(e) => handleConfigChange('xai', 'apiKey', e.target.value)}
                placeholder="Entrez votre clé API xAI"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Obtenez votre clé API sur <a href="https://console.x.ai/" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">xAI Console</a>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modèle
              </label>
              <select
                value={providerConfig.model}
                onChange={(e) => handleConfigChange('xai', 'model', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              >
                <option value="grok-2-latest">Grok 2 Latest (Recommandé)</option>
                <option value="grok-1">Grok 1</option>
                <option value="grok-beta">Grok Beta</option>
              </select>
            </div>
          </div>
        );

      case 'groq':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clé API Groq *
              </label>
              <input
                type="password"
                value={providerConfig.apiKey}
                onChange={(e) => handleConfigChange('groq', 'apiKey', e.target.value)}
                placeholder="Entrez votre clé API Groq"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Obtenez votre clé API sur <a href="https://console.groq.com/" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">Groq Console</a>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modèle
              </label>
              <select
                value={providerConfig.model}
                onChange={(e) => handleConfigChange('groq', 'model', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              >
                <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile (Recommandé)</option>
                <option value="llama-3.1-70b-versatile">Llama 3.1 70B Versatile</option>
                <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant</option>
                <option value="mixtral-8x7b">Mixtral 8x7B</option>
              </select>
            </div>
          </div>
        );

      case 'lmstudio':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL de base LM Studio *
              </label>
              <input
                type="url"
                value={providerConfig.baseUrl}
                onChange={(e) => handleConfigChange('lmstudio', 'baseUrl', e.target.value)}
                placeholder="http://localhost:1234"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                URL de votre serveur LM Studio local
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modèle *
              </label>
              <input
                type="text"
                value={providerConfig.model}
                onChange={(e) => handleConfigChange('lmstudio', 'model', e.target.value)}
                placeholder="Nom du modèle chargé"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Nom du modèle actuellement chargé dans LM Studio
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clé API (optionnel)
              </label>
              <input
                type="password"
                value={providerConfig.apiKey || ''}
                onChange={(e) => handleConfigChange('lmstudio', 'apiKey', e.target.value)}
                placeholder="Clé API si requise"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
            </div>
          </div>
        );

      case 'openai':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clé API OpenAI *
              </label>
              <input
                type="password"
                value={providerConfig.apiKey || ''}
                onChange={(e) => handleConfigChange('openai', 'apiKey', e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Obtenez votre clé API sur{' '}
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">
                  platform.openai.com
                </a>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modèle
              </label>
              <select
                value={providerConfig.model}
                onChange={(e) => handleConfigChange('openai', 'model', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              >
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-5">GPT-5</option>
                <option value="gpt-o3">GPT-o3</option>
              </select>

            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL de base (optionnel)
              </label>
              <input
                type="url"
                value={providerConfig.baseUrl || ''}
                onChange={(e) => handleConfigChange('openai', 'baseUrl', e.target.value)}
                placeholder="https://api.openai.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Laissez vide pour utiliser l'API officielle OpenAI
              </p>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700 mb-2">
                🔍 Problème avec OpenAI ? Utilisez le diagnostic avancé
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => quickOpenAIDiagnostic()}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  ⚡ Diagnostic rapide
                </button>

              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const isConfigValid = configService.isConfigValid();
  const configErrors = configService.getConfigErrors();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Configuration LLM</h2>
          <p className="text-gray-600">
            Configurez votre fournisseur de modèle de langage pour utiliser les agents EBIOS RM.
          </p>
        </div>

        {/* Sélection du fournisseur */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Fournisseur LLM
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(['gemini', 'openai', 'mistral', 'anthropic', 'deepseek', 'qwen', 'xai', 'groq', 'ollama', 'lmstudio'] as LLMProvider[]).map((provider) => (
              <button
                key={provider}
                onClick={() => handleProviderChange(provider)}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  config.provider === provider
                    ? 'border-brand-primary bg-brand-primary bg-opacity-5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900 capitalize">
                  {provider === 'lmstudio' ? 'LM Studio' :
                   provider === 'xai' ? 'xAI Grok' :
                   provider === 'anthropic' ? 'Claude' :
                   provider === 'deepseek' ? 'DeepSeek' :
                   provider === 'qwen' ? 'Qwen' :
                   provider === 'groq' ? 'Groq' :
                   provider === 'openai' ? 'OpenAI' :
                   provider}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {provider === 'gemini' && 'Gemini 2.5 Pro/Flash - Google'}
                  {provider === 'openai' && 'GPT-4o et modèles OpenAI'}
                  {provider === 'mistral' && 'Mistral Large 2407 - Mistral AI'}
                  {provider === 'anthropic' && 'Claude Sonnet 4.5 - Anthropic'}
                  {provider === 'deepseek' && 'DeepSeek-V3 - DeepSeek'}
                  {provider === 'qwen' && 'Qwen Max - Alibaba'}
                  {provider === 'xai' && 'Grok 4 - xAI'}
                  {provider === 'groq' && 'Llama 3.3 - Plateforme Groq'}
                  {provider === 'ollama' && 'Modèles locaux avec Ollama'}
                  {provider === 'lmstudio' && 'Interface LM Studio locale'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Avertissement CORS pour les providers nécessitant un proxy */}
        {['anthropic', 'openai', 'mistral', 'deepseek', 'qwen', 'xai', 'groq'].includes(config.provider) && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  ℹ️ Information importante
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Ce provider utilise un <strong>proxy backend</strong> pour contourner les restrictions CORS.
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>✅ <strong>En production (Vercel)</strong> : Fonctionne automatiquement via le proxy Vercel</li>
                    <li>⚠️ <strong>En développement local</strong> :
                      {config.provider === 'anthropic' ? (
                        <span> Lancez le proxy avec <code className="bg-blue-100 px-1 rounded">npm run dev:proxy</code> ou <code className="bg-blue-100 px-1 rounded">start-proxy.bat</code></span>
                      ) : (
                        <span> Peut nécessiter un proxy local (CORS peut bloquer)</span>
                      )}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Configuration du fournisseur */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 capitalize">
            Configuration {config.provider === 'lmstudio' ? 'LM Studio' : config.provider}
          </h3>
          {renderProviderConfig()}
        </div>

        {/* Erreurs de configuration */}
        {configErrors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Configuration incomplète
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul className="list-disc list-inside space-y-1">
                    {configErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Résultat du test de connexion */}
        {connectionResult && (
          <div className={`mb-6 p-4 rounded-md ${
            connectionResult.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {connectionResult.success ? (
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <h3 className={`text-sm font-medium ${
                  connectionResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {connectionResult.success ? 'Connexion réussie' : 'Échec de la connexion'}
                </h3>
                {connectionResult.error && (
                  <div className="mt-2 text-sm text-red-700">
                    {connectionResult.error}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
            className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Sauvegarder
          </button>
          
          <button
            onClick={handleTestConnection}
            disabled={isTestingConnection || !isConfigValid}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isTestingConnection ? 'Test en cours...' : 'Tester la connexion'}
          </button>
          
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Réinitialiser
          </button>

          <button
            onClick={() => setShowLLMTester(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            🧪 Tester tous les LLM
          </button>
        </div>

        {hasUnsavedChanges && (
          <div className="mt-4 text-sm text-amber-600">
            ⚠️ Vous avez des modifications non sauvegardées
          </div>
        )}
      </div>

      {/* Testeur LLM Modal */}
      {showLLMTester && (
        <LLMTesterComponent onClose={() => setShowLLMTester(false)} />
      )}

    </div>
  );
};

export default Settings;
