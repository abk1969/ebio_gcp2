import type { LLMConfig, LLMProvider } from '../types';
import { secureStorage } from '../utils/encryption';

const CONFIG_STORAGE_KEY = 'ebios_llm_config';

// Configuration par défaut
const DEFAULT_CONFIG: LLMConfig = {
  provider: 'gemini',
  gemini: {
    apiKey: '',
    model: 'gemini-2.5-flash',
    baseUrl: 'https://generativelanguage.googleapis.com'
  },
  ollama: {
    baseUrl: 'http://localhost:11434',
    model: 'llama3.3',
    apiKey: ''
  },
  lmstudio: {
    baseUrl: 'http://localhost:1234',
    model: 'local-model',
    apiKey: ''
  },
  mistral: {
    apiKey: '',
    model: 'mistral-large-2407',
    baseUrl: 'https://api.mistral.ai'
  },
  anthropic: {
    apiKey: '',
    model: 'claude-sonnet-4-20250514',
    baseUrl: 'https://api.anthropic.com'
  },
  deepseek: {
    apiKey: '',
    model: 'deepseek-chat',
    baseUrl: 'https://api.deepseek.com'
  },
  qwen: {
    apiKey: '',
    model: 'qwen-max',
    baseUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1'
  },
  xai: {
    apiKey: '',
    model: 'grok-2-latest',
    baseUrl: 'https://api.x.ai'
  },
  groq: {
    apiKey: '',
    model: 'llama-3.3-70b-versatile',
    baseUrl: 'https://api.groq.com/openai'
  },
  openai: {
    apiKey: '',
    model: 'gpt-4o',
    baseUrl: 'https://api.openai.com'
  }
};

class ConfigService {
  private config: LLMConfig;
  private listeners: Array<(config: LLMConfig) => void> = [];
  private isInitialized: boolean = false;

  constructor() {
    this.config = this.loadConfig();

    // Attendre que le DOM soit chargé pour réessayer de charger depuis localStorage
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          if (!this.isInitialized) {
            this.config = this.loadConfig();
            this.isInitialized = true;
            this.notifyListeners();
          }
        });
      } else {
        this.isInitialized = true;
      }
    }
  }

  /**
   * Charge la configuration depuis le localStorage
   */
  private loadConfig(): LLMConfig {
    console.log('[ConfigService] ===== LOAD CONFIG =====');

    // Vérifier si nous sommes côté client
    if (typeof window === 'undefined' || typeof localStorage === 'undefined' || typeof document === 'undefined') {
      console.log('[ConfigService] localStorage non disponible (SSR ou environnement serveur) - utilisation config par défaut');
      // Côté serveur ou environnement sans localStorage - NE JAMAIS charger depuis .env
      return DEFAULT_CONFIG;
    }

    try {
      const stored = secureStorage.getItem(CONFIG_STORAGE_KEY);
      console.log('[ConfigService] Données localStorage:', stored ? 'trouvées' : 'non trouvées');

      if (stored) {
        const parsedConfig = JSON.parse(stored);
        console.log('[ConfigService] Provider chargé depuis localStorage:', parsedConfig.provider);

        // Nettoyer les modèles Gemini avec -latest (qui ne sont plus supportés)
        if (parsedConfig.gemini?.model?.includes('-latest')) {
          console.warn(`[Config] Nettoyage du modèle Gemini obsolète: ${parsedConfig.gemini.model}`);
          parsedConfig.gemini.model = parsedConfig.gemini.model.replace('-latest', '');
        }

        // Merge avec la config par défaut pour s'assurer que toutes les propriétés existent
        const mergedConfig = {
          ...DEFAULT_CONFIG,
          ...parsedConfig,
          gemini: { ...DEFAULT_CONFIG.gemini, ...parsedConfig.gemini },
          ollama: { ...DEFAULT_CONFIG.ollama, ...parsedConfig.ollama },
          lmstudio: { ...DEFAULT_CONFIG.lmstudio, ...parsedConfig.lmstudio },
          mistral: { ...DEFAULT_CONFIG.mistral, ...parsedConfig.mistral },
          anthropic: { ...DEFAULT_CONFIG.anthropic, ...parsedConfig.anthropic },
          deepseek: { ...DEFAULT_CONFIG.deepseek, ...parsedConfig.deepseek },
          qwen: { ...DEFAULT_CONFIG.qwen, ...parsedConfig.qwen },
          xai: { ...DEFAULT_CONFIG.xai, ...parsedConfig.xai },
          groq: { ...DEFAULT_CONFIG.groq, ...parsedConfig.groq },
          openai: { ...DEFAULT_CONFIG.openai, ...parsedConfig.openai }
        };

        console.log('[ConfigService] Provider après merge:', mergedConfig.provider);
        console.log('[ConfigService] ===========================');
        return mergedConfig;
      }
    } catch (error) {
      console.warn('Erreur lors du chargement de la configuration LLM:', error);
    }

    console.log('[ConfigService] Utilisation config par défaut, provider:', DEFAULT_CONFIG.provider);
    console.log('[ConfigService] ===========================');
    // NE JAMAIS charger depuis .env - uniquement depuis l'interface Settings
    return DEFAULT_CONFIG;
  }

  /**
   * Sauvegarde la configuration dans le localStorage
   */
  private saveConfig(): void {
    // Vérifier si nous sommes côté client
    if (typeof window === 'undefined' || typeof localStorage === 'undefined' || typeof document === 'undefined') {
      console.warn('[ConfigService] localStorage non disponible (SSR) - configuration non sauvegardée');
      this.notifyListeners();
      return;
    }

    console.log('[ConfigService] ===== SAVE CONFIG =====');
    console.log('[ConfigService] Provider à sauvegarder:', this.config.provider);

    try {
      // Créer une copie de la config avec les clés API chiffrées
      const configToSave = {
        ...this.config,
        gemini: {
          ...this.config.gemini,
          apiKey: this.config.gemini.apiKey // Sera chiffré automatiquement
        },
        ollama: {
          ...this.config.ollama,
          apiKey: this.config.ollama.apiKey || ''
        },
        lmstudio: {
          ...this.config.lmstudio,
          apiKey: this.config.lmstudio.apiKey || ''
        },
        mistral: {
          ...this.config.mistral,
          apiKey: this.config.mistral.apiKey || ''
        },
        anthropic: {
          ...this.config.anthropic,
          apiKey: this.config.anthropic.apiKey || ''
        },
        deepseek: {
          ...this.config.deepseek,
          apiKey: this.config.deepseek.apiKey || ''
        },
        qwen: {
          ...this.config.qwen,
          apiKey: this.config.qwen.apiKey || ''
        },
        xai: {
          ...this.config.xai,
          apiKey: this.config.xai.apiKey || ''
        },
        groq: {
          ...this.config.groq,
          apiKey: this.config.groq.apiKey || ''
        }
      };

      secureStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(configToSave), true);
      console.log('[ConfigService] Configuration sauvegardée avec succès');
      console.log('[ConfigService] ===========================');
      this.notifyListeners();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la configuration LLM:', error);
    }
  }

  /**
   * Notifie tous les listeners des changements de configuration
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.config));
  }

  /**
   * Retourne la configuration actuelle
   */
  getConfig(): LLMConfig {
    return { ...this.config };
  }

  /**
   * Retourne la configuration du fournisseur actuel
   */
  getCurrentProviderConfig() {
    const { provider } = this.config;
    return {
      provider,
      config: this.config[provider]
    };
  }

  /**
   * Met à jour la configuration complète
   */
  updateConfig(newConfig: Partial<LLMConfig>): void {
    console.log('[ConfigService] ===== UPDATE CONFIG =====');
    console.log('[ConfigService] Ancien provider:', this.config.provider);
    console.log('[ConfigService] Nouveau provider:', newConfig.provider);

    this.config = {
      ...this.config,
      ...newConfig,
      gemini: { ...this.config.gemini, ...newConfig.gemini },
      ollama: { ...this.config.ollama, ...newConfig.ollama },
      lmstudio: { ...this.config.lmstudio, ...newConfig.lmstudio },
      mistral: { ...this.config.mistral, ...newConfig.mistral },
      anthropic: { ...this.config.anthropic, ...newConfig.anthropic },
      deepseek: { ...this.config.deepseek, ...newConfig.deepseek },
      qwen: { ...this.config.qwen, ...newConfig.qwen },
      xai: { ...this.config.xai, ...newConfig.xai },
      groq: { ...this.config.groq, ...newConfig.groq },
      openai: { ...this.config.openai, ...newConfig.openai }
    };

    console.log('[ConfigService] Provider après merge:', this.config.provider);
    console.log('[ConfigService] ============================');

    this.saveConfig();
  }

  /**
   * Change le fournisseur LLM actuel
   */
  setProvider(provider: LLMProvider): void {
    this.config.provider = provider;
    this.saveConfig();
  }

  /**
   * Met à jour la configuration d'un fournisseur spécifique
   */
  updateProviderConfig(provider: LLMProvider, config: Partial<any>): void {
    switch (provider) {
      case 'gemini':
        this.config.gemini = { ...this.config.gemini, ...config };
        break;
      case 'ollama':
        this.config.ollama = { ...this.config.ollama, ...config };
        break;
      case 'lmstudio':
        this.config.lmstudio = { ...this.config.lmstudio, ...config };
        break;
      case 'mistral':
        this.config.mistral = { ...this.config.mistral, ...config };
        break;
      case 'anthropic':
        this.config.anthropic = { ...this.config.anthropic, ...config };
        break;
      case 'deepseek':
        this.config.deepseek = { ...this.config.deepseek, ...config };
        break;
      case 'qwen':
        this.config.qwen = { ...this.config.qwen, ...config };
        break;
      case 'xai':
        this.config.xai = { ...this.config.xai, ...config };
        break;
      case 'groq':
        this.config.groq = { ...this.config.groq, ...config };
        break;
      case 'openai':
        this.config.openai = { ...this.config.openai, ...config };
        break;
    }
    this.saveConfig();
  }

  /**
   * Vérifie si la configuration actuelle est valide
   */
  isConfigValid(): boolean {
    const { provider } = this.config;
    const providerConfig = this.config[provider];

    switch (provider) {
      case 'gemini':
      case 'mistral':
      case 'anthropic':
      case 'deepseek':
      case 'qwen':
      case 'xai':
      case 'groq':
      case 'openai':
        return !!(providerConfig.apiKey && providerConfig.model);
      case 'ollama':
      case 'lmstudio':
        return !!(providerConfig.baseUrl && providerConfig.model);
      default:
        return false;
    }
  }

  /**
   * Retourne les erreurs de configuration
   */
  getConfigErrors(): string[] {
    const errors: string[] = [];
    const { provider } = this.config;
    const providerConfig = this.config[provider];

    switch (provider) {
      case 'gemini':
        if (!providerConfig.apiKey) {
          errors.push('Clé API Gemini manquante');
        }
        if (!providerConfig.model) {
          errors.push('Modèle Gemini non spécifié');
        }
        break;
      case 'mistral':
        if (!providerConfig.apiKey) {
          errors.push('Clé API Mistral manquante');
        }
        if (!providerConfig.model) {
          errors.push('Modèle Mistral non spécifié');
        }
        break;
      case 'anthropic':
        if (!providerConfig.apiKey) {
          errors.push('Clé API Anthropic manquante');
        }
        if (!providerConfig.model) {
          errors.push('Modèle Anthropic non spécifié');
        }
        break;
      case 'deepseek':
        if (!providerConfig.apiKey) {
          errors.push('Clé API DeepSeek manquante');
        }
        if (!providerConfig.model) {
          errors.push('Modèle DeepSeek non spécifié');
        }
        break;
      case 'qwen':
        if (!providerConfig.apiKey) {
          errors.push('Clé API Qwen manquante');
        }
        if (!providerConfig.model) {
          errors.push('Modèle Qwen non spécifié');
        }
        break;
      case 'xai':
        if (!providerConfig.apiKey) {
          errors.push('Clé API xAI manquante');
        }
        if (!providerConfig.model) {
          errors.push('Modèle xAI non spécifié');
        }
        break;
      case 'groq':
        if (!providerConfig.apiKey) {
          errors.push('Clé API Groq manquante');
        }
        if (!providerConfig.model) {
          errors.push('Modèle Groq non spécifié');
        }
        break;
      case 'ollama':
        if (!providerConfig.baseUrl) {
          errors.push('URL de base Ollama manquante');
        }
        if (!providerConfig.model) {
          errors.push('Modèle Ollama non spécifié');
        }
        break;
      case 'lmstudio':
        if (!providerConfig.baseUrl) {
          errors.push('URL de base LM Studio manquante');
        }
        if (!providerConfig.model) {
          errors.push('Modèle LM Studio non spécifié');
        }
        break;
    }

    return errors;
  }

  /**
   * Ajoute un listener pour les changements de configuration
   */
  addListener(listener: (config: LLMConfig) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Remet la configuration aux valeurs par défaut
   */
  resetToDefaults(): void {
    this.config = { ...DEFAULT_CONFIG };
    this.saveConfig();
  }

  /**
   * Teste la connexion avec le fournisseur actuel
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const { provider } = this.config;
      const providerConfig = this.config[provider];

      switch (provider) {
        case 'gemini':
          // Test simple pour Gemini - on vérifie juste que la clé est présente
          if (!providerConfig.apiKey) {
            return { success: false, error: 'Clé API Gemini manquante' };
          }
          return { success: true };

        case 'mistral':
          // Test simple pour Mistral - on vérifie juste que la clé est présente
          if (!providerConfig.apiKey) {
            return { success: false, error: 'Clé API Mistral manquante' };
          }
          return { success: true };

        case 'anthropic':
          // Test simple pour Anthropic - on vérifie juste que la clé est présente
          if (!providerConfig.apiKey) {
            return { success: false, error: 'Clé API Anthropic manquante' };
          }
          return { success: true };

        case 'deepseek':
          // Test simple pour DeepSeek - on vérifie juste que la clé est présente
          if (!providerConfig.apiKey) {
            return { success: false, error: 'Clé API DeepSeek manquante' };
          }
          return { success: true };

        case 'qwen':
          // Test simple pour Qwen - on vérifie juste que la clé est présente
          if (!providerConfig.apiKey) {
            return { success: false, error: 'Clé API Qwen manquante' };
          }
          return { success: true };

        case 'xai':
          // Test simple pour xAI - on vérifie juste que la clé est présente
          if (!providerConfig.apiKey) {
            return { success: false, error: 'Clé API xAI manquante' };
          }
          return { success: true };

        case 'groq':
          // Test simple pour Groq - on vérifie juste que la clé est présente
          if (!providerConfig.apiKey) {
            return { success: false, error: 'Clé API Groq manquante' };
          }
          return { success: true };

        case 'openai':
          // Test simple pour OpenAI - on vérifie juste que la clé est présente
          if (!providerConfig.apiKey) {
            return { success: false, error: 'Clé API OpenAI manquante' };
          }
          return { success: true };

        case 'ollama':
          // Test de connexion HTTP pour Ollama
          try {
            const response = await fetch(`${providerConfig.baseUrl}/api/tags`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                ...(providerConfig.apiKey && { 'Authorization': `Bearer ${providerConfig.apiKey}` })
              },
              signal: AbortSignal.timeout(5000) // Timeout de 5 secondes
            });

            if (!response.ok) {
              return { success: false, error: `Erreur de connexion Ollama: ${response.status}` };
            }

            return { success: true };
          } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
              return { success: false, error: 'Timeout de connexion à Ollama' };
            }
            return { success: false, error: `Impossible de se connecter à Ollama: ${error instanceof Error ? error.message : 'Erreur inconnue'}` };
          }

        case 'lmstudio':
          // Test de connexion HTTP pour LM Studio
          try {
            const response = await fetch(`${providerConfig.baseUrl}/v1/models`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                ...(providerConfig.apiKey && { 'Authorization': `Bearer ${providerConfig.apiKey}` })
              },
              signal: AbortSignal.timeout(5000) // Timeout de 5 secondes
            });

            if (!response.ok) {
              return { success: false, error: `Erreur de connexion LM Studio: ${response.status}` };
            }

            return { success: true };
          } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
              return { success: false, error: 'Timeout de connexion à LM Studio' };
            }
            return { success: false, error: `Impossible de se connecter à LM Studio: ${error instanceof Error ? error.message : 'Erreur inconnue'}` };
          }

        default:
          return { success: false, error: 'Fournisseur non supporté' };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur de connexion inconnue' 
      };
    }
  }
}

// Instance singleton
export const configService = new ConfigService();
export default configService;
